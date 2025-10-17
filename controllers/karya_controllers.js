import { prisma } from "../util/prisma_config.js"
import { contractSigner } from '../util/blockchain_config.js'; 

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

    const creatorUser = await prisma.user.findUnique({
        where: { id: authorId },
        select: { role: true }
    });
    if(creatorUser.role != "CREATOR"){
        return res.status(400).json({ error: "user bukan creator" });
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
                        contact: true,
                    }
                }
            }
        });

        // Format Response
        const responseData = {
            id: karyaWithAuthor.id,
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
    select: {
        id: true, // Pastikan Anda memilih semua kolom yang Anda butuhkan
        hash: true,
        creator: true,
        status: true,
        address: true,
        media: true,
        title: true,
        category: true,
        description: true,
        makna: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        // Menyertakan relasi author di dalam select
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
            hash:karyaWithAuthor.hash,
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
        return res.status(500).json({ error: 'Terjadi kesalahan server internal atau request belum sesuai.' });
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
        return res.status(500).json({ error: 'Terjadi kesalahan server internal atau request belum sesuai.' });
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
            hash: karya.hash,
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
        return res.status(500).json({ error: 'Terjadi kesalahan server internal atau request belum sesuai.' });
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
        return res.status(500).json({ error: 'Terjadi kesalahan server internal atau request belum sesuai.' });
    }
};

export const deleteKarya= async (req, res)=>{
    const idAdmin= req.body.adminId
    const idKarya= req.body.idKarya

    if(!idKarya || !idAdmin){
        res.status(404).json({
            "messages":"request memerlukan idKarya dan adminId"
        })
    }

    const adminUser = await prisma.user.findUnique({
        where: { id: idAdmin },
        select: { role: true }
    });

    const karya = await prisma.karya.findUnique({
        where: { id: idKarya },
        select: { title: true }
    });

    if(!karya){
        return res.status(403).json({ error: 'karya tidak ditemukan' });
    }
  
    if (!adminUser || adminUser.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Akses Ditolak: Hanya user dengan role ADMIN yang dapat melakukan penghapusan.' });
    }
    
    try{
         await prisma.karya.delete(
          {
                where: {
                    id: idKarya
                }
          }
        )
        res.status(200).json(
            {
                messages: "berhasil reject" 
            }
        )
    }catch(err){
        console.error('Error saat mencari karya:', err);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal atau request belum sesuai.' });
    }
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


export const approveKarya = async (req, res) => {
    // Konversi ke angka lebih awal untuk validasi
    const idAdmin = parseInt(req.body.adminId);
    const idKarya = parseInt(req.body.idKarya);
    const idCreator = parseInt(req.body.idCreator);

    //  Validasi ID
    if (isNaN(idKarya) || isNaN(idAdmin) || isNaN(idCreator)) {
        return res.status(400).json({
            "messages": "idKarya, idCreator, dan adminId harus berupa angka yang valid."
        });
    }

    try {
        // Fetch data yang diperlukan secara paralel
        const [adminUser, karya, creator] = await Promise.all([
            prisma.user.findUnique({
                where: { id: idAdmin },
                select: { role: true }
            }),
            prisma.karya.findUnique({
                where: { id: idKarya },
                select: { title: true, creator: true, media: true, description: true, verified: true }
            }),
            prisma.user.findUnique({
                where: { id: idCreator },
                select: { walletAddress: true, username: true }
            })
        ]);

        // Validasi Data
        if (!karya) {
            return res.status(404).json({ error: 'Karya tidak ditemukan.' });
        }
        if (karya.verified) {
            return res.status(409).json({ error: 'Karya ini sudah disetujui sebelumnya.' });
        }
        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Akses Ditolak: Hanya user dengan role ADMIN yang dapat melakukan persetujuan.' });
        }
        if (!creator || !creator.walletAddress) {
            return res.status(400).json({ error: 'Wallet Address Creator tidak ditemukan atau tidak valid.' });
        }

        const creatorWalletAddress = creator.walletAddress;


        // Memanggil fungsi view 'creators' dari Smart Contract untuk cek status "signed"
        const creatorData = await contractSigner.creators(creatorWalletAddress);
        let signTxHash = null; // Variable untuk menyimpan hash transaksi signCreator 

        if (!creatorData.signed) {
            console.log(`Creator ${creatorWalletAddress} (${creator.username}) belum ditandatangani. Admin akan mengirim transaksi signCreator terlebih dahulu.`);

            try {
                // Panggil signCreator, Admin yang menandatangani Creator
                const signTx = await contractSigner.signCreator(creatorWalletAddress, creator.username);
                
                signTxHash = signTx.hash;
                console.log(`signCreator berhasil dikirim. Hash: ${signTxHash}`);
            } catch (signError) {
                // Jika pengiriman signCreator gagal (misalnya, masalah estimasi gas), kembalikan error
                console.error('Gagal saat mengirim transaksi signCreator:', signError);
                return res.status(500).json({
                    error: 'Gagal mengirim verifikasi Creator (signCreator) ke blockchain.',
                    detail: signError.reason || signError.shortMessage
                });
            }
        } else {
            console.log(`Creator ${creatorWalletAddress} sudah ditandatangani. Lanjut ke penambahan Art.`);
        }

         let addArtTxHash = null;

        // 4. Update Database (Optimistic Write - Ini cepat)
        const approve = await prisma.karya.update({
            where: { id: idKarya },
            data: {
                verified: true,
                status: "APPROVED",
                hak_cipta: `HC-2025-${makeid(4)}`,
                licency: `Creative Commons CC ${makeid(2)}-${makeid(2)}-${makeid(2)} 4.0`
            },
            select: {
                id: true, creator: true, updatedAt: true, hak_cipta: true, licency: true, verified: true,
                title: true, media: true, createdAt: true, description: true,
            }
        });

        // Transaksi Blockchain (Panggil addArt - TANPA MENUNGGU KONFIRMASI)
        const { title, description, media } = karya;
       

        console.log(`Mengirim transaksi addArt untuk: ${title} (${description})`);

        try {
            const tx = await contractSigner.addArt(
                creatorWalletAddress, 
                title,
                description,
                media
            )

            addArtTxHash = tx.hash;
            
            await prisma.karya.update({
            where: { id: idKarya },
            data: {
              hash:addArtTxHash
            },
        });
            console.log(`Transaksi addArt berhasil dikirim. Hash: ${addArtTxHash}`);

            return res.status(200).json({
                ...approve,
                // signTransactionHash: signTxHash, 
                addArtTransactionHash: addArtTxHash, 
                message: `Karya berhasil di approved di database. Transaksi blockchain telah dikirim dan sedang menunggu konfirmasi.`
            });

        } catch (error) {
            // Penanganan Error Transaksi addArt
            let blockchainError = (error.reason && error.reason !== "unknown") ? `Transaksi Revert: ${error.reason}` : 'Gagal mengirim transaksi addArt ke blockchain.';

            console.error('Error saat mengirim transaksi addArt:', error);

            return res.status(202).json({
                ...approve,
                message: `PERINGATAN: Karya berhasil di approved di database, tetapi transaksi addArt GAGAL dikirim.`,
                blockchain_error: blockchainError,
                note: 'Silakan cek konsol server untuk detail error blockchain. Status DB terupdate, namun status blockchain masih Tertunda/Gagal.'
            });
        }

    } catch (err) {
        // Penanganan Error Prisma
        if (err.code === 'P2025') {
            return res.status(404).json({ error: `User/Karya dengan ID tersebut tidak ditemukan.` });
        }

        console.error('Error server/prisma:', err);
        return res.status(500).json({ error: 'Terjadi kesalahan server internal.' });
    }
}
