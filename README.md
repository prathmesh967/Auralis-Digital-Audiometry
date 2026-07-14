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
<img width="1917" height="1077" alt="Screenshot 2026-07-14 124440" src="https://github.com/user-attachments/assets/7c0d96e9-476a-4175-bd15-e92c9e64252b" />
<img width="1917" height="1075" alt="Screenshot 2026-07-14 124512" src="https://github.com/user-attachments/assets/635d3977-b562-48ea-a860-de803d1137cd" />
<img width="1905" height="1077" alt="Screenshot 2026-07-14 124647" src="https://github.com/user-attachments/assets/a5f6b829-34df-47ab-ae1b-a95dfa06d07a" />
<img width="1897" height="1078" alt="Screenshot 2026-07-14 124659" src="https://github.com/user-attachments/assets/f19c01c8-adbc-43c6-94e1-efea6614885e" />
<img width="1880" height="1007" alt="Screenshot 2026-07-14 124625" src="https://github.com/user-attachments/assets/25d8e8b1-dfd2-48e5-b770-f1662132e052" />



This project is intended **only for preliminary hearing screening** and educational purposes. It is **not a substitute for professional medical diagnosis or certified audiometric evaluation**.
