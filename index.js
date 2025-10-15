import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import userRoutes from './routes/user_routes.js';
// Impor Ethers object dari config baru (tidak perlu ChainArtABI, ethers, atau wallet lagi)
// import { contractSigner, contractReader } from './util/blockchain_config.js'; 

const app = express();



const PORT = process.env.PORT


// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api', userRoutes);

app.get('/', (req, res) => {
    res.send('Backend Server Running.');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});