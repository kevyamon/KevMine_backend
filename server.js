import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import robotRoutes from './routes/robotRoutes.js';
import logRoutes from './routes/logRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import socketHandler from './socket/socketHandler.js';
import path from 'path';

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

// Configure CORS for production
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Pass the socket.io instance to the request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io handler
socketHandler(io);

// API routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/robots', robotRoutes);
app.use('/api/logs', logRoutes);

// Ping endpoint to keep the server awake
app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});


// Deployment logic
const __dirname = path.resolve();

if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '/frontend/dist')));

  // Any route that is not an API route will be redirected to index.html
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
  );
} else {
  // Development mode
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

// Custom error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);