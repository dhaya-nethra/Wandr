## Wandr

Wandr is a mobility data collection application developed for Kerala’s transportation planning and research. The platform allows participants to record and manage their daily travel information while enabling researchers and administrators to analyze aggregated travel patterns securely and efficiently.

## Features

Participant Portal:
User-friendly interface for recording trips, viewing travel history, and managing travel preferences.

Admin Portal:
Administrative tools for monitoring participant activities, analytics, audit logs, and data management.

Trip Tracking:
Manual and automatic GPS-based trip tracking functionality.

Location Services:
Enable or disable GPS tracking for collecting travel movement data.

Data Export:
Export trip history in JSON format and anonymized CSV datasets for research purposes.

Analytics:
View travel statistics, trip summaries, and mobility insights.

Privacy & Security:
Consent management, encrypted data collection, and secure participant data handling.

Audit Logging:
Track administrative activities and system events for transparency.

## Tech Stack

Frontend: React, TypeScript, Tailwind CSS

Backend: Node.js / Express.js

Database: PostgreSQL

Authentication: Role-based authentication system

Location Services: GPS and device location APIs

Data Export: JSON and CSV data processing tools

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Wandr
   ```

2. **Install dependencies for all modules:**
   This project uses a monorepo structure. You can install all dependencies (root, frontend, and backend) with a single command:
   ```bash
   npm run install:all
   ```

## Running the Application

### Development Mode
To run both the frontend and the backend server simultaneously in development mode:
```bash
npm run dev:all
```
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000

## Project Structure

```text
wandr/
├── frontend/          # React + Vite web application
│   ├── src/           # Application source code (components, pages, hooks)
│   └── public/        # Static assets
├── backend/           # Node.js Express server
│   ├── database.js    # PostgreSQL connection logic
│   └── index.js       # Main API server
├── mobile/            # Mobile platform code (Android & iOS)
├── apps/              # Desktop application (Electron)
└── docs-site/         # Documentation website
```

