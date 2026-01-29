# Deployment Guide

## Prerequisites
- Node.js v18+
- SQLite (or change Prisma provider to PostgreSQL/MySQL for production)

## Backend Deployment
1. Navigate to `/backend`.
2. Install dependencies: `npm install`.
3. Set up environment variables in `.env`:
   - `DATABASE_URL="file:./dev.db"` (Or your production DB URL)
   - `JWT_SECRET="your-secret-key"`
   - `PORT=5000`
4. Build the project: `npm run build`.
5. Run migrations: `npx prisma migrate deploy`.
6. Start the server: `npm start`.
   - Host on Render, Railway, or Heroku.

## Frontend Deployment
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Configure `vite.config.ts` or set environment variables to point to your Production Backend URL.
   - Example: `VITE_API_URL=https://your-backend-url.com/api` (Update `api.ts` to use this).
4. Build the project: `npm run build`.
5. Deploy the `dist` folder to Vercel, Netlify, or AWS S3.

## Local Development
- Backend: `npm run dev` (Port 5000)
- Frontend: `npm run dev` (Port 3000)

## Keep Alive Configuration (Render + Supabase)
To prevent the Render free tier from spinning down due to inactivity and to keep the Supabase database active:
1.  A GitHub Action (`.github/workflows/keep-alive.yml`) has been set up to ping the backend every 14 minutes.
2.  **Critical Setup**: You must add a Repository Secret to your GitHub repo:
    -   Go to **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
    -   Name: `RENDER_URL`
    -   Value: Your full backend URL (e.g., `https://enhanced-escrow-backend.onrender.com`).
3.  Without this secret, the keep-alive ping will not work.
