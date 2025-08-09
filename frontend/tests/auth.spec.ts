import { test, expect, Page } from '@playwright/test';

/**
 * Tests End-to-End para el sistema de autenticación
 * Utiliza Playwright para probar flujos completos del usuario
 */

// Configuración para cada test
test.beforeEach(async ({ page }) => {
  // Navegar a la página principal
  await page.goto('http://localhost:80');
});

test.describe('Authentication Flow', () => {
  
  test('should display login and signup buttons when not authenticated', async ({ page }) => {
    // Verificar que los botones de autenticación están presentes
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /registrarse/i })).toBeVisible();
  });

  test('should open login modal when clicking login button', async ({ page }) => {
    // Hacer clic en el botón de login
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Verificar que se abre el modal de login
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Iniciar Sesión')).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });

  test('should open signup modal when clicking signup button', async ({ page }) => {
    // Hacer clic en el botón de signup
    await page.getByRole('button', { name: /registrarse/i }).click();
    
    // Verificar que se abre el modal de signup
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Registrarse')).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByLabel(/nombre completo/i)).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    // Abrir modal de signup
    await page.getByRole('button', { name: /registrarse/i }).click();
    
    // Llenar formulario de registro
    const timestamp = Date.now();
    const email = `test${timestamp}@playwright.test`;
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByLabel(/nombre completo/i).fill('Test User Playwright');
    
    // Enviar formulario
    await page.getByRole('button', { name: /registrarse/i, exact: true }).click();
    
    // Verificar que el registro fue exitoso
    await expect(page.getByText(/usuario registrado exitosamente/i)).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Primero registrar un usuario
    await registerTestUser(page);
    
    // Abrir modal de login
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Llenar formulario de login
    await page.getByLabel(/email/i).fill('admin@tinambu.com');
    await page.getByLabel(/contraseña/i).fill('admin123');
    
    // Enviar formulario
    await page.getByRole('button', { name: /iniciar sesión/i, exact: true }).click();
    
    // Verificar que el login fue exitoso
    await expect(page.getByText(/hola,/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /cerrar sesión/i })).toBeVisible();
  });

  test('should show error message for invalid login credentials', async ({ page }) => {
    // Abrir modal de login
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Llenar formulario con credenciales incorrectas
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');
    
    // Enviar formulario
    await page.getByRole('button', { name: /iniciar sesión/i, exact: true }).click();
    
    // Verificar que se muestra mensaje de error
    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 10000 });
  });

  test('should successfully logout', async ({ page }) => {
    // Primero hacer login
    await loginTestUser(page);
    
    // Hacer logout
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    
    // Verificar que se cerró la sesión
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /registrarse/i })).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    // Probar validación en formulario de signup
    await page.getByRole('button', { name: /registrarse/i }).click();
    
    // Intentar enviar formulario vacío
    await page.getByRole('button', { name: /registrarse/i, exact: true }).click();
    
    // Verificar que se muestran mensajes de validación
    await expect(page.getByText(/email es obligatorio/i)).toBeVisible();
    await expect(page.getByText(/contraseña es obligatoria/i)).toBeVisible();
    await expect(page.getByText(/nombre completo es obligatorio/i)).toBeVisible();
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    const email = 'duplicate@test.com';
    
    // Registrar primer usuario
    await page.getByRole('button', { name: /registrarse/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/contraseña/i).fill('password123');
    await page.getByLabel(/nombre completo/i).fill('First User');
    await page.getByRole('button', { name: /registrarse/i, exact: true }).click();
    
    // Esperar confirmación
    await expect(page.getByText(/usuario registrado exitosamente/i)).toBeVisible({ timeout: 10000 });
    
    // Intentar registrar segundo usuario con mismo email
    await page.reload();
    await page.getByRole('button', { name: /registrarse/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/contraseña/i).fill('password456');
    await page.getByLabel(/nombre completo/i).fill('Second User');
    await page.getByRole('button', { name: /registrarse/i, exact: true }).click();
    
    // Verificar mensaje de error
    await expect(page.getByText(/ya existe un usuario con el email/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Protected Routes', () => {
  
  test('should redirect to login when accessing protected route without authentication', async ({ page }) => {
    // Intentar acceder a ruta protegida
    await page.goto('http://localhost:80/my-bookings');
    
    // Verificar que se muestra el formulario de login o se redirige
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('should allow access to protected route after authentication', async ({ page }) => {
    // Hacer login primero
    await loginTestUser(page);
    
    // Navegar a ruta protegida
    await page.getByText(/mis reservas/i).click();
    
    // Verificar que se puede acceder
    await expect(page.url()).toContain('/my-bookings');
  });

  test('should show admin link for admin users', async ({ page }) => {
    // Login como admin
    await loginAsAdmin(page);
    
    // Verificar que se muestra el enlace de admin
    await expect(page.getByText(/admin/i)).toBeVisible();
  });

  test('should not show admin link for regular users', async ({ page }) => {
    // Login como usuario regular
    await loginTestUser(page);
    
    // Verificar que NO se muestra el enlace de admin
    await expect(page.getByText(/admin/i)).not.toBeVisible();
  });
});

test.describe('Navigation', () => {
  
  test('should navigate through public pages', async ({ page }) => {
    // Navegar a diferentes páginas públicas
    await page.getByText(/tinambú/i).first().click();
    await expect(page.url()).toContain('/about');
    
    await page.getByText(/alojamiento/i).click();
    await expect(page.url()).toContain('/accomodations');
    
    await page.getByText(/actividades/i).click();
    await expect(page.url()).toContain('/activities');
    
    await page.getByText(/reservar/i).click();
    await expect(page.url()).toContain('/book');
  });

  test('should maintain authentication state across navigation', async ({ page }) => {
    // Login
    await loginTestUser(page);
    
    // Navegar a diferentes páginas
    await page.getByText(/alojamiento/i).click();
    await expect(page.getByRole('button', { name: /cerrar sesión/i })).toBeVisible();
    
    await page.getByText(/actividades/i).click();
    await expect(page.getByRole('button', { name: /cerrar sesión/i })).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  
  test('should work on mobile devices', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar que la navegación funciona en móvil
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /registrarse/i })).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    // Configurar viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Verificar funcionalidad en tablet
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

// Funciones auxiliares
async function registerTestUser(page: Page) {
  const timestamp = Date.now();
  const email = `test${timestamp}@playwright.test`;
  
  await page.getByRole('button', { name: /registrarse/i }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill('password123');
  await page.getByLabel(/nombre completo/i).fill('Test User');
  await page.getByRole('button', { name: /registrarse/i, exact: true }).click();
  
  await expect(page.getByText(/usuario registrado exitosamente/i)).toBeVisible({ timeout: 10000 });
  
  return { email, password: 'password123' };
}

async function loginTestUser(page: Page) {
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.getByLabel(/email/i).fill('admin@tinambu.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i, exact: true }).click();
  
  await expect(page.getByText(/hola,/i)).toBeVisible({ timeout: 10000 });
}

async function loginAsAdmin(page: Page) {
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.getByLabel(/email/i).fill('admin@tinambu.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i, exact: true }).click();
  
  await expect(page.getByText(/hola,/i)).toBeVisible({ timeout: 10000 });
}
