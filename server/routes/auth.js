import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import verifyToken from '../middleware/verifyToken.js'; // make sure you have this middleware

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', verifyToken, getMe); // ✅ Add this line

export default router;
