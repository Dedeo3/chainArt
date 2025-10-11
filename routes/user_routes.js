import express from 'express';
import { createProfile, updateProfile, getProfile, submitKarya, getKaryaById,getPendingKarya, getApprovedKarya } from '../controllers/user_controllers.js'; // Import fungsi spesifik

const router = express.Router();

// Endpoint POST /api/profile untuk membuat user baru
router.post('/profile', createProfile);
// Endpoint POST /api/profile/{id} untuk update profile
router.patch('/profile/:id', updateProfile);
// Endpoint GET /api/profile/:id untuk mengambil profil
router.get('/profile/:id', getProfile);
router.post('/submit-karya', submitKarya)
router.get('/karya/:id', getKaryaById)
router.get('/karya-pending', getPendingKarya)
router.get('/karya-approved', getApprovedKarya)

export default router;