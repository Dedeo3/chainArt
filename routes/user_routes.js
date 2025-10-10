import express from 'express';
import { createProfile, updateProfile, getProfile } from '../controllers/user_controllers.js'; // Import fungsi spesifik

const router = express.Router();

// Endpoint POST /api/profile untuk membuat user baru
router.post('/profile', createProfile);
// Endpoint POST /api/profile/{id} untuk update profile
router.patch('/profile/:id', updateProfile);
// Endpoint GET /api/profile/:id untuk mengambil profil
router.get('/profile/:id', getProfile);

export default router;