import express from 'express';
import { createProfile, updateProfile, getProfile, submitKarya, getKaryaById, getPendingKarya, getApprovedKarya, searchKaryaByTitle, requestCreator, getCreatorRequests, accToCreator } from '../controllers/user_controllers.js'; // Import fungsi spesifik

const router = express.Router();

router.get('/profile/creator-request', getCreatorRequests)

// Endpoint GET /api/profile/:id untuk mengambil profil
router.get('/profile/:id', getProfile);

// Contoh penggunaan: GET /api/karya/search?title=Bunga
router.get('/karya/search', searchKaryaByTitle);

router.get('/karya/:id', getKaryaById)

router.get('/karya-pending', getPendingKarya)

router.get('/karya-approved', getApprovedKarya)

// Endpoint POST /api/profile untuk membuat user baru
router.post('/profile', createProfile);

router.post('/submit-karya', submitKarya)

router.post('/profile/creator-request', requestCreator)

// endpoint acc creator
router.patch('/profile/creator-request', accToCreator)

// Endpoint POST /api/profile/{id} untuk update profile
router.patch('/profile/:id', updateProfile);


export default router;