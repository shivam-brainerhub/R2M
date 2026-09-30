# R2M

## Project Overview

This project consists of two main parts:
- **Frontend:** A web application (Next.js/React).
- **Backend:** A Python-based API server (FastAPI) with database migrations (Alembic).
- **Database:** PostgreSQL.

## Getting Started

This project is fully dockerized and uses Docker Compose for orchestration. You do not need to install Node.js or Python locally to run the application.

### Prerequisites
- Docker
- Docker Compose

### Setup & Run
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   (Update the `.env` values if necessary, though the defaults work for local development).

2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

3. The services will be available at:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **Database**: localhost:5432

### Database Migrations
To run database migrations (Alembic) inside the running backend container, use:
```bash
docker-compose exec backend alembic upgrade head
```

### Stopping the services
To stop the running containers:
```bash
docker-compose down
```
