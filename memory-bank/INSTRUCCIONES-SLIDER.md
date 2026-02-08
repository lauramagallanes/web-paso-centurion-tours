# 📸 Instrucciones para subir imágenes del Hero Slider

## 🎯 Imágenes necesarias

Necesitas preparar **10 imágenes** en total para el slider:

### 1. **Slide Tinambú** (1 imagen principal)
- `slide-tinambu.jpg` - Imagen de la cabaña/ecolodge con el bosque de fondo

### 2. **Slide Avistamiento de Aves** (1 imagen principal + 3 mini imágenes)
- `slide-aves.jpg` - Imagen principal de personas observando aves o paisaje
- `ave-1.jpg` - Foto de un ave (formato vertical preferido)
- `ave-2.jpg` - Foto de un ave (formato vertical preferido)
- `ave-3.jpg` - Foto de un ave (formato vertical preferido)

### 3. **Slide Senderismo** (1 imagen principal)
- `slide-senderismo.jpg` - Imagen de personas haciendo senderismo/camino en el bosque

### 4. **Slide Alojamiento** (1 imagen principal + 2 mini imágenes)
- `slide-alojamiento.jpg` - Imagen de la cabaña interior o exterior
- `alojamiento-1.jpg` - Foto del alojamiento (formato vertical preferido)
- `alojamiento-2.jpg` - Foto del alojamiento (formato vertical preferido)

---

## 📋 Especificaciones técnicas

### Imágenes principales (slides grandes):
- **Formato**: JPG
- **Tamaño recomendado**: 1920x1080px (horizontal)
- **Peso máximo**: 1MB cada una
- **Orientación**: Horizontal (landscape)

### Imágenes de galería (mini imágenes):
- **Formato**: JPG
- **Tamaño recomendado**: 600x800px (vertical)
- **Peso máximo**: 500KB cada una
- **Orientación**: Vertical (portrait)

---

## 🚀 Comandos para subir las imágenes

Una vez que tengas todas las imágenes listas en una carpeta, ejecuta estos comandos:

```bash
# Ir a la carpeta donde están tus imágenes
cd /ruta/donde/estan/tus/imagenes

# Subir imágenes principales
AWS_PROFILE=laura aws s3 cp slide-tinambu.jpg s3://tinambu-public-assets-dev/slider/slide-tinambu.jpg --region us-east-1

AWS_PROFILE=laura aws s3 cp slide-aves.jpg s3://tinambu-public-assets-dev/slider/slide-aves.jpg --region us-east-1

AWS_PROFILE=laura aws s3 cp slide-senderismo.jpg s3://tinambu-public-assets-dev/slider/slide-senderismo.jpg --region us-east-1

AWS_PROFILE=laura aws s3 cp slide-alojamiento.jpg s3://tinambu-public-assets-dev/slider/slide-alojamiento.jpg --region us-east-1

# Subir galería de aves (3 imágenes)
AWS_PROFILE=laura aws s3 cp ave-1.jpg s3://tinambu-public-assets-dev/slider/ave-1.jpg --region us-east-1

AWS_PROFILE=laura aws s3 cp ave-2.jpg s3://tinambu-public-assets-dev/slider/ave-2.jpg --region us-east-1

AWS_PROFILE=laura aws s3 cp ave-3.jpg s3://tinambu-public-assets-dev/slider/ave-3.jpg --region us-east-1

# Subir galería de alojamiento (2 imágenes)
AWS_PROFILE=laura aws s3 cp alojamiento-1.jpg s3://tinambu-public-assets-dev/slider/alojamiento-1.jpg --region us-east-1

AWS_PROFILE=laura aws s3 cp alojamiento-2.jpg s3://tinambu-public-assets-dev/slider/alojamiento-2.jpg --region us-east-1
```

---

## ✅ Verificar que se subieron correctamente

```bash
AWS_PROFILE=laura aws s3 ls s3://tinambu-public-assets-dev/slider/ --human-readable --region us-east-1
```

Deberías ver las 10 imágenes listadas.

---

## 🎨 Vista previa del diseño

Cada slide mostrará:
- ✅ Imagen de fondo grande y atractiva
- ✅ Overlay oscuro en la parte inferior
- ✅ Título y descripción en texto blanco
- ✅ Galería de imágenes pequeñas a la derecha (solo en algunos slides)
- ✅ Botón de acción
- ✅ Dots de navegación en la parte inferior
- ✅ Flechas de navegación a los lados

---

## 💡 Consejos para las imágenes

1. **Imágenes principales**: Asegúrate de que el sujeto principal esté centrado o ligeramente hacia arriba
2. **Aves**: Fotos claras de aves individuales con buen enfoque
3. **Alojamiento**: Muestra diferentes ángulos/habitaciones
4. **Iluminación**: Prefiere imágenes con buena iluminación natural
5. **Compresión**: Usa herramientas como TinyPNG para optimizar antes de subir

---

Una vez que subas las imágenes, avísame para hacer los ajustes finales necesarios!


