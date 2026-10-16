# 🔄 Skill Swap Platform

> A peer-to-peer skill exchange platform for university students — teach what you know, learn what you need.

---

## ✨ Features

- 🔐 **Authentication** — Sign up / Sign in with name, email, age
- 🎯 **Explore Skills** — Browse skills by category (Design, Programming, Language, Business, Music)
- 🔁 **Skill Swaps** — Send & receive swap requests with real-time status tracking
- 📅 **Session Scheduling** — Set date, time, duration & Google Meet link
- 📋 **Collaborative Agenda** — Build a shared session agenda (total must match session duration exactly)
- ⭐ **Reviews & Ratings** — Rate completed sessions; average auto-recalculates from real reviews
- 💬 **Private Chat** — Real-time messaging with file attachments (PDF, images, video) & video link sharing
- 🔔 **Notifications** — Live notifications for swaps, messages, and reviews
- 👤 **Profile Management** — Edit name, faculty, bio, age, skills to teach & learn
- 🚪 **Logout Modal** — Confirmation dialog before signing out

---

## 🏗️ Project Structure

```
skill-swap/
├── client/          # React + Vite frontend (port 5173)
│   └── src/
│       └── App.jsx  # Main application (single-file architecture)
│
└── server/          # Node.js + Express backend (port 5001)
    ├── server.js    # All API routes
    ├── database.json # JSON database
    └── uploads/     # Chat attachments storage
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/skill-swap.git
cd skill-swap

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Running the App

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
node server.js
# Server runs on http://localhost:5001
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

Then open **http://localhost:5173** in your browser.

---

## 🔑 Test Accounts

| Email | Password | Name |
|-------|----------|------|
| malakrashed660@gmail.com | malak123 | Malak Rashed |
| malakgabra660@gmail.com | malak123 | Malak Mohamed |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8 |
| Backend | Node.js, Express |
| Database | JSON flat-file |
| File Uploads | Multer |
| Styling | Pure CSS (purple theme) |

---

## 📁 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/signin` | Login |
| PUT | `/api/auth/profile/:id` | Update profile |
| GET | `/api/skills` | Get all skills & users |
| GET | `/api/students` | Get all students |
| GET | `/api/matches/:studentId` | Get skill matches |
| POST | `/api/swaps` | Send swap request |
| GET | `/api/swaps/:userId` | Get user's swaps |
| PUT | `/api/swaps/:id/status` | Accept/Reject swap |
| PUT | `/api/swaps/:id/schedule` | Set meeting details |
| PUT | `/api/swaps/:id/agenda` | Update session agenda |
| PUT | `/api/swaps/:id/complete` | Mark session complete |
| POST | `/api/reviews` | Submit a review |
| GET | `/api/reviews/:userId` | Get user's reviews |
| GET | `/api/messages/:userId` | Get messages |
| POST | `/api/messages` | Send message |
| POST | `/api/messages/upload` | Upload file attachment |
| GET | `/api/notifications/:userId` | Get notifications |

---

## 🎨 Design

- Purple theme (`#7c3aed`)
- Responsive sidebar layout
- Mobile-friendly cards
