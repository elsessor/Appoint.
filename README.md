# 🎓 Appoint — Language Learning Platform

A full-stack MERN application connecting language learners with tutors and peers for real-time collaboration, scheduling, and video calls.

## ✨ Features

### 🔐 Authentication & Users
- Sign up / Login with JWT-based auth
- User profiles with availability settings
- Password reset functionality
- Admin dashboard for user management

### 📅 Appointments & Scheduling
- Schedule lessons/appointments with friends
- Calendar view with time slot management
- Availability configuration (hours, breaks, slot duration)
- Automatic reminders before appointments
- Rating system for completed lessons

### 💬 Real-Time Chat
- Stream Chat integration for instant messaging
- Group and direct conversations
- Online presence indicators
- Real-time notifications

### 📞 Video Calls
- Integrated voice/video calling
- Call scheduling with availability checks
- In-call controls and UI

### 👥 Friends & Networking
- Send/accept friend requests
- View friend profiles and availability
- Browse recommended users
- Unfriend functionality

### 📝 Meeting Minutes
- Create and store meeting notes
- Organize by appointment
- Searchable meeting history

### 🔔 Notifications
- Real-time appointment reminders
- Friend request alerts
- Message notifications
- Customizable notification settings

### ⚙️ Admin Panel
- User management
- Content moderation
- System analytics
- Pagination and filtering

### 🌍 Additional Features
- Multi-language support
- Dark/Light theme toggle
- Responsive design (mobile-first)
- Error boundaries & fallbacks
- Philippine holidays calendar integration
- Gemini AI integration for assistance

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Real-time:** Socket.io
- **Chat:** Stream Chat SDK
- **Authentication:** JWT + HTTPOnly Cookies
- **AI:** Google Gemini API
- **Scheduling:** Node Cron

### Frontend
- **Library:** React 19
- **Build Tool:** Vite
- **State Management:** React Query (TanStack Query)
- **Chat UI:** Stream Chat React
- **Styling:** Tailwind CSS + DaisyUI
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Routing:** React Router v7

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Stream Chat API credentials
- Google Gemini API key

### Local Development

```bash
# Clone repository
git clone https://github.com/elsessor/Appoint.git
cd Appoint

# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (new terminal)
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (Vite dev proxy forwards `/api` to backend on port 5001).

### Environment Variables

**Backend** (`backend/.env`):
```
MONGODB_URI=your_mongo_atlas_uri
JWT_SECRET_KEY=your_jwt_secret
STREAM_API_KEY=your_stream_key
STREAM_API_SECRET=your_stream_secret
GEMINI_API_KEY=your_gemini_key
NODE_ENV=development
PORT=5001
```

**Frontend** (`client/.env`):
```
VITE_STREAM_API_KEY=your_stream_public_key
VITE_API_URL=http://localhost:5001  # Optional, defaults to /api for dev
```

## 📦 Production Deployment

### Single Host (Recommended)
Deploy entire app on Render:
1. Set Root Directory: (blank/root)
2. Build Command: `npm run build`
3. Start Command: `node index.js`
4. Set environment variables on host

See `DEPLOY_RENDER.md` for detailed steps.

### Split Hosting
- **Frontend:** Vercel (Project Root: `client`)
- **Backend:** Render (Project Root: `backend`)
- Set `VITE_API_URL` on Vercel to backend URL

See `DEPLOY_VERCEL.md` and `DEPLOY_RENDER.md` for exact instructions.

## 🛠️ Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # API endpoints
│   │   ├── models/           # MongoDB schemas
│   │   ├── middleware/       # Auth & custom middleware
│   │   ├── lib/              # Database, Socket, Stream config
│   │   └── utils/            # Helpers & schedulers
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/            # Route components
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # API client, axios config
│   │   └── store/            # Zustand stores
│   ├── vite.config.js        # Dev proxy config
│   └── package.json
├── index.js                  # Root entry (spawns backend)
├── render.yaml               # Render deployment config
└── README.md
```

## 🔑 Key Features Explained

### Real-Time Sync
- Socket.io connects frontend to backend for instant updates
- Notifications, presence status, and chat use WebSocket

### Appointment Workflow
1. User sets availability
2. Friend books a time slot
3. Auto-reminder 15 mins before
4. Post-appointment rating & notes
5. Data persists in MongoDB

### Authentication Flow
- JWT stored in HTTPOnly cookie (secure, httpOnly, sameSite)
- Cookie sent automatically on cross-site requests
- Refresh happens on `/auth/me` check

### Chat Integration
- Server generates secure Stream token
- Client connects with public API key + token
- Messages sync in real-time across all devices

## 🧪 Testing

```bash
# Backend tests (if configured)
cd backend
npm test

# Frontend tests (if configured)
cd client
npm test

# Production build test
npm run build
node index.js
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🆘 Troubleshooting

### Login fails / 401 on reload
- Check `NODE_ENV=production` on backend
- Verify `CLIENT_URL` matches frontend origin
- Ensure cookies have `Secure; HttpOnly; SameSite=None` in production

### Chat won't connect
- Verify `STREAM_API_KEY` and `STREAM_API_SECRET` on backend
- Check `VITE_STREAM_API_KEY` (public key) on frontend
- Ensure `/api/chat/token` endpoint returns a token

### Appointments not syncing
- Check MongoDB connection string
- Verify Socket.io connects successfully
- Check browser DevTools for WebSocket errors

## 📚 Documentation

- `DEPLOY_RENDER.md` — Single-host deployment on Render
- `DEPLOY_VERCEL.md` — Frontend-only deployment on Vercel
- `backend/` — API documentation (routes & models)
- `client/` — Component library (Storybook optional)

## 💡 Future Enhancements

- [ ] Video recording for lessons
- [ ] AI-powered tutoring suggestions
- [ ] Subscription/payment integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Blockchain certificates for completed courses
