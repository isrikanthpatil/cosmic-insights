import { parseDDMMYYYY } from './dateUtils';

export interface NumerologyReading {
  birthNumber: number;
  destinyNumber: number;
  kuaNumber: number;
  loshuGrid: number[][];
  birthNumberMeaning: string;
  destinyNumberMeaning: string;
  kuaNumberMeaning: string;
  birthNumberDetail: string;
  destinyNumberDetail: string;
  birthNumberPlanet: string;
  destinyNumberPlanet: string;
  loshuAnalysis: string[];
  luckyNumbers: number[];
  remedies: string[];
  /** Lo Shu numbers (1–9) absent from the grid, in ascending order. */
  missingNumbers: number[];
  gridMeanings: { [key: number]: { element: string; meaning: string; color: string } };
}

// Curated, deterministic remedy per missing Lo Shu number. Rendered as a
// dedicated "Remedies for your missing numbers" section on the Numerology
// screen — no LLM involved.
export const MISSING_NUMBER_REMEDIES: Record<number, string> = {
  1: 'Missing 1 (Sun): build confidence and initiative — greet the sunrise, act decisively, and honour elders; warm reds/oranges support this energy.',
  2: 'Missing 2 (Moon): nurture emotional balance — keep a steady sleep routine, spend time near water, honour your mother, and meditate; white/silver tones help.',
  3: 'Missing 3 (Jupiter): grow knowledge and optimism — read and learn daily, respect teachers, and practice gratitude; yellow tones and Thursdays support this.',
  4: 'Missing 4 (Rahu): create discipline and structure — keep a fixed routine, declutter, and take up steady service or a craft; grounding habits balance this.',
  5: 'Missing 5 (Mercury): strengthen communication and adaptability — practice writing/speaking, stay curious, keep learning; green tones and mindful breathing help.',
  6: 'Missing 6 (Venus): invite harmony and warmth — nurture home and relationships, engage with art or music, and practice kindness; white/pastels support this.',
  7: 'Missing 7 (Ketu): develop introspection and faith — set aside quiet time for meditation or prayer, spend time in nature, and journal; simplicity helps.',
  8: 'Missing 8 (Saturn): build patience and perseverance — commit to consistent work, serve those in need, and practice discipline and honesty; Saturdays support this.',
  9: 'Missing 9 (Mars): channel energy and courage — exercise regularly, act bravely while managing anger, and help the less fortunate; red tones balance this.',
};

export const calculateBirthNumber = (dateOfBirth: string): number => {
  const date = parseDDMMYYYY(dateOfBirth);
  if (!date) {
    console.error('Invalid date format for birth number calculation:', dateOfBirth);
    return 1; // Default fallback
  }
  
  const day = date.getDate();
  
  if (day <= 9) return day;
  
  const sum = day.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  return sum <= 9 ? sum : sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
};

// Destiny Number = Bhagyank in Indian numerology: the sum of the FULL date of
// birth reduced to a single digit. This is date-derived by definition (not a
// misnomer). The name-based number (Namank, Chaldean) is a separate concept and
// is planned as a future addition; firstName/lastName are accepted here for a
// forward-compatible signature but are intentionally not used by Bhagyank.
export const calculateDestinyNumber = (firstName: string, lastName: string, dateOfBirth: string): number => {
  const date = parseDDMMYYYY(dateOfBirth);
  if (!date) {
    console.error('Invalid date format for destiny number calculation:', dateOfBirth);
    return 1; // Default fallback
  }

  // Get all digits from the birth date (DD/MM/YYYY)
  const day = date.getDate();
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const year = date.getFullYear();
  
  // Convert to string and extract all digits
  const dateString = day.toString().padStart(2, '0') + 
                    month.toString().padStart(2, '0') + 
                    year.toString();
  
  // Sum all individual digits
  let sum = 0;
  for (let i = 0; i < dateString.length; i++) {
    sum += parseInt(dateString[i]);
  }
  
  // Reduce to single digit (keep reducing until single digit)
  while (sum > 9) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }

  return sum;
};

export const calculateKuaNumber = (dateOfBirth: string, gender: 'male' | 'female'): { kuaNumber: number } => {
  const date = parseDDMMYYYY(dateOfBirth);
  if (!date) {
    return { kuaNumber: 1 }; // Default fallback for invalid dates
  }

  const year = date.getFullYear();

  // Reduce any number to a single digit (1-9) by repeated digit summing.
  const reduceToSingle = (n: number): number => {
    let x = Math.abs(n);
    while (x > 9) {
      x = String(x).split('').reduce((s, d) => s + Number(d), 0);
    }
    return x;
  };

  // Step 1: sum ALL digits of the birth year, then reduce to a single digit.
  //   e.g. 1978 -> 1+9+7+8 = 25 -> 2+5 = 7
  const yearDigitSum = reduceToSingle(
    String(year).split('').reduce((s, d) => s + Number(d), 0)
  );

  // Step 2/3: gender formulas (each reduced to a single digit).
  //   Male:   11 - yearDigitSum   e.g. 11 - 7 = 4
  //   Female: yearDigitSum + 4    e.g. 7 + 4 = 11 -> 2
  // Note: this method can legitimately yield 5; Kua 5 is kept as-is (no substitution).
  const kuaNumber =
    gender === 'male'
      ? reduceToSingle(11 - yearDigitSum)
      : reduceToSingle(yearDigitSum + 4);

  return { kuaNumber };
};

export const generateLoshuGrid = (dateOfBirth: string, birthNumber: number, destinyNumber: number, kuaNumber?: number): number[][] => {
  const date = parseDDMMYYYY(dateOfBirth);
  if (!date) {
    console.error('Invalid date format for loshu grid generation:', dateOfBirth);
    return [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; // Default empty grid
  }
  
  // Format as DDMMYYYY for loshu grid calculation, ignoring zeros
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  const dateString = day + month + year;
  
  // Initialize grid with the traditional Lo Shu square layout
  // Grid positions: [row][col]
  // 4 9 2
  // 3 5 7  
  // 8 1 6
  const grid = [
    [0, 0, 0], // Row 0: positions for 4, 9, 2
    [0, 0, 0], // Row 1: positions for 3, 5, 7
    [0, 0, 0]  // Row 2: positions for 8, 1, 6
  ];

  // Traditional Lo Shu Grid positions
  const positions = {
    1: [2, 1], // Bottom center
    2: [0, 2], // Top right
    3: [1, 0], // Middle left
    4: [0, 0], // Top left
    5: [1, 1], // Center
    6: [2, 2], // Bottom right
    7: [1, 2], // Middle right
    8: [2, 0], // Bottom left
    9: [0, 1]  // Top center
  };

  // Count occurrences of each digit (ignoring 0)
  dateString.split('').forEach(digit => {
    const num = parseInt(digit);
    if (num > 0 && num <= 9) {
      const [row, col] = positions[num as keyof typeof positions];
      grid[row][col]++;
    }
  });

  // Add birth number to the grid
  if (birthNumber >= 1 && birthNumber <= 9) {
    const [row, col] = positions[birthNumber as keyof typeof positions];
    grid[row][col]++;
  }

  // Add destiny number to the grid
  if (destinyNumber >= 1 && destinyNumber <= 9) {
    const [row, col] = positions[destinyNumber as keyof typeof positions];
    grid[row][col]++;
  }

  // Add Kua number to the grid if provided
  if (kuaNumber && kuaNumber >= 1 && kuaNumber <= 9) {
    const [row, col] = positions[kuaNumber as keyof typeof positions];
    grid[row][col]++;
  }

  return grid;
};

// Per-number knowledge (Indian numerology). Each single-digit number is governed
// by a graha. `summary` is the one-line label shown on the compact card; `detail`
// is the richer reading revealed when the card is expanded.
interface NumberInfo { planet: string; summary: string; detail: string; }
const NUMBER_KNOWLEDGE: Record<number, NumberInfo> = {
  1: {
    planet: 'Sun (Surya)',
    summary: 'Leadership, independence, pioneering spirit',
    detail: 'Ruled by the Sun, number 1 gives strong will, originality and authority — a natural pioneer and leader. Strengths: confidence, initiative and determination. Watch for: ego, dominance and impatience. Well suited to leadership, government, administration and entrepreneurship. Remedy: honour the Sun (Surya Namaskar, offering water at sunrise) and lead with humility.',
  },
  2: {
    planet: 'Moon (Chandra)',
    summary: 'Cooperation, sensitivity, intuition',
    detail: 'Ruled by the Moon, number 2 is gentle, intuitive and diplomatic — a natural peacemaker and partner. Strengths: empathy, cooperation and imagination. Watch for: over-sensitivity, indecision and mood swings. Well suited to counselling, hospitality, caregiving and the arts. Remedy: strengthen the Moon — white clothes and foods on Mondays, and respect for the mother.',
  },
  3: {
    planet: 'Jupiter (Guru)',
    summary: 'Creativity, expression, optimism, wisdom',
    detail: 'Ruled by Jupiter, number 3 is expressive, knowledgeable and optimistic — the teacher and creator. Strengths: communication, generosity and love of learning. Watch for: scattered focus, over-talking and over-confidence. Well suited to teaching, writing, law, advisory roles and the arts. Remedy: respect elders and gurus, wear yellow, and chant Guru mantras on Thursdays.',
  },
  4: {
    planet: 'Rahu',
    summary: 'Discipline, structure, hard work',
    detail: 'Governed by Rahu, number 4 is practical, systematic and unconventional — a builder and reformer. Strengths: reliability, method and endurance. Watch for: stubbornness, sudden ups and downs, and a rebellious streak. Well suited to engineering, technology, real estate and systems work. Remedy: charity to the underprivileged and steady, honest effort.',
  },
  5: {
    planet: 'Mercury (Budha)',
    summary: 'Freedom, communication, adaptability',
    detail: 'Ruled by Mercury, number 5 is versatile, quick-witted and business-minded — youthful and adaptable. Strengths: communication, intellect and resourcefulness. Watch for: restlessness, over-indulgence and inconsistency. Well suited to business, trade, media, writing and technology. Remedy: wear green, chant Budha mantras on Wednesdays, and keep the mind healthily engaged.',
  },
  6: {
    planet: 'Venus (Shukra)',
    summary: 'Love, harmony, beauty, responsibility',
    detail: 'Ruled by Venus, number 6 is caring, artistic and family-oriented, with a love of beauty and comfort. Strengths: harmony, devotion and aesthetic sense. Watch for: over-attachment, indulgence and people-pleasing. Well suited to the arts, design, fashion, hospitality and luxury fields. Remedy: wear white, honour Shukra on Fridays, and cultivate balance in relationships.',
  },
  7: {
    planet: 'Ketu',
    summary: 'Spirituality, introspection, analysis',
    detail: 'Governed by Ketu, number 7 is introspective, analytical and spiritually inclined — a seeker and researcher. Strengths: intuition, depth and independence. Watch for: isolation, over-skepticism and escapism. Well suited to research, spirituality, healing, analysis and philosophy. Remedy: meditation, quiet reflection and Ketu-related spiritual practice.',
  },
  8: {
    planet: 'Saturn (Shani)',
    summary: 'Ambition, discipline, material mastery',
    detail: 'Ruled by Saturn, number 8 is hardworking, patient and just — success comes through perseverance and often after delay, but it lasts. Strengths: discipline, responsibility and endurance. Watch for: struggle, pessimism and rigidity. Well suited to administration, law, finance, mining and long-term ventures. Remedy: serve the needy, honour Shani on Saturdays, and act with fairness.',
  },
  9: {
    planet: 'Mars (Mangala)',
    summary: 'Energy, courage, humanitarian spirit',
    detail: 'Ruled by Mars, number 9 is bold, energetic and protective — a courageous fighter for causes. Strengths: courage, discipline and compassion for others. Watch for: anger, impatience and aggression. Well suited to defence, sports, surgery, engineering and social service. Remedy: worship Hanuman, channel energy through exercise and discipline, and keep anger in check.',
  },
};

const kuaMeanings = {
  1: 'Water element - Flexible, intuitive, flowing nature. Favorable directions: North, South, East, Southeast',
  2: 'Earth element - Stable, nurturing, practical approach. Favorable directions: Southwest, Northwest, West, Northeast',
  3: 'Wood element - Growth-oriented, creative, ambitious. Favorable directions: East, Southeast, North, South',
  4: 'Wood element - Gentle, artistic, harmonious nature. Favorable directions: Southeast, East, South, North',
  5: 'Earth element - Central, balanced, grounding energy. Favorable directions: Center, all directions in moderation',
  6: 'Metal element - Strong-willed, organized, disciplined. Favorable directions: West, Northeast, Southwest, Northwest',
  7: 'Metal element - Communicative, social, adaptable. Favorable directions: Northwest, West, Northeast, Southwest',
  8: 'Earth element - Steady, reliable, mountainous strength. Favorable directions: Northeast, Southwest, Northwest, West',
  9: 'Fire element - Passionate, energetic, illuminating. Favorable directions: South, North, Southeast, East'
};

// Lo Shu Grid meanings based on traditional FEAT Theory ABC
const gridMeanings = {
  1: { element: 'Water', meaning: 'Mental Element - Thinking, planning, intelligence', color: '#4A90E2' },
  2: { element: 'Earth', meaning: 'Emotional Ground - Feelings, relationships, intuition', color: '#8B4513' },
  3: { element: 'Air/Soft Wood', meaning: 'Social Growth - Communication, creativity, expression', color: '#32CD32' },
  4: { element: 'Hard Wood', meaning: 'Stability - Organization, discipline, structure', color: '#228B22' },
  5: { element: 'Earth', meaning: 'Logic, Mercury - Balance, reasoning, center of being', color: '#DAA520' },
  6: { element: 'Yellow Metal/Sky', meaning: 'Luxury, Desire - Material success, beauty, comfort', color: '#FFD700' },
  7: { element: 'White Metal/Sky', meaning: 'Spiritual Energy - Intuition, mysticism, inner wisdom', color: '#C0C0C0' },
  8: { element: 'Earth', meaning: 'Patience, Karma - Endurance, justice, life lessons', color: '#8B4513' },
  9: { element: 'Fire', meaning: 'Confidence, Action - Leadership, courage, achievement', color: '#FF4500' }
};

export const getNumerologyReading = (firstName: string, lastName: string, dateOfBirth: string, gender: 'male' | 'female'): NumerologyReading => {
  const birthNumber = calculateBirthNumber(dateOfBirth);
  const destinyNumber = calculateDestinyNumber(firstName, lastName, dateOfBirth);
  const kuaResult = calculateKuaNumber(dateOfBirth, gender);
  const kuaNumber = kuaResult.kuaNumber;
  const loshuGrid = generateLoshuGrid(dateOfBirth, birthNumber, destinyNumber, kuaNumber);

  const loshuAnalysis = [];
  
  // Traditional Lo Shu Grid layout for analysis
  // 4 9 2
  // 3 5 7  
  // 8 1 6
  
  // Analyze rows (horizontal planes)
  if (loshuGrid[0].every(cell => cell > 0)) {
    loshuAnalysis.push('Top row complete (4-9-2): Mental plane is strong - excellent thinking, confidence, and emotional grounding');
  }
  if (loshuGrid[1].every(cell => cell > 0)) {
    loshuAnalysis.push('Middle row complete (3-5-7): Emotional plane is balanced - good social skills, logic, and spiritual awareness');
  }
  if (loshuGrid[2].every(cell => cell > 0)) {
    loshuAnalysis.push('Bottom row complete (8-1-6): Physical plane is active - strong patience, mental clarity, and material success');
  }

  // Analyze columns (vertical planes)
  if (loshuGrid.every(row => row[0] > 0)) {
    loshuAnalysis.push('Left column complete (4-3-8): Thought process is strong - excellent planning, creativity, and patience');
  }
  if (loshuGrid.every(row => row[1] > 0)) {
    loshuAnalysis.push('Middle column complete (9-5-1): Will power is excellent - strong confidence, logic, and mental clarity');
  }
  if (loshuGrid.every(row => row[2] > 0)) {
    loshuAnalysis.push('Right column complete (2-7-6): Action-oriented personality - excellent emotional grounding, spirituality, and material success');
  }

  // Analyze diagonals
  if (loshuGrid[0][0] > 0 && loshuGrid[1][1] > 0 && loshuGrid[2][2] > 0) {
    loshuAnalysis.push('Main diagonal complete (4-5-6): Material success path - good balance between stability, logic, and luxury');
  }
  if (loshuGrid[0][2] > 0 && loshuGrid[1][1] > 0 && loshuGrid[2][0] > 0) {
    loshuAnalysis.push('Secondary diagonal complete (2-5-8): Spiritual wisdom path - excellent emotional grounding, logic, and patience');
  }

  // Check for missing numbers and their significance
  const missingNumbers: number[] = [];
  const gridNumbers = [4, 9, 2, 3, 5, 7, 8, 1, 6]; // Traditional Lo Shu order
  const gridPositions = [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2]
  ];

  gridNumbers.forEach((num, index) => {
    const [row, col] = gridPositions[index];
    if (loshuGrid[row][col] === 0) {
      missingNumbers.push(num);
    }
  });

  if (missingNumbers.length > 0) {
    const missingMeanings = missingNumbers.map(num => `${num} (${(gridMeanings as Record<number, { element: string; meaning: string; color: string }>)[num].meaning})`);
    loshuAnalysis.push(`Missing numbers: ${missingNumbers.join(', ')} - Areas needing development: ${missingMeanings.join(', ')}`);
  }

  // Check for repeated numbers (strong areas)
  const repeatedNumbers: string[] = [];
  gridNumbers.forEach((num, index) => {
    const [row, col] = gridPositions[index];
    if (loshuGrid[row][col] > 1) {
      repeatedNumbers.push(`${num} (${loshuGrid[row][col]} times)`);
    }
  });

  if (repeatedNumbers.length > 0) {
    loshuAnalysis.push(`Strong numbers: ${repeatedNumbers.join(', ')} - These are your dominant traits and natural strengths`);
  }

  loshuAnalysis.push(`Kua Number ${kuaNumber} influence: ${kuaMeanings[kuaNumber as keyof typeof kuaMeanings] || 'Unique energy pattern'} - This number enhances your personal energy and directional guidance.`);

  return {
    birthNumber,
    destinyNumber,
    kuaNumber,
    loshuGrid,
    birthNumberMeaning: NUMBER_KNOWLEDGE[birthNumber]?.summary ?? '',
    destinyNumberMeaning: NUMBER_KNOWLEDGE[destinyNumber]?.summary ?? '',
    birthNumberDetail: NUMBER_KNOWLEDGE[birthNumber]?.detail ?? '',
    destinyNumberDetail: NUMBER_KNOWLEDGE[destinyNumber]?.detail ?? '',
    birthNumberPlanet: NUMBER_KNOWLEDGE[birthNumber]?.planet ?? '',
    destinyNumberPlanet: NUMBER_KNOWLEDGE[destinyNumber]?.planet ?? '',
    kuaNumberMeaning: kuaMeanings[kuaNumber as keyof typeof kuaMeanings] || 'Unique energy pattern',
    loshuAnalysis,
    luckyNumbers: generateUniqueLuckyNumbers(birthNumber, destinyNumber, kuaNumber),
    missingNumbers: [...missingNumbers].sort((a, b) => a - b),
    gridMeanings,
    remedies: [
      `Strengthen birth number ${birthNumber} energy through meditation and positive affirmations`,
      `Enhance destiny number ${destinyNumber} qualities in daily life and career choices`,
      `Use Kua number ${kuaNumber} favorable directions for important activities and sleeping`,
      'Practice gratitude and maintain positive thoughts to attract abundance',
      'Wear gemstones and colors associated with your lucky numbers',
      'For missing numbers, practice activities that develop those qualities',
      'Chant mantras during early morning hours for spiritual growth'
    ]
  };
};

// Helper function to generate unique lucky numbers
const generateUniqueLuckyNumbers = (birthNumber: number, destinyNumber: number, kuaNumber: number): number[] => {
  const numbers = [birthNumber, destinyNumber, kuaNumber];
  
  // Remove duplicates using Set
  const uniqueNumbers = Array.from(new Set(numbers));
  
  // If we have fewer than 3 unique numbers, add some derived numbers
  if (uniqueNumbers.length < 3) {
    const additionalNumbers = [];
    
    // Add sum of birth and destiny numbers (reduced to single digit)
    const sumNumber = ((birthNumber + destinyNumber - 1) % 9) + 1;
    if (!uniqueNumbers.includes(sumNumber)) {
      additionalNumbers.push(sumNumber);
    }
    
    // Add difference of birth and destiny numbers (absolute value, reduced to single digit)
    const diffNumber = ((Math.abs(birthNumber - destinyNumber) || 9) - 1) % 9 + 1;
    if (!uniqueNumbers.includes(diffNumber) && !additionalNumbers.includes(diffNumber)) {
      additionalNumbers.push(diffNumber);
    }
    
    // Add product of birth and destiny numbers (reduced to single digit)
    const productNumber = ((birthNumber * destinyNumber - 1) % 9) + 1;
    if (!uniqueNumbers.includes(productNumber) && !additionalNumbers.includes(productNumber)) {
      additionalNumbers.push(productNumber);
    }
    
    // Add the additional numbers to make up to 3 total
    uniqueNumbers.push(...additionalNumbers.slice(0, 3 - uniqueNumbers.length));
  }
  
  // Return only the first 3 unique numbers
  return uniqueNumbers.slice(0, 3);
};