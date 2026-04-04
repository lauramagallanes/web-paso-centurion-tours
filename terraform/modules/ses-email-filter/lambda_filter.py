import json
import boto3
import os
import re
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ssm = boto3.client("ssm")


def extract_email_address(raw: str) -> str:
    """Extract clean email address from 'Name <email>' or plain 'email' format."""
    raw = raw.strip().lower()
    match = re.search(r"<([^>]+)>", raw)
    if match:
        return match.group(1).strip()
    return raw


def get_blocklist(param_name: str) -> list:
    """Fetch comma-separated blocklist from SSM Parameter Store."""
    try:
        response = ssm.get_parameter(Name=param_name)
        raw = response["Parameter"]["Value"]
        return [entry.strip().lower() for entry in raw.split(",") if entry.strip()]
    except ssm.exceptions.ParameterNotFound:
        logger.warning("Blocklist parameter '%s' not found. Allowing email.", param_name)
        return []
    except Exception as e:
        logger.error("Error reading SSM parameter '%s': %s", param_name, e)
        return []


def is_blocked(address: str, blocklist: list) -> bool:
    """
    Check if an email address (or its domain) is in the blocklist.
    Supports full addresses like 'spam@evil.com' and domain entries like '@evil.com'.
    """
    address = address.lower().strip()
    if address in blocklist:
        return True
    if "@" in address:
        domain = "@" + address.split("@", 1)[1]
        if domain in blocklist:
            return True
    return False


def lambda_handler(event, context):
    """
    SES Receipt Rule filter – invoked synchronously (RequestResponse).

    Returns:
        {"disposition": "STOP_RULE_SET"}  → email is rejected (blocked)
        {"disposition": "CONTINUE"}       → email proceeds to next rule (allowed)
    """
    BLOCKLIST_PARAM = os.environ.get("BLOCKLIST_SSM_PARAM", "/dev/ses/email_blocklist")

    try:
        record = event.get("Records", [{}])[0]
        ses_data = record.get("ses", {})
        mail = ses_data.get("mail", {})
        receipt = ses_data.get("receipt", {})

        envelope_sender = mail.get("source", "").lower().strip()
        headers = mail.get("headers", [])

        from_header = ""
        for h in headers:
            if h.get("name", "").lower() == "from":
                from_header = h.get("value", "")
                break

        from_email = extract_email_address(from_header) if from_header else ""

        logger.info("Envelope sender: %s", envelope_sender)
        logger.info("From header email: %s", from_email)

        spam_verdict = receipt.get("spamVerdict", {}).get("status", "PROCESSING")
        virus_verdict = receipt.get("virusVerdict", {}).get("status", "PROCESSING")
        logger.info("Spam verdict: %s | Virus verdict: %s", spam_verdict, virus_verdict)

    except Exception as e:
        logger.error("Error parsing SES event: %s", e)
        return {"disposition": "CONTINUE"}

    # Always block confirmed virus-infected emails regardless of blocklist
    if virus_verdict == "FAIL":
        logger.warning("BLOCKED – virus detected from '%s'", envelope_sender)
        return {"disposition": "STOP_RULE_SET"}

    # Fetch blocklist from SSM (fail open: allow if SSM is unreachable)
    blocklist = get_blocklist(BLOCKLIST_PARAM)

    if not blocklist:
        logger.info("Blocklist is empty. Allowing email from '%s'.", envelope_sender)
        return {"disposition": "CONTINUE"}

    # Check both envelope sender and From header against blocklist
    for address in filter(None, [envelope_sender, from_email]):
        if is_blocked(address, blocklist):
            logger.warning("BLOCKED – '%s' matched blocklist", address)
            return {"disposition": "STOP_RULE_SET"}

    logger.info("ALLOWED – '%s' passed all filters", envelope_sender)
    return {"disposition": "CONTINUE"}
