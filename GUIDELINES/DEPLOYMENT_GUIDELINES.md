# Deployment & Infrastructure Guidelines

This document outlines the guidelines and best practices for deploying and managing the infrastructure of the Pipeline Pulse application.

## 1. Core Infrastructure

-   **Provider:** Amazon Web Services (AWS)
-   **Infrastructure as Code (IaC):** All core infrastructure is managed via AWS CloudFormation. The templates are located in the `.github/workflows/` directory.
-   **Primary Services:**
    -   **Amazon ECS (Elastic Container Service) with Fargate:** For running our backend and frontend containers.
    -   **Amazon Aurora Serverless v2:** For our PostgreSQL database.
    -   **Amazon S3:** For storing file uploads and other static assets.
    -   **AWS Secrets Manager:** For securely storing all application secrets.
    -   **Amazon CloudFront:** As a CDN for the frontend application.
    -   **AWS Certificate Manager (ACM):** For managing SSL/TLS certificates.

## 2. Deployment Process

-   **Continuous Integration/Continuous Deployment (CI/CD):** All deployments are automated via GitHub Actions. The workflow files are located in `.github/workflows/`.
-   **`deploy-cloudformation-infrastructure.yml`:** This workflow is responsible for deploying the core AWS infrastructure. It should be run when there are changes to the CloudFormation templates.
-   **`deploy-existing-infrastructure.yml`:** This workflow is responsible for deploying the application code (backend and frontend) to the existing infrastructure. It is triggered on pushes to the `main` and `development` branches.

## 3. Environment Strategy

-   **Development:** The `development` branch deploys to a dedicated development environment in AWS. This environment is used for testing and staging.
-   **Production:** The `main` branch deploys to the production environment. All code must be thoroughly tested in the development environment before being merged to `main`.
-   **Environment Variables:** Environment-specific configuration is managed through `.env` files. The `.env.development` and `.env.production` files in the `backend/` and `frontend/` directories are used to configure the application for each environment. **Do not commit these files to version control.** They should be created from the `.env.example` files.

## 4. Security

-   **IAM Roles:** The ECS tasks run with specific IAM roles that grant them the necessary permissions to access other AWS services (like Secrets Manager and S3). These roles should always follow the principle of least privilege.
-   **Secrets Management:** All sensitive information (database passwords, API keys, JWT secrets) **must** be stored in AWS Secrets Manager. The application code retrieves these secrets at runtime. Do not pass secrets as environment variables to the containers.
-   **Network Security:** The application is deployed within a VPC. Security groups are used to control traffic between the different components (e.g., allowing the backend to connect to the database).

## 5. Monitoring & Logging

-   **CloudWatch Logs:** All application logs (from both the backend and frontend) are sent to Amazon CloudWatch Logs. This is our primary tool for debugging and monitoring.
-   **Health Checks:** The backend exposes a `/health` endpoint that is used by ECS to monitor the health of the application containers.
