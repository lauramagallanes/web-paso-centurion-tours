# MVP Implementation Plan – Tinambú Paso Centurión Tours

## 1. Project Idea and Objective:
Create a web application for Tinambú – Paso Centurión Tours, an ecotourism and birdwatching business in Uruguay. The app will allow visitors to book guided activities and lodging online, while the admin can manage those bookings and offerings through a private dashboard.

## 2. Target Audience:
- Nature and birdwatching tourists looking for guided experiences in Paso Centurión, Uruguay.
- Admin staff managing the reservations and offerings of Tinambú Tours.

## 3. Technologies:
- **Frontend:** React + TypeScript
- **Backend:** Java + Spring Boot
- **Database:** PostgreSQL (self-hosted on EC2)
- **Infrastructure:** AWS EC2, Docker, S3 for media storage, and Terraform for managing IaC
- **Authentication:** JWT-based token authentication for admin access and Spring Security for the backend

## 4. Core Features (MVP - First Iteration):
- Visitor:
  - View information about the project, activities, and available lodging
  - Book a room or activity using a web form
  - Receive a booking confirmation via email
- Admin:
  - Register and log into an admin panel
  - View, confirm, and manage reservations
  - Create, edit, or disable activities and rooms

## 5. Specify the Front-End Approach:
- Use a responsive layout with clear navigation for visitors
- Forms for booking with validation feedback
- Admin panel with protected routes and table views for managing data
- Authentication and session management using JWT stored in local storage

## 6. Define Your Deployment Strategy and AI Interaction Protocol:
- Codebase hosted on GitHub
- Dockerized backend and frontend deployed on AWS EC2
- Nginx as reverse proxy
- S3 for image hosting (room and activity photos)
- Memory Bank structure maintained under `/memory-bank` in the repo:
  - `app-description.md`, `change-log.md`, `plan-user-authentication.md`, etc.
- AI assistants will follow step-by-step ACID-style implementation plans and update the memory bank accordingly

---

This implementation plan defines the minimum viable structure to guide development with an AI partner. It will evolve as features are developed incrementally.