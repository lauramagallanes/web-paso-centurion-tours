# Cambios de Colores de Botones

**Fecha:** 2026-02-05  
**Objetivo:** Cambiar botones marrones/terracota a verde oliva y crema según paleta Figma

---

## ✅ CAMBIOS REALIZADOS

### 1. Colores Secundarios Actualizados

**Antes (Terracota/Naranja):**
- `--color-secondary`: `#d67e54` (marrón/naranja)
- `--color-secondary-hover`: `#e08e64`
- `--color-secondary-active`: `#c66e44`

**Ahora (Verde Oliva Claro):**
- `--color-secondary`: `#8a9d4a` (verde oliva claro)
- `--color-secondary-hover`: `#9aad5a`
- `--color-secondary-active`: `#7a8935`

### 2. Botones Secundarios

**Antes:**
- Fondo: Terracota/Naranja (`#d67e54`)
- Texto: Blanco

**Ahora:**
- Fondo: Verde Oliva Claro (`#8a9d4a`)
- Texto: Blanco
- Hover: Verde más claro (`#9aad5a`)

### 3. Estados On/Off Agregados

Se agregaron nuevas clases según la paleta de Figma:

**Botón Off (Verde Claro):**
```css
.btn-off {
  background-color: var(--color-secondary); /* #8a9d4a */
  color: white;
  border: 1px solid var(--color-secondary);
}
```

**Botón On (Verde Oscuro):**
```css
.btn-on {
  background-color: var(--color-primary); /* #6b792e */
  color: white;
  border: 1px solid var(--color-primary);
}
```

**Botón Outline Crema:**
```css
.btn-outline-cream {
  background-color: var(--color-background-alt); /* #fff9f4 */
  color: var(--color-primary);
  border: 1px solid var(--color-secondary);
}
```

### 4. Colores de Warning Actualizados

**Antes:**
- Warning: `#d67e54` (terracota)

**Ahora:**
- Warning: `#8a9d4a` (verde oliva claro)

### 5. Tema Dark Actualizado

Los colores también se actualizaron para el tema oscuro:
- Secondary: `#9aad5a` (verde más claro para dark theme)
- Hover: `#aabd6a`
- Active: `#8a9d4a`

---

## 📋 PALETA DE COLORES FINAL

### Light Theme

| Elemento | Color | Hex |
|----------|-------|-----|
| Primary (Botón On) | Verde Oliva Oscuro | `#6b792e` |
| Secondary (Botón Off) | Verde Oliva Claro | `#8a9d4a` |
| Crema (Fondo) | Crema | `#fff9f4` |
| Texto Primary | Negro | `#191919` |
| Texto Secondary | Gris Oscuro | `#444444` |

### Dark Theme

| Elemento | Color | Hex |
|----------|-------|-----|
| Primary (Botón On) | Verde Oliva | `#7a8935` |
| Secondary (Botón Off) | Verde Oliva Claro | `#9aad5a` |
| Fondo | Negro Profundo | `#0d0d0b` |
| Texto Primary | Blanco Crema | `#fefcfb` |

---

## 🎨 VARIANTES DE BOTONES DISPONIBLES

1. **`.btn-primary`** - Verde Oliva Oscuro (Botón On)
2. **`.btn-secondary`** - Verde Oliva Claro (Botón Off)
3. **`.btn-outline`** - Borde verde, fondo transparente
4. **`.btn-outline-cream`** - Fondo crema, borde verde
5. **`.btn-off`** - Verde claro (estado off)
6. **`.btn-on`** - Verde oscuro (estado on)
7. **`.btn-ghost`** - Transparente
8. **`.btn-danger`** - Rojo (sin cambios)
9. **`.btn-success`** - Verde (sin cambios)

---

## ✅ ARCHIVOS MODIFICADOS

1. `frontend/src/styles/colors.css`
   - Actualizado `--color-secondary` y variantes
   - Actualizado `--color-button-secondary-*`
   - Actualizado `--color-warning`
   - Actualizado para tema dark

2. `frontend/src/components/common/Button.css`
   - Actualizado comentario de `.btn-secondary`
   - Agregadas clases `.btn-off`, `.btn-on`, `.btn-outline-cream`

---

## 🧪 PRUEBA

Para verificar los cambios:

1. **Botones Primary:** Deben ser verde oliva oscuro (`#6b792e`)
2. **Botones Secondary:** Deben ser verde oliva claro (`#8a9d4a`)
3. **Botones Outline:** Deben tener borde verde
4. **Botones Outline Cream:** Deben tener fondo crema con borde verde
5. **Estados On/Off:** Deben usar las clases `.btn-on` y `.btn-off`

---

## 📝 NOTAS

- Todos los botones ahora usan la paleta verde/crema
- El color marrón/terracota ha sido eliminado completamente
- Los cambios son compatibles con tema light y dark
- Se mantienen todos los estados (hover, active, disabled)

---

**Cambios completados según paleta de Figma.**


