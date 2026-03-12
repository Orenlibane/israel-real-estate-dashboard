# Israel Real Estate & Mortgage Dashboard

A high-end BI dashboard for tracking Israeli real estate prices and mortgage rates, built with Angular and Node.js.

## Architecture

- **Frontend**: Angular 21+ with SCSS, Tailwind CSS, Chart.js
- **Backend**: Node.js Express proxy server
- **Data Sources**: CBS (Central Bureau of Statistics), Bank of Israel

## Features

- Real-time data from CBS and Bank of Israel APIs
- Interactive dual-axis chart showing price/interest rate correlation
- Glassmorphism UI with dark mode support
- Full RTL (Hebrew) support
- Searchable data tables with CSV export
- Toggle between "New Dwellings" and "General Market" data

## Getting Started

### 1. Start the Backend Server

```bash
cd server
npm install
npm start
```

The server will run on `http://localhost:3000`

### 2. Start the Angular Frontend

```bash
cd frontend
npm install
npm start
```

The app will run on `http://localhost:4200`

## API Endpoints (Proxy Server)

| Endpoint | Description |
|----------|-------------|
| `/api/cbs/prices` | CBS New Dwellings Price Index |
| `/api/cbs/general-prices` | CBS General Housing Price Index |
| `/api/boi/interest` | Bank of Israel Interest Rates |
| `/api/boi/mortgages` | Bank of Israel Mortgage Data |
| `/api/health` | Health check endpoint |

## Project Structure

```
israel-real-estate-dashboard/
├── server/                 # Node.js Express proxy server
│   ├── index.js           # Main server file
│   └── package.json
├── frontend/              # Angular application
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── header/           # Header with toggles
│       │   │   ├── kpi-section/      # KPI cards
│       │   │   ├── correlation-chart/ # Dual-axis chart
│       │   │   └── data-table/       # Searchable table
│       │   ├── services/
│       │   │   ├── data.service.ts   # API communication
│       │   │   └── theme.service.ts  # Dark mode management
│       │   └── models/
│       │       └── data.models.ts    # TypeScript interfaces
│       └── styles.scss               # Global styles
└── README.md
```

## Deployment

### Railway Deployment

1. **Create a Railway account** at https://railway.app

2. **Install Railway CLI** (optional):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Deploy via GitHub**:
   - Push your code to GitHub
   - In Railway dashboard, click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the configuration and deploy

4. **Or deploy via CLI**:
   ```bash
   railway init
   railway up
   ```

5. **Environment Variables** (set in Railway dashboard):
   - `NODE_ENV`: `production`
   - `PORT`: (automatically set by Railway)
   - `CORS_ORIGIN`: Your frontend URL (optional, defaults to `*`)

### Manual Deployment

1. **Build the frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Start the server**:
   ```bash
   cd ..
   NODE_ENV=production node server/index.js
   ```

The server will serve both the API and the Angular frontend on the same port.

### Vercel Deployment

For Vercel, you can deploy the frontend separately and configure the backend on a different service.

1. Connect your repo to Vercel
2. Set the root directory to `frontend`
3. Update `environment.prod.ts` with your backend URL

## Data Sources

- **CBS (למ"ס)**: https://api.cbs.gov.il
- **Bank of Israel**: https://boi.org.il/PublicApi

## License

MIT
