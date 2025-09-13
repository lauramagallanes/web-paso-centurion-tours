# Application Description: Tinambú – Paso Centurión Tours

## Objective
Develop a web application for Tinambú – Paso Centurión Tours, an ecotourism and birdwatching business in Uruguay. The application should allow visitors to:
- Learn about the project, its activities, and lodging options.
- Book guided tours and accommodations through the website.
- Interact with a simple and clear reservation system.

And allow the admin team to:
- Manage incoming bookings.
- Create, edit, or disable rooms and activities.

## Target Users
- Visitors interested in nature tourism and birdwatching.
- Project administrators.

## Core Features
- Lodging reservation.
- Activity reservation (e.g., hiking, birdwatching).
- Admin panel to manage reservations.
- Admin panel to manage rooms and activities.

## Tech Stack (Updated)
- **Frontend:** React + TypeScript + Vite
- **Backend:** Java 17 + Spring Boot 3.2 + Spring Data JPA
- **Database:** PostgreSQL 13 (AWS RDS)
- **Infrastructure:** AWS Lambda + API Gateway + S3 + RDS
- **Deployment:** Serverless architecture with AWS services

## Current Deployment Architecture

### Frontend (React + TypeScript)
- **URL:** https://tinambu-frontend-dev.s3.us-east-1.amazonaws.com/
- **Hosting:** AWS S3 Static Website Hosting
- **Build:** Vite for production builds
- **Deployment:** Direct sync to S3 bucket `tinambu-frontend-dev`
- **CORS:** Configured to communicate with AWS API Gateway

### Backend (Spring Boot + AWS Lambda)
- **Function Name:** `tinambu-tours-backend-dev`
- **Runtime:** Java 17
- **Handler:** `com.tinambu.tours.lambda.SpringBootLambdaHandler`
- **Memory:** 1024 MB
- **Timeout:** 180 seconds
- **VPC:** Configured with subnets and security groups for RDS access
- **Environment Profile:** `lambda-with-db`

### API Gateway (HTTP API)
- **API ID:** [API_GATEWAY_ID]
- **Base URL:** https://[API_GATEWAY_ID].execute-api.us-east-1.amazonaws.com
- **Type:** HTTP API (not REST API)
- **CORS:** Enabled for all origins with proper headers
- **Configured Routes:**
  - `GET /basic` - Health check endpoint
  - `GET /senderos` - Public senderos list
  - `GET /senderos/admin` - Admin senderos management
  - `POST /senderos/admin` - Create sendero
  - `PUT /senderos/admin/{id}` - Update sendero
  - `DELETE /senderos/admin/{id}` - Delete sendero
  - `GET /senderos/{id}` - Get sendero by ID
  - Authentication routes (`/auth/login`, `/auth/signup`, etc.)
  - Other existing routes for various endpoints

### Database (PostgreSQL RDS)
- **Host:** [Set via environment variable DB_HOST]
- **Port:** 5432
- **Database:** [Set via environment variable DB_NAME]
- **Username:** [Set via environment variable DB_USERNAME]
- **Engine:** PostgreSQL 13
- **Instance:** AWS RDS managed service
- **VPC:** Same VPC as Lambda for secure communication
- **Security Groups:** Configured to allow Lambda access

## Admin Credentials
- **Email:** [Ask dev team for admin credentials]
- **Password:** [Ask dev team for admin credentials]
- **User Type:** ADMINISTRADOR (with admin privileges)
- **Note:** Pre-configured admin user exists in database

## Development Workflow

### Frontend Development & Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://tinambu-frontend-dev --delete --region us-east-1 --profile laura
```

### Backend Development & Deployment
```bash
# Build backend
cd backend
mvn clean install -DskipTests

# Upload to S3
aws s3 cp target/tinambu-tours-lambda.jar s3://tinambu-public-assets-dev/lambda/tinambu-tours-lambda-REAL-DB.jar --region us-east-1 --profile laura

# Update Lambda function
AWS_PROFILE=laura aws lambda update-function-code --function-name tinambu-tours-backend-dev --s3-bucket tinambu-public-assets-dev --s3-key lambda/tinambu-tours-lambda-REAL-DB.jar --region us-east-1
```

### API Gateway Route Management
```bash
# Add new route example
AWS_PROFILE=laura aws apigatewayv2 create-route --api-id 53dmek6dqk --route-key "GET /new-endpoint" --target "integrations/cd4sgpj" --authorization-type NONE --region us-east-1
```

## Important Configuration Details

### Spring Boot Configuration
- **Profile:** `lambda-with-db` (set via environment variable)
- **Web Application Type:** `SERVLET` (configured in SpringBootLambdaHandler)
- **JPA:** Hibernate with PostgreSQL driver
- **Security:** Spring Security with JWT authentication
- **CORS:** Configured for frontend domain

### AWS Lambda Environment Variables
```
DB_USERNAME=[DATABASE_USERNAME]
DB_PORT=5432
JWT_SECRET=[JWT_SECRET_KEY_256_BITS]
SPRING_PROFILES_ACTIVE=lambda-with-db
DB_NAME=[DATABASE_NAME]
DB_HOST=[RDS_ENDPOINT]
DB_PASSWORD=[DATABASE_PASSWORD]
```

### Network Configuration
- **Lambda VPC:** [CONFIGURED_VPC_ID]
- **Lambda Subnets:** [SUBNET_1], [SUBNET_2]
- **Lambda Security Group:** [LAMBDA_SECURITY_GROUP_ID]
- **RDS Security Group:** Allows inbound PostgreSQL (5432) from Lambda SG

## Current Implementation Status

### ✅ Fully Working
- Frontend-Backend integration
- PostgreSQL database connectivity
- Admin panel with sendero management
- User authentication and authorization
- API Gateway routing
- Spring Boot on AWS Lambda
- Real database operations (CRUD for senderos)

### ⚠️ Implemented but Limited
- Only senderos management is fully implemented
- Other entities (habitaciones, guías, reservas) have controllers but may need testing

### 📋 Next Development Areas
- Complete habitaciones management implementation
- Complete guías management implementation  
- Complete reservas management implementation
- Dashboard statistics with real data
- Public website booking functionality

## Access Information
- **Admin Panel:** https://[FRONTEND_BUCKET].s3.us-east-1.amazonaws.com/admin
- **Public Site:** https://[FRONTEND_BUCKET].s3.us-east-1.amazonaws.com/
- **API Base:** https://[API_GATEWAY_ID].execute-api.us-east-1.amazonaws.com
- **Database:** Direct access only via Lambda (no public endpoint)

## Key Files for New Development
- **Frontend API Config:** `frontend/src/services/apiService.ts` (baseURL configured)
- **Backend Controller:** `backend/src/main/java/com/tinambu/tours/controller/SimpleSenderoController.java` (working template)
- **Database Entities:** `backend/src/main/java/com/tinambu/tours/entity/`
- **Frontend Admin Hooks:** `frontend/src/hooks/useAdminApi.ts` (API integration patterns)

## Project Goals
- Validate the product by receiving at least 10 real reservations within the first month.
- Reduce manual management of bookings and activities.
- Provide a professional and coherent digital experience to visitors.
- Ensure a solid architecture for future scalability.