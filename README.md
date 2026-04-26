# Enhanced Escrow System 🛡️

An advanced, trustless peer-to-peer (P2P) commerce platform designed to eliminate fraud in localized trade through a physical multi-factor verification (Photo + OTP) protocol.

## 🚀 Key Features

- **Zero-Trust Architecture:** Funds are locked in a system-managed escrow and only released upon successful physical handover.
- **Physical Verification Oracle:** Delivery Agents must upload photo proof at the destination, which triggers a unique OTP for the Buyer.
- **The Dispute Matrix:** Sophisticated conflict resolution handling:
  - **Bounced:** Doorstep rejection with automated return tracking.
  - **Received:** 24-hour post-delivery protection window.
  - **Missing:** 7-day logistics failure safety lock.
- **Administrative Governance:** Full control over user suspension, agent management, and dispute arbitration.
- **Role-Based Access Control (RBAC):** Distinct dashboards and security layers for Admins, Sellers, Buyers, and Agents.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, TypeScript, Vanilla CSS (Premium UI).
- **Backend:** Node.js, Express, TypeScript, Prisma ORM.
- **Database:** PostgreSQL (via Supabase/Direct).
- **Security:** JWT Authentication, Bcrypt Password Hashing, Role-based Middleware.

## 📦 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/jyuonfaa/Enhanced-Escrow.git
cd Enhanced-Escrow
```

### 2. Backend Setup
```bash
cd backend
npm install
# Configure your .env (see .env.example)
npx prisma migrate dev
npx prisma db seed
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Configure your .env (see .env.example)
npm run dev
```

## 📄 Documentation

The project includes comprehensive documentation in the root directory:
- [SETUP_GUIDE.pdf](./SETUP_GUIDE.pdf): Installation and environment configuration.
- [STUDENT_TESTING_GUIDE.pdf](./STUDENT_TESTING_GUIDE.pdf): Architectural manual for auditing the project logic.
- [FINAL_YEAR_PROJECT_DOCUMENTATION.pdf](./FINAL_YEAR_PROJECT_DOCUMENTATION.pdf): Full technical thesis and system design.
- [USER_MANUAL.md](./USER_MANUAL.md): Basic usage instructions for each role.

## ⚖️ License
This project is for educational purposes as a Final Year Project.

---
Created by **jyuonfaa**
