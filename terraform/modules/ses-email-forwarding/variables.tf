variable "environment" {
  description = "Environment name"
  type        = string
}

variable "destination_email" {
  description = "Email address to forward emails to"
  type        = string
  default     = "pasocenturiontours@gmail.com"
}

variable "from_email" {
  description = "Email address to send forwarded emails from (must be verified in SES)"
  type        = string
  default     = "noreply@pasocenturion.com.uy"
}

