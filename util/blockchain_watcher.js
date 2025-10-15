// import 'dotenv/config';
// // Pastikan path ini benar untuk file yang mengekspor contractReader
// import { contractReader } from './blockchain_config.js';
// // Mengimpor instance PrismaClient dari prisma_config.js
// import { prisma } from './prisma_config.js';

// /**
//  * Memperbarui role pengguna di database menggunakan Prisma setelah 
//  * event CreatorSigned terkonfirmasi di blockchain.
//  * @param {string} walletAddress - Alamat dompet kreator (dari event blockchain).
//  */
// const updatePrismaUser = async (walletAddress) => {
//     // Alamat dompet dari event.
//     const addressToCheck = walletAddress;

//     try {
//         // Menggunakan metode Prisma ORM untuk melakukan update.
//         // updateMany digunakan untuk memastikan update berjalan meskipun walletAddress 
//         // tidak didefinisikan sebagai unique di skema Prisma, dan menangani perbandingan case.
//         const updatedUser = await prisma.user.updateMany({
//             where: {
//                 walletAddress: {
//                     // Menggunakan mode 'insensitive' yang didukung oleh PostgreSQL (NeonDB) 
//                     // untuk mengatasi perbedaan huruf besar/kecil pada alamat dompet.
//                     equals: addressToCheck,
//                     mode: 'insensitive',
//                 },
//             },
//             data: {
//                 role: 'CREATOR',
//                 approveTocreator: true,
//                 updatedAt: new Date(), // Menyetel updatedAt saat ini
//             },
//         });

//         if (updatedUser.count > 0) {
//             console.log(`[SUCCESS DB] Role CREATOR berhasil diupdate (${updatedUser.count} row) untuk alamat ${walletAddress} menggunakan Prisma.`);
//         } else {
//             console.warn(`[WARNING DB] Alamat ${walletAddress} dari event tidak ditemukan di database. Pastikan alamat dompet sudah tersimpan di tabel "User".`);
//         }
//     } catch (error) {
//         console.error(`[ERROR DB] Gagal melakukan update role untuk ${walletAddress}:`, error);
//     }
// };


// // -----------------------------------------------------------
// // FUNGSI UTAMA: MENDENGARKAN EVENT DARI BLOCKCHAIN
// // -----------------------------------------------------------

// export const startWatchingCreatorEvents = async () => {
//     console.log("Memulai ChainArt Creator Event Watcher...");
//     console.log("Menghubungkan ke Provider dan siap mendengarkan event...");

//     // Nama Event di Kontrak Solidity
//     const eventName = "CreatorSigned";

//     // Listener function yang akan dipanggil setiap kali event CreatorSigned dipancarkan
//     const listener = async (creatorAddress, event) => {
//         console.log(`\n--- EVENT DITERIMA: ${eventName} ---`);
//         console.log(`Alamat Kreator: ${creatorAddress}`);
//         console.log(`Blok Number: ${event.log.blockNumber}`);
//         console.log(`Hash Transaksi: ${event.log.transactionHash}`);

//         // Panggil fungsi untuk memperbarui database menggunakan Prisma
//         await updatePrismaUser(creatorAddress);

//         console.log(`--- Update DB Selesai: ${creatorAddress} ---\n`);
//     };

//     try {
//         // Mulai mendengarkan event CreatorSigned dari kontrak
//         contractReader.on(eventName, listener);

//         console.log(`[LISTENER AKTIF] Berhasil tersambung. Menunggu event ${eventName} dari kontrak...`);

//         // Handler error koneksi provider Ethers (penting untuk worker 24/7)
//         contractReader.provider.on("error", (error) => {
//             console.error("[PROVIDER ERROR] Terjadi kesalahan koneksi Provider:", error);
//             // Logika reconnect atau notifikasi dapat ditambahkan di sini
//         });

//     } catch (error) {
//         console.error("Gagal memulai Event Listener:", error);
//     }
// };

// // Panggil fungsi untuk memulai watcher saat skrip dieksekusi
// // startWatchingCreatorEvents();