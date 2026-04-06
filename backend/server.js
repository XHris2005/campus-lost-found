require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const itemRoutes = require('./routes/itemRoutes');
const adminRoutes = require('./routes/adminRoutes');
const claimRoutes = require('./routes/claimRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, slow down.' }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app', // replace with your actual Vercel URL
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});