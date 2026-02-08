# Fix: Imagen Principal de Senderos

## Fecha: 2025-11-07

## Problema Identificado

Cuando se subían imágenes de senderos, estas se guardaban correctamente en S3 y en la tabla `sendero_imagenes`, pero **NO se actualizaba el campo `imagenPrincipal` en la tabla `senderos`**. Esto causaba que:

1. Las cards en el frontend mostraban placeholders en lugar de las imágenes
2. No había sincronización entre la imagen marcada como principal y el campo de la entidad Sendero
3. Las consultas que devolvían senderos no incluían la URL de la imagen principal

## Cambios Implementados

### Backend (`SenderoService.java`)

#### 1. Al subir la primera imagen
**Antes:**
```java
if (currentOrder == 0 && i == 0) {
    senderoImagen.marcarComoPrincipal();
    // Note: Can't set sendero properties due to simplified entity relationships
}
```

**Después:**
```java
if (currentOrder == 0 && i == 0) {
    senderoImagen.marcarComoPrincipal();
    // Update sendero with main image URL
    sendero.setImagenPrincipal(imageUrl);
    sendero.setGaleria(true);
    senderoRepository.save(sendero);
}
```

#### 2. Al eliminar una imagen
Se agregó lógica para:
- Si se elimina la imagen principal, automáticamente promover la siguiente imagen como principal
- Si no quedan imágenes, limpiar el campo `imagenPrincipal` y marcar `galeria = false`
- Actualizar la entidad Sendero en ambos casos

```java
// If this was the principal image, update sendero and set new principal
if (wasPrincipal) {
    Sendero sendero = obtenerSenderoPorId(senderoId);
    List<SenderoImagen> remainingImages = senderoImagenRepository.findBySenderoIdOrderByOrdenAsc(senderoId);
    
    if (!remainingImages.isEmpty()) {
        // Set first remaining image as principal
        SenderoImagen newPrincipal = remainingImages.get(0);
        newPrincipal.marcarComoPrincipal();
        senderoImagenRepository.save(newPrincipal);
        sendero.setImagenPrincipal(newPrincipal.getUrlImagen());
    } else {
        // No more images, clear principal image
        sendero.setImagenPrincipal(null);
        sendero.setGaleria(false);
    }
    senderoRepository.save(sendero);
}
```

#### 3. Al marcar una imagen como principal
Ya existía la lógica correcta (líneas 181-182):
```java
sendero.setImagenPrincipal(image.getUrlImagen());
senderoRepository.save(sendero);
```

### Frontend

#### Cambio de prioridad en selección de imagen

**Archivos modificados:**
- `frontend/src/pages/public/Home.tsx`
- `frontend/src/pages/public/Activities.tsx`

**Antes:**
```typescript
// Usaba primero urlImagen (campo legacy) y luego imagenPrincipal
if (sendero.urlImagen && sendero.urlImagen.trim() !== '') {
  imagenUrl = sendero.urlImagen.trim();
} else if (sendero.imagenPrincipal && sendero.imagenPrincipal.trim() !== '') {
  imagenUrl = sendero.imagenPrincipal.trim();
}
```

**Después:**
```typescript
// Usa primero imagenPrincipal y luego urlImagen como fallback
if (sendero.imagenPrincipal && sendero.imagenPrincipal.trim() !== '') {
  imagenUrl = sendero.imagenPrincipal.trim();
} else if (sendero.urlImagen && sendero.urlImagen.trim() !== '') {
  imagenUrl = sendero.urlImagen.trim();
}
```

## Resultado

✅ Al subir imágenes, el campo `imagenPrincipal` se actualiza automáticamente  
✅ Las cards muestran correctamente la imagen principal del sendero  
✅ Al eliminar la imagen principal, se promueve automáticamente la siguiente  
✅ No se generan thumbnails problemáticos  
✅ La base de datos y S3 están sincronizados  

## Archivos Modificados

### Backend
- `backend/src/main/java/com/tinambu/tours/service/SenderoService.java`
  - Método `addImagesToSendero()` (líneas 100-106)
  - Método `removeImageFromSendero()` (líneas 150-167)

### Frontend
- `frontend/src/pages/public/Home.tsx` (líneas 71-78)
- `frontend/src/pages/public/Activities.tsx` (líneas 68-75)

## Despliegue

✅ Backend desplegado a Lambda: `tinambu-tours-backend-dev`  
✅ Frontend desplegado a S3: `tinambu-frontend-dev`  
✅ Cambios en producción desde: 2025-11-07 16:05

## Notas

- El campo `urlImagen` se mantiene como fallback para compatibilidad con datos legacy
- En el futuro se podría eliminar `urlImagen` y migrar todos los registros a usar solo `imagenPrincipal`
- No se generan thumbnails durante la subida de imágenes - se usa la imagen completa


