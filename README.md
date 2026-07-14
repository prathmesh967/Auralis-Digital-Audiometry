# 🎧 Digital Audiometry – Web-Based Hearing Assessment Platform

A web-based hearing assessment platform that enables users to perform **preliminary hearing screening** using a web browser and headphones. The application combines **Adaptive Pure Tone Audiometry**, **Speech Hearing Tests**, **3D Sound Localization**, and **Audiogram Generation** to provide a comprehensive hearing evaluation without requiring traditional audiometry equipment for initial screening.


---

## 📌 Features

### 🎵 Adaptive Pure Tone Audiometry
- Implements the **Hughson–Westlake Algorithm (Down 10 dB, Up 5 dB)**
- Tests hearing thresholds across multiple frequencies
- Determines minimum audible hearing threshold efficiently

### 🗣️ Speech Hearing Test
- Plays predefined words/sentences
- Captures user responses using browser speech recognition
- Evaluates speech recognition accuracy

### 🎧 3D Sound Localization
- Uses the **Web Audio API** with **HRTF (Head Related Transfer Function)**
- Simulates spatial audio from different directions
- Tests the user's ability to identify sound direction

### 🔇 Ambient Noise Detection
- Uses the device microphone
- Detects environmental noise before testing
- Ensures accurate hearing assessment by recommending a quiet environment

### 📊 Audiogram Generation
- Generates hearing threshold graphs
- Compares left and right ear hearing levels
- Classifies hearing ability

### 📄 Report Generation
- Hearing thresholds
- Hearing age estimation
- Risk level classification
- Personalized hearing recommendations

---

# 🏗️ Tech Stack

## Frontend
- React (Vite)
- TypeScript
- Tailwind CSS
- Chart.js
- Three.js

## Backend
- Node.js
- Express.js

## Database
- MongoDB Atlas

## Browser APIs
- Web Audio API
- Web Speech API
- MediaDevices API

---

# 🏛️ System Architecture

```
User
   │
   ▼
React Frontend (Vite + TypeScript)
   │
REST APIs
   │
Express.js
   │
Node.js
   │
MongoDB
```

---


---


# 📁 Project Structure

```
digital-audiometry/
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── assets/
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── config/
│
└── README.md
```

---

# 🔧 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/digital-audiometry.git
```

---

## Install Frontend

```bash
cd client
npm install
npm run dev
```

---

## Install Backend

```bash
cd server
npm install
npm start
```

---




---


This project is intended **only for preliminary hearing screening** and educational purposes. It is **not a substitute for professional medical diagnosis or certified audiometric evaluation**.
