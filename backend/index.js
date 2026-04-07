import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sonic-architect';
const jwtSecret = process.env.JWT_SECRET || 'sonic-secret-key';
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const emailUser = process.env.EMAIL_USER || '';
const emailPassword = process.env.EMAIL_PASSWORD || '';

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

const googleClient = new OAuth2Client(googleClientId);

app.use(cors());
app.use(express.json());

mongoose.set('strictQuery', false);
mongoose.connect(mongoUri).catch((error) => console.warn('MongoDB connection failed', error));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
  googleId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['forgot-password', 'change-password'], default: 'forgot-password' },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Auto-delete after 10 minutes
});

const hearingResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prompts: [String],
  correctCount: Number,
  totalCount: Number,
  score: Number,
  rating: String,
  ambientNoise: Number,
  timestamp: { type: Date, default: Date.now },
});

const soundLocalizationResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  results: [
    {
      position: {
        x: Number,
        y: Number,
        z: Number,
      },
      userGuess: String,
      correct: Boolean,
      responseTime: Number,
      timestamp: Number,
    },
  ],
  overallAccuracy: Number,
  averageLatency: Number,
  frontalBias: Number,
  lateralDelay: Number,
  spatialAccuracy: {
    frontal: Number,
    lateral: Number,
    lowerLateral: Number,
  },
  quadrantAnalysis: {
    frontLeft: Number,
    frontRight: Number,
    backLeft: Number,
    backRight: Number,
  },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const OTP = mongoose.model('OTP', otpSchema);
const HearingResult = mongoose.model('HearingResult', hearingResultSchema);
const SpeechResult = mongoose.model('SpeechResult', speechResultSchema);
const SoundLocalizationResult = mongoose.model('SoundLocalizationResult', soundLocalizationResultSchema);

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email
const sendOTPEmail = async (email, otp, purpose) => {
  const subject = purpose === 'forgot-password' ? 'Reset Your Password' : 'Verify Password Change';
  const message = `Your OTP for ${purpose === 'forgot-password' ? 'password reset' : 'password change'} is: <strong>${otp}</strong><br/>This OTP is valid for 10 minutes.`;

  try {
    await transporter.sendMail({
      from: emailUser,
      to: email,
      subject,
      html: `<p>${message}</p>`,
    });
    console.log(`✓ OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
};

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });
    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, { expiresIn: '7d' });

    return res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;

    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      // Create new user from Google profile
      const randomPassword = Math.random().toString(36).slice(-16);
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        email,
        googleId,
        name,
        passwordHash,
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(401).json({ message: 'Google authentication failed.', error: error.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if email exists
      return res.json({ message: 'If email exists, OTP has been sent.' });
    }

    // Generate and save OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.deleteMany({ email, purpose: 'forgot-password' }); // Remove old OTPs
    await OTP.create({ email, otp, purpose: 'forgot-password', expiresAt });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp, 'forgot-password');
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }

    return res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    return res.status(500).json({ message: 'Forgot password failed.', error: error.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const otpRecord = await OTP.findOne({ email, otp, purpose: purpose || 'forgot-password' });
    if (!otpRecord) {
      return res.status(401).json({ message: 'Invalid OTP.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(401).json({ message: 'OTP has expired.' });
    }

    return res.json({ message: 'OTP verified successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'OTP verification failed.', error: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp, purpose: 'forgot-password' });
    if (!otpRecord) {
      return res.status(401).json({ message: 'Invalid OTP.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(401).json({ message: 'OTP has expired.' });
    }

    // Update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Password reset failed.', error: error.message });
  }
});

app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;
    if (!currentPassword || !newPassword || !otp) {
      return res.status(400).json({ message: 'Current password, new password, and OTP are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify current password
    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email: user.email, otp, purpose: 'change-password' });
    if (!otpRecord) {
      return res.status(401).json({ message: 'Invalid OTP.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(401).json({ message: 'OTP has expired.' });
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Password change failed.', error: error.message });
  }
});

app.post('/api/auth/request-otp', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate and save OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.deleteMany({ email: user.email, purpose: 'change-password' }); // Remove old OTPs
    await OTP.create({ email: user.email, otp, purpose: 'change-password', expiresAt });

    // Send OTP via email
    const emailSent = await sendOTPEmail(user.email, otp, 'change-password');
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }

    return res.json({ message: 'OTP sent to your email for password change.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to request OTP.', error: error.message });
  }
});

app.get('/api/auth/profile', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  return res.json({ user });
});

app.put('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true }
    ).select('-passwordHash');
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({ user: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update profile.', error: error.message });
  }
});

app.post('/api/hearing-results', authenticate, async (req, res) => {
  try {
    const { frequencies, left, right, ambientNoise, score, hearingAge, riskLevel, tips } = req.body;
    const hearingResult = await HearingResult.create({
      user: req.user.id,
      frequencies,
      left,
      right,
      ambientNoise,
      score,
      hearingAge,
      riskLevel,
      tips,
    });
    return res.status(201).json({ hearingResult });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to save hearing result.', error: error.message });
  }
});

app.get('/api/hearing-results', authenticate, async (req, res) => {
  const results = await HearingResult.find({ user: req.user.id }).sort({ timestamp: -1 }).limit(20);
  return res.json({ results });
});

app.post('/api/speech-results', authenticate, async (req, res) => {
  try {
    const { prompts, correctCount, totalCount, score, rating, ambientNoise } = req.body;
    const speechResult = await SpeechResult.create({
      user: req.user.id,
      prompts,
      correctCount,
      totalCount,
      score,
      rating,
      ambientNoise,
    });
    return res.status(201).json({ speechResult });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to save speech result.', error: error.message });
  }
});

app.get('/api/speech-results', authenticate, async (req, res) => {
  const results = await SpeechResult.find({ user: req.user.id }).sort({ timestamp: -1 }).limit(20);
  return res.json({ results });
});

app.post('/api/3d-sound-results', authenticate, async (req, res) => {
  try {
    const {
      results,
      overallAccuracy,
      averageLatency,
      frontalBias,
      lateralDelay,
      spatialAccuracy,
      quadrantAnalysis,
    } = req.body;
    const soundResult = await SoundLocalizationResult.create({
      user: req.user.id,
      results,
      overallAccuracy,
      averageLatency,
      frontalBias,
      lateralDelay,
      spatialAccuracy,
      quadrantAnalysis,
    });
    return res.status(201).json({ soundResult });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Unable to save 3D sound result.', error: error.message });
  }
});

app.get('/api/3d-sound-results', authenticate, async (req, res) => {
  const results = await SoundLocalizationResult.find({ user: req.user.id })
    .sort({ timestamp: -1 })
    .limit(20);
  return res.json({ results });
});

app.get('/api/history', authenticate, async (req, res) => {
  const hearing = await HearingResult.find({ user: req.user.id }).sort({ timestamp: -1 }).limit(10);
  const speech = await SpeechResult.find({ user: req.user.id }).sort({ timestamp: -1 }).limit(10);
  const sound = await SoundLocalizationResult.find({ user: req.user.id })
    .sort({ timestamp: -1 })
    .limit(10);
  const history = [
    ...hearing.map((item) => ({
      id: item._id,
      type: 'audiogram',
      timestamp: item.timestamp,
      title: 'Pure Tone Hearing Test',
      subtitle: `Score ${item.score} • ${item.riskLevel}`,
      score: item.score,
      details: `Estimated hearing age ${item.hearingAge}.`,
    })),
    ...speech.map((item) => ({
      id: item._id,
      type: 'speech',
      timestamp: item.timestamp,
      title: 'Speech Hearing Test',
      subtitle: `${item.correctCount}/${item.totalCount} words correct`,
      score: item.score,
      details: `Speech intelligibility rating: ${item.rating}`,
    })),
    ...sound.map((item) => ({
      id: item._id,
      type: '3d-sound',
      timestamp: item.timestamp,
      title: '3D Sound Localization Test',
      subtitle: `${item.overallAccuracy.toFixed(1)}% accuracy • ${item.averageLatency.toFixed(0)}ms latency`,
      score: item.overallAccuracy,
      details: `Frontal bias: ${item.frontalBias.toFixed(1)}%`,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);
  return res.json({ history });
});

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Auralis API listening on http://localhost:${port}`);
});
