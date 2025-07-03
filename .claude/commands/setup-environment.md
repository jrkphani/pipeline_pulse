# Setup Development Environment

Set up complete development environment for Pipeline Pulse: $ARGUMENTS

## 🔧 Prerequisites Validation

- **Python**: Check Python 3.9+ installation
- **Node.js**: Verify Node.js 18+ and npm
- **Database**: Ensure PostgreSQL (production) or SQLite (development)
- **AWS CLI**: Validate AWS credentials for production access

## 📦 Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment configuration
cp .env.example .env
# Edit .env with your configuration:
# - ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET
# - DATABASE_URL (for local development)
# - CURRENCYFREAKS_API_KEY
# - AWS_REGION (for production)

# Database setup
alembic upgrade head      # Apply migrations
python reset_database.py # Reset local database with sample data (optional)

# Verify setup
uvicorn main:app --reload --port 8000
# Test: http://localhost:8000/docs (should show API documentation)
```

## 🎨 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Environment configuration
cp .env.example .env
# Edit .env with:
# - VITE_API_BASE_URL=http://localhost:8000 (for local development)
# - VITE_API_BASE_URL=https://api.1chsalesreports.com (for production)

# Start development server
npm run dev
# Test: http://localhost:5173 (should show Pipeline Pulse dashboard)
```

## 🔗 Integration Verification

1. **API Connectivity**: Ensure frontend can reach backend API
2. **Zoho Integration**: Test OAuth2 flow in Token Management page
3. **Database Connectivity**: Verify data persistence
4. **Currency Service**: Test SGD conversion functionality

## 🧪 Run Test Suite

```bash
# Backend tests
cd backend
python -m pytest -v

# Frontend E2E tests
cd frontend
npm test
```

## 🚀 Production Access Setup

```bash
# AWS CLI configuration
aws configure
# Enter your AWS credentials for production access

# Test production API
curl https://api.1chsalesreports.com/health

# Test production frontend
curl https://1chsalesreports.com
```

## ✅ Success Indicators

- ✅ Backend API running at <http://localhost:8000>
- ✅ Frontend running at <http://localhost:5173>
- ✅ API documentation accessible at <http://localhost:8000/docs>
- ✅ Database migrations applied successfully
- ✅ Zoho OAuth2 flow functional
- ✅ All tests passing

## 🔧 Troubleshooting Common Issues

**Backend Issues:**

- `ModuleNotFoundError`: Run `pip install -r requirements.txt`
- Database connection errors: Check DATABASE_URL in .env
- Zoho API errors: Verify ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET

**Frontend Issues:**

- Build errors: Run `npm install` to update dependencies
- API connection failed: Verify VITE_API_BASE_URL in .env
- TypeScript errors: Run `npm run build` to check type issues

**Integration Issues:**

- CORS errors: Ensure backend CORS is configured for frontend URL
- OAuth2 flow fails: Check Zoho app configuration and redirect URLs
- Currency conversion fails: Verify CURRENCYFREAKS_API_KEY

Usage: `/setup-environment [component]` where component is `backend`, `frontend`, or `full`
