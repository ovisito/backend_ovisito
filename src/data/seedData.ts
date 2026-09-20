import { 
  Destination, 
  KulinerItem, 
  HotelItem, 
  EventItem, 
  TransportRoute, 
  RentalVehicle, 
  MiceVenue, 
  MarketplaceProduct, 
  BahasaAcehWord, 
  HabaJameun,
  ApiEndpointDoc 
} from '../types';

export const DESTINASI_DATA: Destination[] = [
  {
    id: 1,
    nama: 'Masjid Raya Baiturrahman',
    slug: 'masjid-raya-baiturrahman',
    kategori: 'Wisata Religi & Sejarah',
    kabupaten_kota: 'Kota Banda Aceh',
    kabupaten_kota_id: 1,
    alamat: 'Jl. Moh. Jam No.1, Kp. Baru, Kec. Baiturrahman, Kota Banda Aceh',
    lat: 5.5539,
    lng: 95.3197,
    harga_tiket: 0,
    rating: 4.9,
    total_review: 4820,
    featured: true,
    is_active: true,
    deskripsi: 'Ikon bersejarah kebanggaan masyarakat Aceh yang didirikan era Kesultanan Aceh Sultan Iskandar Muda pada tahun 1612. Dilengkapi 12 payung elektrik megah seperti Masjid Nabawi dan kolam air mancur.',
    foto: [
      'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1000&q=80'
    ],
    fasilitas: ['Parkir Basement', 'Tempat Wudhu Modern', 'Payung Elektrik', 'Pemandu Sejarah', 'Kamera CCTV', 'Toilet Bersih'],
    jam_operasional: '04:00 - 22:30 WIB'
  },
  {
    id: 2,
    nama: 'Pantai Iboih & Pulau Rubiah',
    slug: 'pantai-iboih-pulau-rubiah',
    kategori: 'Wisata Bahari',
    kabupaten_kota: 'Kota Sabang',
    kabupaten_kota_id: 2,
    alamat: 'Iboih, Kec. Sukakarya, Kota Sabang, Pulau Weh',
    lat: 5.8672,
    lng: 95.2536,
    harga_tiket: 10000,
    rating: 4.8,
    total_review: 2150,
    featured: true,
    is_active: true,
    deskripsi: 'Surga diving dan snorkeling paling terkenal di ujung barat Indonesia. Terumbu karang alami dengan ratusan spesies ikan hias tropis dan kapal boat kaca untuk melihat dasar laut.',
    foto: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
    ],
    fasilitas: ['Sewa Snorkel/Diving', 'Boat Kaca', 'Bungalow Tepi Laut', 'Warung Kuliner Seafood', 'Musholla'],
    jam_operasional: '24 Jam'
  },
  {
    id: 3,
    nama: 'Danau Laut Tawar & Dataran Tinggi Gayo',
    slug: 'danau-laut-tawar-gayo',
    kategori: 'Wisata Alam',
    kabupaten_kota: 'Kabupaten Aceh Tengah',
    kabupaten_kota_id: 3,
    alamat: 'Dataran Tinggi Gayo, Takengon, Kabupaten Aceh Tengah',
    lat: 4.6225,
    lng: 96.8833,
    harga_tiket: 5000,
    rating: 4.8,
    total_review: 1840,
    featured: true,
    is_active: true,
    deskripsi: 'Danau vulkanik seluas 5.472 hektar di ketinggian 1.250 mdpl dengan hawa sejuk pegunungan, perkebunan kopi Arabika Gayo terbaik dunia, dan ikan depik endemik.',
    foto: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
    ],
    fasilitas: ['Camping Ground', 'Dermaga Perahu Wisata', 'Kedai Kopi Specialty Gayo', 'Homestay Tradisional Gayo', 'Spot Foto Instagramable'],
    jam_operasional: '06:00 - 18:30 WIB'
  },
  {
    id: 4,
    nama: 'Museum Tsunami Aceh',
    slug: 'museum-tsunami-aceh',
    kategori: 'Wisata Budaya & Edukasi',
    kabupaten_kota: 'Kota Banda Aceh',
    kabupaten_kota_id: 1,
    alamat: 'Jl. Sultan Iskandar Muda No.3, Sukaramai, Kec. Baiturrahman, Banda Aceh',
    lat: 5.5483,
    lng: 95.3150,
    harga_tiket: 15000,
    rating: 4.7,
    total_review: 3410,
    featured: false,
    is_active: true,
    deskripsi: 'Monumen edukasi dan pengingat peristiwa Tsunami Samudera Hindia 2004 karya arsitek Ridwan Kamil. Menyimpan lorong tsunami (Space of Fear), Ruang Doa (Space of Sorrow), dan pameran simulator gempa.',
    foto: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80'
    ],
    fasilitas: ['Audio Guide Multibahasa', 'Teater Simulasi 4D', 'Toko Souvenir', 'Lift Akses Difabel', 'Musholla'],
    jam_operasional: '09:00 - 16:00 WIB (Jumat Tutup Sesi Siang)'
  },
  {
    id: 5,
    nama: 'Tugu Nol Kilometer Indonesia',
    slug: 'tugu-nol-kilometer-indonesia',
    kategori: 'Wisata Sejarah & Landmark',
    kabupaten_kota: 'Kota Sabang',
    kabupaten_kota_id: 2,
    alamat: 'Hutan Wisata Iboih, Sukakarya, Kota Sabang',
    lat: 5.9080,
    lng: 95.2152,
    harga_tiket: 5000,
    rating: 4.6,
    total_review: 1590,
    featured: false,
    is_active: true,
    deskripsi: 'Titik geografis paling barat kepulauan Indonesia. Wisatawan bisa mendapatkan Sertifikat Resmi Titik Nol Kilometer dengan nomor registrasi kenegaraan.',
    foto: [
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1000&q=80'
    ],
    fasilitas: ['Pusat Pembuatan Sertifikat Nol Km', 'Gardu Pandang Samudera Hindia', 'Kios UMKM Khas Sabang', 'Musholla'],
    jam_operasional: '07:00 - 19:00 WIB'
  }
];

export const KULINER_DATA: KulinerItem[] = [
  {
    id: 1,
    nama: 'Mie Aceh Kepiting Spesial',
    slug: 'mie-aceh-kepiting',
    kategori: 'Makanan Utama',
    restoran_nama: 'Mie Razali Banda Aceh',
    kabupaten_kota: 'Kota Banda Aceh',
    harga: 45000,
    halal_certified: true,
    rating: 4.9,
    deskripsi: 'Mie tebal kuning khas Aceh dimasak dengan kuah kari kental berempah 16 bumbu rahasia Aceh, disajikan dengan kepiting bakau segar, emping melinjo, acar bawang merah, dan jeruk nipis.',
    bahan_utama: ['Mie Basah Aceh', 'Kepiting Bakau', 'Bumbu Kari Aceh', 'Kapulaga', 'Jintan', 'Emping Melinjo'],
    foto: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 2,
    nama: 'Kopi Sanger Arabika Gayo',
    slug: 'kopi-sanger-arabika-gayo',
    kategori: 'Minuman Khas Warkop',
    restoran_nama: 'Warung Kopi Solong Ulee Kareng',
    kabupaten_kota: 'Kota Banda Aceh',
    harga: 14000,
    halal_certified: true,
    rating: 4.9,
    deskripsi: 'Sanger: "Sama-sama ngerti" — paduan harmonis kopi saring tarik khas Aceh dengan sedikit krimer kental manis. Rasa kopi pekat tetap dominan dengan sentuhan gurih lembut.',
    bahan_utama: ['Biji Kopi Robusta Ulee Kareng & Arabika Gayo', 'Susu Kental Manis', 'Air Mendidih Arang'],
    foto: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 3,
    nama: 'Ayam Tangkap Rumput Aceh',
    slug: 'ayam-tangkap-aceh',
    kategori: 'Lauk Tradisional',
    restoran_nama: 'Rumah Makan Hasan',
    kabupaten_kota: 'Aceh Besar',
    harga: 75000,
    halal_certified: true,
    rating: 4.8,
    deskripsi: 'Ayam kampung berbumbu rempah digoreng garing bersama dedaunan aromatik melimpah: daun temurui (kari), daun pandan, dan cabai hijau renyah.',
    bahan_utama: ['Ayam Kampung Muda', 'Daun Temurui/Salam Koja', 'Daun Pandan', 'Bawang Merah', 'Kunyit'],
    foto: ['https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 4,
    nama: 'Kuah Pliek U',
    slug: 'kuah-pliek-u',
    kategori: 'Gulai Tradisional',
    restoran_nama: 'Dapur Rayeuk Lambaro',
    kabupaten_kota: 'Aceh Besar',
    harga: 30000,
    halal_certified: true,
    rating: 4.7,
    deskripsi: 'Gulai sayuran khas Aceh berkuah santan yang dimasak menggunakan Pliek U (ampas kelapa sisa minyak kelapa yang telah difermentasikan bertahun-tahun), nangka muda, melinjo, dan rebung.',
    bahan_utama: ['Pliek U Fermentasi', 'Nangka Muda', 'Buah Melinjo', 'Kacang Panjang', 'Santan Segar', 'Kecombrang'],
    foto: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 5,
    nama: 'Kue Timphan Srikaya Pisang',
    slug: 'kue-timphan-aceh',
    kategori: 'Kue Basah & Takjil',
    restoran_nama: 'Toko Kue Tradisional Peunayong',
    kabupaten_kota: 'Kota Banda Aceh',
    harga: 5000,
    halal_certified: true,
    rating: 4.8,
    deskripsi: 'Kudapan manis tradisional Aceh terbuat dari tepung ketan yang diuleni bersama pisang raja matang, diisi srikaya manis atau kelapa parut gula aren, dibungkus daun pisang muda muda yang dikukus harum.',
    bahan_utama: ['Tepung Ketan', 'Pisang Raja', 'Pasta Srikaya Telur Santan', 'Daun Pisang Muda'],
    foto: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80']
  }
];

export const HOTEL_DATA: HotelItem[] = [
  {
    id: 1,
    nama: 'Hermes Palace Hotel Banda Aceh',
    slug: 'hermes-palace-hotel',
    bintang: 5,
    syariah: true,
    kabupaten_kota: 'Kota Banda Aceh',
    alamat: 'Jl. T. Panglima Nyak Makam, Lambhuk, Kec. Ulee Kareng, Kota Banda Aceh',
    harga_mulai: 850000,
    rating: 4.7,
    total_review: 1240,
    foto: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'],
    tipe_kamar: [
      { id: 101, nama: 'Deluxe Queen Syariah', harga: 850000, kapasitas: 2, fasilitas: ['Sarapan Halal', 'WiFi Kencang', 'Kiblat & Sajadah', 'Kolam Renang'] },
      { id: 102, nama: 'Executive Suite Baiturrahman View', harga: 1450000, kapasitas: 2, fasilitas: ['Sarapan Mewah', 'Balkon Pribadi', 'Bathtub', 'Lounge Access'] }
    ]
  },
  {
    id: 2,
    nama: 'The Pade Hotel & Resort',
    slug: 'the-pade-hotel-resort',
    bintang: 4,
    syariah: true,
    kabupaten_kota: 'Aceh Besar',
    alamat: 'Jl. Soekarno-Hatta No.1, Darul Imarah, Aceh Besar',
    harga_mulai: 620000,
    rating: 4.6,
    total_review: 890,
    foto: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80'],
    tipe_kamar: [
      { id: 201, nama: 'Superior Garden View', harga: 620000, kapasitas: 2, fasilitas: ['AC', 'Smart TV', 'Sarapan', 'Taman Tropis'] },
      { id: 202, nama: 'Grand Deluxe King', harga: 920000, kapasitas: 2, fasilitas: ['Mini Bar Halal', 'Bathtub', 'Balcony', 'Room Service 24h'] }
    ]
  },
  {
    id: 3,
    nama: 'Freddies Santai Sumurtiga Resort',
    slug: 'freddies-sumurtiga-sabang',
    bintang: 3,
    syariah: false,
    kabupaten_kota: 'Kota Sabang',
    alamat: 'Pantai Sumurtiga, Ie Meulee, Sukajaya, Kota Sabang',
    harga_mulai: 480000,
    rating: 4.8,
    total_review: 760,
    foto: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80'],
    tipe_kamar: [
      { id: 301, nama: 'Oceanfront Bungalow', harga: 480000, kapasitas: 2, fasilitas: ['Akses Pantai Langsung', 'Sarapan Western/Aceh', 'Balkon Menghadap Samudra'] },
      { id: 302, nama: 'Family Beach House', harga: 850000, kapasitas: 4, fasilitas: ['2 Kamar Tidur', 'Dapur Kecil', 'Living Area', 'Hamparan Pasir Putih'] }
    ]
  }
];

export const EVENT_DATA: EventItem[] = [
  {
    id: 1,
    nama: 'Pekan Kebudayaan Aceh (PKA) IX',
    slug: 'pekan-kebudayaan-aceh-ix',
    kategori: 'Budaya & Seni Tradisi',
    lokasi: 'Taman Sulthanah Safiatuddin & Lapangan Blang Padang',
    kabupaten_kota: 'Kota Banda Aceh',
    tanggal_mulai: '2026-10-15',
    tanggal_selesai: '2026-10-22',
    harga_tiket: 0,
    status: 'upcoming',
    deskripsi: 'Perhelatan akbar budaya terbesar masyarakat Serambi Mekkah. Menampilkan anjungan adat dari 23 kabupaten/kota se-Aceh, Tari Saman kolosal, Seudati, perlombaan perahu hias, dan kuliner adat.',
    foto: ['https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 2,
    nama: 'Sabang Marine Festival 2026',
    slug: 'sabang-marine-festival',
    kategori: 'Bahari & Olahraga Air',
    lokasi: 'Teluk Sabang & Pantai Kasih',
    kabupaten_kota: 'Kota Sabang',
    tanggal_mulai: '2026-05-18',
    tanggal_selesai: '2026-05-22',
    harga_tiket: 25000,
    status: 'upcoming',
    deskripsi: 'Festival kelautan internasional menyambut yacht reli dunia, parade perahu nelayan tradisional hias Panglima Laot, kejuaraan spearfishing, dan festival seafood pesisir.',
    foto: ['https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 3,
    nama: 'Gayo Coffee Festival & Barista Championship',
    slug: 'gayo-coffee-festival',
    kategori: 'Kuliner & Agro Wisata',
    lokasi: 'Pentas Budaya Lut Tawar, Takengon',
    kabupaten_kota: 'Kabupaten Aceh Tengah',
    tanggal_mulai: '2026-11-05',
    tanggal_selesai: '2026-11-08',
    harga_tiket: 15000,
    status: 'upcoming',
    deskripsi: 'Festival kopi terlengkap di pusat penghasil Arabika Gayo. Menghadirkan cupping session bersama Q-Grader internasional, tur panen kebun kopi, dan live music Didong Gayo.',
    foto: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80']
  }
];

export const TRANSPORT_DATA: TransportRoute[] = [
  {
    id: 1,
    operator: 'Kapal Express Bahari 2F',
    jenis: 'kapal_cepat',
    asal: 'Pelabuhan Ulee Lheue (Banda Aceh)',
    tujuan: 'Pelabuhan Balohan (Sabang)',
    durasi: '45 Menit',
    harga: 100000,
    jadwal: ['08:00 WIB', '10:00 WIB', '14:00 WIB', '16:30 WIB'],
    fasilitas: ['Ruang AC Full', 'Kursi Reclining', 'Bagasi Terdaftar', 'Kantin On-Board']
  },
  {
    id: 2,
    operator: 'KMP BRR (Ferry Ro-Ro)',
    jenis: 'ferry',
    asal: 'Pelabuhan Ulee Lheue (Banda Aceh)',
    tujuan: 'Pelabuhan Balohan (Sabang)',
    durasi: '1 Jam 45 Menit',
    harga: 35000,
    jadwal: ['08:00 WIB', '11:00 WIB', '14:00 WIB', '17:00 WIB'],
    fasilitas: ['Membawa Kendaraan Motor/Mobil', 'Dek Terbuka Angin Laut', 'Kantin Tradisional']
  },
  {
    id: 3,
    operator: 'Gayo Trans Shuttle HiAce Luxury',
    jenis: 'shuttle_hiace',
    asal: 'Banda Aceh Pool (Jl. Lueng Bata)',
    tujuan: 'Takengon (Pusat Kota Lut Tawar)',
    durasi: '6 Jam',
    harga: 170000,
    jadwal: ['09:00 WIB', '13:00 WIB', '20:00 WIB'],
    fasilitas: ['Captain Seat 10 Kursi', 'USB Charging Port', 'AC Double Blower', 'Snack & Air Mineral']
  }
];

export const RENTAL_DATA: RentalVehicle[] = [
  {
    id: 1,
    nama: 'Toyota Innova Reborn Diesel 2.4',
    tipe: 'mobil',
    transmisi: 'matic',
    kapasitas: 7,
    harga_per_hari: 650000,
    harga_dengan_supir: 850000,
    kabupaten_kota: 'Kota Banda Aceh',
    tahun: 2024,
    foto: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 2,
    nama: 'Toyota HiAce Commuter 15-Seat',
    tipe: 'mobil',
    transmisi: 'manual',
    kapasitas: 15,
    harga_per_hari: 1100000,
    harga_dengan_supir: 1350000,
    kabupaten_kota: 'Kota Banda Aceh',
    tahun: 2023,
    foto: ['https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 3,
    nama: 'Yamaha NMAX 155 Connected (Sabang Explore)',
    tipe: 'motor',
    transmisi: 'matic',
    kapasitas: 2,
    harga_per_hari: 100000,
    kabupaten_kota: 'Kota Sabang',
    tahun: 2024,
    foto: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80']
  }
];

export const MICE_DATA: MiceVenue[] = [
  {
    id: 1,
    nama: 'Bale Asan Grand Ballroom Hermes Palace',
    tipe: 'ballroom',
    kapasitas_maksimal: 1200,
    harga_sewa_per_hari: 35000000,
    kabupaten_kota: 'Kota Banda Aceh',
    luas_m2: 1100,
    fasilitas: ['Stage Audio P.A 20.000 Watt', 'Videotron P2.5 12x4 Meter', 'Ruang VIP Transit', 'Katering Halal Sertifikasi MUI'],
    foto: ['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 2,
    nama: 'Aceh International Convention Hall (AICC)',
    tipe: 'convention_center',
    kapasitas_maksimal: 4000,
    harga_sewa_per_hari: 75000000,
    kabupaten_kota: 'Kota Banda Aceh',
    luas_m2: 3500,
    fasilitas: ['Dual Hall Expo Area', 'Ruang Konferensi Pers', 'Keamanan 24 Jam', 'Area Parkir 500 Mobil'],
    foto: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80']
  }
];

export const MARKETPLACE_DATA: MarketplaceProduct[] = [
  {
    id: 1,
    nama: 'Kopi Arabika Gayo Specialty Grade 1 (250gr)',
    slug: 'kopi-arabika-gayo-specialty',
    kategori: 'Kopi & Minuman',
    umkm_nama: 'Koperasi Kopi Gayo Mandiri',
    asal_daerah: 'Bener Meriah / Takengon',
    harga: 85000,
    stok: 140,
    rating: 4.9,
    berat_gram: 250,
    deskripsi: 'Biji kopi pilihan single origin dipetik merah di perkebunan ketinggian 1.450 mdpl. Tasting notes: Floral, hints of caramel, brown sugar, balanced medium acidity.',
    foto: ['https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 2,
    nama: 'Kupiah Meukeutop Sulam Benang Emas',
    slug: 'kupiah-meukeutop-sulam',
    kategori: 'Kerajinan Tangan & Busana Adat',
    umkm_nama: 'Rumah Kreatif Pintu Aceh Peunayong',
    asal_daerah: 'Kota Banda Aceh',
    harga: 165000,
    stok: 35,
    rating: 4.8,
    berat_gram: 300,
    deskripsi: 'Peci tradisional khas pahlawan Teuku Umar dengan 4 warna filosofis Aceh: merah (keberanian), kuning (kejayaan), hijau (keagamaan), dan hitam (ketegasan).',
    foto: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80']
  },
  {
    id: 3,
    nama: 'Minyak Nilam Murni Atsiri Aceh (Patchouli Oil 50ml)',
    slug: 'minyak-nilam-aceh',
    kategori: 'Herbal & Atsiri',
    umkm_nama: 'ARC (Atsiri Research Center) USK',
    asal_daerah: 'Aceh Jaya',
    harga: 120000,
    stok: 60,
    rating: 4.9,
    berat_gram: 100,
    deskripsi: 'Minyak nilam terbaik dunia dengan kandungan patchouli alcohol (PA) tinggi >32%, diproses dengan teknologi distilasi modern ARC Universitas Syiah Kuala.',
    foto: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=80']
  }
];

export const BAHASA_ACEH_DATA: BahasaAcehWord[] = [
  {
    id: 1,
    kata_aceh: 'Peue haba?',
    art_indonesia: 'Apa kabar?',
    arti_inggris: 'How are you?',
    kelas_kata: 'ungkapan',
    lafal_fonetik: '/pɯə ha.ba/',
    contoh_kalimat_aceh: 'Peue haba gata nyang baro troh nibak Sabang?',
    terjemahan_contoh: 'Apa kabarmu yang baru saja tiba dari Sabang?',
    dialek: 'Umum'
  },
  {
    id: 2,
    kata_aceh: 'Haba get',
    art_indonesia: 'Kabar baik',
    arti_inggris: 'Good news / I am fine',
    kelas_kata: 'ungkapan',
    lafal_fonetik: '/ha.ba gɛt/',
    contoh_kalimat_aceh: 'Alhamdulillah, haba get cit kamo mantong sehat.',
    terjemahan_contoh: 'Alhamdulillah, kabar baik kami masih sehat walafiat.',
    dialek: 'Umum'
  },
  {
    id: 3,
    kata_aceh: 'Teurimong geunaseh',
    art_indonesia: 'Terima kasih',
    arti_inggris: 'Thank you',
    kelas_kata: 'ungkapan',
    lafal_fonetik: '/tɯ.ri.moŋ ɡɯ.na.seh/',
    contoh_kalimat_aceh: 'Teurimong geunaseh beh ka neubantu kamo.',
    terjemahan_contoh: 'Terima kasih ya sudah membantu kami.',
    dialek: 'Umum'
  },
  {
    id: 4,
    kata_aceh: 'Saleum teuka',
    art_indonesia: 'Selamat datang',
    arti_inggris: 'Welcome',
    kelas_kata: 'ungkapan',
    lafal_fonetik: '/sa.lɯm tɯ.ka/',
    contoh_kalimat_aceh: 'Saleum teuka rakan bak Tanoh Rencong Aceh!',
    terjemahan_contoh: 'Selamat datang sahabat di Tanah Rencong Aceh!',
    dialek: 'Umum'
  },
  {
    id: 5,
    kata_aceh: 'Piyoh',
    art_indonesia: 'Silakan mampir / Singgah',
    arti_inggris: 'Please come in / Drop by',
    kelas_kata: 'verba',
    lafal_fonetik: '/pi.joh/',
    contoh_kalimat_aceh: 'Neu piyoh dilee rakan bak keude kupi kamo.',
    terjemahan_contoh: 'Silakan singgah dulu kawan di kedai kopi kami.',
    dialek: 'Aceh Rayeuk'
  },
  {
    id: 6,
    kata_aceh: 'Mangat that',
    art_indonesia: 'Enak sekali / Sangat lezat',
    arti_inggris: 'Very delicious',
    kelas_kata: 'adjektiva',
    lafal_fonetik: '/ma.ŋat tʰat/',
    contoh_kalimat_aceh: 'Mie Aceh Razali nyoe mangat that keubit.',
    terjemahan_contoh: 'Mie Aceh Razali ini sungguh enak sekali.',
    dialek: 'Umum'
  },
  {
    id: 7,
    kata_aceh: 'Pajan',
    art_indonesia: 'Kapan',
    arti_inggris: 'When',
    kelas_kata: 'partikel',
    lafal_fonetik: '/pa.dʒan/',
    contoh_kalimat_aceh: 'Pajan geutanyoe ta jak u Pantai Lampuuk?',
    terjemahan_contoh: 'Kapan kita pergi ke Pantai Lampuuk?',
    dialek: 'Umum'
  },
  {
    id: 8,
    kata_aceh: 'Padup',
    art_indonesia: 'Berapa',
    arti_inggris: 'How much / How many',
    kelas_kata: 'partikel',
    lafal_fonetik: '/pa.dup/',
    contoh_kalimat_aceh: 'Padup hareuga kupi sanger saboh glah nyoe?',
    terjemahan_contoh: 'Berapa harga secangkir kopi sanger ini?',
    dialek: 'Umum'
  }
];

export const HABA_JAMEUN_DATA: HabaJameun[] = [
  {
    id: 1,
    peribahasa_aceh: 'Adat bak Po Teumeureuhom, Hukom bak Syiah Kuala, Qanun bak Putroe Phang, Reusam bak Laksamana.',
    arti_harfiah: 'Adat bersumber dari Sultan Iskandar Muda, Hukum agama dari Syekh Abdurrauf As-Singkili (Syiah Kuala), Qanun perundang-undangan dari Putroe Phang, Tata krama dan ketahanan dari Laksamana Malahayati.',
    makna_filosofis: 'Prinsip tata kelola kenegaraan, keadilan, dan keseimbangan sosial peradaban Aceh yang menyatukan nilai syariat Islam, kearifan adat, diplomasi, dan pertahanan.',
    konteks_penggunaan: 'Digunakan dalam musyawarah adat, pengesahan qanun, dan pendidikan kepemimpinan Aceh.'
  },
  {
    id: 2,
    peribahasa_aceh: 'Udep beu sajan, mate beu saban.',
    arti_harfiah: 'Hidup harus bersama-sama, mati harus seirama.',
    makna_filosofis: 'Solidaritas tinggi dan kesetiakawanan tak terpecah dalam menghadapi susah maupun senang dalam masyarakat Aceh.',
    konteks_penggunaan: 'Nasihat persaudaraan dan gotong royong (meunasah / reusam gampong).'
  },
  {
    id: 3,
    peribahasa_aceh: 'Batee meutingkue, geulumbang meugulong.',
    arti_harfiah: 'Batu bertumpuk, gelombang bergulung.',
    makna_filosofis: 'Keteguhan pendirian dan kekokohan prinsip yang tidak goyah meski diterpa cobaan berat laksana batu karang pantai.',
    konteks_penggunaan: 'Memberi semangat pantang menyerah dan ketegaran menghadapi tantangan.'
  }
];

export const API_ENDPOINTS: ApiEndpointDoc[] = [
  {
    module: 'destinasi',
    method: 'GET',
    path: '/api/v2/public/destinasi/destinasi',
    title: 'Katalog Destinasi Wisata',
    description: 'Menampilkan daftar objek wisata di Aceh dengan fitur pencarian, filter wilayah, kategori, dan rating.',
    access: 'Public',
    queryParams: [
      { name: 'search', type: 'string', description: 'Cari nama destinasi (cth: Baiturrahman, Iboih)' },
      { name: 'kabupaten_kota_id', type: 'number', description: 'Filter ID kab/kota: 1=Banda Aceh, 2=Sabang, 3=Aceh Tengah' },
      { name: 'featured', type: 'boolean', description: 'Hanya tampilkan destinasi unggulan (true/false)' },
      { name: 'page', type: 'number', default: '1', description: 'Halaman data' },
      { name: 'per_page', type: 'number', default: '10', description: 'Jumlah item per halaman' }
    ],
    responseExample: {
      status: true,
      current_page: 1,
      total: 5,
      data: DESTINASI_DATA
    }
  },
  {
    module: 'destinasi',
    method: 'GET',
    path: '/api/v2/public/destinasi/destinasi/:id',
    title: 'Detail Destinasi & Tiket',
    description: 'Mengambil informasi lengkap destinasi wisata tertentu termasuk jam operasional, foto, dan fasilitas.',
    access: 'Public',
    responseExample: {
      status: true,
      data: DESTINASI_DATA[0]
    }
  },
  {
    module: 'kuliner',
    method: 'GET',
    path: '/api/v2/public/kuliner/menu',
    title: 'Daftar Kuliner Khas Aceh',
    description: 'Katalog hidangan tradisional, warkop, rempah kari, dan makanan khas Aceh terverifikasi halal.',
    access: 'Public',
    queryParams: [
      { name: 'search', type: 'string', description: 'Pencarian nama hidangan (cth: Mie Aceh, Sanger)' },
      { name: 'kategori', type: 'string', description: 'Filter kategori masakan' }
    ],
    responseExample: {
      status: true,
      data: KULINER_DATA
    }
  },
  {
    module: 'hotel',
    method: 'GET',
    path: '/api/v2/public/hotel/hotel',
    title: 'Katalog Hotel & Penginapan',
    description: 'Daftar hotel berbintang, resort tepi pantai, dan penginapan berkonsep Syariah di Aceh.',
    access: 'Public',
    queryParams: [
      { name: 'syariah', type: 'boolean', description: 'Filter akomodasi ramah Syariah' },
      { name: 'bintang', type: 'number', description: 'Klasifikasi bintang hotel' }
    ],
    responseExample: {
      status: true,
      data: HOTEL_DATA
    }
  },
  {
    module: 'event',
    method: 'GET',
    path: '/api/v2/public/event/event',
    title: 'Kalender Event & Festival',
    description: 'Jadwal festival budaya, maritim, dan kejuaraan kopi di seluruh Provinsi Aceh.',
    access: 'Public',
    responseExample: {
      status: true,
      data: EVENT_DATA
    }
  },
  {
    module: 'transport',
    method: 'GET',
    path: '/api/v2/public/transport/rute',
    title: 'Jadwal & Rute Transportasi',
    description: 'Jadwal kapal cepat Sabang, Ro-Ro ferry, dan armada shuttle antar-kabupaten.',
    access: 'Public',
    responseExample: {
      status: true,
      data: TRANSPORT_DATA
    }
  },
  {
    module: 'rental',
    method: 'GET',
    path: '/api/v2/public/rental/kendaraan',
    title: 'Armada Rental Mobil & Motor',
    description: 'Ketersediaan sewa kendaraan lepas kunci atau dengan supir ramah wisata.',
    access: 'Public',
    responseExample: {
      status: true,
      data: RENTAL_DATA
    }
  },
  {
    module: 'mice',
    method: 'GET',
    path: '/api/v2/public/mice/venue',
    title: 'Venue MICE & Convention',
    description: 'Daftar ballroom dan convention hall untuk konferensi pemerintahan dan korporasi di Aceh.',
    access: 'Public',
    responseExample: {
      status: true,
      data: MICE_DATA
    }
  },
  {
    module: 'marketplace',
    method: 'GET',
    path: '/api/v2/public/marketplace/produk',
    title: 'Marketplace Oleh-Oleh & UMKM',
    description: 'Katalog produk autentik Aceh: Kopi Gayo, Songket, Minyak Nilam ATSIRI, dan souvenir lokal.',
    access: 'Public',
    responseExample: {
      status: true,
      data: MARKETPLACE_DATA
    }
  },
  {
    module: 'bahasa-aceh',
    method: 'GET',
    path: '/api/v2/public/bahasa-aceh/kamus',
    title: 'Kamus Kosakata Bahasa Aceh',
    description: 'Pencarian leksikon Bahasa Aceh ke Bahasa Indonesia dan Inggris beserta fonetik & contoh kalimat.',
    access: 'Public',
    queryParams: [
      { name: 'q', type: 'string', description: 'Kata pencarian (contoh: "haba", "piyoh", "mangat")' }
    ],
    responseExample: {
      status: true,
      data: BAHASA_ACEH_DATA
    }
  },
  {
    module: 'bahasa-aceh',
    method: 'GET',
    path: '/api/v2/public/bahasa-aceh/peribahasa',
    title: 'Peribahasa Klasik (Haba Jameun)',
    description: 'Koleksi falsafah dan peribahasa petuah leluhur Aceh dengan tafsir makna mendalam.',
    access: 'Public',
    responseExample: {
      status: true,
      data: HABA_JAMEUN_DATA
    }
  },
  {
    module: 'bahasa-aceh',
    method: 'POST',
    path: '/api/v2/public/bahasa-aceh/translate',
    title: 'Mesin Terjemahan Cepat Bahasa Aceh',
    description: 'Menerjemahkan teks kalimat atau frasa dari Bahasa Indonesia ke Bahasa Aceh atau sebaliknya.',
    access: 'Public',
    bodyExample: {
      text: 'Apa kabar teman-teman?',
      from: 'id',
      to: 'aceh'
    },
    responseExample: {
      status: true,
      data: {
        original: 'Apa kabar teman-teman?',
        translated: 'Peue haba rakan-rakan mandum?',
        detected_lang: 'id',
        target_lang: 'aceh',
        confidence: 0.98
      }
    }
  }
];
