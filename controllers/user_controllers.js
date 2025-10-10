import {prisma} from "../util/prisma_config.js"

export const createProfile = async (req, res) => {
    const { walletAddress, username, contact } = req.body;

    if (!walletAddress || !username || !contact) {
        return res.status(400).json({ error: 'Data walletAddress, username, dan contact harus diisi.' });
    }

    try {
        const newUser = await prisma.user.create({
            data: {
                walletAddress: walletAddress,
                username: username,
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
    const updateData = req.body; // Ambil seluruh body request (hanya berisi field yang diubah)

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
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                walletAddress: true,
                username: true,
                contact: true,
                role: true,
                updatedAt:true
            }
        });

        // Response 200
        return res.status(200).json(updatedUser);

    } catch (error) {
        // Penanganan Error (ID tidak ditemukan atau data unik duplikat)

        // P2025: Record yang akan diperbarui tidak ditemukan (ID salah)
        if (error.code === 'P2025') {
            return res.status(404).json({ error: `User dengan ID ${userId} tidak ditemukan.` });
        }

        // P2002: Unique Constraint Violation (misalnya, mencoba menggunakan username yang sudah ada)
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: `Gagal memperbarui: Salah satu data unik (Wallet Address, Username, atau Contact) sudah digunakan oleh user lain.`
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