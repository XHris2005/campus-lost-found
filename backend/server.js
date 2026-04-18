require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const https = require('https');
const itemRoutes = require('./routes/itemRoutes');
const adminRoutes = require('./routes/adminRoutes');
const claimRoutes = require('./routes/claimRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.set('trust proxy', 1);

// ...
app.use('/api/users', userRoutes);

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // increase from 100 to 500
  message: { error: 'Too many requests, slow down.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, slow down.' }
});

app.use('/api/auth', authLimiter);

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://campus-lost-found-sigma.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Campus Lost & Found API is running' });
});

// Keep-alive ping every 10 minutes to prevent Render cold starts
cron.schedule('*/10 * * * *', () => {
  https.get('https://campus-lost-found-backend-qcw5.onrender.com', (res) => {
    console.log(`Keep-alive ping: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Keep-alive ping failed:', err.message);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});