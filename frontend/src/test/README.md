# Testing Suite - Tinambú Tours

## 🧪 **TESTING STRATEGY OVERVIEW**

Esta suite de testing implementa una estrategia completa de testing para la aplicación Tinambú Tours, cubriendo:

### **📊 TIPOS DE TESTS IMPLEMENTADOS**

#### **1. Unit Tests (Tests Unitarios)**
- **Ubicación**: `src/components/**/__tests__/*.test.tsx`
- **Framework**: Vitest + React Testing Library
- **Propósito**: Testear componentes individuales de forma aislada
- **Cobertura**: Componentes UI, hooks, utilidades

#### **2. Integration Tests (Tests de Integración)**
- **Ubicación**: `src/test/integration/*.test.tsx`
- **Framework**: Vitest + React Testing Library + MSW
- **Propósito**: Testear flujos completos de usuario y interacciones entre componentes
- **Cobertura**: Flujos de navegación, gestión de estado, APIs

#### **3. End-to-End Tests (Tests E2E)**
- **Ubicación**: `src/test/e2e/*.spec.ts`
- **Framework**: Playwright
- **Propósito**: Testear la aplicación completa en un navegador real
- **Cobertura**: Flujos críticos de usuario, responsive design, accesibilidad

---

## 🚀 **COMANDOS DE TESTING**

```bash
# Tests unitarios e integración
npm run test                # Modo watch
npm run test:run           # Ejecución única
npm run test:ui            # Interfaz visual
npm run test:coverage      # Con reporte de cobertura

# Tests E2E
npm run test:e2e           # Ejecutar tests E2E
npm run test:e2e:ui        # Interfaz visual E2E
npm run test:e2e:debug     # Modo debug E2E

# Ejecutar todos los tests
npm run test:all           # Unit + Integration + E2E
```

---

## 🛠️ **CONFIGURACIÓN**

### **Vitest Configuration (`vite.config.ts`)**
```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  css: true,
  coverage: {
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'src/test/', '**/*.d.ts'],
  },
}
```

### **Playwright Configuration (`playwright.config.ts`)**
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
]
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

```
src/test/
├── setup.ts                 # Configuración global de tests
├── utils/
│   └── test-utils.tsx       # Utilidades y custom render
├── mocks/
│   ├── handlers.ts          # MSW request handlers
│   └── server.ts            # MSW server setup
├── integration/
│   ├── UserFlow.test.tsx    # Tests de flujos de usuario
│   └── FullAppFlow.test.tsx # Tests de aplicación completa
└── e2e/
    ├── home.spec.ts         # Tests E2E de página home
    ├── booking-flow.spec.ts # Tests E2E de flujo de reserva
    └── navigation.spec.ts   # Tests E2E de navegación
```

---

## 🧩 **COMPONENTES TESTEADOS**

### **✅ Core Components**
- [x] **Button**: Variantes, estados, eventos
- [x] **Icon**: Renderizado, tamaños, colores
- [x] **Card**: Layouts, variantes, contenido
- [x] **Breadcrumbs**: Navegación, generación automática
- [x] **HeroSlider**: Navegación, autoplay, responsive
- [x] **ErrorBoundary**: Captura de errores, fallbacks

### **✅ Context Providers**
- [x] **ThemeContext**: Light/dark mode, persistencia
- [x] **CartContext**: Gestión de carrito, localStorage
- [x] **FavoritesContext**: Gestión de favoritos

### **✅ Integration Flows**
- [x] **Booking Flow**: Agregar al carrito → Checkout
- [x] **Favorites Management**: Agregar/quitar favoritos
- [x] **Theme Switching**: Persistencia entre páginas
- [x] **Navigation**: Breadcrumbs, routing, mobile menu

### **✅ E2E Scenarios**
- [x] **Home Page**: Carga, navegación, responsive
- [x] **Booking Process**: Flujo completo de reserva
- [x] **Error Handling**: 404, 500, error boundaries
- [x] **Accessibility**: ARIA labels, keyboard navigation

---

## 🎯 **TESTING PATTERNS**

### **1. Component Testing Pattern**
```typescript
describe('ComponentName', () => {
  it('renders with default props', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interactions', async () => {
    const handleClick = vi.fn();
    render(<Component onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### **2. Context Testing Pattern**
```typescript
const TestComponent = () => {
  const { state, action } = useContext();
  return <div data-testid="state">{state}</div>;
};

describe('Context', () => {
  it('provides initial state', () => {
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    expect(screen.getByTestId('state')).toHaveTextContent('initial');
  });
});
```

### **3. Integration Testing Pattern**
```typescript
describe('User Flow', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('completes full user journey', async () => {
    render(<App />);
    
    // Step 1: Navigate
    await user.click(screen.getByRole('link', { name: /activities/i }));
    
    // Step 2: Interact
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    
    // Step 3: Verify
    await waitFor(() => {
      expect(screen.getByText(/cart: 1/i)).toBeInTheDocument();
    });
  });
});
```

### **4. E2E Testing Pattern**
```typescript
test.describe('Feature', () => {
  test('user can complete task', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: /start/i }).click();
    
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

---

## 🔧 **MOCKING STRATEGIES**

### **1. API Mocking (MSW)**
```typescript
// Mock successful API response
server.use(
  http.get('/api/activities', () => {
    return HttpResponse.json([
      { id: '1', title: 'Activity 1' },
      { id: '2', title: 'Activity 2' },
    ]);
  })
);
```

### **2. Component Mocking**
```typescript
// Mock SVG imports
vi.mock('*.svg?react', () => ({
  default: (props: any) => <svg data-testid="mock-svg" {...props} />
}));
```

### **3. Browser API Mocking**
```typescript
// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

---

## 📊 **COVERAGE GOALS**

### **Target Coverage Metrics**
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### **Critical Paths (100% Coverage)**
- Authentication flow
- Payment processing
- Error boundaries
- Data validation
- Security functions

---

## 🚨 **TESTING BEST PRACTICES**

### **✅ DO**
- Test user behavior, not implementation
- Use semantic queries (getByRole, getByLabelText)
- Mock external dependencies
- Test error states and edge cases
- Keep tests isolated and independent
- Use descriptive test names
- Test accessibility features

### **❌ DON'T**
- Test internal component state directly
- Use implementation details in selectors
- Create tests that depend on other tests
- Mock everything (test real integrations when possible)
- Ignore async behavior
- Write tests just for coverage numbers

---

## 🔍 **DEBUGGING TESTS**

### **Common Issues & Solutions**

#### **1. Async Operations**
```typescript
// ❌ Wrong
expect(screen.getByText('Async content')).toBeInTheDocument();

// ✅ Correct
await waitFor(() => {
  expect(screen.getByText('Async content')).toBeInTheDocument();
});
```

#### **2. User Events**
```typescript
// ❌ Wrong
fireEvent.click(button);

// ✅ Correct
await user.click(button);
```

#### **3. Cleanup**
```typescript
// Always cleanup after tests
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

---

## 🎯 **CONTINUOUS INTEGRATION**

### **GitHub Actions Pipeline**
```yaml
- name: Run Tests
  run: |
    npm run test:run
    npm run test:e2e:headless
    npm run test:coverage
```

### **Quality Gates**
- All tests must pass
- Coverage thresholds must be met
- E2E tests must pass on multiple browsers
- No accessibility violations

---

## 📈 **METRICS & REPORTING**

### **Test Reports Generated**
- **Coverage Report**: `coverage/index.html`
- **Playwright Report**: `playwright-report/index.html`
- **Test Results**: `test-results.json`

### **Key Metrics Tracked**
- Test execution time
- Flaky test detection
- Coverage trends
- Browser compatibility
- Performance benchmarks

---

## 🔄 **MAINTENANCE**

### **Regular Tasks**
- Update test data when features change
- Review and update mocks
- Maintain E2E test stability
- Update browser versions
- Review coverage reports
- Refactor slow tests

### **When to Update Tests**
- New features added
- Bug fixes implemented
- API changes
- UI/UX updates
- Performance optimizations
- Accessibility improvements

---

## 🎉 **CONCLUSION**

Esta suite de testing proporciona una cobertura completa de la aplicación Tinambú Tours, asegurando:

- **Confiabilidad**: Tests automáticos detectan regresiones
- **Calidad**: Cobertura de casos edge y errores
- **Mantenibilidad**: Tests claros y bien organizados
- **Performance**: Tests rápidos y eficientes
- **Accesibilidad**: Verificación de estándares WCAG
- **Compatibilidad**: Tests en múltiples navegadores y dispositivos

**¡Los tests son la base de una aplicación robusta y confiable!** 🚀

