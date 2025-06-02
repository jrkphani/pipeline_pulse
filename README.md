# Pipeline Pulse 🚀

**Pipeline Pulse** is a comprehensive deal analysis platform that transforms your Zoho CRM data into actionable insights. Built for revenue leaders who need real-time pipeline intelligence and data-driven decision making.

## ✨ Features

### 📊 **Smart Pipeline Analytics**
- **Currency Standardization**: Automatic SGD conversion using real exchange rates
- **Data Quality Filtering**: Focus on deals with actual revenue and active probabilities (10-89%)
- **Interactive Drill-Down**: Country-by-country deal exploration with sortable views
- **Real-Time Metrics**: Total pipeline value, deal counts, average sizes, and conversion rates

### 🔄 **Zoho CRM Integration**
- **CSV Upload**: Import Zoho CRM opportunity exports
- **Live CRM Connection**: Direct integration via MCP server for real-time updates
- **Deal Updates**: Modify opportunities directly from the analysis interface
- **Sync Capabilities**: Keep your CRM data in sync with analysis insights

### 📈 **Advanced Filtering**
- **Probability Ranges**: Focus on deals requiring active sales attention
- **Revenue Thresholds**: Filter out placeholder deals without actual values
- **Date Ranges**: Analyze specific time periods and closing windows
- **Country/Region**: Geographic pipeline distribution analysis

### 🎨 **Modern Interface**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Adaptive theming for better user experience
- **Export Options**: Generate reports in multiple formats
- **Real-Time Updates**: Live data synchronization with visual indicators

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** for beautiful, accessible components
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **Recharts** for data visualization

### Backend
- **Python FastAPI** for high-performance API
- **Pandas** for data processing and analysis
- **Pydantic** for data validation
- **Zoho CRM MCP Server** integration
- **SQLite/PostgreSQL** for data persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- npm/yarn/pnpm

### Installation

1. **Clone and setup the project**
```bash
cd /Users/jrkphani/Projects/pipeline-pulse

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

2. **Environment Configuration**
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Pipeline Pulse"

# Backend (.env)
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
DATABASE_URL=sqlite:///./pipeline_pulse.db
```

3. **Run the application**
```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
pipeline-pulse/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API integration
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── requirements.txt
│   └── main.py
└── README.md
```

## 🔗 API Endpoints

### Upload & Analysis
- `POST /api/upload` - Upload CSV for analysis
- `GET /api/analysis/{analysis_id}` - Retrieve analysis results
- `POST /api/analysis/{analysis_id}/filter` - Apply filters to analysis

### Zoho CRM Integration
- `GET /api/zoho/deals` - Fetch deals from Zoho CRM
- `PUT /api/zoho/deals/{deal_id}` - Update deal in Zoho CRM
- `POST /api/zoho/sync` - Sync analysis results back to CRM

### Data Export
- `GET /api/export/{analysis_id}/csv` - Export as CSV
- `GET /api/export/{analysis_id}/excel` - Export as Excel
- `GET /api/export/{analysis_id}/pdf` - Export as PDF report

## 📊 Usage Workflow

1. **Upload Data**: Import your Zoho CRM opportunity export CSV
2. **Review Analysis**: Explore the automatically generated pipeline insights
3. **Apply Filters**: Focus on specific probability ranges, countries, or date ranges
4. **Drill Down**: Click on countries to see individual deal details
5. **Update CRM**: Make changes directly through the integrated CRM connection
6. **Export Results**: Generate reports for stakeholders and management

## 🔧 Configuration

### Zoho CRM Setup
1. Create a Zoho CRM application in the developer console
2. Generate client ID, client secret, and refresh token
3. Configure the MCP server connection
4. Set appropriate API permissions for reading and updating deals

### Currency Exchange
- Automatic SGD standardization using live exchange rates
- Configurable base currency in settings
- Historical rate storage for consistent reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@pipelinepulse.com or create an issue in the GitHub repository.

---

**Pipeline Pulse** - Transform your CRM data into revenue insights. Built for the modern sales organization.
