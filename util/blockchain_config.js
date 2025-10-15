import 'dotenv/config';
import { ethers } from 'ethers';
import { ChainArtABI } from '../abi/abi.js';

// Kontrak Address Anda
const CONTRACT_ADDRESS = "0x77200F5a857F54517bfF50cE8FBcB9428C7d6E20";
const CONTRACT_ABI = ChainArtABI;

// Setup Ethers
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Instance Signer: Digunakan untuk transaksi (WRITE)
export const contractSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Instance Reader: Digunakan untuk view (READ)
export const contractReader = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
