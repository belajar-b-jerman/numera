export type LevelId =
  | 'count-10'
  | 'compare-20'
  | 'add-10'
  | 'subtract-10'
  | 'bonds-10'
  | 'add-20'
  | 'subtract-20'
  | 'place-value'
  | 'add-100'
  | 'multiply-groups'
  | 'divide-share'
  | 'pattern-logic'

export type Strand = 'Fondasi' | 'Number Sense' | 'Operasi' | 'Olimpiade Mini'

export type Level = {
  id: LevelId
  title: string
  subtitle: string
  strand: Strand
  band: 'TK B' | 'Kelas 1' | 'Kelas 2'
  merdeka: string
  singapore: string
  goal: string
  color: string
}

export const levels: Level[] = [
  {
    id: 'count-10',
    title: 'Bilangan 1-10',
    subtitle: 'Hitung benda dan cocokkan jumlah',
    strand: 'Fondasi',
    band: 'TK B',
    merdeka: 'Mengenal bilangan cacah kecil lewat benda nyata.',
    singapore: 'Concrete: anak melihat dan menghitung objek satu per satu.',
    goal: 'Membangun korespondensi satu benda satu bilangan.',
    color: '#f7b267',
  },
  {
    id: 'compare-20',
    title: 'Membandingkan Bilangan',
    subtitle: 'Urutan, lebih besar, lebih kecil',
    strand: 'Number Sense',
    band: 'TK B',
    merdeka: 'Membandingkan dan mengurutkan bilangan sampai 20.',
    singapore: 'Pictorial: garis bilangan membantu melihat posisi angka.',
    goal: 'Anak paham besar-kecil tanpa harus selalu menghitung ulang.',
    color: '#72c6a1',
  },
  {
    id: 'add-10',
    title: 'Penjumlahan sampai 10',
    subtitle: 'Penjumlahan sampai 10',
    strand: 'Operasi',
    band: 'Kelas 1',
    merdeka: 'Memahami makna penjumlahan sebagai menggabungkan.',
    singapore: 'Concrete ke abstract: benda digabung, lalu ditulis sebagai simbol.',
    goal: 'Anak melihat penjumlahan sebagai aksi, bukan hafalan.',
    color: '#8fb3ff',
  },
  {
    id: 'subtract-10',
    title: 'Pengurangan sampai 10',
    subtitle: 'Pengurangan sampai 10',
    strand: 'Operasi',
    band: 'Kelas 1',
    merdeka: 'Memahami pengurangan sebagai mengambil atau selisih.',
    singapore: 'Model gambar memperlihatkan benda awal, benda pergi, dan sisa.',
    goal: 'Anak bisa membedakan cerita mengambil dan membandingkan.',
    color: '#ff8fab',
  },
  {
    id: 'bonds-10',
    title: 'Pasangan Bilangan 10',
    subtitle: 'Number bonds dan make ten',
    strand: 'Number Sense',
    band: 'Kelas 1',
    merdeka: 'Mengurai dan menyusun bilangan untuk strategi hitung.',
    singapore: 'Number bonds menjadi dasar mental math Singapore Math.',
    goal: 'Anak cepat melihat 7 perlu 3 untuk menjadi 10.',
    color: '#ffd166',
  },
  {
    id: 'add-20',
    title: 'Penjumlahan sampai 20',
    subtitle: 'Tambah sampai 20 dengan strategi',
    strand: 'Operasi',
    band: 'Kelas 1',
    merdeka: 'Menggunakan berbagai strategi penjumlahan bilangan kecil.',
    singapore: 'Make ten: pecah angka agar operasi menjadi lebih mudah.',
    goal: 'Anak tidak bergantung pada menghitung jari satu per satu.',
    color: '#6ec6ff',
  },
  {
    id: 'subtract-20',
    title: 'Pengurangan sampai 20',
    subtitle: 'Kurang sampai 20 dengan garis bilangan',
    strand: 'Operasi',
    band: 'Kelas 1',
    merdeka: 'Melakukan pengurangan sampai 20 dalam konteks dekat anak.',
    singapore: 'Counting back dan bar model sederhana untuk melihat sisa.',
    goal: 'Anak memilih strategi mundur, selisih, atau pecah angka.',
    color: '#c8a2ff',
  },
  {
    id: 'place-value',
    title: 'Nilai Tempat',
    subtitle: 'Nilai tempat sampai 100',
    strand: 'Number Sense',
    band: 'Kelas 2',
    merdeka: 'Memahami puluhan dan satuan sebagai struktur bilangan.',
    singapore: 'Base-ten blocks menghubungkan gambar dengan notasi angka.',
    goal: 'Anak paham 47 sebagai 4 puluhan dan 7 satuan.',
    color: '#95d5b2',
  },
  {
    id: 'add-100',
    title: 'Operasi sampai 100',
    subtitle: 'Tambah dan kurang sampai 100',
    strand: 'Operasi',
    band: 'Kelas 2',
    merdeka: 'Menghitung bilangan dua digit dengan konteks sehari-hari.',
    singapore: 'Decomposition: puluhan dihitung dengan puluhan, satuan dengan satuan.',
    goal: 'Anak mulai memakai struktur, bukan hitung panjang.',
    color: '#f4978e',
  },
  {
    id: 'multiply-groups',
    title: 'Perkalian Awal',
    subtitle: 'Perkalian sebagai grup sama banyak',
    strand: 'Operasi',
    band: 'Kelas 2',
    merdeka: 'Pengenalan perkalian melalui penjumlahan berulang.',
    singapore: 'Array dan equal groups sebelum simbol perkalian formal.',
    goal: 'Anak melihat 3 x 4 sebagai 3 kelompok berisi 4.',
    color: '#81b29a',
  },
  {
    id: 'divide-share',
    title: 'Pembagian Awal',
    subtitle: 'Pembagian sebagai berbagi rata',
    strand: 'Operasi',
    band: 'Kelas 2',
    merdeka: 'Pengenalan pembagian melalui berbagi benda sama banyak.',
    singapore: 'Concrete sharing: benda dibagi dulu, simbol muncul belakangan.',
    goal: 'Anak paham pembagian sebagai distribusi yang adil.',
    color: '#f2cc8f',
  },
  {
    id: 'pattern-logic',
    title: 'Pola dan Logika',
    subtitle: 'Pola, angka hilang, kerja mundur',
    strand: 'Olimpiade Mini',
    band: 'Kelas 2',
    merdeka: 'Mengamati pola dan relasi antar bilangan.',
    singapore: 'Problem solving: understand, plan, solve, check.',
    goal: 'Melatih kebiasaan berpikir olimpiade secara ringan.',
    color: '#90dbf4',
  },
]

export const curriculumNotes = [
  {
    title: 'Kurikulum Merdeka sebagai peta',
    body: 'Materi disusun bertahap sesuai kebutuhan anak Indonesia: bilangan, operasi, pola, nilai tempat, pengukuran ringan, dan pemecahan masalah kontekstual.',
  },
  {
    title: 'Singapore Math sebagai mesin belajar',
    body: 'Setiap konsep bergerak dari Concrete, Pictorial, lalu Abstract. Anak melihat benda, memahami model gambar, baru memakai simbol angka.',
  },
  {
    title: 'Problem solving untuk fondasi olimpiade',
    body: 'Latihan tidak hanya mengejar cepat. Anak diajak memilih strategi, memecah angka, mencari pola, bekerja mundur, dan mengecek jawaban.',
  },
]
