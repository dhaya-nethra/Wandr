Wandr

Wandr is a mobility data collection application developed for Kerala’s transportation planning and research. The platform allows participants to record and manage their daily travel information while enabling researchers and administrators to analyze aggregated travel patterns securely and efficiently.
Features


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


Tech Stack


Frontend: React, TypeScript, Tailwind CSS


Backend: Node.js / Express.js


Database: PostgreSQL


Authentication: Role-based authentication system


Location Services: GPS and device location APIs


Data Export: JSON and CSV data processing tools

## Project Structure

This is a monorepo with the following structure:

- **`frontend/`**: React + Vite frontend application.
- **`backend/`**: Node.js Express server.
- **`mobile/`**: Mobile platform code (Android & iOS) managed by Capacitor.
- **`apps/desktop/`**: Electron-specific main process code.
- **`docs-site/`**: Documentation website.


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

Project Structure

wandr/
├── frontend/                    # React + Vite web application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── layout/        # AdminLayout, AppLayout, MobileNav
│   │   │   ├── trips/         # Trip-related components (TripForm, TripCard, etc.)
│   │   │   ├── ui/            # shadcn/ui components (buttons, dialogs, etc.)
│   │   │   ├── AdminSecretTrigger.tsx
│   │   │   └── NavLink.tsx
│   │   ├── hooks/             # Custom React hooks (useAuth, useTrips, useGeolocation, etc.)
│   │   ├── lib/               # Utilities (backendApi, crypto, geocoding, serverSync)
│   │   ├── pages/             # Page components (Dashboard, Login, NewTrip, Profile, etc.)
│   │   ├── types/             # TypeScript type definitions (trip.ts)
│   │   ├── test/              # Test files
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── App.css
│   │   └── vite-env.d.ts
│   ├── public/                # Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.js
│   ├── postcss.config.js
│   └── vitest.config.ts
│
├── backend/                    # Node.js Express server
│   ├── index.js               # Main server
│   ├── db.js                  # JSON file database utilities
│   ├── natpac_data.json       # Data store
│   ├── package.json
│   └── variables.gradle
│
├── capacitor.config.ts        # Capacitor configuration
├── package.json               # Root package config
├── tsconfig.json              # Root TypeScript config
├── FOLDER_STRUCTURE.md        # This file
└── test-proxy.mjs

