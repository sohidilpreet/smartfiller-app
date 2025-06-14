import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import machineRoutes from './routes/machines.js';
import userRoutes from './routes/users.js';
// import machineFileRoutes from './routes/machineFiles.js';
import uploadRoute from './routes/upload.js';

dotenv.config();

const app = express();

// ✅ CORS CONFIGURATION
app.use(cors({
  origin: ['http://localhost:5173','http://localhost:19000', 'http://localhost:8081'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Middleware
app.use(express.json());

// ✅ Routes
app.use('/api/auth', authRoutes);

// ✅ Root endpoint
app.get('/', (req, res) => res.send('SmartFiller API Running'));

app.use('/api/machines', machineRoutes);

app.use('/api/users', userRoutes);

// app.use('/api/files', machineFileRoutes);

app.use('/uploads', express.static('uploads'));

app.use('/api/upload', uploadRoute);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
