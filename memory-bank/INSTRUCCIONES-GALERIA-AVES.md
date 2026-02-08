# 📸 Instrucciones para Subir Imágenes de Aves a S3

## Imágenes Necesarias para la Galería de Aves

### Especies Destacadas (5 imágenes principales)

Necesitas 5 imágenes para las especies destacadas en la sección principal:

- **ave1.jpg** - Para Surucuá
- **ave2.jpg** - Para Perdiz de Monte
- **ave3.jpg** - Para Federal
- **ave4.jpg** - Para Caburé
- **ave5.jpg** - Para Urraca Azul

### Galería General (6 o más imágenes)

Para la galería principal, necesitas al menos 6 imágenes más:

- **ave6.jpg** hasta **ave11.jpg** (o más si quieres)

---

## 🚀 Comandos para Subir las Imágenes

### Opción 1: Subir todas las imágenes de una vez

```bash
# Ve a la carpeta donde tienes las imágenes
cd /ruta/donde/estan/tus/imagenes

# Sube TODAS las imágenes a la carpeta /aves/
AWS_PROFILE=laura aws s3 sync . s3://tinambu-public-assets-dev/aves/ \
  --exclude "*" \
  --include "ave*.jpg" \
  --region us-east-1
```

### Opción 2: Subir solo las especies destacadas (ave1-ave5)

```bash
# Sube las 5 primeras (especies destacadas)
AWS_PROFILE=laura aws s3 cp ave1.jpg s3://tinambu-public-assets-dev/aves/ave1.jpg --region us-east-1
AWS_PROFILE=laura aws s3 cp ave2.jpg s3://tinambu-public-assets-dev/aves/ave2.jpg --region us-east-1
AWS_PROFILE=laura aws s3 cp ave3.jpg s3://tinambu-public-assets-dev/aves/ave3.jpg --region us-east-1
AWS_PROFILE=laura aws s3 cp ave4.jpg s3://tinambu-public-assets-dev/aves/ave4.jpg --region us-east-1
AWS_PROFILE=laura aws s3 cp ave5.jpg s3://tinambu-public-assets-dev/aves/ave5.jpg --region us-east-1
```

### Opción 3: Subir la galería (ave6-ave11 o más)

```bash
# Sube las imágenes de galería a la carpeta gallery/
AWS_PROFILE=laura aws s3 cp ave6.jpg s3://tinambu-public-assets-dev/aves/gallery/ave6.jpg --region us-east-1
AWS_PROFILE=laura aws s3 cp ave7.jpg s3://tinambu-public-assets-dev/aves/gallery/ave7.jpg --region us-east-1
AWS_PROFILE=laura aws s3 cp ave8.jpg s3://tinambu-public-assets-dev/aves/gallery/ave8.jpg --region us-east-1
AWS_PROFILE=laura aws s3 cp ave9.jpg s3://tinambu-public-assets-dev/aves/gallery/ave9.jpg --region us-east-1
AWS_PROFILE=laura aws s3 cp ave10.jpg s3://tinambu-public-assets-dev/aves/gallery/ave10.jpg --region us-east-1
AWS_PROFILE=laura aws s3 cp ave11.jpg s3://tinambu-public-assets-dev/aves/gallery/ave11.jpg --region us-east-1
```

**O todo junto:**

```bash
# Si organizaste tus imágenes en subcarpetas:
# /aves-principales/ → ave1.jpg a ave5.jpg
# /aves-galeria/ → ave6.jpg a ave11.jpg

cd /ruta/donde/estan/tus/imagenes

# Sube especies destacadas
AWS_PROFILE=laura aws s3 sync ./aves-principales s3://tinambu-public-assets-dev/aves/ --region us-east-1

# Sube galería
AWS_PROFILE=laura aws s3 sync ./aves-galeria s3://tinambu-public-assets-dev/aves/gallery/ --region us-east-1
```

---

## ✅ Verificar que las imágenes se subieron correctamente

```bash
# Lista las especies destacadas (ave1-ave5)
AWS_PROFILE=laura aws s3 ls s3://tinambu-public-assets-dev/aves/ --region us-east-1

# Lista la galería (ave6-ave11)
AWS_PROFILE=laura aws s3 ls s3://tinambu-public-assets-dev/aves/gallery/ --region us-east-1
```

Deberías ver algo como:

```
2025-11-08 XX:XX:XX   XXXXX ave1.jpg
2025-11-08 XX:XX:XX   XXXXX ave2.jpg
2025-11-08 XX:XX:XX   XXXXX ave3.jpg
2025-11-08 XX:XX:XX   XXXXX ave4.jpg
2025-11-08 XX:XX:XX   XXXXX ave5.jpg
```

---

## 📐 Recomendaciones de Tamaño de Imágenes

### Especies Destacadas (ave1.jpg - ave5.jpg)
- **Tamaño recomendado**: 800px × 600px (ancho × alto)
- **Máximo**: 1200px × 900px
- **Formato**: JPG
- **Calidad**: 85%

### Galería (ave6.jpg - ave11.jpg)
- **Tamaño recomendado**: 1200px × 900px
- **Máximo**: 1600px × 1200px
- **Formato**: JPG
- **Calidad**: 85%

---

## 📂 Estructura Final en S3

```
s3://tinambu-public-assets-dev/
├── aves/
│   ├── ave1.jpg  ← Surucuá Común (Especie destacada)
│   ├── ave2.jpg  ← Tinambú Chico (Especie destacada)
│   ├── ave3.jpg  ← Frutero Azul (Especie destacada)
│   ├── ave4.jpg  ← Federal (Especie destacada)
│   ├── ave5.jpg  ← Picaflor Esmeralda (Especie destacada)
│   └── gallery/
│       ├── ave6.jpg   ← Galería
│       ├── ave7.jpg   ← Galería
│       ├── ave8.jpg   ← Galería
│       ├── ave9.jpg   ← Galería
│       ├── ave10.jpg  ← Galería
│       └── ave11.jpg  ← Galería
```

---

## 🎯 Resumen Simple

**11 imágenes en total:**

| Archivo | Ubicación en S3 | Uso |
|---------|----------------|-----|
| ave1.jpg | `/aves/` | Especie destacada 1 |
| ave2.jpg | `/aves/` | Especie destacada 2 |
| ave3.jpg | `/aves/` | Especie destacada 3 |
| ave4.jpg | `/aves/` | Especie destacada 4 |
| ave5.jpg | `/aves/` | Especie destacada 5 |
| ave6.jpg | `/aves/gallery/` | Galería |
| ave7.jpg | `/aves/gallery/` | Galería |
| ave8.jpg | `/aves/gallery/` | Galería |
| ave9.jpg | `/aves/gallery/` | Galería |
| ave10.jpg | `/aves/gallery/` | Galería |
| ave11.jpg | `/aves/gallery/` | Galería |

---

## 🐦 Especies a Fotografiar

Las especies destacadas son las siguientes (nombres usados en Uruguay):

- **ave1.jpg**: **Surucuá** (*Trogon surrucura*) - Ave del Bosque Atlántico con plumaje verde metálico y pecho rojo
- **ave2.jpg**: **Perdiz de Monte** (*Crypturellus obsoletus*) - Ave terrestre tímida de sotobosques húmedos
- **ave3.jpg**: **Federal** (*Amblyramphus holosericeus*) - Ave de humedales con plumaje rojo escarlata
- **ave4.jpg**: **Caburé** (*Glaucidium brasilianum*) - Pequeño búho diurno de bosques y áreas arboladas
- **ave5.jpg**: **Urraca Azul** (*Cyanocorax caeruleus*) - Ave azul brillante del Bosque Atlántico
- **ave6-ave11.jpg**: Cualquier otra ave que hayas fotografiado en Paso Centurión

Si no tienes fotos de alguna especie específica, usa cualquier foto de ave similar que tengas disponible. 📸

---

## 🆘 Si tienes problemas

Si las imágenes no se ven en la página web:

1. **Verifica que se subieron**: 
   ```bash
   AWS_PROFILE=laura aws s3 ls s3://tinambu-public-assets-dev/aves/
   ```

2. **Prueba el URL directo**: 
   ```
   https://tinambu-public-assets-dev.s3.us-east-1.amazonaws.com/aves/ave1.jpg
   ```

3. **Limpia caché del navegador**: `Ctrl+Shift+R`

4. **Verifica permisos**: La política del bucket ya está configurada para `/aves/*` ✅

---

## ✨ Comando Todo-en-Uno

Si tienes las 11 imágenes en una sola carpeta nombradas correctamente:

```bash
cd /ruta/donde/estan/tus/imagenes

# Sube ave1-ave5 a /aves/
for i in {1..5}; do
  AWS_PROFILE=laura aws s3 cp ave$i.jpg s3://tinambu-public-assets-dev/aves/ave$i.jpg --region us-east-1
done

# Sube ave6-ave11 a /aves/gallery/
for i in {6..11}; do
  AWS_PROFILE=laura aws s3 cp ave$i.jpg s3://tinambu-public-assets-dev/aves/gallery/ave$i.jpg --region us-east-1
done

echo "✅ Todas las imágenes subidas!"
```

---

¡Cuando termines de subir las imágenes, avísame para recompilar y desplegar! 🚀🦜
