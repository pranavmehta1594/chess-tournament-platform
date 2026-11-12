# Kingdom of Chess - Quick Setup Guide

This guide explains how to run the Kingdom of Chess frontend and backend after cloning the repository.

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL, either local or hosted with Neon
- Git

## 1. Clone the repository

```bash
git clone <repository-url> kingdom-of-chess
cd kingdom-of-chess
```

The project should contain these folders:

```text
kingdom-of-chess/
|-- backend/
|-- frontend/
```

## 2. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 3. Configure environment variables

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Update `backend/.env`:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=database_url
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

For Neon, replace `DATABASE_URL` with the SSL connection string supplied by Neon.

Create the frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

For local development, use:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_LIVE_API_URL=
```

Never commit either `.env` file. They contain secrets and database credentials.

## If you are sharing the project

The private `.env` files do not need to be shared with another developer or
reviewer. Share the repository, `.env.example` files, and this guide instead.
The reviewer can create local environment files using the examples above.

If they do not have PostgreSQL installed, Docker can provide the local
database and services:

```bash
docker compose up --build -d
docker compose exec backend node dist/db/migrate.js
docker compose exec backend node dist/db/seed.js
```

Then open [http://localhost:3000](http://localhost:3000). The Docker database
is local demo data and is separate from any hosted production database.

## 4. Prepare the database

Run migrations from the backend directory:

```bash
cd backend
npm run db:migrate
```

To create demo users and a sample tournament:

```bash
npm run db:seed
```

`db:seed` is for a fresh demo database. It deletes existing users, tournaments,
participants, and matches before inserting sample data. Do not run it against a
database containing data that must be preserved.

## 5. Start the application

Open two terminals.

Terminal 1 - backend:

```bash
cd backend
npm run start:dev
```

Terminal 2 - frontend:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The backend health check is available at:

```text
http://localhost:3001/
```

## Demo accounts

After seeding, the available demo accounts are:

| Role | Email | Password |
| --- | --- | --- |
| Coach | `coach@kingdom.chess` | `CoachPass123!` |
| Student | `student1@kingdom.chess` | `StudentPass123!` |
| Student | `student2@kingdom.chess` | `StudentPass123!` |
| Student | `student3@kingdom.chess` | `StudentPass123!` |
| Student | `student4@kingdom.chess` | `StudentPass123!` |

## Useful commands

Backend:

```bash
npm run build       # production build
npm run test        # unit tests
npm run test:e2e    # end-to-end tests
npm run lint        # backend lint
```

Frontend:

```bash
npm run build       # production build
npm run start       # serve the production build
npm run lint        # frontend lint
```

## Mobile testing

When opening the frontend from a phone, do not use `localhost` for the API.
Use the computer's LAN IP instead, for example:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.10:3001
NEXT_PUBLIC_SOCKET_URL=http://192.168.1.10:3001
```

Also set the backend's `FRONTEND_URL` to the URL used by the phone and allow
the backend port through the local firewall. Restart both applications after
changing environment variables.

## Production configuration

For a production frontend, set:

```env
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_LIVE_API_URL=https://your-backend-domain.example.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.example.com
```

Set the backend `FRONTEND_URL` to the deployed frontend origin, for example
`https://your-frontend-domain.example.com`. Configure the production database,
`JWT_SECRET`, and other secrets in the hosting provider rather than committing
them to the repository.
