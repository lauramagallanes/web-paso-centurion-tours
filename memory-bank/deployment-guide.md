# Tinambu Tours - Deployment & Development Guide

## ⚡ Quick Reference

### URLs
- **Frontend:** https://[FRONTEND_BUCKET].s3.us-east-1.amazonaws.com/
- **API:** https://[API_GATEWAY_ID].execute-api.us-east-1.amazonaws.com
- **Admin Panel:** https://[FRONTEND_BUCKET].s3.us-east-1.amazonaws.com/admin

### Admin Access
- **Email:** [Ask dev team for credentials]
- **Password:** [Ask dev team for credentials]

## 🚀 Deployment Commands

### Frontend Deployment
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://[FRONTEND_BUCKET] --delete --region us-east-1 --profile [AWS_PROFILE]
```

### Backend Deployment
```bash
cd backend
mvn clean install -DskipTests
aws s3 cp target/tinambu-tours-lambda.jar s3://[ASSETS_BUCKET]/lambda/tinambu-tours-lambda.jar --region us-east-1 --profile [AWS_PROFILE]
AWS_PROFILE=[AWS_PROFILE] aws lambda update-function-code --function-name [LAMBDA_FUNCTION_NAME] --s3-bucket [ASSETS_BUCKET] --s3-key lambda/tinambu-tours-lambda.jar --region us-east-1
```

## 🔧 Adding New API Endpoints

### 1. Create Controller Method (Backend)
Example based on working `SimpleSenderoController.java`:

```java
@PostMapping("/admin")
public ResponseEntity<ApiResponse<Sendero>> crearSendero(@RequestBody Sendero sendero) {
    try {
        if (sendero.getId() == null) {
            sendero.setId(UUID.randomUUID());
        }
        sendero.setActivo(true);
        
        Sendero nuevoSendero = senderoRepository.save(sendero);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(nuevoSendero));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Error al crear sendero"));
    }
}
```

### 2. Add API Gateway Route
```bash
AWS_PROFILE=[AWS_PROFILE] aws apigatewayv2 create-route \
  --api-id [API_GATEWAY_ID] \
  --route-key "POST /your-endpoint" \
  --target "integrations/[INTEGRATION_ID]" \
  --authorization-type NONE \
  --region us-east-1
```

### 3. Update Frontend Hook
Example based on working `useSenderosAdmin` pattern:

```typescript
const createItem = async (item: any) => {
  return execute('/your-endpoint/admin', {
    method: 'POST',
    body: JSON.stringify(item)
  });
};
```

## 📊 Database Schema Reference

### Current Working Tables
- **senderos** - Fully implemented with CRUD operations
- **usuarios** - Authentication working
- **habitaciones** - Entity exists, controller needs testing
- **guias** - Entity exists, controller needs testing  
- **reservas** - Entity exists, controller needs testing

### Database Connection
- **Host:** [RDS_ENDPOINT] (set via environment variable)
- **Database:** [DATABASE_NAME] (set via environment variable)
- **Access:** Only via Lambda (no direct external access)

## 🛠️ Development Workflow

### For New Features:
1. **Backend:** Add controller method in `backend/src/main/java/com/tinambu/tours/controller/`
2. **API Gateway:** Add route using AWS CLI command above
3. **Frontend:** Add hook method in `frontend/src/hooks/useAdminApi.ts`
4. **Deploy:** Use deployment commands above
5. **Test:** Verify endpoint with curl or frontend

### Working Patterns:
- **Controller Pattern:** Follow `SimpleSenderoController.java`
- **Frontend Hook Pattern:** Follow `useSenderosAdmin` in `useAdminApi.ts`
- **Error Handling:** Use `ApiResponse<T>` wrapper for consistent responses
- **CORS:** Already configured globally

## 🔍 Debugging

### Backend Issues:
```bash
# Check Lambda logs
aws logs tail /aws/lambda/[LAMBDA_FUNCTION_NAME] --follow --profile [AWS_PROFILE]

# Test endpoint directly
curl -X GET "https://[API_GATEWAY_ID].execute-api.us-east-1.amazonaws.com/your-endpoint"
```

### Frontend Issues:
- Check browser Developer Tools Console
- Verify CORS errors (should be resolved)
- Check API calls in Network tab

## 🗂️ File Structure Reference

### Key Backend Files:
```
backend/src/main/java/com/tinambu/tours/
├── controller/SimpleSenderoController.java (✅ Working template)
├── entity/sendero/Sendero.java (✅ Working entity)
├── repository/SenderoRepository.java (✅ Working repository)
├── lambda/SpringBootLambdaHandler.java (✅ Lambda handler)
└── dto/response/ApiResponse.java (✅ Response wrapper)
```

### Key Frontend Files:
```
frontend/src/
├── services/apiService.ts (✅ API configuration)
├── hooks/useAdminApi.ts (✅ API hooks)
├── pages/admin/TrailManagement.tsx (✅ Working admin page)
└── contexts/AuthContext.tsx (✅ Authentication)
```

## ⚠️ Important Notes

### Always Remember:
- API Gateway routes must be added manually for new endpoints
- Lambda deployment can take 10-30 seconds to be active
- Frontend deployment to S3 is immediate
- Database changes require Lambda restart
- All CRUD operations are real database operations (no mock data)

### Current Limitations:
- Only senderos management is fully tested end-to-end
- Other entities (habitaciones, guías, reservas) have backend controllers but need API Gateway routes
- Dashboard statistics may need real data implementation

### Security:
- Admin authentication is working with JWT
- Database credentials are stored in Lambda environment variables
- No direct database access from internet (VPC protected)

## 🎯 Next Development Priorities

1. **Complete habitaciones management**
   - Add missing API Gateway routes
   - Test CRUD operations
   - Update frontend admin page

2. **Complete guías management**
   - Add missing API Gateway routes  
   - Test CRUD operations
   - Update frontend admin page

3. **Complete reservas management**
   - Add missing API Gateway routes
   - Test CRUD operations
   - Update frontend admin page

4. **Public website booking functionality**
   - Add public-facing booking endpoints
   - Implement booking form
   - Connect with payment processing
