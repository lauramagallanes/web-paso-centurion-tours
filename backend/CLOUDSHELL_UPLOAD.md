# 🌐 OPCIÓN 3: AWS CloudShell (MÁS SIMPLE)

## 🎯 **VENTAJA**: No necesitas credenciales locales

### **Paso 1: Abrir CloudShell**
```
URL: https://console.aws.amazon.com/cloudshell/
```

### **Paso 2: Subir JAR**
1. **Drag & Drop**: Arrastra `tinambu-tours-lambda.jar` a la ventana de CloudShell
2. **Esperar**: Que se complete la subida (~2 minutos)

### **Paso 3: Ejecutar comando**
```bash
aws lambda update-function-code \
  --function-name tinambu-tours-backend-dev \
  --zip-file fileb://tinambu-tours-lambda.jar
```

### **Ventajas de CloudShell**:
- ✅ Ya tiene credenciales AWS configuradas
- ✅ No necesitas configurar nada local
- ✅ Interfaz web simple
- ✅ Comando único

**¿Quieres intentar este método?**
