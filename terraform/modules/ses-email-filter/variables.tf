variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "inbound_email_bucket" {
  description = "S3 bucket name where SES stores inbound emails"
  type        = string
  default     = "pasocenturion-emails-inbound"
}

variable "s3_action_iam_role_arn" {
  description = "IAM role ARN that allows SES to write to the inbound S3 bucket (e.g. arn:aws:iam::ACCOUNT:role/ses-inbound-write-to-s3)"
  type        = string
  default     = ""
}

variable "s3_rules" {
  description = <<-EOT
    List of S3 store rules to recreate after the filter rule.
    Each entry maps a set of recipients to an S3 prefix.
    Example:
      [
        { name = "info",      recipients = ["info@pasocenturion.com.uy"],      prefix = "inbound/info/" },
        { name = "consultas", recipients = ["consultas@pasocenturion.com.uy"], prefix = "inbound/consultas/" },
        { name = "reservas",  recipients = ["reservas@pasocenturion.com.uy"],  prefix = "inbound/reservas/" }
      ]
  EOT
  type = list(object({
    name       = string
    recipients = list(string)
    prefix     = string
  }))
  default = []
}

variable "initial_blocklist" {
  description = <<-EOT
    Initial comma-separated list of blocked email addresses and/or domains.
    After the first terraform apply, manage this value directly in AWS SSM Console
    or via CLI — Terraform will not overwrite it.

    Examples:
      "spam@evil.com"
      "spam@evil.com,phishing@fraud.net,@entire-bad-domain.com"

    Note: SSM does not allow empty strings. Use "EMPTY" as default when no addresses
    need to be blocked initially (the Lambda handles this gracefully).
  EOT
  type        = string
  default     = "EMPTY"
}

variable "blocked_ip_ranges" {
  description = <<-EOT
    Map of label => CIDR block for IP-level blocking (Option 1).
    These are account-wide SES IP filters applied before any receipt rules.

    Example:
      {
        "known-spammer" = "203.0.113.0/24"
        "botnet-range"  = "198.51.100.5/32"
      }
  EOT
  type        = map(string)
  default     = {}
}
