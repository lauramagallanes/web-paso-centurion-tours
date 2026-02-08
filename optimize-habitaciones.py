#!/usr/bin/env python3
"""
Script para optimizar imágenes de habitaciones
Comprime imágenes grandes a un tamaño más manejable manteniendo buena calidad
"""

import os
import sys
from PIL import Image

# Permitir imágenes grandes
Image.MAX_IMAGE_PIXELS = None

def optimize_image(input_path, output_path=None, max_size_mb=5, quality=85):
    """
    Optimiza una imagen para reducir su tamaño
    
    Args:
        input_path: Ruta de la imagen original
        output_path: Ruta donde guardar la imagen optimizada (si es None, sobrescribe)
        max_size_mb: Tamaño máximo objetivo en MB
        quality: Calidad JPEG (1-100, default 85)
    """
    if output_path is None:
        output_path = input_path
    
    try:
        print(f"\n📂 Procesando: {input_path}")
        
        # Abrir imagen
        img = Image.open(input_path)
        
        # Obtener tamaño original
        original_size = os.path.getsize(input_path) / (1024 * 1024)
        print(f"   Tamaño original: {original_size:.2f} MB")
        print(f"   Dimensiones originales: {img.size[0]}x{img.size[1]} px")
        
        # Convertir a RGB si es necesario (para PNGs con transparencia)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Calcular el factor de reducción necesario
        target_size_bytes = max_size_mb * 1024 * 1024
        current_quality = quality
        
        # Intentar diferentes niveles de calidad hasta alcanzar el tamaño objetivo
        while current_quality > 40:
            # Guardar temporalmente para verificar tamaño
            temp_output = output_path + '.temp'
            img.save(temp_output, 'JPEG', quality=current_quality, optimize=True)
            
            new_size = os.path.getsize(temp_output)
            
            if new_size <= target_size_bytes:
                # ¡Éxito! Renombrar archivo temporal
                if os.path.exists(output_path):
                    os.remove(output_path)
                os.rename(temp_output, output_path)
                
                final_size = new_size / (1024 * 1024)
                reduction = ((original_size - final_size) / original_size) * 100
                
                print(f"   ✅ Optimizada con calidad {current_quality}")
                print(f"   Nuevo tamaño: {final_size:.2f} MB")
                print(f"   Reducción: {reduction:.1f}%")
                print(f"   Guardada en: {output_path}")
                return True
            
            # Si aún es muy grande, reducir calidad
            os.remove(temp_output)
            current_quality -= 5
        
        # Si no se pudo reducir lo suficiente con calidad, reducir dimensiones
        print(f"   ⚠️  No se pudo reducir con calidad, reduciendo dimensiones...")
        scale_factor = 0.9
        
        while scale_factor > 0.3:
            new_width = int(img.size[0] * scale_factor)
            new_height = int(img.size[1] * scale_factor)
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            temp_output = output_path + '.temp'
            resized_img.save(temp_output, 'JPEG', quality=85, optimize=True)
            
            new_size = os.path.getsize(temp_output)
            
            if new_size <= target_size_bytes:
                if os.path.exists(output_path):
                    os.remove(output_path)
                os.rename(temp_output, output_path)
                
                final_size = new_size / (1024 * 1024)
                reduction = ((original_size - final_size) / original_size) * 100
                
                print(f"   ✅ Optimizada con escala {scale_factor:.1%}")
                print(f"   Nuevas dimensiones: {new_width}x{new_height} px")
                print(f"   Nuevo tamaño: {final_size:.2f} MB")
                print(f"   Reducción: {reduction:.1f}%")
                print(f"   Guardada en: {output_path}")
                return True
            
            os.remove(temp_output)
            scale_factor -= 0.1
        
        print(f"   ❌ No se pudo optimizar la imagen al tamaño objetivo")
        return False
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def main():
    if len(sys.argv) < 2:
        print("=" * 60)
        print("🖼️  OPTIMIZADOR DE IMÁGENES PARA HABITACIONES")
        print("=" * 60)
        print("\nUso:")
        print("  python3 optimize-habitaciones.py <archivo_o_directorio> [max_size_mb]")
        print("\nEjemplos:")
        print("  python3 optimize-habitaciones.py habitacion1.jpg")
        print("  python3 optimize-habitaciones.py habitacion1.jpg 3")
        print("  python3 optimize-habitaciones.py /ruta/a/imagenes/")
        print("\nOpciones:")
        print("  max_size_mb: Tamaño máximo en MB (default: 5)")
        print("=" * 60)
        sys.exit(1)
    
    input_path = sys.argv[1]
    max_size_mb = float(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    print("=" * 60)
    print("🖼️  OPTIMIZADOR DE IMÁGENES PARA HABITACIONES")
    print("=" * 60)
    print(f"Tamaño máximo objetivo: {max_size_mb} MB")
    print("=" * 60)
    
    # Si es un directorio, procesar todas las imágenes
    if os.path.isdir(input_path):
        image_extensions = ('.jpg', '.jpeg', '.png', '.webp')
        files_processed = 0
        files_success = 0
        
        for filename in os.listdir(input_path):
            if filename.lower().endswith(image_extensions):
                file_path = os.path.join(input_path, filename)
                files_processed += 1
                if optimize_image(file_path, max_size_mb=max_size_mb):
                    files_success += 1
        
        print("\n" + "=" * 60)
        print(f"✅ Proceso completado: {files_success}/{files_processed} imágenes optimizadas")
        print("=" * 60)
    
    # Si es un archivo, procesarlo
    elif os.path.isfile(input_path):
        if optimize_image(input_path, max_size_mb=max_size_mb):
            print("\n" + "=" * 60)
            print("✅ Imagen optimizada exitosamente")
            print("=" * 60)
        else:
            print("\n" + "=" * 60)
            print("❌ No se pudo optimizar la imagen")
            print("=" * 60)
            sys.exit(1)
    else:
        print(f"❌ Error: '{input_path}' no es un archivo o directorio válido")
        sys.exit(1)

if __name__ == "__main__":
    main()

