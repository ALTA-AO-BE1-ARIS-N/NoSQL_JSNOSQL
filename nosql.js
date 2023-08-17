const readline = require('readline');
const { MongoClient } = require('mongodb');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Mengganti dengan URL MongoDB Anda
const mongoURL = 'mongodb://localhost:27017';
const client = new MongoClient(mongoURL);

let currentUser = null;

async function main() {
  try {
    await client.connect();
    const database = client.db('user_db');
    const usersCollection = database.collection('users');
    const barangCollection = database.collection('barang');

    while (true) {
      if (currentUser === null) {
        console.log('1. Registrasi Pengguna');
        console.log('2. Login');
      } else {
        console.log('1. Tambah Barang');
        console.log('2. Lihat Barangku');
        console.log('3. Hapus Barang');
        console.log('4. Logout');
      }

      const menu = await questionAsync('Pilih menu: ');

      if (currentUser === null) {
        if (menu === '1') {
          await registerUser(usersCollection);
        } else if (menu === '2') {
          await loginUser(usersCollection);
        } else {
          console.log('Menu tidak valid.');
        }
      } else {
        if (menu === '1') {
          await tambahBarang(barangCollection);
        } else if (menu === '2') {
          await lihatBarangku(barangCollection);
        } else if (menu === '3') {
          await hapusBarang(barangCollection);
        } else if (menu === '4') {
          currentUser = null;
          console.log('Berhasil logout.');
        } else {
          console.log('Menu tidak valid.');
        }
      }
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  } finally {
    await client.close();
  }
}

async function questionAsync(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function registerUser(usersCollection) {
  const nama = await questionAsync('Masukkan nama: ');
  const hp = await questionAsync('Masukkan nomor hp: ');
  const password = await questionAsync('Masukkan password: ');

  await usersCollection.insertOne({ nama, hp, password });
  console.log('Pengguna terdaftar.');
}

async function loginUser(usersCollection) {
  const hp = await questionAsync('Masukkan nomor hp: ');
  const password = await questionAsync('Masukkan password: ');

  const user = await usersCollection.findOne({ hp, password });
  if (user) {
    currentUser = user._id;
    console.log('Berhasil login!');
  } else {
    console.log('Nomor hp atau password salah.');
  }
}

async function tambahBarang(barangCollection) {
  const namaBarang = await questionAsync('Masukkan nama barang: ');
  await barangCollection.insertOne({ user_id: currentUser, nama: namaBarang });
  console.log('Barang berhasil ditambahkan.');
}

async function lihatBarangku(barangCollection) {
  const userBarang = await barangCollection.find({ user_id: currentUser }).toArray();
  console.log('Barang milik Anda:');
  userBarang.forEach((barang) => {
    console.log(`ID: ${barang._id}, Nama: ${barang.nama}`);
  });
}

async function hapusBarang(barangCollection) {
  const barangId = await questionAsync('Masukkan ID barang yang akan dihapus: ');
  const result = await barangCollection.deleteOne({ _id: ObjectId(barangId), user_id: currentUser });
  if (result.deletedCount > 0) {
    console.log('Barang berhasil dihapus.');
  } else {
    console.log('Barang tidak ditemukan atau Anda tidak memiliki akses.');
  }
}

main();