# TaskFlow — Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking team progress with role-based access control.

## 🚀 Live Demo

> **Live URL:** _(add your Railway URL here after deployment)_  
> **GitHub:** _(add your GitHub repo URL here)_

---

## ✨ Features

| Feature | Details |
|---|---|
| **Authentication** | JWT-based signup / login with bcrypt hashing |
| **Projects** | Create, view, edit, delete projects with progress tracking |
| **Team Management** | Invite members by email, assign Admin / Member roles |
| **Tasks** | Create, assign, update status & priority, set due dates |
| **Kanban Board** | Visual board view grouped by status |
| **Dashboard** | Stats, overdue tasks, my tasks, recent activity |
| **RBAC** | Owners, Admins, Members have distinct permissions |

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken) + bcryptjs
- express-validator

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- React Router v6
- Axios + react-hot-toast
- Lucide React icons

**Deployment**
- Railway (monorepo — backend serves built frontend)
- MongoDB Atlas

---

## 📁 Project Structure

```
team-task-manager/
├── server/
│   └── src/
│       ├── config/       # DB connection
│       ├── models/       # User, Project, Task
│       ├── controllers/  # Auth, Project, Task logic
│       ├── routes/       # REST API routes
│       ├── middleware/   # JWT auth, RBAC helpers
│       └── index.js      # Express entry point
├── client/
│   └── src/
│       ├── context/      # AuthContext (React)
│       ├── pages/        # Dashboard, Projects, ProjectDetail, Login, Signup
│       ├── components/   # Layout, PrivateRoute
│       ├── api.js        # Axios instance
│       └── App.jsx       # Router
├── package.json          # Root scripts for Railway
├── railway.json          # Railway config
└── README.md
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)

### Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd team-task-manager

# 2. Install all dependencies
npm run install:all

# 3. Configure the backend environment
cp server/.env.example server/.env
# Edit server/.env and add your MONGODB_URI and JWT_SECRET

# 4. Start both servers concurrently
npm run dev
```

Frontend → http://localhost:5173  
Backend API → http://localhost:5000/api

---

## 🌐 Railway Deployment

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### Step 2 — Create Railway project
1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repository

### Step 3 — Add MongoDB
- Click **+ New** → **Database** → **MongoDB**  
  _or_ use MongoDB Atlas and paste the connection string as an env var

### Step 4 — Set environment variables
In Railway → your service → **Variables**, add:

| Variable | Value |
|---|---|
| `MONGODB_URI` | `mongodb+srv://...` (Atlas) or Railway MongoDB internal URL |
| `JWT_SECRET` | any long random string |
| `NODE_ENV` | `production` |

### Step 5 — Deploy
Railway auto-detects the `build` and `start` scripts from `package.json`:
- **Build:** `npm run build` (installs deps + builds React)
- **Start:** `node server/src/index.js` (serves API + static React files)

Your app will be live at the Railway-generated URL! 🎉

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/projects` | All members |
| POST | `/api/projects` | Authenticated |
| GET | `/api/projects/:id` | Members |
| PUT | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Owner |
| POST | `/api/projects/:id/members` | Admin |
| DELETE | `/api/projects/:id/members/:uid` | Owner |
| PATCH | `/api/projects/:id/members/:uid/role` | Owner |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/dashboard` | Dashboard stats |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/project/:id` | Project tasks |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Admin / creator |

---

## 👥 Role-Based Access Control

| Action | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| View project | ✅ | ✅ | ✅ |
| Create / update tasks | ✅ | ✅ | ✅ |
| Delete tasks (own) | ✅ | ✅ | ✅ |
| Delete any task | ✅ | ✅ | ❌ |
| Add members | ✅ | ✅ | ❌ |
| Update project info | ✅ | ✅ | ❌ |
| Change member roles | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
