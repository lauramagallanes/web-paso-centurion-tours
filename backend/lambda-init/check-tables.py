#!/usr/bin/env python3
"""
Script para verificar qué tablas existen en la base de datos
"""

import boto3
import psycopg2
import json

def get_db_password():
    """Obtiene la contraseña de la BD desde SSM Parameter Store"""
    ssm = boto3.client('ssm', region_name='us-east-1')
    response = ssm.get_parameter(Name='/dev/database/password', WithDecryption=True)
    return response['Parameter']['Value']

def check_tables():
    """Verifica qué tablas existen en la base de datos"""
    
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
        
        # Listar todas las tablas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"📋 Tablas existentes ({len(tables)}):")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Verificar específicamente las tablas de alojamientos
        alojamiento_tables = ['alojamientos', 'alojamiento_imagenes', 'alojamiento_disponibilidad', 'alojamiento_reserva_bloqueos', 'alojamiento_reservas']
        print(f"\n🏠 Estado de tablas de alojamientos:")
        for table_name in alojamiento_tables:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = %s
                );
            """, (table_name,))
            exists = cursor.fetchone()[0]
            status = "✅ Existe" if exists else "❌ No existe"
            print(f"   - {table_name}: {status}")
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Verificación de tablas completada',
                'total_tables': len(tables),
                'tables': [table[0] for table in tables]
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
    return check_tables()

if __name__ == "__main__":
    # Para ejecutar localmente
    result = check_tables()
    print(json.dumps(result, indent=2))



