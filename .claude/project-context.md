# Pipeline Pulse Project Context

## Project Overview
Pipeline Pulse is an enterprise-grade sales intelligence platform that transforms Zoho CRM data into actionable revenue insights. It provides real-time pipeline visibility, O2R (Opportunity-to-Revenue) tracking through four phases, GTM motion management, and currency-standardized financial insights in SGD.

## Key Business Goals
1. **Automate Data Ingestion**: Robust, automated synchronization from Zoho CRM
2. **Real-time Visibility**: Up-to-the-minute sales pipeline data and KPIs
3. **Data Quality**: Ensure accuracy, standardize currency to SGD, identify discrepancies
4. **Operational Efficiency**: Reduce manual data preparation and reporting
5. **Proactive Management**: Early identification of at-risk deals and expansion opportunities
6. **Revenue Intelligence**: Transform opportunity data into predictive insights

## Target Users
- **Primary**: Sales Leaders, Sales Operations Managers, Account Executives
- **Secondary**: Customer Success Managers, Finance Team, System Administrators
- **Scale**: Support for 100+ concurrent users, 1M+ opportunity records

## Core Features
1. **Data Synchronization**: Automated Zoho CRM sync with conflict resolution
2. **O2R Tracking**: Four-phase opportunity lifecycle management
3. **Health Monitoring**: Green/Yellow/Red/Blocked status system
4. **GTM Motion Tracker**: Customer journey aligned with AWS segments
5. **Financial Intelligence**: Multi-currency to SGD standardization
6. **Bulk Operations**: Efficient data management capabilities
7. **Analytics & Reporting**: Comprehensive dashboards and custom reports

## Technical Architecture
- **Frontend**: React 18.3+ with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI with Python 3.11+, async architecture
- **Database**: PostgreSQL 15+ with SQLAlchemy ORM
- **Cache**: Redis for performance optimization
- **Integrations**: Zoho CRM SDK, Currency Freaks API
- **Infrastructure**: AWS (ECS/EKS, RDS, ElastiCache)

## Design Philosophy
- **Data Clarity**: Complex insights made instantly understandable
- **Professional Trust**: Enterprise-grade aesthetics that inspire confidence
- **Operational Efficiency**: Every element serves a purpose in revenue workflow
- **Adaptive Intelligence**: Responsive to user needs and system states

## Development Standards
- TypeScript strict mode for type safety
- Pydantic models for API validation
- Design token system for consistent UI
- Repository pattern for data access
- Comprehensive error handling
- WCAG 2.1 Level AA accessibility compliance

## Current Phase
Setting up the initial project structure and core foundation components.
