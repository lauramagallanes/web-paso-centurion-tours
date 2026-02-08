import json
import boto3
import os
import urllib.parse

ses = boto3.client('ses', region_name='us-east-1')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Reenvía correos desde S3 a Gmail
    Se activa cuando se crea un objeto en S3 (S3 Event Notification)
    """
    DESTINATION_EMAIL = os.environ.get('DESTINATION_EMAIL', 'lmagallanes.dv@gmail.com')
    FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@pasocenturion.com.uy')
    
    print(f"Processing S3 event for email forwarding to {DESTINATION_EMAIL}")
    print(f"Event: {json.dumps(event)}")
    
    for record in event.get('Records', []):
        # Evento de S3
        s3_event = record.get('s3', {})
        bucket = s3_event.get('bucket', {}).get('name')
        key = s3_event.get('object', {}).get('key')
        
        # Decodificar key si está URL encoded
        key = urllib.parse.unquote_plus(key)
        
        print(f"Processing: s3://{bucket}/{key}")
        
        # Solo procesar correos (no notificaciones de SES)
        if 'AMAZON_SES_SETUP_NOTIFICATION' in key:
            print(f"Skipping SES setup notification: {key}")
            continue
        
        # Descargar correo desde S3
        try:
            response = s3.get_object(Bucket=bucket, Key=key)
            raw_message = response['Body'].read()
            
            print(f"Downloaded email from S3, size: {len(raw_message)} bytes")
            
            # Reenviar correo original tal cual
            ses.send_raw_email(
                Source=FROM_EMAIL,
                Destinations=[DESTINATION_EMAIL],
                RawMessage={'Data': raw_message}
            )
            
            print(f"✅ Email forwarded successfully to {DESTINATION_EMAIL}")
        except Exception as e:
            print(f"❌ Error forwarding email: {str(e)}")
            # No hacer raise para que otros correos se procesen
            continue
    
    return {
        'statusCode': 200,
        'body': json.dumps('Email forwarding processed')
    }

