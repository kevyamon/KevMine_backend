import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import robotRoutes from './routes/robotRoutes.js';
import logRoutes from './routes/logRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import questRoutes from './routes/questRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js'; // 1. Importer les routes de messagerie
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import socketHandler from './socket/socketHandler.js';
import startRankUpdateScheduler from './utils/scheduler.js';
import path from 'path';

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

socketHandler(io);

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/robots', robotRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes); // 2. Utiliser les routes de messagerie

app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});

const __dirname = path.resolve();

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/dist')));
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  startRankUpdateScheduler(io);
});