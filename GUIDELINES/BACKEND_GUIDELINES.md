# Backend Development Guidelines

This document provides guidelines for developing the backend of the Pipeline Pulse application. Following these standards ensures our backend is robust, scalable, and maintainable.

## 1. Technology Stack

-   **Framework:** FastAPI
-   **Language:** Python
-   **Database:** PostgreSQL for production, SQLite for local development.
-   **ORM:** SQLAlchemy
-   **Database Migrations:** Alembic
-   **Zoho Integration:** The official `zohocrm-sdk-v8` is the standard. All new Zoho interactions must use the SDK via our established service layers.

## 2. Code Style & Structure

-   **Project Structure:** The backend is organized into a layered architecture:
    -   `app/api/`: API endpoint definitions (routers).
    -   `app/core/`: Core application logic, including configuration, database connections, and middleware.
    -   `app/models/`: SQLAlchemy database models.
    -   `app/services/`: Business logic and interactions with external services (like Zoho).
    -   `app/tests/`: Pytest tests.
-   **Dependency Management:** All Python dependencies are managed in `requirements.txt`. Use `pip install -r requirements.txt` to install them.
-   **Formatting:** We will eventually introduce a code formatter like Black. For now, please adhere to PEP 8 standards.

## 3. API Design

-   **RESTful Principles:** Design APIs to be as RESTful as possible. Use appropriate HTTP verbs (GET, POST, PUT, DELETE).
-   **Validation:** Use Pydantic models for request and response validation to ensure data integrity.
-   **Error Handling:** Return appropriate HTTP status codes for errors (e.g., 400 for bad requests, 401 for unauthorized, 404 for not found, 500 for server errors).
-   **Asynchronous Operations:** Use `async def` for all API endpoints to ensure the application is non-blocking and can handle concurrent requests efficiently.

## 4. Database

-   **Migrations:** All database schema changes **must** be handled through Alembic migrations. Do not make manual changes to the database schema.
    -   To create a new migration: `alembic revision -m "Your descriptive message"`
    -   To apply migrations: `alembic upgrade head`
-   **Sessions:** Use FastAPI's dependency injection system to manage database sessions (`Depends(get_db)`).
-   **Querying:** Use SQLAlchemy's ORM for all database interactions. Avoid writing raw SQL queries where possible.

## 5. Zoho CRM Integration

-   **SDK First:** All communication with Zoho CRM must go through the official Python SDK. Do not make direct HTTP requests to the Zoho API.
-   **Service Layer:** Abstract all SDK interactions into a dedicated service layer (e.g., `UnifiedZohoCRMService`). API endpoints should not call the SDK directly.
-   **Authentication:** The `ImprovedZohoSDKManager` and `ImprovedZohoTokenStore` handle all aspects of service-level authentication with Zoho. Do not implement custom token management.

## 6. Security

-   **Secrets Management:** All secrets (API keys, database passwords, etc.) **must** be loaded from AWS Secrets Manager in production. The `SecretsManager` class in `app/core/secrets.py` handles this. Do not hardcode secrets or commit them to version control.
-   **Authentication & Authorization:** User authentication will be handled via JWTs. Endpoints must be protected, and data access must be filtered based on the user's region, as defined in their JWT.
