# Configurar S3 Event Notification para trigger Lambda cuando llega correo

resource "aws_s3_bucket_notification" "email_forwarding" {
  bucket = "pasocenturion-emails-inbound"

  lambda_function {
    lambda_function_arn = aws_lambda_function.email_forwarding.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "inbound/"
    filter_suffix       = ""
  }

  depends_on = [
    aws_lambda_permission.s3_invoke_lambda
  ]
}

# Permiso para que S3 pueda invocar Lambda
resource "aws_lambda_permission" "s3_invoke_lambda" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_forwarding.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::pasocenturion-emails-inbound"
}


