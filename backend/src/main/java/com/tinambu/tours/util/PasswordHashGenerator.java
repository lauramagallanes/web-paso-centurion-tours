package com.tinambu.tours.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad para generar hashes de contraseñas
 * Ejecutar con: java -cp target/classes:target/dependency/* com.tinambu.tours.util.PasswordHashGenerator admin123
 */
public class PasswordHashGenerator {
    
    public static void main(String[] args) {
        if (args.length != 1) {
            System.out.println("Uso: java PasswordHashGenerator <contraseña>");
            System.exit(1);
        }
        
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = args[0];
        String hash = encoder.encode(password);
        
        System.out.println("Contraseña: " + password);
        System.out.println("Hash BCrypt: " + hash);
        
        // Verificar que el hash funciona
        boolean matches = encoder.matches(password, hash);
        System.out.println("Verificación: " + (matches ? "CORRECTO" : "ERROR"));
    }
}
