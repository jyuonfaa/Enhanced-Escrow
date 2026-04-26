<div align="center">
  <h1>Enhanced Escrow System</h1>
  <h3>Final Year Project Documentation & System Design</h3>
  <br/>
  <p><strong>A Secure Platform for Trustless Peer-to-Peer Transactions</strong></p>
  <br/>
  <p><em>Prepared following Industry Standard Practices</em></p>
</div>

<div style="page-break-after: always;"></div>

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Introduction and Background](#2-introduction-and-background)
3. [System Requirements Specifications (SRS)](#3-system-requirements-specifications-srs)
4. [System Architecture & Technology Stack](#4-system-architecture--technology-stack)
5. [Database Design & Data Modeling](#5-database-design--data-modeling)
6. [Security & Risk Management](#6-security--risk-management)
7. [Core Workflows & Business Logic](#7-core-workflows--business-logic)
8. [Testing Strategy](#8-testing-strategy)
9. [Implementation & Local Development Setup](#9-implementation--local-development-setup)
10. [Deployment & Maintenance Guidelines](#10-deployment--maintenance-guidelines)
11. [Conclusion](#11-conclusion)

<div style="page-break-after: always;"></div>

## 1. Executive Summary <a id="1-executive-summary"></a>
The Enhanced Escrow System is a web-based, multi-tiered platform engineered to facilitate secure peer-to-peer (P2P) localized commerce. It integrates an intermediary delivery proxy into the transaction lifecycle to mitigate online fraud. Funds transferred by buyers are held securely in escrow and only released to sellers when the delivery agent verifies the item's handover using cryptographic authentication (OTP) and photographic evidence.

## 2. Introduction and Background <a id="2-introduction-and-background"></a>
### 2.1 Problem Statement
The proliferation of social media marketplaces has led to an increase in P2P trade. However, the lack of intermediary trust mechanisms exposes users to significant financial risks. Sellers avoid shipping items before receiving payment, while buyers avoid paying before receiving the item. The resulting stalemate frequently impedes legitimate commerce.

### 2.2 Project Scope & Objectives
- **Secure Fund Management:** Implement logical escrow parameters that tie capital flow directly to verified events.
- **Delivery Verification:** Institute a multi-factor verification protocol across Buyers and Delivery Agents.
- **Conflict Arbitration:** Provide robust dispute management interfaces for administrative mediation.

## 3. System Requirements Specifications (SRS) <a id="3-system-requirements-specifications-srs"></a>

### 3.1 Functional Requirements
1. The system does authenticate Users via JSON Web Tokens (JWT) into specific roles (Buyer, Seller, Agent, Admin).
2. The system does enable Sellers to list catalog items with pricing and descriptions.
3. The system does enable Buyers to initiate an Escrow transaction for a listed product.
4. The system does enable System Administrators to assign delivery jobs to registered Agents.
5. The system does require the Delivery Agent to supply a Buyer-generated OTP to finalize a delivery.
6. The system does allow Buyers to initiate a Dispute holding state prior to completion.

### 3.2 Non-Functional Requirements
1. **Performance:** The platform backend architecture must respond to stateless client requests in under 200ms.
2. **Security:** Passwords are cryptographically hashed using **bcrypt** before database transmission. All endpoints require strict stateless authorization middleware.
3. **Scalability:** The architecture will decouple the client layer (React) from the business layer (Express/Node) enabling independent scaling.

## 4. System Architecture & Technology Stack <a id="4-system-architecture--technology-stack"></a>
Built utilizing the PERN architectural paradigm (PostgreSQL, Express, React, Node) configured for robust scalability.

- **Presentation Layer (Frontend):** 
  - **Framework:** React.js, compiled by Vite for rapid HMR and optimized production bundling.
  - **Type Safety:** TypeScript ensures component data consistency.
  - **State Client:** Axios for HTTP client requests over standard REST principles.
- **Application Layer (Backend):**
  - **Runtime:** Node.js (v18+)
  - **Framework:** Express.js providing extensive middleware pipeline management.
- **Data Persistence Layer (Database):**
  - **Database Engine:** PostgreSQL
  - **ORM Middleware:** Prisma ORM, providing type-safe SQL query generation and strict schema migrations.

## 5. Database Design & Data Modeling (ERD Equivalent) <a id="5-database-design--data-modeling"></a>

| Entity | Primary Key | Critical Attributes | Relationships |
| :--- | :--- | :--- | :--- |
| **User** | `id` | `email`, `passwordHash`, `role` | 1:M to Products, 1:M to Transactions |
| **Product** | `id` | `price`, `sellerId` | M:1 to User (Seller), 1:M to Transactions |
| **Transaction**| `id` | `amount`, `status`, `agentId` | M:1 to User, M:1 to Product |
| **Dispute** | `id` | `reason`, `status`, `transactionId`| 1:1 to Transaction |

*Note: Roles determine foreign key assignment within the Transaction model (buyerId, sellerId, agentId loop back to User entity).*

## 6. Security & Risk Management <a id="6-security--risk-management"></a>
1. **Endpoint Protection:** Express API routes are strictly guarded by Role-Based Access Control (RBAC) middleware verifying JWT signatures continuously.
2. **Input Validation:** Backend models utilize strict type coercion through Prisma schemas preventing SQL Injection.
3. **Escrow Bypass Prevention:** The core database schema prevents manual `status` mutation to `COMPLETED` unless the transaction state explicitly satisfies the OTP string validation matching the server's generated hash.

## 7. Core Workflows & Business Logic <a id="7-core-workflows--business-logic"></a>
### 7.1 The Escrow Verification Pipeline
1. **Initialization (Buyer):** Triggers `POST /api/transactions`. Backend verifies funds (simulated) and locks state to `ESCROW_HELD`.
2. **Assignment (Admin):** Modifies Transaction metadata assigning `agentId`.
3. **Transit Authentication (Agent & Buyer):** Agent requests `POST /api/transactions/:id/verify` attaching `otp` and `photoProof`. 
4. **Resolution (System):** Backend compares attached `otp` against the stored `escrowCode`. Upon success, `status` updates to `COMPLETED`, transferring capital to Seller.

## 8. Testing Strategy <a id="8-testing-strategy"></a>
Industry-grade documentation necessitates robust QA protocols:
- **Unit Testing:** Individual functional endpoints and cryptographic hash functions.
- **Integration Testing:** Verification of sequential lifecycle (e.g., from `Pending` -> `Escrow Held` -> `Completed`).
- **User Acceptance Testing (UAT):** Testing role dashboard functionality (Buyer UI vs. Seller UI).

## 9. Implementation & Local Development Setup <a id="9-implementation--local-development-setup"></a>

To initialize and run the system locally for development or evaluation purposes, two terminal instances are required.

**Prerequisite:** Ensure **Node.js (v18 or newer)** is installed on the host machine.

### 9.1 Backend Initialization (Terminal 1)
1. Navigate to the backend directory: `cd backend`
2. Install necessary dependencies: `npm install`
3. Generate the Prisma database client: `npx prisma generate`
4. Start the Node.js development server: `npm run dev`
*(The backend API will boot up and bind to Port 5002)*

### 9.2 Frontend Client Initialization (Terminal 2)
1. Open a new terminal and navigate to the frontend directory: `cd frontend`
2. Install necessary dependencies: `npm install`
3. Start the Vite development server: `npm run dev`
*(The React application will boot up and bind to Port 3000)*

### 9.3 System Access
Once both servers are running synchronously, open a web browser and navigate to `http://localhost:3000`. The default administrator dashboard can be accessed using the pre-seeded testing credentials:
- **Email:** `admin@gmail.com`
- **Password:** `12345678`

## 10. Deployment & Maintenance Guidelines <a id="10-deployment--maintenance-guidelines"></a>
### CI/CD Paradigm
- **Backend Infrastructure:** Render or Heroku environments relying on unified `npm start` commands wrapped over `.env` injection.
- **Database Synchronization:** Pre-deployment hooks utilize `npx prisma migrate deploy` ensuring host database parity with application schema.
- **Client Infrastructure:** Vercel edges serving static optimized `/dist` directories generated by `vite build`. API Base URLs are dynamically mapped through Vite environmental variables (`VITE_API_URL`).

## 11. Conclusion <a id="11-conclusion"></a>
The Enhanced Escrow System operates precisely as a standardized safety mechanism for unverified digital commerce markets. Through logical constraints, physical authentication standards, and modern Javascript tooling, the architecture reliably mitigates P2P fraud risks, providing confidence to arbitrary internet transactions.
