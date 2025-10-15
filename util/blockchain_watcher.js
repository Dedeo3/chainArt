import 'dotenv/config';
import { contractReader } from './blockchain_config.js';
// Asumsi: dbPool diekspor sebagai default dari db_config.js
import dbPool from './prisma_config.js';

/**
 * Memperbarui role pengguna di database NeonDB (PostgreSQL) setelah 
 * event CreatorSigned terkonfirmasi di blockchain.
 * * @param {string} walletAddress - Alamat dompet kreator (dari event blockchain).
 */
const updateNeonDbUser = async (walletAddress) => {
    // Ubah alamat dompet menjadi lowercase untuk pencocokan yang aman 
    // di dalam query SQL (menggunakan LOWER("walletAddress")).
    const addressToLower = walletAddress.toLowerCase();

    // SQL Query: Update role dan status persetujuan di tabel "User"
    // Pastikan nama tabel dan kolom sesuai dengan skema Prisma Anda.
    const sql = `
        UPDATE "user"
        SET "role" = 'CREATOR', 
            "approveTocreator" = TRUE,
            "updatedAt" = NOW()
        WHERE LOWER("walletAddress") = $1;
    `;

    let client;
    try {
        // Mendapatkan client dari pool koneksi NeonDB
        client = await dbPool.connect();

        // Eksekusi query untuk mengubah status di DB
        const result = await client.query(sql, [addressToLower]);

        if (result.rowCount > 0) {
            console.log(`[SUCCESS DB] Role CREATOR berhasil diupdate untuk alamat ${walletAddress} di NeonDB.`);
        } else {
            console.warn(`[WARNING DB] Alamat ${walletAddress} dari event tidak ditemukan di database. Pastikan alamat dompet sudah tersimpan di tabel "User".`);
        }
    } catch (error) {
        console.error(`[ERROR DB] Gagal melakukan update role untuk ${walletAddress}:`, error);
    } finally {
        // Sangat penting: Client harus dikembalikan ke pool setelah digunakan
        if (client) {
            client.release();
        }
    }
};


export const startWatchingCreatorEvents = async () => {
    console.log("Memulai ChainArt Creator Event Watcher...");
    console.log("Menghubungkan ke Provider dan siap mendengarkan event...");

    // Nama Event di Kontrak Solidity
    const eventName = "CreatorSigned";

    // Listener function yang akan dipanggil setiap kali event CreatorSigned dipancarkan
    const listener = async (creatorAddress, event) => {
        console.log(`\n--- EVENT DITERIMA: ${eventName} ---`);
        console.log(`Alamat Kreator: ${creatorAddress}`);
        console.log(`Blok Number: ${event.log.blockNumber}`);
        console.log(`Hash Transaksi: ${event.log.transactionHash}`);

        // Panggil fungsi untuk memperbarui database NeonDB
        await updateNeonDbUser(creatorAddress);

        console.log(`--- Update DB Selesai: ${creatorAddress} ---\n`);
    };

    try {
        // Mulai mendengarkan event CreatorSigned dari kontrak
        contractReader.on(eventName, listener);

        console.log(`[LISTENER AKTIF] Berhasil tersambung. Menunggu event ${eventName} dari kontrak...`);

        // Handler error koneksi provider Ethers (penting untuk worker 24/7)
        contractReader.provider.on("error", (error) => {
            console.error("[PROVIDER ERROR] Terjadi kesalahan koneksi Provider:", error);
            // Worker akan otomatis mencoba menyambung kembali
        });

    } catch (error) {
        console.error("Gagal memulai Event Listener:", error);
    }
};

// Panggil fungsi untuk memulai watcher saat skrip dieksekusi
startWatchingCreatorEvents();
