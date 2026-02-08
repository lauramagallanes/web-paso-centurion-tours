package com.tinambu.tours.controller;

import com.tinambu.tours.dto.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

import java.util.Map;

@RestController
@RequestMapping("/contacto")
@CrossOrigin(origins = {"*"})
public class ContactController {

    @Autowired(required = false)
    private SesClient sesClient;

    @Value("${CONTACT_EMAIL:consultas@pasocenturion.com.uy}")
    private String contactEmail;
    
    @Value("${SES_FROM_EMAIL:noreply@pasocenturion.com.uy}")
    private String sesFromEmail;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> sendContactMessage(@RequestBody Map<String, String> contactData) {
        try {
            String nombre = contactData.get("nombre");
            String apellido = contactData.get("apellido");
            String email = contactData.get("email");
            String telefono = contactData.getOrDefault("telefono", "No proporcionado");
            String mensaje = contactData.get("mensaje");

            // Validar campos requeridos
            if (nombre == null || nombre.trim().isEmpty() ||
                apellido == null || apellido.trim().isEmpty() ||
                email == null || email.trim().isEmpty() ||
                mensaje == null || mensaje.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Todos los campos requeridos deben ser completados"));
            }

            // Si SES no está disponible, usar método alternativo
            if (sesClient == null) {
                System.out.println("⚠️ SES Client no disponible, usando método alternativo");
                logContactMessage(nombre, apellido, email, telefono, mensaje);
                return ResponseEntity.ok(ApiResponse.success(null));
            }

            // Construir el cuerpo del email
            String emailBody = buildEmailBody(nombre, apellido, email, telefono, mensaje);
            String emailSubject = "Nuevo mensaje de contacto - " + nombre + " " + apellido;

            // Crear el request de email
            SendEmailRequest emailRequest = SendEmailRequest.builder()
                .source(sesFromEmail)
                .destination(Destination.builder()
                    .toAddresses(contactEmail)
                    .build())
                .message(Message.builder()
                    .subject(Content.builder()
                        .data(emailSubject)
                        .charset("UTF-8")
                        .build())
                    .body(Body.builder()
                        .text(Content.builder()
                            .data(emailBody)
                            .charset("UTF-8")
                            .build())
                        .build())
                    .build())
                .replyToAddresses(email)
                .build();

            // Enviar el email
            try {
                SendEmailResponse response = sesClient.sendEmail(emailRequest);
                System.out.println("✅ Email enviado exitosamente. Message ID: " + response.messageId());
                return ResponseEntity.ok(ApiResponse.success(null));
            } catch (MessageRejectedException e) {
                // Si el email no está verificado en SES, usar método alternativo
                System.out.println("⚠️ Email no verificado en SES, usando método alternativo");
                System.out.println("Error: " + e.getMessage());
                logContactMessage(nombre, apellido, email, telefono, mensaje);
                return ResponseEntity.ok(ApiResponse.success(null));
            }

        } catch (Exception e) {
            System.err.println("❌ Error al enviar mensaje de contacto: " + e.getMessage());
            e.printStackTrace();
            
            // Intentar loguear el mensaje como fallback
            try {
                String nombre = contactData.getOrDefault("nombre", "Desconocido");
                String apellido = contactData.getOrDefault("apellido", "");
                String email = contactData.getOrDefault("email", "Desconocido");
                String telefono = contactData.getOrDefault("telefono", "No proporcionado");
                String mensaje = contactData.getOrDefault("mensaje", "");
                logContactMessage(nombre, apellido, email, telefono, mensaje);
            } catch (Exception logError) {
                System.err.println("Error al loguear mensaje: " + logError.getMessage());
            }
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Error al enviar el mensaje. Por favor, intenta nuevamente."));
        }
    }

    private String buildEmailBody(String nombre, String apellido, String email, String telefono, String mensaje) {
        StringBuilder body = new StringBuilder();
        body.append("Nuevo mensaje de contacto recibido desde el sitio web\n\n");
        body.append("========================================\n");
        body.append("INFORMACIÓN DE CONTACTO\n");
        body.append("========================================\n\n");
        body.append("Nombre: ").append(nombre).append("\n");
        body.append("Apellido: ").append(apellido).append("\n");
        body.append("Email: ").append(email).append("\n");
        body.append("Teléfono: ").append(telefono).append("\n\n");
        body.append("========================================\n");
        body.append("MENSAJE\n");
        body.append("========================================\n\n");
        body.append(mensaje).append("\n\n");
        body.append("========================================\n");
        body.append("Este mensaje fue enviado desde el formulario de contacto del sitio web.\n");
        return body.toString();
    }

    private void logContactMessage(String nombre, String apellido, String email, String telefono, String mensaje) {
        System.out.println("\n========================================");
        System.out.println("📧 MENSAJE DE CONTACTO RECIBIDO");
        System.out.println("========================================");
        System.out.println("Nombre: " + nombre + " " + apellido);
        System.out.println("Email: " + email);
        System.out.println("Teléfono: " + telefono);
        System.out.println("----------------------------------------");
        System.out.println("MENSAJE:");
        System.out.println(mensaje);
        System.out.println("========================================");
        System.out.println("⚠️ NOTA: Este mensaje fue logueado porque SES no está disponible");
        System.out.println("   o el email no está verificado. Revisa los logs de CloudWatch.");
        System.out.println("   Para recibir emails, verifica 'consultas@pasocenturion.com.uy' en AWS SES.");
        System.out.println("========================================\n");
    }
}

