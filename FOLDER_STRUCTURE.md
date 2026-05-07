# Wandr - Project Structure

This is a monorepo with the following structure:

```
wandr/
├── frontend/               # React + Vite frontend application
│   ├── src/               # React components, pages, hooks, lib
│   ├── public/            # Static assets
│   ├── index.html         # HTML entry point
│   ├── vite.config.ts     # Vite configuration
│   ├── tsconfig.json      # TypeScript configuration
│   ├── tailwind.config.ts # Tailwind CSS configuration
│   ├── package.json       # Frontend dependencies
│   └── dist/              # Build output
│
├── backend/               # Node.js Express server
│   ├── index.js          # Main server file
│   ├── db.js             # Database utilities
│   ├── natpac_data.json  # Data file
│   └── package.json      # Backend dependencies
│
├── mobile/                # Mobile applications (Capacitor)
│   ├── android/          # Android native project
│   └── ios/              # iOS native project
│
├── apps/                  # Desktop and other applications
│   └── desktop/          # Electron desktop app
│
├── build/                # Build artifacts
└── scratch/              # Temporary files

```

## Scripts

### From root directory:

```bash
npm run dev:all         # Run frontend + backend concurrently
npm run dev             # Run frontend only
npm run dev:server      # Run backend only
npm run build           # Build frontend
npm run desktop:dev     # Run desktop with frontend
npm run mobile:open:android  # Build and open Android
npm run mobile:open:ios      # Build and open iOS
npm run lint            # Lint code
npm run test            # Run tests
```

### From frontend directory:

```bash
cd frontend
npm run dev             # Vite dev server
npm run build           # Build for production
npm run preview         # Preview production build
```

### From backend directory:

```bash
cd backend
npm run dev             # Start backend with nodemon
npm start               # Start backend
```

## Getting Started

1. Install root dependencies:
```bash
npm run install:all
```

2. Run the full stack:
```bash
npm run dev:all
```

3. Access:
   - Frontend: https://localhost:8080
   - Backend: http://localhost:3001
   - Backend Health: http://localhost:3001/api/health

## Development

- **Frontend**: Located in `frontend/` - React with TypeScript, Vite build tool
- **Backend**: Located in `backend/` - Express.js server
- **Mobile**: Located in `mobile/` - Capacitor-based mobile apps
- **Desktop**: Located in `apps/desktop/` - Electron-based desktop app
