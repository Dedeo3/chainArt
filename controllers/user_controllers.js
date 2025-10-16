import {prisma} from "../util/prisma_config.js"
import { contractSigner } from '../util/blockchain_config.js'; 


export const createProfile = async (req, res) => {
    const { walletAddress, username, contact } = req.body;

    if (!walletAddress || !username || !contact) {
        return res.status(400).json({ error: 'Data walletAddress, username, dan contact harus diisi.' });
    }

    try {
        const newUser = await prisma.user.create({
            data: {
                walletAddress: walletAddress,
                username: username.toLowerCase(),
                contact: contact,
                // role otomatis 'USER'
            },
        });

        // Format response 
        const responseData = {
            id: newUser.id,
            role: newUser.role,
            createdAt:newUser.createdAt
        };

        return res.status(200).json(responseData);

    } catch (error) {
        // Penanganan error Unique Constraint
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Profile sudah terdaftar (Wallet Address, Username, atau Contact duplikat).' });
        }

        console.error('Error saat membuat profile:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
};

export const updateProfile = async (req, res) => {
    const userId = parseInt(req.params.id);
    const updateData = req.body;

    // Pastikan body tidak kosong
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Body request tidak boleh kosong. Masukkan data yang ingin diperbarui.' });
    }

    // Hanya izinkan field yang bisa diubah
    const allowedFields = ['walletAddress', 'username', 'contact'];
    const receivedFields = Object.keys(updateData);
    const isValidUpdate = receivedFields.every(field => allowedFields.includes(field));

    if (!isValidUpdate) {
        return res.status(400).json({ error: 'Hanya walletAddress, username, dan contact yang diizinkan untuk diperbarui.' });
    }

    try {
        // Ambil data user sebelum di-update (untuk cek role dan walletAddress)
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, walletAddress: true }
        });

        if (!existingUser) {
            return res.status(404).json({ error: `User dengan ID ${userId} tidak ditemukan.` });
        }

        // let txHash = null;

        // Cek apakah ini adalah update username untuk seorang CREATOR
        const isCreator = existingUser.role === 'CREATOR';
        const isUpdatingUsername = 'username' in updateData;

        //  VALIDASI ALAMAT DOMPET UNTUK CREATOR
        if (isCreator && isUpdatingUsername) {
            const walletAddress = existingUser.walletAddress;
            // Alamat dompet Ethereum/EVM biasanya 42 karakter (0x + 40 karakter)
            if (!walletAddress || walletAddress.length !== 42) {
                return res.status(400).json({
                    error: "Alamat dompet Creator tidak valid. Pembaruan nama di blockchain dibatalkan."
                });
            }
        }

        // OPTIMISTIC WRITE DATABASE 
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                walletAddress: true,
                username: true, // Ambil username baru dari DB
                contact: true,
                role: true,
                updatedAt: true
            }
        });

        // // 4. KIRIM TRANSAKSI KE BLOCKCHAIN (Jika diperlukan)
        // if (isCreator && isUpdatingUsername) {
        //     const newUsername = updatedUser.username;
        //     console.log(`[BLOCKCHAIN] Mengirim updateCreatorName untuk: ${newUsername}`);

        //     try {
        //         // Asumsi fungsi di smart contract adalah updateCreatorName
        //         const tx = await contractSigner.updateCreatorName(newUsername);
        //         txHash = tx.hash;
        //         console.log(`Transaksi updateCreatorName berhasil dikirim. Hash: ${txHash}`);

        //         // Jika transaksi berhasil dikirim, kembalikan respons 200 di sini
        //         return res.status(200).json({
        //             ...updatedUser,
        //             message: 'Profile berhasil diperbarui, dan transaksi blockchain telah dikirim.',
        //             transactionHash: txHash
        //         });
        //     } catch (error) {
        //         // JIKA TRANSAKSI BLOCKCHAIN GAGAL (tapi DB sudah berhasil di-update)
        //         // Kita RETURN respons 202 di sini.

        //         // Pengecekan spesifik untuk error Ethers
        //         let blockchainError = 'Gagal mengirim transaksi updateCreatorName ke blockchain.';
        //         if (error.reason) {
        //             blockchainError = `Transaksi Revert: ${error.reason}`;
        //         } else if (error.code === 'INSUFFICIENT_FUNDS') {
        //             blockchainError = 'Gagal Transaksi: Dompet Admin tidak memiliki cukup Gas Fee.';
        //         }

        //         console.error('Error saat update nama creator di blockchain:', error);

        //         // Kembalikan error 202 (Accepted, tapi dengan warning)
        //         return res.status(202).json({
        //             ...updatedUser,
        //             message: `PERINGATAN: Profile berhasil diperbarui di database, tetapi transaksi update nama di blockchain gagal.`,
        //             blockchain_error: blockchainError,
        //             note: 'Database sudah terupdate. Perlu dilakukan verifikasi atau penyesuaian manual di smart contract.'
        //         });
        //     }
        // }

        // Response 200
        return res.status(200).json({
            ...updatedUser,
            message: 'Profile berhasil diperbarui.',
            // transactionHash: txHash
        });

    } catch (error) {
        // Penanganan Error Prisma

        // P2025: Record yang akan diperbarui tidak ditemukan (ID salah)
        if (error.code === 'P2025') {
            return res.status(404).json({ error: `User dengan ID ${userId} tidak ditemukan.` });
        }

        // P2002: Unique Constraint Violation 
        if (error.code === 'P2002') {
            const field = error.meta?.target ? error.meta.target.join(', ') : 'field unik';
            return res.status(409).json({
                error: `Gagal memperbarui: ${field} sudah digunakan oleh user lain.`
            });
        }

        console.error('Error saat memperbarui profile:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
};

export const getProfile = async (req, res) => {
    // Ambil ID dari URL dan konversi ke integer
    const userId = parseInt(req.params.id);

    // Validasi sederhana: pastikan ID valid
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID profil tidak valid.' });
    }

    try {
        // Gunakan findUnique untuk mencari user berdasarkan ID
        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            // Pilih field yang ingin ditampilkan (kecuali password, jika ada)
            select: {
                id: true,
                walletAddress: true,
                username: true,
                contact: true,
                createdAt: true,
                role: true,
            }
        });

        // Cek jika user tidak ditemukan
        if (!userProfile) {
            return res.status(404).json({ error: `User dengan ID ${userId} tidak ditemukan.` });
        }

        // Response 200 OK dengan data profil
        return res.status(200).json(userProfile);

    } catch (error) {
        console.error('Error saat mengambil profile:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
};

export const getUsers = async (req, res) => {
    try {
        // Gunakan findUnique untuk mencari user berdasarkan ID
        const userProfile = await prisma.user.findMany({
        
            // Pilih field yang ingin ditampilkan (kecuali password, jika ada)
            select: {
                id: true,
                walletAddress: true,
                username: true,
                contact: true,
                createdAt: true,
                role: true,
            }
        });

        // Cek jika user tidak ditemukan
        if (!userProfile) {
            return res.status(404).json({ error: `User tidak ditemukan atau belum ada list users` });
        }

        // Response 200 OK dengan data profil
        return res.status(200).json(userProfile);

    } catch (error) {
        console.error('Error saat mengambil profile:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
};

export const getCreator = async (req, res) => {
    try {
        // Gunakan findUnique untuk mencari user berdasarkan ID
        const userProfile = await prisma.user.findMany({
            where:{
                role:"CREATOR"
            },
            // Pilih field yang ingin ditampilkan (kecuali password, jika ada)
            select: {
                id: true,
                walletAddress: true,
                username: true,
                contact: true,
                createdAt: true,
                role: true,
            }
        });

        // Cek jika user tidak ditemukan
        if (!userProfile) {
            return res.status(404).json({ error: `User tidak ditemukan atau belum ada list users` });
        }

        // Response 200 OK dengan data profil
        return res.status(200).json(userProfile);

    } catch (error) {
        console.error('Error saat mengambil profile:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
};

export const requestCreator = async (req, res) => {
    
    const { id, approveTocreator } = req.body;

    if (!id) {
        return res.status(400).json({ error: "ID user harus disediakan." });
    }

    
    const userId = parseInt(id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: "ID user tidak valid." });
    }

   
    if (approveTocreator !== false) {
        return res.status(400).json({ error: "Permintaan harus menyertakan \"approveTocreator\": false." });
    }

    try {
      
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                approveTocreator: false // Set ke FALSE sesuai requirement request
            },
           
            select: {
                id: true,
                updatedAt: true, // Menggunakan updatedAt untuk 'updatesAt'
                role: true,
                approveTocreator: true
            }
        });

      
        return res.status(200).json(updatedUser);

    } catch (error) {
        
        if (error.code === 'P2025') {
            return res.status(404).json({ error: `User dengan ID ${userId} tidak ditemukan.` });
        }

        console.error('Error saat request role creator:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
};

export const getCreatorRequests = async (req, res) => {
    try {
     
        const creatorRequests = await prisma.user.findMany({
            where: {
                approveTocreator: false,
            },
          
            select: {
                id: true,
                walletAddress: true,
                username: true,
                contact: true,
                createdAt: true,
                role: true,
                approveTocreator: true,
            },
        });

       
        return res.status(200).json(creatorRequests);

    } catch (error) {
        console.error('Error getting creator requests list:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal saat mengambil daftar permintaan creator.' });
    }
};

export const accToCreator = async (req, res) => {
    const { id, adminId } = req.body;

    // Validasi input
    if (!id || !adminId) {
        return res.status(400).json({ error: "ID target dan ID Admin harus disediakan." });
    }

    const userId = parseInt(id);
    const adminCheckerId = parseInt(adminId);

    if (isNaN(userId) || isNaN(adminCheckerId)) {
        return res.status(400).json({ error: "ID yang diberikan tidak valid." });
    }

    // Ambil data User Target
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletAddress: true, username: true, role: true, approveTocreator: true }
    });

    try {
        // 1. Cek role Admin
        const adminUser = await prisma.user.findUnique({
            where: { id: adminCheckerId },
            select: { role: true }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Akses Ditolak: Hanya user dengan role ADMIN yang dapat melakukan persetujuan.' });
        }

        if (!targetUser) {
            return res.status(404).json({ error: `User dengan ID ${userId} tidak ditemukan.` });
        }

        // Cek jika sudah menjadi CREATOR di database (menghindari duplikasi)
        if (targetUser.role === 'CREATOR') {
            // Sinkronkan data di DB
            const alreadyCreator = await prisma.user.update({
                where: { id: userId },
                data: {
                    role: 'CREATOR',
                    approveTocreator: true,
                },
                select: { id: true, role: true, approveTocreator: true }
            });
            return res.status(200).json({
                ...alreadyCreator,
                message: "User sudah menjadi Creator di database."
            });
        }

        const { walletAddress, username } = targetUser;

        // Cek validitas alamat dompet sebelum mengirim transaksi
        if (!walletAddress || walletAddress.length !== 42) {
            return res.status(400).json({ error: "Alamat dompet target tidak valid atau kosong." });
        }

        // OPTIMISTIC UPDATE DATABASE DAHULU
        console.log(`[OPTIMISTIC WRITE] Mengubah role user ${userId} menjadi CREATOR di DB.`);
        const updatedCreator = await prisma.user.update({
            where: { id: userId },
            data: {
                role: 'CREATOR',
                approveTocreator: true,
                updatedAt: new Date(),
            },
            select: { id: true, role: true, approveTocreator: true }
        });

        // FIRE: EKSEKUSI TRANSAKSI BLOCKCHAIN
        console.log(`Mengirim transaksi signCreator untuk: ${walletAddress} (${username})`);
        const tx = await contractSigner.signCreator(walletAddress, username);

        console.log(`Transaksi signCreator berhasil dikirim. Hash: ${tx.hash}`);

        // Respon segera ke klien
        return res.status(200).json({
            ...updatedCreator,
            transactionHash: tx.hash,
            message: 'User berhasil diupdate di database. Transaksi blockchain telah dikirim.'
        });

    } catch (error) {

        if (error.code === 'P2025') {
            return res.status(404).json({ error: `User dengan ID ${userId} tidak ditemukan untuk diubah statusnya.` });
        }

        // Penanganan error saat ESTIMATE GAS / Pengiriman Transaksi
        let errorMessage = 'Terjadi kesalahan saat mencoba mengirim transaksi ke blockchain.';

        if (error.reason) {
            errorMessage = `Transaksi Gagal (Revert Kontrak): ${error.reason}`;

            // LOGIKA PENTING: Jika REVERT karena sudah di-sign, ini mengonfirmasi status DB benar.
            if (error.reason.includes('Already signed')) {
                return res.status(200).json({
                    id: userId,
                    walletAddress: targetUser.walletAddress,
                    message: "Transaksi gagal karena sudah disetujui sebelumnya. Status DB sudah benar."
                });
            }

        } else if (error.code === 'CALL_EXCEPTION') {
            errorMessage = `Transaksi Gagal: Kemungkinan izin 'onlyOwner' tidak terpenuhi atau 'Already signed'.`;
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = `Transaksi Gagal: Dompet Admin tidak memiliki cukup Gas Fee.`;
        }

        // JIKA GAGAL KARENA ERROR LAIN (selain "Already signed"), DB SUDAH TERUPDATE 
        console.error('Error saat acc role creator:', error);
        return res.status(500).json({
            error: 'Terjadi kesalahan server internal.',
            details: errorMessage,
            // Tambahkan catatan untuk admin:
            note: 'PERHATIAN: Database sudah terupdate, tetapi transaksi blockchain mungkin gagal. Perlu dilakukan verifikasi manual.'
        });
    }
};