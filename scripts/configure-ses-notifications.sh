#!/bin/bash
# Script to configure SES bounce and complaint notifications
# This script can be used to manually configure SES if Terraform hasn't been applied yet

set -e

# Configuration
PROFILE="${AWS_PROFILE:-laura}"
REGION="${AWS_REGION:-us-east-1}"
DOMAIN_IDENTITY="${SES_DOMAIN_IDENTITY:-pasocenturion.com.uy}"
EMAIL_IDENTITIES="${SES_EMAIL_IDENTITIES:-tinambu.paso.centurion@gmail.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuring SES Bounce and Complaint Notifications ===${NC}"
echo "Profile: $PROFILE"
echo "Region: $REGION"
echo "Domain Identity: $DOMAIN_IDENTITY"
echo "Email Identities: $EMAIL_IDENTITIES"
echo ""

# Get SNS topic ARNs from Terraform outputs or create them manually
# For now, we'll assume they exist or need to be created

echo -e "${YELLOW}Step 1: Checking SNS topics...${NC}"

# Check if bounce topic exists
BOUNCE_TOPIC_ARN=$(aws sns list-topics --profile "$PROFILE" --region "$REGION" \
  --query "Topics[?contains(TopicArn, 'ses-bounces')].TopicArn" \
  --output text | head -n1)

if [ -z "$BOUNCE_TOPIC_ARN" ]; then
  echo -e "${RED}Bounce topic not found. Please run Terraform first or create it manually.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Bounce topic found: $BOUNCE_TOPIC_ARN${NC}"

# Check if complaint topic exists
COMPLAINT_TOPIC_ARN=$(aws sns list-topics --profile "$PROFILE" --region "$REGION" \
  --query "Topics[?contains(TopicArn, 'ses-complaints')].TopicArn" \
  --output text | head -n1)

if [ -z "$COMPLAINT_TOPIC_ARN" ]; then
  echo -e "${RED}Complaint topic not found. Please run Terraform first or create it manually.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Complaint topic found: $COMPLAINT_TOPIC_ARN${NC}"
echo ""

# Configure domain identity notifications
echo -e "${YELLOW}Step 2: Configuring domain identity notifications...${NC}"

# Configure bounce notifications for domain
echo "Configuring bounce notifications for domain: $DOMAIN_IDENTITY"
aws ses set-identity-notification-topic \
  --identity "$DOMAIN_IDENTITY" \
  --notification-type Bounce \
  --sns-topic "$BOUNCE_TOPIC_ARN" \
  --profile "$PROFILE" \
  --region "$REGION"

echo -e "${GREEN}✓ Bounce notifications configured for domain${NC}"

# Configure complaint notifications for domain
echo "Configuring complaint notifications for domain: $DOMAIN_IDENTITY"
aws ses set-identity-notification-topic \
  --identity "$DOMAIN_IDENTITY" \
  --notification-type Complaint \
  --sns-topic "$COMPLAINT_TOPIC_ARN" \
  --profile "$PROFILE" \
  --region "$REGION"

echo -e "${GREEN}✓ Complaint notifications configured for domain${NC}"
echo ""

# Configure email identity notifications
echo -e "${YELLOW}Step 3: Configuring email identity notifications...${NC}"

IFS=',' read -ra EMAIL_ARRAY <<< "$EMAIL_IDENTITIES"
for email in "${EMAIL_ARRAY[@]}"; do
  email=$(echo "$email" | xargs) # Trim whitespace
  
  echo "Configuring notifications for email: $email"
  
  # Configure bounce notifications
  aws ses set-identity-notification-topic \
    --identity "$email" \
    --notification-type Bounce \
    --sns-topic "$BOUNCE_TOPIC_ARN" \
    --profile "$PROFILE" \
    --region "$REGION"
  
  # Configure complaint notifications
  aws ses set-identity-notification-topic \
    --identity "$email" \
    --notification-type Complaint \
    --sns-topic "$COMPLAINT_TOPIC_ARN" \
    --profile "$PROFILE" \
    --region "$REGION"
  
  echo -e "${GREEN}✓ Notifications configured for $email${NC}"
done

echo ""
echo -e "${GREEN}=== Configuration Complete ===${NC}"
echo ""
echo "SES bounce and complaint notifications are now configured."
echo "All bounces and complaints will be sent to:"
echo "  - Bounces: $BOUNCE_TOPIC_ARN"
echo "  - Complaints: $COMPLAINT_TOPIC_ARN"
echo ""
echo "You can verify the configuration with:"
echo "  aws ses get-identity-notification-attributes --identities $DOMAIN_IDENTITY --profile $PROFILE --region $REGION"


