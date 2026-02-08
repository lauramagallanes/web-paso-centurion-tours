variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "ses_domain_identity" {
  description = "SES domain identity (e.g., pasocenturion.com.uy)"
  type        = string
  default     = ""
}

variable "ses_email_identities" {
  description = "List of verified SES email identities"
  type        = list(string)
  default     = []
}


