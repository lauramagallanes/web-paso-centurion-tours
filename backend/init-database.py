#!/usr/bin/env python3
"""
Script para inicializar la base de datos PostgreSQL con usuario admin
Ejecuta dentro de AWS Lambda que tiene acceso a la VPC
"""

import boto3
import psycopg2
import json
import hashlib

def get_db_password():
    """Obtiene la contraseña de la BD desde SSM Parameter Store"""
    ssm = boto3.client('ssm', region_name='us-east-1')
    response = ssm.get_parameter(Name='/dev/database/password', WithDecryption=True)
    return response['Parameter']['Value']

def init_database():
    """Inicializa la base de datos con tablas y usuario admin"""
    
    # Configuración de conexión
    DB_CONFIG = {
        'host': 'tinambu-db-dev.cwd08asyq2vx.us-east-1.rds.amazonaws.com',
        'port': 5432,
        'database': 'tinambu_tours',
        'user': 'tinambu_admin',
        'password': get_db_password()
    }
    
    try:
        # Conectar a PostgreSQL
        print("Conectando a PostgreSQL...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Verificar conexión
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Conectado a PostgreSQL: {version[0]}")
        
        # Crear tabla usuarios si no existe
        print("Creando tabla usuarios...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                rol VARCHAR(50) DEFAULT 'user',
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Crear tabla senderos si no existe  
        print("Creando tabla senderos...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS senderos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                dificultad VARCHAR(50),
                duracion_horas INTEGER,
                distancia_km DECIMAL(5,2),
                precio_usd DECIMAL(10,2),
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Verificar si ya existe usuario admin
        cursor.execute("SELECT COUNT(*) FROM usuarios WHERE email = 'admin@pasocenturion.com.uy';")
        admin_exists = cursor.fetchone()[0] > 0
        
        if not admin_exists:
            print("Creando usuario admin...")
            # Hash simple de la contraseña (en producción usar bcrypt)
            admin_password = hashlib.sha256("admin123".encode()).hexdigest()
            
            cursor.execute("""
                INSERT INTO usuarios (email, password, nombre, rol, activo) 
                VALUES (%s, %s, %s, %s, %s);
            """, ('admin@pasocenturion.com.uy', admin_password, 'Administrador', 'admin', True))
            print("✅ Usuario admin creado")
        else:
            print("✅ Usuario admin ya existe")
            
        # Insertar senderos de ejemplo si no existen
        cursor.execute("SELECT COUNT(*) FROM senderos;")
        senderos_count = cursor.fetchone()[0]
        
        if senderos_count == 0:
            print("Creando senderos de ejemplo...")
            senderos = [
                ("Avistamiento de Aves", "Más de 200 especies en hábitats diversos. Observación guiada para amantes de las aves, la fotografía y la biodiversidad.", "Fácil", 3, 2.5, 45.00),
                ("Sendero del Río", "Caminata junto al río con cascadas y pozas naturales", "Moderado", 4, 5.0, 65.00),
                ("Mirador Panorámico", "Ascenso al punto más alto con vista 360° del valle", "Difícil", 6, 8.5, 85.00)
            ]
            
            for sendero in senderos:
                cursor.execute("""
                    INSERT INTO senderos (nombre, descripcion, dificultad, duracion_horas, distancia_km, precio_usd) 
                    VALUES (%s, %s, %s, %s, %s, %s);
                """, sendero)
            
            print("✅ Senderos de ejemplo creados")
        else:
            print("✅ Senderos ya existen")
        
        # Confirmar cambios
        conn.commit()
        
        # Verificar datos
        cursor.execute("SELECT COUNT(*) FROM usuarios;")
        users_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM senderos;")
        senderos_count = cursor.fetchone()[0]
        
        print(f"✅ Base de datos inicializada:")
        print(f"   - Usuarios: {users_count}")
        print(f"   - Senderos: {senderos_count}")
        
        # Mostrar usuario admin para login
        cursor.execute("SELECT email, nombre, rol FROM usuarios WHERE rol = 'admin';")
        admin_user = cursor.fetchone()
        if admin_user:
            print(f"👤 Usuario admin disponible:")
            print(f"   - Email: {admin_user[0]}")
            print(f"   - Nombre: {admin_user[1]}")
            print(f"   - Password: admin123")
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Base de datos inicializada exitosamente',
                'users_count': users_count,
                'senderos_count': senderos_count,
                'admin_credentials': {
                    'email': 'admin@pasocenturion.com.uy',
                    'password': 'admin123'
                }
            })
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

def lambda_handler(event, context):
    """Handler para AWS Lambda"""
    return init_database()

if __name__ == "__main__":
    # Para ejecutar localmente
    result = init_database()
    print(json.dumps(result, indent=2))

