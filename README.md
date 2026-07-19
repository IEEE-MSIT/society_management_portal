# Society Management Portal

Welcome to the Society Management Portal repository. This portal is designed to streamline operations for IEEE organizational units and society chapters, featuring member directories, interactive meeting schedules, attendance logging, and a Kanban workflow board.

## Module 1 Features

This repository contains **Module 1** of a multi-tenant Society Management Portal, covering:

- **Multi-Tenant Database Design**: Society-isolated schema using Prisma ORM and PostgreSQL.
- **Authentication**: Stateless session management using JWT access tokens.
- **Role-Based Access Control (RBAC)**: Support for Core Admin, Core Team Lead, and General Member tiers.
- **Member Management**: Standard CRUD, status changes, soft-deletes, pagination, search, and filtration.

---

## Technical Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, JWT, Bcrypt, Zod, Morgan, Helmet, CORS
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router DOM, React Hook Form + Zod, TanStack Query (React Query), Lucide Icons

---

## Project Structure

```text
├── README.md
├── frontend/
└── backend/
```

---

## Setup Instructions

### Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Test Credentials

Default password:

```
Password123
```

### Greenwood Society

- Core Admin: `admin@greenwood.com`
- Core Team Lead: `lead@greenwood.com`
- General Member: `member@greenwood.com`

### Skyline Residency

- Core Admin: `admin@skyline.com`
- General Member: `member@skyline.com`

---

## Security

- Multi-tenant data isolation
- JWT Authentication
- Role-Based Access Control (RBAC)
- Soft Delete support

---

## Deployments

- **Frontend (Vercel)**: [society-management-portal-zeta.vercel.app](https://society-management-portal-zeta.vercel.app)
- **Backend (Render)**: [society-management-portal-ex3f.onrender.com](https://society-management-portal-ex3f.onrender.com)