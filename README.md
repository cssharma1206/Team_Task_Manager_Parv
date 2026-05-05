# TaskFlow — Team Task Manager

A full-stack web application to manage projects, assign tasks, and track team progress with role-based access control.

## 🔗 Links

- **Live URL:** https://web-production-e0e95.up.railway.app
- **GitHub:** https://github.com/cssharma1206/Team_Task_Manager_Parv

> **Note:** If the live URL doesn't load, set DNS to `8.8.8.8` or use Private DNS: `dns.google` on mobile (known issue with some Indian ISPs only).

---

## ✨ Features

- JWT Authentication (Signup / Login)
- Create & manage Projects with descriptions
- Task creation with status, priority, due date & assignee
- Kanban Board view (To Do → In Progress → Review → Done)
- Team management — invite members by email
- Role-Based Access Control (Owner / Admin / Member)
- Dashboard with stats, overdue tasks & recent activity

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account

```bash
# 1. Clone the repo
git clone https://github.com/cssharma1206/Team_Task_Manager_Parv.git
cd Team_Task_Manager_Parv

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp server/.env.example server/.env
# Fill in MONGODB_URI and JWT_SECRET in server/.env

# 4. Run locally
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:5000/api
```

---

## 🌐 Deployment (Railway)

1. Push repo to GitHub
2. Connect repo on [railway.app](https://railway.app)
3. Add environment variables:

| Variable | Value |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Any long secret string |
| `NODE_ENV` | `production` |

Railway auto-runs `npm run build` then `node server/src/index.js`.

---

## 🔐 Role-Based Access Control

| Action | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| View project & tasks | ✅ | ✅ | ✅ |
| Create / edit tasks | ✅ | ✅ | ✅ |
| Add members | ✅ | ✅ | ❌ |
| Delete any task | ✅ | ✅ | ❌ |
| Change member roles | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
