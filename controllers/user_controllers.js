import {prisma} from "../util/prisma_config.js"
import { contractSigner } from '../util/blockchain_config.js'; 
import { startWatchingCreatorEvents } from "../util/blockchain_watcher.js";

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

export const submitKarya = async (req, res) => {
    const {
        creator,
        address,
        media,
        title,
        category,
        description,
        makna,
        authorId
    } = req.body;

    // Validasi Wajib
    if (!creator || !media || !title || !authorId) {
        return res.status(400).json({ error: "Data wajib (creator, media, title, authorId) harus diisi." });
    }

    
    const parsedAuthorId = parseInt(authorId);
    if (isNaN(parsedAuthorId)) {
        return res.status(400).json({ error: "authorId harus berupa angka." });
    }

    try {
        const createdKarya = await prisma.karya.create({
            data: {
                creator,
                address,
                media,
                title,
                category,
                description,
                makna,
                authorId: parsedAuthorId,
            },
        });

        // Ambil data Karya yang baru dibuat beserta relasi author (untuk mendapatkan walletAddress)
        const karyaWithAuthor = await prisma.karya.findUnique({
            where: { id: createdKarya.id },
            include: {
                author: {
                    select: {
                        walletAddress: true,
                        contact:true,
                    }
                }
            }
        });

        // Format Response
        const responseData = {
            id: karyaWithAuthor.id,
            walletAddress: karyaWithAuthor.author.walletAddress,
            contact:karyaWithAuthor.author.contact, 
            creator: karyaWithAuthor.creator,
            status: karyaWithAuthor.status,
            address: karyaWithAuthor.address,
            media: karyaWithAuthor.media,
            title: karyaWithAuthor.title,
            category: karyaWithAuthor.category,
            description: karyaWithAuthor.description,
            makna: karyaWithAuthor.makna,
            authorId: karyaWithAuthor.authorId,
            createdAt: karyaWithAuthor.createdAt,
            updatedAt: karyaWithAuthor.updatedAt,
        };

        return res.status(201).json(responseData);

    } catch (error) {
        // P2003: Foreign Key Constraint Error (authorId tidak ditemukan)
        if (error.code === 'P2003') {
            return res.status(404).json({ error: `User (authorId: ${parsedAuthorId}) tidak ditemukan atau tidak valid.` });
        }
        // Penanganan error Unique Constraint P2002
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Data yang Anda masukkan sudah terdaftar atau terduplikasi.' });
        }

        console.error('Error saat membuat karya:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
};

export const getKaryaById = async (req, res) => {
    const karyaId = parseInt(req.params.id);

    // Validasi ID
    if (isNaN(karyaId)) {
        return res.status(400).json({ error: 'ID Karya tidak valid atau harus berupa angka.' });
    }

    try {
   
        const karyaWithAuthor = await prisma.karya.findUnique({
            where: { id: karyaId },
            include: {
                author: {
                    select: {
                        walletAddress: true,
                        contact: true,
                    }
                }
            }
        });

        // Cek jika Karya tidak ditemukan
        if (!karyaWithAuthor) {
            return res.status(404).json({ error: `Karya dengan ID ${karyaId} tidak ditemukan.` });
        }

        const responseData = {
            id: karyaWithAuthor.id,

            // Diambil dari relasi author
            walletAddress: karyaWithAuthor.author.walletAddress,
            contact: karyaWithAuthor.author.contact,

            creator: karyaWithAuthor.creator,
            status: karyaWithAuthor.status,
            address: karyaWithAuthor.address,
            media: karyaWithAuthor.media,
            title: karyaWithAuthor.title,
            category: karyaWithAuthor.category,
            description: karyaWithAuthor.description,
            makna: karyaWithAuthor.makna,
            authorId: karyaWithAuthor.authorId,
            createdAt: karyaWithAuthor.createdAt,
            updatedAt: karyaWithAuthor.updatedAt,
        };

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error saat mengambil karya:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
};

export const getPendingKarya = async (req, res) => {
    try {
        const pendingKaryaList = await prisma.karya.findMany({
            where: {
                status: 'PENDING',
            },
            //sertakan data author untuk mendapatkan walletAddress dan contact
            include: {
                author: {
                    select: {
                        walletAddress: true,
                        contact: true,
                    }
                }
            },
            // Urutkan berdasarkan tanggal terbaru
            orderBy: {
                createdAt: 'desc',
            }
        });

        // Format Response: Lakukan mapping untuk setiap item agar sesuai format 
        const responseData = pendingKaryaList.map(karya => ({
            id: karya.id,

            // Data dari relasi author
            walletAddress: karya.author.walletAddress,
            contact: karya.author.contact,

            creator: karya.creator,
            status: karya.status,
            address: karya.address,
            media: karya.media,
            title: karya.title,
            category: karya.category,
            description: karya.description,
            makna: karya.makna,
            authorId: karya.authorId,
            createdAt: karya.createdAt,
            updatedAt: karya.updatedAt,
        }));

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error saat mengambil daftar karya pending:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
};

export const getApprovedKarya = async (req, res) => {
    try {
        const approvedKaryaList = await prisma.karya.findMany({
            where: {
                status: 'APPROVED',
            },
            //sertakan data author untuk mendapatkan walletAddress dan contact
            include: {
                author: {
                    select: {
                        walletAddress: true,
                        contact: true,
                    }
                }
            },
            // Urutkan berdasarkan tanggal terbaru
            orderBy: {
                createdAt: 'desc',
            }
        });

        // Format Response: Lakukan mapping untuk setiap item agar sesuai format 
        const responseData = approvedKaryaList.map(karya => ({
            id: karya.id,

            // Data dari relasi author
            walletAddress: karya.author.walletAddress,
            contact: karya.author.contact,

            creator: karya.creator,
            status: karya.status,
            address: karya.address,
            media: karya.media,
            title: karya.title,
            category: karya.category,
            description: karya.description,
            makna: karya.makna,
            authorId: karya.authorId,
            createdAt: karya.createdAt,
            updatedAt: karya.updatedAt,
        }));

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error saat mengambil daftar karya approved:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
};

export const searchKaryaByTitle = async (req, res) => {
    // Ambil query pencarian dari req.query.title (contoh: /api/karya/search?title=lukisan)
    const searchQuery = req.query.title;

    if (!searchQuery) {
        return res.status(400).json({ error: 'Query pencarian "title" harus disediakan.' });
    }

    try {
        const searchResults = await prisma.karya.findMany({
            where: {
                // Mencari title yang mengandung searchQuery. 
                // mode: 'insensitive' membuat pencarian tidak case-sensitive (huruf besar/kecil diabaikan).
                title: {
                    contains: searchQuery,
                    mode: 'insensitive',
                },
                status: 'APPROVED' 
            },
            include: {
                author: {
                    select: {
                        walletAddress: true,
                        contact: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        // 3. Format Response: Lakukan mapping untuk setiap item agar sesuai format yang diinginkan
        const responseData = searchResults.map(karya => ({
            id: karya.id,

            // Data dari relasi author
            walletAddress: karya.author.walletAddress,
            contact: karya.author.contact,

            creator: karya.creator,
            status: karya.status,
            address: karya.address,
            media: karya.media,
            title: karya.title,
            category: karya.category,
            description: karya.description,
            makna: karya.makna,
            authorId: karya.authorId,
            createdAt: karya.createdAt,
            updatedAt: karya.updatedAt,
        }));
        
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error saat mencari karya:', error);
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

    try {
        // 1. Cek role Admin
        const adminUser = await prisma.user.findUnique({
            where: { id: adminCheckerId },
            select: { role: true }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Akses Ditolak: Hanya user dengan role ADMIN yang dapat melakukan persetujuan.' });
        }

        // 2. Ambil data User Target
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { walletAddress: true, username: true, role: true, approveTocreator: true }
        });

        if (!targetUser) {
            return res.status(404).json({ error: `User dengan ID ${userId} tidak ditemukan.` });
        }

        // 3. Cek jika sudah menjadi CREATOR di database (menghindari duplikasi)
        if (targetUser.role === 'CREATOR') {
            // Sinkronkan data di DB (walaupun biasanya sudah sinkron)
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


        // 4. FIRE: EKSEKUSI TRANSAKSI BLOCKCHAIN
        console.log(`Mengirim transaksi signCreator untuk: ${walletAddress} (${username})`);

        // Mengirim transaksi tanpa menunggu konfirmasi (tanpa .wait())
        const tx = await contractSigner.signCreator(walletAddress, username);

        console.log(`Transaksi signCreator berhasil dikirim. Hash: ${tx.hash}`);

        // 5. FORGET: Respon segera ke klien
       startWatchingCreatorEvents
        return res.status(202).json({
            id: userId,
            walletAddress: walletAddress,
            transactionHash: tx.hash,
            message: 'Transaksi persetujuan telah dikirim ke blockchain. Status role di database akan diperbarui secara otomatis setelah konfirmasi blok.'
        });

    } catch (error) {

        if (error.code === 'P2025') {
            return res.status(404).json({ error: `User dengan ID ${userId} tidak ditemukan untuk diubah statusnya.` });
        }

        // Penanganan error saat ESTIMATE GAS / Pengiriman Transaksi
        let errorMessage = 'Terjadi kesalahan saat mencoba mengirim transaksi ke blockchain.';

        if (error.reason) {
            errorMessage = `Transaksi Gagal (Revert Kontrak): ${error.reason}`;

            // LOGIKA PENTING: Jika REVERT karena sudah di-sign, lakukan sinkronisasi DB final
            if (error.reason.includes('Already signed')) {
                // LAKUKAN UPDATE FINAL KE DB DI SINI
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        role: 'CREATOR',
                        approveTocreator: true,
                        updatedAt: new Date()
                    },
                });
                return res.status(200).json({
                    id: userId,
                    // walletAddress: targetUser.walletAddress,
                    message: "Transaksi telah gagal karena sudah disetujui sebelumnya. Status DB telah disinkronkan."
                });
            }

        } else if (error.code === 'CALL_EXCEPTION') {
            errorMessage = `Transaksi Gagal: Kemungkinan izin 'onlyOwner' tidak terpenuhi atau 'Already signed'.`;
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = `Transaksi Gagal: Dompet Admin tidak memiliki cukup Gas Fee.`;
        }

        // JIKA GAGAL KARENA REVERT SELAIN "Already signed", TIDAK PERLU UPDATE DB.
        console.error('Error saat acc role creator:', error);
        return res.status(500).json({
            error: 'Terjadi kesalahan server internal.',
            details: errorMessage
        });
    }
};