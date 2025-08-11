# 🔗 **INTEGRATION TESTS - FRONTEND-BACKEND CONNECTIVITY**

## 📋 **OVERVIEW**

This directory contains integration tests that validate the connectivity and data flow between the **frontend React application** and the **backend Spring Boot API**. These tests ensure that:

- ✅ API endpoints are accessible
- ✅ Data structures are consistent  
- ✅ Error handling works correctly
- ✅ Authentication flows properly
- ✅ CORS is configured correctly
- ✅ Performance meets expectations

---

## 🧪 **TEST FILES**

### **1. BackendConnectivity.test.tsx**
**🎯 Purpose**: Mock-based integration tests for API connectivity
- **Health check** endpoint validation
- **CRUD operations** for all main entities (Senderos, Habitaciones, Guías, Reservas)
- **Authentication** flow testing
- **CORS headers** validation
- **Error handling** scenarios
- **Performance** and timeout testing

### **2. ApiHooks.test.tsx** 
**🎯 Purpose**: Tests for React hooks that interact with the backend
- **useApi** hook functionality
- **useHabitaciones, useSenderos, useGuiasDisponibles** hooks
- **useReservas** hook (create, verify, calculate price)
- **Loading states** management
- **Error state** handling
- **Network conditions** simulation

### **3. FullAppIntegration.test.tsx**
**🎯 Purpose**: End-to-end component integration with mocked backend
- **Activities page** loading data from backend
- **Accommodations page** with availability checks
- **Booking flow** complete integration
- **My Bookings** page with user data
- **Authentication** integration in components
- **Multi-component** interactions

### **4. RealBackendConnectivity.test.tsx**
**🎯 Purpose**: Tests against the actual running backend
- **Real network requests** to live backend
- **Data validation** with actual database
- **Performance testing** with real latency
- **CORS validation** in real environment
- **Authentication** with real JWT tokens
- **Load testing** with concurrent requests

---

## 🚀 **RUNNING THE TESTS**

### **Prerequisites**
```bash
# Install dependencies
cd frontend
npm install

# For real backend tests, start the backend
docker compose up -d
```

### **Individual Test Commands**
```bash
# All integration tests (mocked)
npm run test:integration

# Backend connectivity (mocked)
npm run test:integration:backend

# API hooks testing
npm run test:integration:hooks

# Full app integration (mocked)
npm run test:integration:full

# Real backend connectivity (requires running backend)
npm run test:integration:real

# All tests including real backend
npm run test:all:real
```

### **Development Workflow**
```bash
# Watch mode for development
npm run test src/test/integration/ --watch

# Coverage for integration tests
npm run test:coverage src/test/integration/

# UI mode for debugging
npm run test:ui
```

---

## 🎯 **WHAT IS TESTED**

### **✅ API Endpoints**
| Endpoint | Method | Purpose | Tested In |
|----------|--------|---------|-----------|
| `/health` | GET | Backend health check | All files |
| `/senderos` | GET | Fetch activities | BackendConnectivity, FullApp |
| `/senderos/{id}` | GET | Fetch single activity | BackendConnectivity |
| `/habitaciones` | GET | Fetch accommodations | BackendConnectivity, FullApp |
| `/guias` | GET | Fetch guides | BackendConnectivity, ApiHooks |
| `/reservas` | POST | Create booking | BackendConnectivity, ApiHooks |
| `/reservas/verificar-disponibilidad` | POST | Check availability | ApiHooks, FullApp |
| `/reservas/calcular-precio` | POST | Calculate price | ApiHooks, FullApp |
| `/auth/login` | POST | User authentication | BackendConnectivity, FullApp |

### **✅ Data Flow Validation**
- **Request/Response** structure consistency
- **UUID format** validation
- **Price calculations** accuracy
- **Date handling** correctness
- **Error messages** localization

### **✅ Frontend-Backend Integration**
- **React hooks** with API calls
- **Component state** updates from API
- **Loading states** during requests
- **Error boundaries** with API failures
- **Context providers** with backend data

### **✅ Network & Performance**
- **CORS headers** validation
- **Request timeouts** handling
- **Concurrent requests** performance
- **Network interruptions** resilience
- **Rate limiting** graceful degradation

---

## 🔧 **TEST CONFIGURATION**

### **Mock Server Setup (MSW)**
```typescript
// Uses Mock Service Worker for controlled testing
const server = setupServer(
  http.get('http://localhost:8080/api/health', () => {
    return HttpResponse.json({ success: true, data: { status: 'UP' } })
  })
);
```

### **Real Backend Detection**
```typescript
// Automatically detects if backend is running
const isBackendRunning = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};
```

### **Environment Configuration**
```bash
# Backend URL (default: http://localhost:8080/api)
REACT_APP_API_URL=http://localhost:8080/api

# Test timeout (default: 10000ms)
VITEST_TIMEOUT=10000
```

---

## 📊 **TEST RESULTS INTERPRETATION**

### **✅ Success Indicators**
- All API endpoints return expected structure
- Data types match TypeScript interfaces
- Error handling works as expected
- Performance within acceptable limits
- CORS configured correctly

### **⚠️ Common Issues & Solutions**

#### **Backend Not Running**
```
⚠️  Backend not available - skipping real connectivity tests
💡 To run these tests, start the backend with: docker compose up -d
```
**Solution**: Start backend with `docker compose up -d`

#### **CORS Errors**
```
Access to fetch at 'http://localhost:8080/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Solution**: Check backend CORS configuration in `SecurityConfig.java`

#### **Network Timeouts**
```
TypeError: fetch failed - network timeout
```
**Solution**: Increase timeout or check network connectivity

#### **Data Structure Mismatches**
```
Expected property 'precioBase' to be number, received string
```
**Solution**: Verify backend DTO structure matches frontend interfaces

---

## 🎯 **INTEGRATION SCENARIOS COVERED**

### **🎪 Happy Path Scenarios**
- ✅ User browses activities → API returns senderos
- ✅ User selects dates → API checks availability  
- ✅ User creates booking → API creates reserva
- ✅ User views bookings → API returns user reservas
- ✅ Admin logs in → API returns JWT token

### **🚨 Error Scenarios**
- ❌ Backend is down → Frontend shows error message
- ❌ Invalid data sent → Backend returns validation errors
- ❌ Unauthorized access → Backend returns 401
- ❌ Network timeout → Frontend handles gracefully
- ❌ Rate limiting → Frontend retries with backoff

### **⚡ Performance Scenarios**
- 🚀 Multiple concurrent requests → All succeed
- 🚀 Large data sets → Pagination works
- 🚀 Slow network → Loading states shown
- 🚀 High load → Rate limiting applied

---

## 🔄 **CI/CD INTEGRATION**

### **GitHub Actions Example**
```yaml
- name: Run Integration Tests
  run: |
    # Start backend
    docker compose up -d --wait
    
    # Run integration tests
    cd frontend
    npm run test:integration
    npm run test:integration:real
    
    # Cleanup
    docker compose down
```

### **Test Reports**
```bash
# Generate coverage report
npm run test:coverage src/test/integration/

# Generate JSON report for CI
npm run test:integration -- --reporter=json > integration-test-results.json
```

---

## 📈 **METRICS & MONITORING**

### **Key Performance Indicators**
- **Response Time**: < 2 seconds for all endpoints
- **Success Rate**: > 99% for all API calls
- **Error Recovery**: < 5 seconds to detect and handle failures
- **Data Consistency**: 100% structure validation

### **Test Coverage Goals**
- **API Endpoints**: 100% of public endpoints tested
- **Error Scenarios**: 90% of error cases covered
- **Integration Flows**: 100% of critical user journeys
- **Performance**: All endpoints under load tested

---

## 🎯 **BEST PRACTICES**

### **✅ DO**
- Test with realistic data volumes
- Include error scenarios
- Validate data structures completely
- Test network edge cases
- Use proper timeouts
- Mock external dependencies consistently

### **❌ DON'T**
- Rely on specific database state
- Use hardcoded IDs (except for mocks)
- Skip error case testing
- Ignore performance implications
- Test implementation details
- Create brittle assertions

---

## 🆘 **TROUBLESHOOTING**

### **Test Failures**
1. **Check backend is running**: `docker compose ps`
2. **Verify network connectivity**: `curl http://localhost:8080/api/health`
3. **Check CORS configuration**: Look for CORS errors in browser console
4. **Validate data structures**: Compare API response with TypeScript interfaces
5. **Review logs**: Check both frontend console and backend logs

### **Performance Issues**
1. **Increase timeouts** in test configuration
2. **Check database performance** with backend logs
3. **Monitor network latency** during tests
4. **Profile API endpoints** individually

### **Getting Help**
- 📚 Check test documentation in each file
- 🐛 Review error messages carefully
- 📞 Ask team about backend API changes
- 🔍 Use browser dev tools for network debugging

---

## 🏆 **SUCCESS CRITERIA**

### **✅ Integration Tests Are Successful When:**
- All API endpoints are accessible and return expected data
- Frontend components properly handle backend responses
- Error scenarios are handled gracefully
- Performance meets requirements
- Data flows correctly between frontend and backend
- Authentication and authorization work properly
- CORS is configured correctly for all origins

### **🎯 Definition of Done:**
- [ ] All integration tests pass consistently
- [ ] Real backend tests pass with live environment  
- [ ] Error scenarios are covered and handled
- [ ] Performance benchmarks are met
- [ ] Documentation is complete and up-to-date
- [ ] CI/CD pipeline includes integration tests

---

**🎉 Ready to validate your frontend-backend integration!** 🚀

