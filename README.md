# 🚀 ISS Mission Control & News Intelligence Dashboard

A high-performance, real-time dashboard for tracking the International Space Station (ISS) and staying updated with the latest space exploration news.

**Live Deployment:** [https://exam-fawn-theta.vercel.app/](https://exam-fawn-theta.vercel.app/)

## ✨ Features
- **ISS Real-Time Tracking**: Live position telemetry (Latitude/Longitude) updated every 10 seconds.
- **Orbital Analytics**: Live velocity tracking and speed history visualization using Recharts.
- **Crew Manifest**: Real-time census of personnel currently aboard the ISS, including roles and craft details.
- **Space News Intelligence**: Curated feed of the latest headlines from NASA, SpaceX, and global space agencies.
- **AI Mission Assistant**: Integrated AI chatbot (Groq Llama 3.3 70B) with full awareness of dashboard telemetry.
- **Dynamic UI**: Glassmorphic design with dark/light mode support and smooth Framer Motion animations.

## 🛠️ Tech Stack
- **Framework**: React 19 + Vite
- **State Management**: Zustand (with Persistence)
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Maps**: React-Leaflet
- **Charts**: Recharts
- **API**: Groq Cloud, Hugging Face, NewsAPI, Open-Notify

## 🚀 Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your `.env` with `VITE_NEWS_API_KEY` and `VITE_GROQ_TOKEN`
4. Run locally: `npm run dev`
