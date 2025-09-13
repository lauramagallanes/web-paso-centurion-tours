#!/usr/bin/env python3
"""
Script para crear los esquemas necesarios en PostgreSQL
"""

import psycopg2
import sys

def create_schemas():
    """Crear los esquemas necesarios en la base de datos"""
    
    # Configuración de conexión
    DB_CONFIG = {
        'host': 'tinambu-db-dev.cwd08asyq2vx.us-east-1.rds.amazonaws.com',
        'port': 5432,
        'database': 'tinambu_tours',
        'user': 'tinambu_admin',
        'password': 'IS3(P5i->n3-w#Qs',
        'sslmode': 'require'
    }
    
    # Esquemas a crear
    schemas = ['contenido', 'reservas', 'usuarios']
    
    try:
        print("🔗 Conectando a PostgreSQL...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("✅ Conexión exitosa!")
        
        # Crear cada esquema
        for schema in schemas:
            print(f"📁 Creando esquema: {schema}")
            try:
                cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {schema};")
                print(f"✅ Esquema '{schema}' creado exitosamente")
            except Exception as e:
                print(f"⚠️  Error creando esquema '{schema}': {e}")
        
        # Confirmar cambios
        conn.commit()
        print("\n🎉 ¡Todos los esquemas creados exitosamente!")
        
        # Verificar esquemas creados
        print("\n📋 Verificando esquemas existentes:")
        cursor.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('contenido', 'reservas', 'usuarios');")
        existing_schemas = cursor.fetchall()
        
        for schema in existing_schemas:
            print(f"✅ {schema[0]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
        print("🔌 Conexión cerrada")
    
    return True

if __name__ == "__main__":
    print("=== CREADOR DE ESQUEMAS POSTGRESQL ===")
    success = create_schemas()
    sys.exit(0 if success else 1)

