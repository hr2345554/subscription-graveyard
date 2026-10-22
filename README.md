# Subscription Graveyard 💀

A premium subscription tracking application with a dark, tech-focused aesthetic. Track subscriptions, visualize spending, and celebrate savings from cancelled services.

## 🎨 Design

- **Dark tech aesthetic** with graphite, silver, electric blue, and violet
- **Premium glassmorphism** with subtle luminous effects
- **Ambient particles** and smooth animations
- **Responsive** across all device sizes

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 🏗️ Production Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Google Cloud account for OAuth

### 1. Database Setup
```bash
createdb subscription_graveyard
```

### 2. Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` — PostgreSQL connection string
- `GOOGLE_CLIENT_ID` — From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- `SESSION_SECRET` — Random secure string

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3001/api/auth/callback`
4. Copy credentials to `.env`

### 4. Database Migration
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Run
```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── App.tsx                    # Main routing
├── contexts/AuthContext.tsx   # Authentication
├── api/service.ts            # Data layer
├── components/
│   ├── ui/                   # Button, Card, Modal, etc.
│   ├── layout/               # Sidebar, Layout
│   └── animations/           # Particles, effects
├── pages/
│   ├── Login.tsx             # Google sign-in
│   ├── Dashboard.tsx         # Overview + stats
│   ├── Subscriptions.tsx     # CRUD management
│   ├── Graveyard.tsx         # Cancelled subs
│   ├── Analytics.tsx         # Charts + insights
│   └── Settings.tsx          # Account settings
└── utils/
    ├── calculations.ts       # Billing math
    └── validation.ts         # Zod schemas
```

## 🔒 Security (Production)

- Real Google OAuth 2.0 authentication
- Server-side session management
- HTTP-only secure cookies
- User-data isolation
- CSRF protection
- Rate limiting on auth endpoints

## 📊 Features

- **Dashboard** — Active subs, spending, renewals, savings
- **Subscriptions** — Full CRUD with search/filter/sort
- **Graveyard** — Cancelled subs with savings tracking
- **Analytics** — Charts, trends, category breakdown
- **Settings** — Profile, preferences, account management

## 🧪 Testing

```bash
npm test
npm run typecheck
npm run lint
```

## 📝 Notes

- **Demo Mode**: Current build uses localStorage for demonstration
- **Production**: Requires PostgreSQL + Google OAuth configuration
- **Savings**: Calculated from cancellation dates (estimates, not verified)
- **Animations**: Respect `prefers-reduced-motion`

## 📄 License

MIT
