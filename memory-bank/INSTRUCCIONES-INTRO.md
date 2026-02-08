# 📸 Instrucciones para subir imágenes de la sección Intro

## 🎯 Imágenes necesarias

Necesitas preparar **2 imágenes** para esta sección:

### 1. **Imagen 1** - Ave/Naturaleza
- `image-1.jpg` - Imagen de un ave o elemento de naturaleza
- Esta imagen irá en el círculo superior izquierdo con el texto "contactanos"

### 2. **Imagen 2** - Paisaje/Río
- `image-2.jpg` - Imagen de paisaje, río, o naturaleza
- Esta imagen irá en el círculo inferior derecho con el texto "conocenos"

---

## 📋 Especificaciones técnicas

**Ambas imágenes:**
- **Formato**: JPG
- **Tamaño recomendado**: 600x600px (cuadrado)
- **Peso máximo**: 500KB cada una
- **Orientación**: Cuadrado (1:1)
- **Nota**: Las imágenes se mostrarán en círculos, así que asegúrate de que el sujeto principal esté centrado

---

## 🚀 Comandos para subir las imágenes

```bash
# Ir a la carpeta donde están tus imágenes
cd /ruta/donde/estan/tus/imagenes

# Subir las 2 imágenes
AWS_PROFILE=laura aws s3 cp image-1.jpg s3://tinambu-public-assets-dev/intro/image-1.jpg --region us-east-1

AWS_PROFILE=laura aws s3 cp image-2.jpg s3://tinambu-public-assets-dev/intro/image-2.jpg --region us-east-1
```

---

## ✅ Verificar que se subieron correctamente

```bash
AWS_PROFILE=laura aws s3 ls s3://tinambu-public-assets-dev/intro/ --human-readable --region us-east-1
```

Deberías ver las 2 imágenes listadas.

---

## 🎨 Vista previa del diseño

Esta sección mostrará:
- ✅ Fondo beige/crema suave
- ✅ Dos imágenes circulares decoradas con hojas naranjas
- ✅ Textos decorativos "contactanos" y "conocenos" alrededor de las imágenes
- ✅ Título "Explora, descubre y descansa en un solo lugar"
- ✅ Descripción del santuario ecológico
- ✅ Botón verde "Conocenos"

---

## 💡 Consejos para las imágenes

1. **Composición**: El sujeto debe estar centrado ya que se mostrará en un círculo
2. **Calidad**: Usa imágenes nítidas y bien iluminadas
3. **Colores**: Los colores cálidos y naturales funcionan mejor con el fondo beige
4. **Tema**: 
   - **Imagen 1**: Ave, detalle de naturaleza, insecto, flor
   - **Imagen 2**: Paisaje amplio, río, bosque, vista panorámica

---

Una vez que subas las imágenes, recarga la página con **Ctrl+F5** para verlas en la nueva sección!


