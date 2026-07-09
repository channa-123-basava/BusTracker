# College Bus Tracker

A production-quality, real-time college bus tracking system built with the MERN stack.

[![Tech Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=flat-square)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Design](#database-design)
- [Deployment](#deployment)
- [Demo Credentials](#demo-credentials)

---

## Features

### Student
- Register / Login
- View assigned bus & route
- Live bus location on map (updates in real-time via Socket.IO)
- View route stops with ETA
- Receive push notifications (trip started, ended, delayed)

### Driver
- Login
- Start / End trip with one click
- Automatic GPS broadcasting via browser Geolocation API
- Location updates via Socket.IO (live) + REST fallback (every 30s)
- View assigned route & stops

### Admin
- Full CRUD: Buses, Routes, Students, Drivers
- Assign buses to students and drivers
- Assign routes to buses
- Monitor all live trips on a single map
- Trip history and status tracking
- Broadcast notifications to all users

---

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Frontend      | React 18 + Vite + Tailwind CSS    |
| Backend       | Node.js + Express.js              |
| Database      | MongoDB Atlas (Mongoose ODM)      |
| Auth          | JWT (JSON Web Tokens)             |
| Real-Time     | Socket.IO                         |
| Maps          | React Leaflet + OpenStreetMap     |
| Deployment    | Vercel (FE) + Render (BE)         |

---

## Project Structure

```
college-bus-tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, error handler
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── socket/          # Socket.IO handler
│   │   └── utils/           # JWT, response helpers
│   ├── server.js            # Entry point
│   ├── seed.js              # Database seeder
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios + service functions
    │   ├── components/
    │   │   └── common/      # Sidebar, Modal, Map, etc.
    │   ├── context/         # Auth, Socket, Notification
    │   ├── pages/
    │   │   ├── admin/       # Dashboard, Buses, Routes, Students, Drivers, Trips
    │   │   ├── auth/        # Login, Register
    │   │   ├── driver/      # Dashboard, Profile, Notifications
    │   │   └── student/     # Dashboard, Profile, Notifications
    │   └── App.jsx          # Router setup
    └── .env.example
```

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/your-username/college-bus-tracker.git
cd college-bus-tracker

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend** — copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```
Fill in `MONGO_URI` and `JWT_SECRET`.

**Frontend** — copy `.env.example` to `.env`:
```bash
cd frontend
cp .env.example .env
```

### 3. Seed the Database

```bash
cd backend
node seed.js
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.

---

## Demo Credentials

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@college.edu      | admin123   |
| Driver  | driver@college.edu     | driver123  |
| Student | student@college.edu    | student123 |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable     | Description                        |
|--------------|------------------------------------|
| `PORT`       | Server port (default: 5000)        |
| `MONGO_URI`  | MongoDB Atlas connection string    |
| `JWT_SECRET` | Secret key for JWT signing         |
| `JWT_EXPIRE` | JWT expiry duration (e.g. `7d`)    |
| `CLIENT_URL` | Frontend URL (for CORS)            |
| `NODE_ENV`   | `development` or `production`      |

### Frontend (`frontend/.env`)

| Variable         | Description                    |
|------------------|--------------------------------|
| `VITE_API_URL`   | Backend API base URL           |
| `VITE_SOCKET_URL`| Backend Socket.IO server URL   |

---

## API Reference

### Auth
| Method | Endpoint                    | Access  | Description        |
|--------|-----------------------------|---------|--------------------|
| POST   | `/api/auth/register`        | Public  | Student registration |
| POST   | `/api/auth/login`           | Public  | Login (all roles)  |
| GET    | `/api/auth/me`              | Private | Get current user   |
| PUT    | `/api/auth/update-password` | Private | Change password    |

### Buses
| Method | Endpoint                    | Access  | Description         |
|--------|-----------------------------|---------|---------------------|
| GET    | `/api/buses`                | Admin   | List all buses      |
| POST   | `/api/buses`                | Admin   | Create bus          |
| GET    | `/api/buses/active`         | Private | Active/on-trip buses |
| GET    | `/api/buses/:id`            | Private | Get single bus      |
| PUT    | `/api/buses/:id`            | Admin   | Update bus          |
| DELETE | `/api/buses/:id`            | Admin   | Delete bus          |
| PUT    | `/api/buses/:id/assign-route` | Admin | Assign route to bus |

### Routes
| Method | Endpoint           | Access  | Description      |
|--------|--------------------|---------|------------------|
| GET    | `/api/routes`      | Private | List all routes  |
| POST   | `/api/routes`      | Admin   | Create route     |
| GET    | `/api/routes/:id`  | Private | Get single route |
| PUT    | `/api/routes/:id`  | Admin   | Update route     |
| DELETE | `/api/routes/:id`  | Admin   | Delete route     |

### Users (Admin Only)
| Method | Endpoint                            | Description            |
|--------|-------------------------------------|------------------------|
| GET    | `/api/users/students`               | List all students      |
| POST   | `/api/users/students`               | Add student            |
| PUT    | `/api/users/students/:id`           | Update student         |
| DELETE | `/api/users/students/:id`           | Delete student         |
| PUT    | `/api/users/students/:id/assign-bus`| Assign bus to student  |
| GET    | `/api/users/drivers`                | List all drivers       |
| POST   | `/api/users/drivers`                | Add driver             |
| PUT    | `/api/users/drivers/:id`            | Update driver          |
| DELETE | `/api/users/drivers/:id`            | Delete driver          |
| PUT    | `/api/users/drivers/:id/assign-bus` | Assign bus to driver   |

### Trips
| Method | Endpoint                 | Access  | Description              |
|--------|--------------------------|---------|--------------------------|
| GET    | `/api/trips`             | Admin   | List all trips           |
| POST   | `/api/trips/start`       | Driver  | Start trip               |
| GET    | `/api/trips/my-trip`     | Driver  | Get active trip          |
| GET    | `/api/trips/bus/:busId`  | Private | Get trip for a bus       |
| PUT    | `/api/trips/:id/location`| Driver  | Update GPS location      |
| PUT    | `/api/trips/:id/end`     | Driver  | End trip                 |

### Notifications
| Method | Endpoint                       | Access  | Description          |
|--------|--------------------------------|---------|----------------------|
| GET    | `/api/notifications`           | Private | Get my notifications |
| POST   | `/api/notifications`           | Admin   | Broadcast            |
| PUT    | `/api/notifications/read-all`  | Private | Mark all read        |
| PUT    | `/api/notifications/:id/read`  | Private | Mark one read        |

---

## Database Design

### User Schema
```
_id, name, email, password (hashed), role (student|driver|admin),
phone, profileImage, isActive,
studentId, department, year, assignedBus (ref Bus),    ← student fields
licenseNumber, assignedBusDriver (ref Bus), isOnTrip, currentLocation  ← driver fields
```

### Bus Schema
```
_id, busNumber, registrationNumber, capacity,
make, model, year, color,
status (active|inactive|maintenance),
assignedRoute (ref Route), assignedDriver (ref User),
isOnTrip, currentLocation { latitude, longitude, updatedAt }
```

### Route Schema
```
_id, routeName, routeNumber,
source { name, latitude, longitude },
destination { name, latitude, longitude },
stops [{ name, latitude, longitude, estimatedTime, order }],
path [{ latitude, longitude }],
distance, estimatedDuration, departureTime, returnTime, isActive
```

### Trip Schema
```
_id, bus (ref Bus), driver (ref User), route (ref Route),
status (scheduled|ongoing|completed|cancelled), tripType (morning|evening|special),
startTime, endTime, scheduledStartTime,
currentLocation { latitude, longitude, updatedAt },
locationLog [{ latitude, longitude, speed, timestamp }],
isDelayed, delayReason, notes
```

### Notification Schema
```
_id, title, message, type, recipients [User], readBy [User],
bus (ref Bus), trip (ref Trip), isGlobal
```

---

## Socket.IO Events

| Event                    | Direction         | Description                         |
|--------------------------|-------------------|-------------------------------------|
| `location_update`        | Server → Client   | Live bus GPS coordinates             |
| `trip_started`           | Server → Client   | Bus started a trip                  |
| `trip_ended`             | Server → Client   | Bus completed a trip                |
| `new_notification`       | Server → Client   | Push notification                   |
| `driver_location_update` | Client → Server   | Driver sends own GPS location        |
| `track_bus`              | Client → Server   | Student joins a bus tracking room   |
| `stop_tracking`          | Client → Server   | Student leaves bus tracking room    |
| `join_bus_room`          | Client → Server   | Driver joins own bus room           |

---

## Deployment

### Backend → Render

1. Push backend to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Add environment variables from `.env`
6. Deploy!

### Frontend → Vercel

1. Push frontend to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Framework: **Vite**
4. Add environment variables:
   - `VITE_API_URL=https://your-api.onrender.com/api`
   - `VITE_SOCKET_URL=https://your-api.onrender.com`
5. Deploy!

---

## License

MIT © College Bus Tracker
