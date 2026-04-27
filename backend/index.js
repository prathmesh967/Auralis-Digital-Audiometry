import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ENV
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET || 'sonic-secret-key';
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASSWORD;

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// MongoDB
mongoose.set('strictQuery', false);
mongoose.connect(mongoUri, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  retryWrites: true,
  maxPoolSize: 10,
})
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

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: { type: String, required: true }, // 'reset' or 'change'
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) }, // 10 minutes
});

// Models
const User = mongoose.model('User', userSchema);
const HearingResult = mongoose.model('HearingResult', hearingResultSchema);
const SpeechResult = mongoose.model('SpeechResult', speechResultSchema);
const SoundLocalizationResult = mongoose.model('SoundLocalizationResult', soundLocalizationResultSchema);
const OTP = mongoose.model('OTP', otpSchema);

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

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, otp, purpose: 'reset' });

    await transporter.sendMail({
      from: emailUser,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (e) {
    res.status(500).json({ message: "Error sending OTP", error: e.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpDoc = await OTP.findOne({ email, otp, purpose: 'reset' });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await OTP.deleteOne({ _id: otpDoc._id });
    res.json({ message: "OTP verified" });
  } catch (e) {
    res.status(500).json({ message: "Error verifying OTP", error: e.message });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const otpDoc = await OTP.findOne({ email, otp, purpose: 'reset' });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { passwordHash: hash });
    await OTP.deleteOne({ _id: otpDoc._id });

    res.json({ message: "Password reset successful" });
  } catch (e) {
    res.status(500).json({ message: "Error resetting password", error: e.message });
  }
});

// Request OTP for password change
app.post('/api/auth/request-otp', authenticate, async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email: req.user.email, otp, purpose: 'change' });

    await transporter.sendMail({
      from: emailUser,
      to: req.user.email,
      subject: 'Password Change OTP',
      text: `Your OTP for password change is: ${otp}. It expires in 10 minutes.`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (e) {
    res.status(500).json({ message: "Error sending OTP", error: e.message });
  }
});

// Change Password
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const otpDoc = await OTP.findOne({ email: req.user.email, otp, purpose: 'change' });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: req.user.id }, { passwordHash: hash });
    await OTP.deleteOne({ _id: otpDoc._id });

    res.json({ message: "Password changed successfully" });
  } catch (e) {
    res.status(500).json({ message: "Error changing password", error: e.message });
  }
});

// ================== RESULTS ==================

// Combined history
app.get('/api/history', authenticate, async (req, res) => {
  try {
    const hearing = await HearingResult.find({ user: req.user.id }).sort({ timestamp: -1 });
    const speech = await SpeechResult.find({ user: req.user.id }).sort({ timestamp: -1 });
    const soundLoc = await SoundLocalizationResult.find({ user: req.user.id }).sort({ timestamp: -1 });

    const history = [
      ...hearing.map(h => ({ ...h.toObject(), type: 'audiogram' })),
      ...speech.map(s => ({ ...s.toObject(), type: 'speech' })),
      ...soundLoc.map(sl => ({ ...sl.toObject(), type: '3d-sound' })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ history });
  } catch (e) {
    res.status(500).json({ message: "Error fetching history", error: e.message });
  }
});

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