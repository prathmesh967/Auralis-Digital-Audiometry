import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ENV
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET || 'sonic-secret-key';
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// MongoDB
mongoose.set('strictQuery', false);
mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.error("MongoDB Error ❌", err));

// Root route
app.get("/", (req, res) => {
  res.send("Auralis Backend is running 🚀");
});

// Google Auth
const googleClient = new OAuth2Client(googleClientId);

// ================== SCHEMAS ==================

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
  googleId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const hearingResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  frequencies: [Number],
  left: [Number],
  right: [Number],
  ambientNoise: Number,
  score: Number,
  hearingAge: String,
  riskLevel: String,
  tips: [String],
  timestamp: { type: Date, default: Date.now },
});

const speechResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  prompts: [String],
  correctCount: Number,
  totalCount: Number,
  score: Number,
  rating: String,
  ambientNoise: Number,
  timestamp: { type: Date, default: Date.now },
});

const soundLocalizationResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  results: [],
  overallAccuracy: Number,
  averageLatency: Number,
  frontalBias: Number,
  lateralDelay: Number,
  spatialAccuracy: Object,
  quadrantAnalysis: Object,
  timestamp: { type: Date, default: Date.now },
});

// Models
const User = mongoose.model('User', userSchema);
const HearingResult = mongoose.model('HearingResult', hearingResultSchema);
const SpeechResult = mongoose.model('SpeechResult', speechResultSchema);
const SoundLocalizationResult = mongoose.model('SoundLocalizationResult', soundLocalizationResultSchema);

// ================== AUTH ==================

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Auth required" });

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================== ROUTES ==================

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash: hash, name });

    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, email, name } });
  } catch (e) {
    res.status(500).json({ message: "Registration error", error: e.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    res.status(500).json({ message: "Login error", error: e.message });
  }
});

// Google Login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      const hash = await bcrypt.hash(Math.random().toString(), 10);
      user = await User.create({
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        passwordHash: hash,
      });
    }

    const token = jwt.sign({ id: user._id }, jwtSecret);

    res.json({ token, user });
  } catch (e) {
    res.status(401).json({ message: "Google auth failed" });
  }
});

// ================== RESULTS ==================

// Hearing
app.post('/api/hearing-results', authenticate, async (req, res) => {
  const data = await HearingResult.create({ ...req.body, user: req.user.id });
  res.json(data);
});

app.get('/api/hearing-results', authenticate, async (req, res) => {
  const data = await HearingResult.find({ user: req.user.id });
  res.json(data);
});

// Speech
app.post('/api/speech-results', authenticate, async (req, res) => {
  const data = await SpeechResult.create({ ...req.body, user: req.user.id });
  res.json(data);
});

app.get('/api/speech-results', authenticate, async (req, res) => {
  const data = await SpeechResult.find({ user: req.user.id });
  res.json(data);
});

// 3D Sound
app.post('/api/3d-sound-results', authenticate, async (req, res) => {
  const data = await SoundLocalizationResult.create({ ...req.body, user: req.user.id });
  res.json(data);
});

app.get('/api/3d-sound-results', authenticate, async (req, res) => {
  const data = await SoundLocalizationResult.find({ user: req.user.id });
  res.json(data);
});

// ================== ERROR ==================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error", error: err.message });
});

// ================== START ==================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});