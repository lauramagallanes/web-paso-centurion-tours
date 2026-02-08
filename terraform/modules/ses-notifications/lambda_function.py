"""
Lambda function to handle SES bounce and complaint notifications via SNS.

This function processes notifications from Amazon SES when emails bounce
or recipients complain. It logs the events and can be extended to:
- Suppress email addresses from future sends
- Alert administrators
- Update databases
"""

import json
import os
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Process SES bounce or complaint notifications from SNS.
    
    Expected event structure (from SNS):
    {
        "Records": [
            {
                "Sns": {
                    "Message": "<JSON string with SES notification>",
                    "Subject": "Amazon SES Email Event Notification",
                    ...
                }
            }
        ]
    }
    """
    try:
        # Extract notification type from environment
        notification_type = os.environ.get('NOTIFICATION_TYPE', 'Unknown')
        environment = os.environ.get('ENVIRONMENT', 'unknown')
        
        logger.info(f"Processing {notification_type} notification in {environment} environment")
        logger.info(f"Event: {json.dumps(event)}")
        
        # Process each SNS record
        for record in event.get('Records', []):
            sns_message = record.get('Sns', {})
            message_body = sns_message.get('Message', '{}')
            
            # Parse the SES notification message
            try:
                ses_notification = json.loads(message_body)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse SNS message as JSON: {e}")
                logger.error(f"Message body: {message_body}")
                continue
            
            # Process the notification
            process_ses_notification(ses_notification, notification_type, environment)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {notification_type} notification',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing notification: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
        }


def process_ses_notification(notification, notification_type, environment):
    """
    Process a single SES notification (bounce or complaint).
    
    Args:
        notification: Parsed JSON notification from SES
        notification_type: 'Bounce' or 'Complaint'
        environment: Environment name (dev, prod, etc.)
    """
    try:
        # Extract notification details
        notification_type_from_message = notification.get('notificationType', '')
        mail = notification.get('mail', {})
        timestamp = notification.get('mail', {}).get('timestamp', '')
        
        # Extract email addresses
        source_email = mail.get('source', 'unknown')
        destination_emails = mail.get('destination', [])
        
        # Extract message ID
        message_id = mail.get('messageId', 'unknown')
        
        logger.info(f"=== {notification_type} Notification ===")
        logger.info(f"Message ID: {message_id}")
        logger.info(f"Source: {source_email}")
        logger.info(f"Destinations: {', '.join(destination_emails)}")
        logger.info(f"Timestamp: {timestamp}")
        
        if notification_type == 'Bounce':
            process_bounce(notification, source_email, destination_emails, message_id)
        elif notification_type == 'Complaint':
            process_complaint(notification, source_email, destination_emails, message_id)
        else:
            logger.warning(f"Unknown notification type: {notification_type_from_message}")
            
    except Exception as e:
        logger.error(f"Error processing {notification_type} notification: {str(e)}", exc_info=True)


def process_bounce(notification, source_email, destination_emails, message_id):
    """
    Process a bounce notification.
    
    Bounces indicate that an email could not be delivered.
    We should suppress hard bounces from future sends.
    """
    try:
        bounce = notification.get('bounce', {})
        bounce_type = bounce.get('bounceType', 'Unknown')
        bounce_subtype = bounce.get('bounceSubType', 'Unknown')
        bounced_recipients = bounce.get('bouncedRecipients', [])
        
        logger.info(f"Bounce Type: {bounce_type}")
        logger.info(f"Bounce Subtype: {bounce_subtype}")
        logger.info(f"Bounced Recipients: {len(bounced_recipients)}")
        
        # Log details for each bounced recipient
        for recipient in bounced_recipients:
            email = recipient.get('emailAddress', 'unknown')
            action = recipient.get('action', 'unknown')
            status = recipient.get('status', 'unknown')
            diagnostic_code = recipient.get('diagnosticCode', 'N/A')
            
            logger.info(f"  - Email: {email}")
            logger.info(f"    Action: {action}")
            logger.info(f"    Status: {status}")
            logger.info(f"    Diagnostic: {diagnostic_code}")
            
            # Hard bounces should be suppressed
            if bounce_type == 'Permanent':
                logger.warning(f"HARD BOUNCE detected for {email} - Should be suppressed from future sends")
            elif bounce_type == 'Transient':
                logger.info(f"SOFT BOUNCE detected for {email} - May retry later")
        
        # TODO: Implement suppression logic here
        # - Add bounced emails to a suppression list (DynamoDB, RDS, etc.)
        # - Or use SES suppression list API
        
    except Exception as e:
        logger.error(f"Error processing bounce: {str(e)}", exc_info=True)


def process_complaint(notification, source_email, destination_emails, message_id):
    """
    Process a complaint notification.
    
    Complaints indicate that a recipient marked the email as spam.
    We MUST suppress these addresses from future sends.
    """
    try:
        complaint = notification.get('complaint', {})
        complaint_type = complaint.get('complaintFeedbackType', 'Unknown')
        complained_recipients = complaint.get('complainedRecipients', [])
        arrival_date = complaint.get('arrivalDate', '')
        
        logger.warning(f"=== SPAM COMPLAINT RECEIVED ===")
        logger.warning(f"Complaint Type: {complaint_type}")
        logger.warning(f"Arrival Date: {arrival_date}")
        logger.warning(f"Complained Recipients: {len(complained_recipients)}")
        
        # Log details for each complained recipient
        for recipient in complained_recipients:
            email = recipient.get('emailAddress', 'unknown')
            logger.warning(f"  - Email: {email} marked as SPAM")
            
            # CRITICAL: Complaints must be suppressed immediately
            logger.error(f"CRITICAL: {email} complained - MUST be suppressed from future sends")
        
        # TODO: Implement suppression logic here
        # - Add complained emails to suppression list IMMEDIATELY
        # - Use SES suppression list API
        # - Alert administrators if complaint rate is high
        
    except Exception as e:
        logger.error(f"Error processing complaint: {str(e)}", exc_info=True)


