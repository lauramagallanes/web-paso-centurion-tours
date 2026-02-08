import json
import boto3
import os
import urllib.parse
from email import message_from_bytes
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ses = boto3.client('ses', region_name='us-east-1')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Reenvía correos desde S3 a Gmail
    Se activa cuando se crea un objeto en S3 (S3 Event Notification)
    """
    DESTINATION_EMAIL = os.environ.get('DESTINATION_EMAIL', 'pasocenturiontours@gmail.com')
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
            
            # Parsear el correo original
            try:
                original_msg = message_from_bytes(raw_message)
                
                # Obtener información del correo original
                original_from = original_msg.get('From', 'Desconocido')
                original_to = original_msg.get('To', 'Desconocido')
                original_subject = original_msg.get('Subject', 'Sin asunto')
                original_date = original_msg.get('Date', '')
                original_reply_to = original_msg.get('Reply-To', '')  # Obtener Reply-To original
                
                print(f"Original From: {original_from}")
                print(f"Original To: {original_to}")
                print(f"Original Subject: {original_subject}")
                print(f"Original Reply-To: {original_reply_to}")
                
                # Crear mensaje que parece original (sin "Fwd:")
                # Usar Reply-To para que las respuestas vayan al remitente original
                forward_msg = MIMEMultipart()
                
                # Determinar el remitente basado en el destinatario original
                if 'reservas@pasocenturion.com.uy' in original_to:
                    forward_from = 'reservas@pasocenturion.com.uy'
                elif 'consultas@pasocenturion.com.uy' in original_to or 'consulta@pasocenturion.com.uy' in original_to:
                    forward_from = 'consultas@pasocenturion.com.uy'
                elif 'info@pasocenturion.com.uy' in original_to:
                    forward_from = 'info@pasocenturion.com.uy'
                else:
                    forward_from = FROM_EMAIL
                
                forward_msg['From'] = f"{forward_from} <{FROM_EMAIL}>"  # Display name con email verificado
                forward_msg['To'] = DESTINATION_EMAIL
                forward_msg['Subject'] = original_subject  # Mantener asunto original (sin "Fwd:")
                
                # Usar Reply-To original si existe, sino usar From original
                # Esto permite que las respuestas vayan directamente al cliente que envió el formulario
                if original_reply_to:
                    forward_msg['Reply-To'] = original_reply_to
                    print(f"Using original Reply-To: {original_reply_to}")
                else:
                    forward_msg['Reply-To'] = original_from
                    print(f"No Reply-To found, using From: {original_from}")
                forward_msg['X-Original-From'] = original_from
                forward_msg['X-Original-To'] = original_to
                forward_msg['X-Original-Date'] = original_date
                
                # Obtener el cuerpo del mensaje original directamente
                body_text = ""
                body_html = None
                
                if original_msg.is_multipart():
                    for part in original_msg.walk():
                        content_type = part.get_content_type()
                        if content_type == "text/plain":
                            body_text = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                        elif content_type == "text/html":
                            body_html = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                else:
                    content_type = original_msg.get_content_type()
                    payload = original_msg.get_payload(decode=True).decode('utf-8', errors='ignore')
                    if content_type == "text/html":
                        body_html = payload
                    else:
                        body_text = payload
                
                # Agregar el cuerpo al mensaje
                if body_html:
                    # Si hay HTML, usar HTML como principal
                    forward_msg.attach(MIMEText(body_html, 'html'))
                    if body_text:
                        # Agregar texto plano como alternativa
                        text_part = MIMEText(body_text, 'plain')
                        text_part.add_header('Content-Disposition', 'inline')
                        forward_msg.attach(text_part)
                else:
                    # Solo texto plano
                    forward_msg.attach(MIMEText(body_text, 'plain'))
                
                # Reenviar el mensaje modificado
                ses.send_raw_email(
                    Source=FROM_EMAIL,
                    Destinations=[DESTINATION_EMAIL],
                    RawMessage={'Data': forward_msg.as_string()}
                )
                
                print(f"✅ Email forwarded successfully to {DESTINATION_EMAIL}")
                
            except Exception as parse_error:
                print(f"Error parsing email, trying simple forward: {str(parse_error)}")
                # Si falla el parseo, intentar reenvío simple
                try:
                    simple_msg = MIMEText(f"""
Este correo fue reenviado automáticamente desde pasocenturion.com.uy

El correo original está disponible en S3: s3://{bucket}/{key}
""")
                    simple_msg['From'] = FROM_EMAIL
                    simple_msg['To'] = DESTINATION_EMAIL
                    simple_msg['Subject'] = "Correo reenviado desde pasocenturion.com.uy"
                    
                    ses.send_raw_email(
                        Source=FROM_EMAIL,
                        Destinations=[DESTINATION_EMAIL],
                        RawMessage={'Data': simple_msg.as_string()}
                    )
                    print(f"✅ Simple forward notification sent to {DESTINATION_EMAIL}")
                except Exception as e2:
                    print(f"❌ Error with simple forward: {str(e2)}")
                    raise
        except Exception as e:
            print(f"❌ Error forwarding email: {str(e)}")
            # No hacer raise para que otros correos se procesen
            continue
    
    return {
        'statusCode': 200,
        'body': json.dumps('Email forwarding processed')
    }

