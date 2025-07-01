# 🧪 Pipeline Pulse Local Testing Guide

## 🎯 **Overview**

This guide will help you test the latest Pipeline Pulse changes locally, including:
- ✅ Live Zoho CRM API v8 integration
- ✅ Real-time data synchronization
- ✅ Enhanced UI with global navigation
- ✅ Bidirectional O2R sync capabilities
- ✅ Token management system
- ✅ Background sync services

## 📋 **Prerequisites**

### **System Requirements**
- Python 3.11+ 
- Node.js 18+
- PostgreSQL 14+ (recommended to match production)
- Git

### **API Credentials**
You'll need valid Zoho CRM credentials (already configured in `.env`):
- Client ID: `1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY`
- Client Secret: `47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7`
- Refresh Token: `1000.9c3015bbe4d6996c6fc3987d19dfe52d.afe4cc9c53d65bdd5bfe800d90d28401`

## 🚀 **Quick Start (Recommended)**

### **Option 1: Automated Setup**
```bash
# Run the automated setup script
./scripts/setup-local-postgres.sh
```

### **Option 2: Manual Setup**

#### **Step 1: Install PostgreSQL**
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Create development database
createdb pipeline_pulse_dev
```

#### **Step 2: Setup Backend**
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Verify environment configuration
cat .env

# Initialize database
python -c "
from app.core.database import create_tables
create_tables()
print('✅ Database initialized!')
"

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### **Step 3: Setup Frontend**
```bash
# Open new terminal
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

## 🔍 **Testing the New Features**

### **1. Live CRM Integration**
- **URL**: http://localhost:5173
- **Test**: Dashboard should show live CRM data instead of file uploads
- **Expected**: Real-time pipeline metrics, deal counts, connection status

### **2. Global Navigation System**
- **Test**: Press `Cmd/Ctrl + K` to open command palette
- **Expected**: 7 primary domains with search functionality
- **Domains**: Revenue Intelligence, O2R Tracker, Analytics, Data Management, CRM Operations, Workflow, Administration

### **3. API v8 Integration**
- **URL**: http://localhost:8000/docs
- **Test**: Check new API endpoints
- **Expected**: 
  - `/api/zoho/sync` - Manual sync trigger
  - `/api/zoho/live-pipeline` - Real-time pipeline data
  - `/api/zoho/status` - Connection status
  - `/api/zoho/health-check` - System health

### **4. Token Management**
- **URL**: http://localhost:5173/crm-sync
- **Test**: Token health monitoring
- **Expected**: Real-time token status, expiry countdown, refresh controls

### **5. Background Sync**
- **Test**: Check logs for automatic sync
- **Expected**: 15-minute interval sync messages in backend logs

## 🧪 **Comprehensive Testing Checklist**

### **Backend API Tests**
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test Zoho connectivity
curl http://localhost:8000/api/zoho/status

# Test live pipeline data
curl http://localhost:8000/api/zoho/live-pipeline

# Test manual sync
curl -X POST http://localhost:8000/api/zoho/sync
```

### **Frontend Feature Tests**
- [ ] Dashboard loads with live data
- [ ] Global navigation works (Cmd/Ctrl+K)
- [ ] CRM sync page shows token status
- [ ] Manual sync triggers work
- [ ] Connection status indicators work
- [ ] Responsive design on mobile

### **Integration Tests**
- [ ] Backend connects to Zoho CRM v8 API
- [ ] Database operations work (PostgreSQL)
- [ ] Background sync runs automatically
- [ ] Token refresh works automatically
- [ ] Error handling displays properly

## 🐛 **Troubleshooting**

### **Common Issues**

**1. Database Connection Error**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Recreate database if needed
dropdb pipeline_pulse_dev
createdb pipeline_pulse_dev
```

**2. Zoho API Authentication Error**
```bash
# Test token validity
python scripts/test-local-zoho-api.py

# Refresh tokens if needed
python scripts/refresh-zoho-tokens.py
```

**3. Frontend Build Issues**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**4. Port Conflicts**
```bash
# Check what's using ports
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# Kill processes if needed
kill -9 <PID>
```

### **Environment Validation**
```bash
# Run environment validation
python scripts/validate-environment.py

# Check all dependencies
pip check  # Backend
npm audit  # Frontend
```

## 📊 **Expected Test Results**

### **Successful Local Setup Should Show:**

**Backend (http://localhost:8000)**
- ✅ Health endpoint returns 200
- ✅ API docs accessible at `/docs`
- ✅ Zoho connectivity successful
- ✅ Database operations working
- ✅ Background sync running

**Frontend (http://localhost:5173)**
- ✅ Dashboard with live CRM data
- ✅ Global navigation functional
- ✅ Token management working
- ✅ Sync controls responsive
- ✅ No console errors

**Integration**
- ✅ Real-time data flow from CRM
- ✅ Automatic background sync (15min)
- ✅ Token auto-refresh working
- ✅ Error handling graceful

## 🔄 **Development Workflow**

### **Making Changes**
1. **Backend**: Edit files in `backend/app/`
2. **Frontend**: Edit files in `frontend/src/`
3. **Hot Reload**: Both servers auto-reload on changes
4. **Testing**: Use browser dev tools and backend logs

### **Testing Changes**
```bash
# Run quick tests
python scripts/run-quick-tests.py

# Run comprehensive tests
python scripts/run-comprehensive-tests.py

# Frontend tests
cd frontend && npm test
```

## 🚀 **Next Steps After Local Testing**

Once local testing is successful:
1. **Commit Changes**: If you make any local modifications
2. **Deploy Decision**: Decide if you want to redeploy to AWS
3. **Production Testing**: Test against live Zoho CRM data
4. **Performance Monitoring**: Monitor sync performance and token health

## 📞 **Getting Help**

If you encounter issues:
1. Check the logs: Backend terminal and browser console
2. Verify environment: `cat backend/.env`
3. Test connectivity: `python scripts/test-local-zoho-api.py`
4. Reset if needed: Drop database and restart setup

The application should now be running with all the latest v8 API features and live CRM integration!
