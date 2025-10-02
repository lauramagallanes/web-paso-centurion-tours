# REGLAS DE ARQUITECTURA - PROYECTO TINAMBU TOURS

## REGLA FUNDAMENTAL: PATRÓN DTO (Data Transfer Object)

### ✅ OBLIGATORIO
**SIEMPRE usa DTOs en la capa de servicios, NUNCA entidades directamente**

### 📋 Implementación Requerida

#### 1. Estructura de DTOs
```
src/main/java/com/tinambu/tours/dto/
├── request/
│   ├── [Entidad]Request.java         # Para crear
│   ├── [Entidad]UpdateRequest.java   # Para actualizar  
│   └── Cambio[Campo]Request.java     # Para operaciones específicas
└── response/
    └── [Entidad]Response.java        # Para devolver datos
```

#### 2. Patrón de Servicio Obligatorio
```java
@Service
@Transactional
public class [Entidad]Service {
    
    // ✅ MÉTODOS PÚBLICOS - Solo DTOs
    public [Entidad]Response crear[Entidad]([Entidad]Request request) { ... }
    public [Entidad]Response actualizar[Entidad](UUID id, [Entidad]UpdateRequest request) { ... }
    public List<[Entidad]Response> obtenerTodos() { ... }
    
    // ✅ MÉTODOS PRIVADOS - Para uso interno con entidades
    private [Entidad] obtener[Entidad]EntidadPorId(UUID id) { ... }
    
    // ✅ MÉTODOS DE CONVERSIÓN - Privados
    private [Entidad] convertirRequestAEntidad([Entidad]Request request) { ... }
    private [Entidad]Response convertirEntidadAResponse([Entidad] entidad) { ... }
}
```

#### 3. Validaciones en DTOs
```java
public class [Entidad]Request {
    @NotBlank(message = "Campo es obligatorio")
    @Email(message = "Email debe tener formato válido")
    private String campo;
    
    // Getters, setters, validaciones customizadas
}
```

### 🚫 PROHIBIDO

#### ❌ NUNCA hagas esto:
```java
// MAL: Devolver entidades directamente
public Usuario crearUsuario(Usuario usuario) { ... }
public List<Sendero> obtenerSenderos() { ... }

// MAL: Pasar entidades entre capas
@PostMapping("/usuarios")
public ResponseEntity<Usuario> crear(@RequestBody Usuario usuario) { ... }
```

#### ✅ SIEMPRE haz esto:
```java
// BIEN: Usar DTOs
public UsuarioResponse crearUsuario(UsuarioRequest request) { ... }
public List<SenderoResponse> obtenerSenderos() { ... }

// BIEN: Controladores con DTOs
@PostMapping("/usuarios")
public ResponseEntity<ApiResponse<UsuarioResponse>> crear(@RequestBody UsuarioRequest request) { ... }
```

### 🔄 Servicios Refactorizados que Siguen la Regla
- ✅ `SenderoService` - Patrón correcto implementado
- ✅ `UsuarioService` - Refactorizado para usar DTOs

### 🎯 Beneficios de Esta Regla
1. **Seguridad**: No expones campos sensibles o internos
2. **Mantenibilidad**: Cambios en entidades no afectan la API
3. **Validación**: Validaciones específicas por operación
4. **Evolución**: API estable aunque cambien las entidades
5. **Claridad**: Contratos de API explícitos y documentados

### 📝 Aplicación Inmediata
Esta regla se aplica a partir de ahora para:
- Todos los servicios nuevos
- Refactoring de servicios existentes
- Cualquier modificación de servicios

---
**Fecha de implementación**: 2 de octubre, 2025  
**Responsable**: Equipo de desarrollo  
**Estado**: ✅ ACTIVA
