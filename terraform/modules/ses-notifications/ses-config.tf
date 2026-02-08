# Configure SES to send notifications to SNS topics
# This requires the SES domain/email identities to be already verified

# Configure bounce notifications for domain identity (if provided)
resource "aws_ses_identity_notification_topic" "bounce_domain" {
  count                    = var.ses_domain_identity != "" ? 1 : 0
  identity                 = var.ses_domain_identity
  notification_type        = "Bounce"
  topic_arn                = aws_sns_topic.ses_bounces.arn
  include_original_headers = true
}

resource "aws_ses_identity_notification_topic" "complaint_domain" {
  count                    = var.ses_domain_identity != "" ? 1 : 0
  identity                 = var.ses_domain_identity
  notification_type        = "Complaint"
  topic_arn                = aws_sns_topic.ses_complaints.arn
  include_original_headers = true
}

# Configure bounce notifications for email identities (if provided)
resource "aws_ses_identity_notification_topic" "bounce_emails" {
  for_each                 = toset(var.ses_email_identities)
  identity                 = each.value
  notification_type        = "Bounce"
  topic_arn                = aws_sns_topic.ses_bounces.arn
  include_original_headers = true
}

resource "aws_ses_identity_notification_topic" "complaint_emails" {
  for_each                 = toset(var.ses_email_identities)
  identity                 = each.value
  notification_type        = "Complaint"
  topic_arn                = aws_sns_topic.ses_complaints.arn
  include_original_headers = true
}


