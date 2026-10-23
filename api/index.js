import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import nodemailer from 'nodemailer';

const app = express();

// ==========================================
// 1. CORS & SECURITY
// ==========================================
app.use(cors({ origin: '*', credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(mongoSanitize());
app.use(express.json({ limit: '10kb' }));

// ==========================================
// 2. DATABASE CONNECTION CACHE (Vercel Serverless ke liye zaroori)
// ==========================================
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Har request se pehle DB connect karein
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// ==========================================
// 3. DATABASE MODELS
// ==========================================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetCode: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  billingFrequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['active', 'cancelled', 'paused'], default: 'active' },
  websiteUrl: { type: String, default: '' },
  startDate: { type: Date },
  renewalDate: { type: Date },
  notes: { type: String, default: '' },
  cancellationDate: { type: Date },
  cancellationReason: { type: String, default: '' }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// ==========================================
// 4. AUTH MIDDLEWARE
// ==========================================
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ==========================================
// 5. AUTH ROUTES
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 6. NODEMAILER & RESET
// ==========================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Yeh email registered nahi hai.' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code - Subscription Graveyard',
      html: `<h2>Aapka Code</h2><h1 style="color: #7C3AED;">${code}</h1>`
    });
    res.json({ message: 'Code email par bhej diya gaya hai.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User nahi mila.' });
    if (user.resetCode !== code) return res.status(400).json({ message: 'Ghalat code.' });
    if (user.resetCodeExpires < Date.now()) return res.status(400).json({ message: 'Code expire.' });
    user.password = newPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();
    res.json({ message: 'Password change ho gaya!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/auth/delete-account', protect, async (req, res) => {
  try {
    await Subscription.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 7. SUBSCRIPTION ROUTES
// ==========================================
app.get('/api/subscriptions', protect, async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/subscriptions', protect, async (req, res) => {
  try {
    const sub = await Subscription.create({ ...req.body, user: req.user._id });
    res.status(201).json(sub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/subscriptions/:id', protect, async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Not found' });
    if (sub.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not auth' });
    const updated = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/subscriptions/:id', protect, async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Not found' });
    if (sub.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not auth' });
    await sub.deleteOne();
    res.json({ message: 'Removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/', (req, res) => res.send('API is running!'));

// YEH SABSE ZAROORI HAI - VERCEL KE LIYE
export default app;