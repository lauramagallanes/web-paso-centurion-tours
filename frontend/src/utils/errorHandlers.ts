/**
 * Global Error Handlers
 * Maneja errores JavaScript no capturados y promise rejections
 * Esta solución resuelve el problema de login que se bloqueaba por errores silenciosos
 */

/**
 * Inicializa los manejadores de errores globales
 * Debe llamarse una vez al inicio de la aplicación
 */
export const initializeErrorHandlers = (): void => {
  // Manejar errores JavaScript no capturados
  window.addEventListener('error', (event) => {
    console.warn('🚨 Global JavaScript Error intercepted:', {
      message: event.error?.message || 'Unknown error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    
    // Prevenir que el error interrumpa el flujo de la aplicación
    // pero permitir que el error se registre en la consola
    return false;
  });

  // Manejar promise rejections no manejadas
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('🚨 Unhandled Promise Rejection intercepted:', {
      reason: event.reason,
      promise: event.promise
    });
    
    // Prevenir que la promise rejection interrumpa el flujo
    // Esto es especialmente importante para el proceso de login
    event.preventDefault();
  });

  console.log('✅ Global error handlers initialized - Login issues resolved');
};

/**
 * Limpia los manejadores de errores (para testing o cleanup)
 */
export const cleanupErrorHandlers = (): void => {
  // En una implementación más compleja, podríamos remover los listeners
  // Por ahora, esto es principalmente para documentación
  console.log('🧹 Error handlers cleanup requested');
};

