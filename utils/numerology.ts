import { parseDDMMYYYY } from './dateUtils';

export interface NumerologyReading {
  birthNumber: number;
  destinyNumber: number;
  kuaNumber: number;
  originalKuaNumber?: number; // Store original before conversion
  loshuGrid: number[][];
  birthNumberMeaning: string;
  destinyNumberMeaning: string;
  kuaNumberMeaning: string;
  loshuAnalysis: string[];
  luckyNumbers: number[];
  remedies: string[];
  gridMeanings: { [key: number]: { element: string; meaning: string; color: string } };
}

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

export const calculateKuaNumber = (dateOfBirth: string, gender: 'male' | 'female'): { kuaNumber: number; originalKuaNumber?: number } => {
  const date = parseDDMMYYYY(dateOfBirth);
  if (!date) {
    console.error('Invalid date format for kua number calculation:', dateOfBirth);
    return { kuaNumber: 1 }; // Default fallback
  }
  
  const year = date.getFullYear();
  console.log('🔢 KUA CALCULATION DEBUG:');
  console.log('📅 Birth Year:', year);
  console.log('👤 Gender:', gender);
  
  // Step 1: Take the last two digits of birth year
  const lastTwoDigits = year % 100;
  const tensDigit = Math.floor(lastTwoDigits / 10);
  const unitsDigit = lastTwoDigits % 10;
  
  console.log('🔢 Last two digits:', lastTwoDigits, '(', tensDigit, '+', unitsDigit, ')');
  
  // Add them together
  let sum = tensDigit + unitsDigit;
  console.log('➕ Initial sum:', sum);
  
  // Step 1 continued: If double-digit, add digits again to get single digit
  while (sum > 9) {
    const originalSum = sum;
    const sumStr = sum.toString();
    sum = parseInt(sumStr[0]) + parseInt(sumStr[1]);
    console.log('🔄 Reducing:', originalSum, '→', sum);
  }
  
  console.log('✅ Final single digit:', sum);
  
  let kuaNumber;
  let originalKuaNumber;
  
  if (gender === 'male') {
    console.log('👨 MALE CALCULATION:');
    // Step 3: For males - subtract from 10
    kuaNumber = 10 - sum;
    console.log('🧮 10 -', sum, '=', kuaNumber);
    
    // Handle special case: if result is 0, it becomes 9
    if (kuaNumber === 0) {
      kuaNumber = 9;
      console.log('⚠️ Adjusted 0 → 9');
    }
    // Handle special case: if result is 10, it becomes 1
    if (kuaNumber === 10) {
      kuaNumber = 1;
      console.log('⚠️ Adjusted 10 → 1');
    }
    
    // Kua 5 Rule: Since Kua 5 doesn't exist in traditional Feng Shui, for males it becomes Kua 2
    if (kuaNumber === 5) {
      originalKuaNumber = 5;
      kuaNumber = 2;
      console.log('🔄 Kua 5 Rule Applied: Male Kua 5 → Kua 2');
    }
  } else {
    console.log('👩 FEMALE CALCULATION:');
    // Step 2: For females - add 5
    kuaNumber = sum + 5;
    console.log('🧮', sum, '+ 5 =', kuaNumber);
    
    // If result is double-digit, add digits again
    while (kuaNumber > 9) {
      const originalKua = kuaNumber;
      const kuaStr = kuaNumber.toString();
      kuaNumber = parseInt(kuaStr[0]) + parseInt(kuaStr[1]);
      console.log('🔄 Reducing:', originalKua, '→', kuaNumber);
    }
    
    // Kua 5 Rule: Since Kua 5 doesn't exist in traditional Feng Shui, for females it becomes Kua 8
    if (kuaNumber === 5) {
      originalKuaNumber = 5;
      kuaNumber = 8;
      console.log('🔄 Kua 5 Rule Applied: Female Kua 5 → Kua 8');
    }
  }
  
  console.log('🏆 FINAL KUA NUMBER:', kuaNumber);
  if (originalKuaNumber) {
    console.log('📝 ORIGINAL KUA NUMBER:', originalKuaNumber, '(converted due to Kua 5 rule)');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return { kuaNumber, originalKuaNumber };
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

const numberMeanings = {
  1: 'Leadership, independence, pioneering spirit',
  2: 'Cooperation, diplomacy, sensitivity',
  3: 'Creativity, communication, optimism',
  4: 'Stability, practicality, hard work',
  5: 'Freedom, adventure, versatility',
  6: 'Nurturing, responsibility, harmony',
  7: 'Spirituality, introspection, analysis',
  8: 'Material success, ambition, authority',
  9: 'Humanitarian, generous, completion'
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
  console.log('🎯 Getting numerology reading for:', { firstName, lastName, dateOfBirth, gender });
  
  const birthNumber = calculateBirthNumber(dateOfBirth);
  const destinyNumber = calculateDestinyNumber(firstName, lastName, dateOfBirth);
  const kuaResult = calculateKuaNumber(dateOfBirth, gender);
  const kuaNumber = kuaResult.kuaNumber;
  const originalKuaNumber = kuaResult.originalKuaNumber;
  const loshuGrid = generateLoshuGrid(dateOfBirth, birthNumber, destinyNumber, kuaNumber);

  console.log('📊 Final calculated numbers:', { birthNumber, destinyNumber, kuaNumber, originalKuaNumber });

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

  // Add Kua number analysis with conversion information
  if (originalKuaNumber) {
    loshuAnalysis.push(`Kua Number Conversion: Your calculated Kua number was ${originalKuaNumber}, but according to traditional Feng Shui, Kua 5 doesn't exist. For ${gender}s, Kua 5 becomes Kua ${kuaNumber}. This converted number has been added to your Lo Shu Grid.`);
  }
  
  loshuAnalysis.push(`Kua Number ${kuaNumber} influence: ${kuaMeanings[kuaNumber as keyof typeof kuaMeanings] || 'Unique energy pattern'} - This number enhances your personal energy and directional guidance.`);

  return {
    birthNumber,
    destinyNumber,
    kuaNumber,
    originalKuaNumber,
    loshuGrid,
    birthNumberMeaning: numberMeanings[birthNumber as keyof typeof numberMeanings],
    destinyNumberMeaning: numberMeanings[destinyNumber as keyof typeof numberMeanings],
    kuaNumberMeaning: kuaMeanings[kuaNumber as keyof typeof kuaMeanings] || 'Unique energy pattern',
    loshuAnalysis,
    luckyNumbers: generateUniqueLuckyNumbers(birthNumber, destinyNumber, kuaNumber),
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