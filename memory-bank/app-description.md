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

## Tech Stack
- **Frontend:** React + TypeScript  
- **Backend:** Java + Spring Boot  
- **Database:** PostgreSQL (self-hosted on EC2)  
- **Infrastructure:** AWS EC2, S3, Docker  

## Project Goals
- Validate the product by receiving at least 10 real reservations within the first month.
- Reduce manual management of bookings and activities.
- Provide a professional and coherent digital experience to visitors.
- Ensure a solid architecture for future scalability.

## Deployment Information

### Environment URLs
- **Development Site:** https://tinambu-frontend-dev.s3.us-east-1.amazonaws.com/
- **Backend API:** [To be configured]

### Admin Credentials
- **Email:** admin@pasocenturion.com.uy
- **Password:** admin123
- **Note:** These are the default credentials created during database initialization

### Access Information
- Admin panel accessible at: `/admin` (requires authentication)
- Public site: Root URL `/`
- Authentication required for admin functionalities