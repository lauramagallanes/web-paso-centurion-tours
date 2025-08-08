# Change Log – Tinambú Paso Centurión Tours

This document keeps track of all updates made to the project.

---

### 📅 2025-08-05
- **Added**: General app description (`app-description.md`).
- **Added**: PostgreSQL security guide for EC2 (`seguridad-postgresql.md`).
- **Added**: implementation plan for user authentication, including signup and login (`plan-user-authentication.md`)
- **Added**: architecture for the frontend and backedn (`architecture.md`)
- **Added**: design patterns that will be used (`design-patterns.md`)

### 📅 2025-01-27
- **Added**: Complete GitHub Actions CI/CD setup for full-stack application
- **Added**: Three workflows: `ci-cd.yml`, `security.yml`, and `test.yml`
- **Added**: AWS EC2 deployment automation
- **Added**: Security scanning with Snyk and OWASP dependency check
- **Added**: Comprehensive testing pipeline for frontend and backend
- **Updated**: `.gitignore` to include Java and AWS specific patterns
- **Added**: Documentation for GitHub Actions configuration

Notes:
- Objective: initialize the memory bank and organize the project structure for AI-assisted development.
- Next steps: continue defining implementation plans.
- CI/CD: GitHub Actions configured for automated testing, security checks, and deployment to AWS EC2.

### 📅 2025-01-27 (Evening)
- **MAJOR**: Complete project restructuring into frontend/backend architecture
- **Added**: Spring Boot backend with layered architecture (Controller, Service, Repository, Entity, DTO)
- **Added**: Factory and Strategy pattern folders for reservation types
- **Added**: Complete Docker configuration (backend/frontend Dockerfiles + docker-compose.yml)
- **Added**: PostgreSQL database initialization scripts
- **Added**: Nginx configuration for frontend reverse proxy
- **Reorganized**: React frontend with improved folder structure (components, pages, contexts, hooks, services)
- **Added**: Comprehensive project documentation and README
- **Added**: Environment configuration templates
- **Updated**: .gitignore for full-stack development

Notes:
- Project now follows the architecture defined in `architecture.md` and `design-patterns.md`
- Ready for development with clear separation between frontend and backend
- Docker-ready for both development and production environments

Contributors: Laura Magallanes