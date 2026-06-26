import type { LevelId } from './curriculum'

export type Challenge = {
  prompt: string
  expression: string
  answer: number
  options: number[]
  visual: number[]
  hint: string
  strategy: string
  story: string
  model: 'objects' | 'comparison' | 'number-bond' | 'place-value' | 'two-digit' | 'groups' | 'sharing' | 'pattern'
  item?: string
  missingIndex?: number
  step?: number
}

type Rng = () => number

const storyItems = ['apel', 'bintang', 'balok', 'kue', 'kerang', 'koin', 'roket', 'stiker']
const friends = ['Alya', 'Bima', 'Cici', 'Danu', 'Eka', 'Faris']

export function createRng(seed: number): Rng {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

export function makeChallenge(levelId: LevelId, seed: number): Challenge {
  const rng = createRng(seed)
  switch (levelId) {
    case 'count-10':
      return countObjects(rng)
    case 'compare-20':
      return compareNumbers(rng)
    case 'add-10':
      return addition(rng, 2, 8, 10)
    case 'subtract-10':
      return subtraction(rng, 4, 10)
    case 'bonds-10':
      return numberBond(rng, 10)
    case 'add-20':
      return addition(rng, 6, 14, 20, true)
    case 'subtract-20':
      return subtraction(rng, 10, 20)
    case 'place-value':
      return placeValue(rng)
    case 'add-100':
      return twoDigit(rng)
    case 'multiply-groups':
      return multiplicationGroups(rng)
    case 'divide-share':
      return divisionShare(rng)
    case 'pattern-logic':
      return patternLogic(rng)
  }
}

function countObjects(rng: Rng): Challenge {
  const answer = randomInt(rng, 3, 10)
  const item = pick(rng, storyItems)
  return withOptions(rng, {
    prompt: `Berapa banyak ${item} di taman?`,
    expression: `${answer} ${item}`,
    answer,
    visual: [answer],
    hint: 'Hitung satu-satu sampai benda terakhir.',
    strategy: 'Menghitung satu-satu',
    story: `${pick(rng, friends)} sedang mengumpulkan ${item}.`,
    model: 'objects',
    item,
  })
}

function compareNumbers(rng: Rng): Challenge {
  const anchor = randomInt(rng, 4, 16)
  const offsets = shuffle(rng, [0, 1, 2, 3, 4, 5])
  const numbers = new Set<number>(offsets.slice(0, 4).map((offset) => Math.min(20, anchor + offset)))
  while (numbers.size < 4) numbers.add(randomInt(rng, Math.max(4, anchor - 2), Math.min(20, anchor + 5)))
  const options = [...numbers]
  const answer = Math.max(...options)
  return {
    prompt: 'Pilih angka yang paling besar.',
    expression: options.join(', '),
    answer,
    options: shuffle(rng, options),
    visual: options,
    hint: 'Angka yang lebih jauh di garis bilangan punya nilai lebih besar.',
    strategy: 'Membandingkan posisi angka',
    story: 'Empat gerbong membawa jumlah penumpang berbeda.',
    model: 'comparison',
  }
}

function addition(rng: Rng, min: number, max: number, limit: number, makeTen = false): Challenge {
  const a = randomInt(rng, min, max)
  let b = randomInt(rng, 1, limit - a)
  if (makeTen && a < 10) {
    b = randomInt(rng, Math.max(1, 10 - a), Math.min(9, limit - a))
  }
  const item = pick(rng, storyItems)
  return withOptions(rng, {
    prompt: `${pick(rng, friends)} punya ${a} ${item}, lalu mendapat ${b} lagi. Jadi berapa?`,
    expression: `${a} + ${b}`,
    answer: a + b,
    visual: [a, b],
    hint: a < 10 && a + b > 10 ? `${a} perlu ${10 - a} untuk jadi 10, lalu lanjutkan sisanya.` : 'Gabungkan dua kelompok benda.',
    strategy: makeTen ? 'Make ten' : 'Menggabungkan kelompok',
    story: 'Tambah berarti dua kelompok digabung.',
    model: 'objects',
    item,
  })
}

function subtraction(rng: Rng, min: number, max: number): Challenge {
  const start = randomInt(rng, min, max)
  const take = randomInt(rng, 1, start - 1)
  const item = pick(rng, storyItems)
  return withOptions(rng, {
    prompt: `Ada ${start} ${item}. ${take} diberikan ke teman. Sisa berapa?`,
    expression: `${start} - ${take}`,
    answer: start - take,
    visual: [start, -take],
    hint: 'Mulai dari jumlah awal, lalu mundur sebanyak yang diambil.',
    strategy: 'Counting back',
    story: 'Kurang bisa berarti benda diambil dari kelompok awal.',
    model: 'objects',
    item,
  })
}

function numberBond(rng: Rng, target: number): Challenge {
  const known = randomInt(rng, 1, target - 1)
  return withOptions(rng, {
    prompt: `Pasangan berapa yang membuat ${known} menjadi ${target}?`,
    expression: `${known} + ? = ${target}`,
    answer: target - known,
    visual: [known, target - known],
    hint: `Bayangkan bingkai 10. Isi ${known}, lalu cari kotak kosongnya.`,
    strategy: 'Number bond',
    story: 'Pasangan angka membuat hitung cepat terasa ringan.',
    model: 'number-bond',
  })
}

function placeValue(rng: Rng): Challenge {
  const tens = randomInt(rng, 2, 9)
  const ones = randomInt(rng, 0, 9)
  const answer = tens * 10 + ones
  return withOptions(rng, {
    prompt: `${tens} puluhan dan ${ones} satuan menjadi angka berapa?`,
    expression: `${tens} puluhan + ${ones} satuan`,
    answer,
    visual: [tens * 10, ones],
    hint: `${tens} puluhan berarti ${tens * 10}. Tambahkan ${ones} satuan.`,
    strategy: 'Nilai tempat',
    story: 'Balok puluhan dan kubus satuan membentuk bilangan dua digit.',
    model: 'place-value',
  })
}

function twoDigit(rng: Rng): Challenge {
  const addMode = rng() > 0.45
  if (addMode) {
    const a = randomInt(rng, 21, 75)
    const b = randomInt(rng, 10, Math.min(24, 99 - a))
    return withOptions(rng, {
      prompt: `Di pasar ada ${a} koin, lalu datang ${b} koin lagi. Totalnya?`,
      expression: `${a} + ${b}`,
      answer: a + b,
      visual: [a, b],
      hint: 'Tambah puluhan dengan puluhan, satuan dengan satuan.',
      strategy: 'Decomposition',
      story: 'Bilangan dua digit lebih mudah kalau dipecah.',
      model: 'two-digit',
      item: 'koin',
    })
  }
  const a = randomInt(rng, 35, 99)
  const b = randomInt(rng, 10, Math.min(29, a - 5))
  return withOptions(rng, {
    prompt: `Toko punya ${a} stiker. Terjual ${b}. Sisa stiker?`,
    expression: `${a} - ${b}`,
    answer: a - b,
    visual: [a, -b],
    hint: 'Kurangi puluhannya dulu, lalu sesuaikan satuannya.',
    strategy: 'Decomposition',
    story: 'Mengurai angka membantu operasi sampai 100.',
    model: 'two-digit',
    item: 'stiker',
  })
}

function multiplicationGroups(rng: Rng): Challenge {
  const groups = randomInt(rng, 2, 5)
  const each = randomInt(rng, 2, 5)
  const item = pick(rng, storyItems)
  return withOptions(rng, {
    prompt: `Ada ${groups} keranjang. Tiap keranjang berisi ${each} ${item}. Totalnya?`,
    expression: `${groups} x ${each}`,
    answer: groups * each,
    visual: Array.from({ length: groups }, () => each),
    hint: `Hitung ${each} sebanyak ${groups} kali.`,
    strategy: 'Equal groups',
    story: 'Perkalian dimulai dari kelompok sama banyak.',
    model: 'groups',
    item,
  })
}

function divisionShare(rng: Rng): Challenge {
  const people = randomInt(rng, 2, 5)
  const each = randomInt(rng, 2, 5)
  const total = people * each
  return withOptions(rng, {
    prompt: `${total} kue dibagi rata untuk ${people} anak. Masing-masing dapat berapa?`,
    expression: `${total} : ${people}`,
    answer: each,
    visual: [total, people],
    hint: `Bagikan satu-satu ke ${people} anak sampai kue habis.`,
    strategy: 'Berbagi rata',
    story: 'Pembagian berarti semua mendapat jumlah yang adil.',
    model: 'sharing',
    item: 'kue',
  })
}

function patternLogic(rng: Rng): Challenge {
  const start = randomInt(rng, 1, 9)
  const step = randomInt(rng, 2, 5)
  const missingIndex = randomInt(rng, 2, 4)
  const sequence = Array.from({ length: 5 }, (_, index) => start + index * step)
  const answer = sequence[missingIndex]
  const shown = sequence.map((value, index) => (index === missingIndex ? '?' : value)).join(', ')
  return withOptions(rng, {
    prompt: 'Angka apa yang hilang dari pola ini?',
    expression: shown,
    answer,
    visual: sequence,
    hint: `Coba lihat selisih antar angka. Polanya naik ${step}.`,
    strategy: 'Mencari pola',
    story: 'Pola adalah pintu awal menuju soal olimpiade.',
    model: 'pattern',
    missingIndex,
    step,
  })
}

function withOptions(rng: Rng, challenge: Omit<Challenge, 'options'>): Challenge {
  const options = new Set<number>([challenge.answer])
  const offsets = challenge.answer <= 10 ? [-3, -2, -1, 1, 2, 3] : [-10, -5, -2, -1, 1, 2, 5, 10]
  const shuffledOffsets = shuffle(rng, offsets)
  for (const offset of shuffledOffsets) {
    if (options.size >= 4) break
    const candidate = challenge.answer + offset
    if (candidate >= 0) options.add(candidate)
  }
  while (options.size < 4) {
    const candidate = Math.max(0, challenge.answer + randomInt(rng, -3, 3))
    options.add(candidate)
  }
  return { ...challenge, options: shuffle(rng, [...options]) }
}

function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

function pick<T>(rng: Rng, items: T[]): T {
  return items[Math.floor(rng() * items.length)]
}

function shuffle<T>(rng: Rng, items: T[]): T[] {
  return items
    .map((item) => ({ item, sort: rng() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item)
}
