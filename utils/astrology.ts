import { parseDDMMYYYY } from './dateUtils';
import { ZODIAC_KNOWLEDGE, PLANETARY_KNOWLEDGE, HOUSE_KNOWLEDGE, ZodiacSignData } from './astrologyKnowledge';

export interface AstrologyReading {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  traits: string[];
  positivePoints: string[];
  negativePoints: string[];
  remedies: string[];
  pastPredictions: string[];
  futurePredictions: string[];
  luckyNumbers: number[];
  luckyColors: string[];
  compatibility: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  locationInsights: string[];
  detailedAnalysis: {
    sunSignData: ZodiacSignData;
    moonSignData: ZodiacSignData;
    ascendantData: ZodiacSignData;
  };
}

export interface DailyHoroscope {
  mainPrediction: string;
  luckyNumbers: number[];
  luckyColor: string;
  positiveEnergy: string;
  advice: string;
}

export interface WeeklyHoroscope {
  weekStart: string;
  weekEnd: string;
  overview: string;
  highlights: string[];
  luckyDays: string[];
  focusAreas: string[];
}

const zodiacSigns = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Function to get coordinates for Indian places
export const getCoordinatesForPlace = (place: string): { latitude: number; longitude: number } | null => {
  // This is a simplified mapping. In a real app, you'd use a geocoding service
  const placeCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
    'mumbai': { latitude: 19.0760, longitude: 72.8777 },
    'delhi': { latitude: 28.7041, longitude: 77.1025 },
    'bangalore': { latitude: 12.9716, longitude: 77.5946 },
    'hyderabad': { latitude: 17.3850, longitude: 78.4867 },
    'ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
    'chennai': { latitude: 13.0827, longitude: 80.2707 },
    'kolkata': { latitude: 22.5726, longitude: 88.3639 },
    'pune': { latitude: 18.5204, longitude: 73.8567 },
    'jaipur': { latitude: 26.9124, longitude: 75.7873 },
    'lucknow': { latitude: 26.8467, longitude: 80.9462 },
    'kanpur': { latitude: 26.4499, longitude: 80.3319 },
    'nagpur': { latitude: 21.1458, longitude: 79.0882 },
    'indore': { latitude: 22.7196, longitude: 75.8577 },
    'bhopal': { latitude: 23.2599, longitude: 77.4126 },
    'visakhapatnam': { latitude: 17.6868, longitude: 83.2185 },
    'patna': { latitude: 25.5941, longitude: 85.1376 },
    'vadodara': { latitude: 22.3072, longitude: 73.1812 },
    'ludhiana': { latitude: 30.9010, longitude: 75.8573 },
    'agra': { latitude: 27.1767, longitude: 78.0081 },
    'nashik': { latitude: 19.9975, longitude: 73.7898 },
    'faridabad': { latitude: 28.4089, longitude: 77.3178 },
    'meerut': { latitude: 28.9845, longitude: 77.7064 },
    'rajkot': { latitude: 22.3039, longitude: 70.8022 },
    'varanasi': { latitude: 25.3176, longitude: 82.9739 },
    'srinagar': { latitude: 34.0837, longitude: 74.7973 },
    'aurangabad': { latitude: 19.8762, longitude: 75.3433 },
    'amritsar': { latitude: 31.6340, longitude: 74.8723 },
    'ranchi': { latitude: 23.3441, longitude: 85.3096 },
    'coimbatore': { latitude: 11.0168, longitude: 76.9558 },
    'jabalpur': { latitude: 23.1815, longitude: 79.9864 },
    'gwalior': { latitude: 26.2183, longitude: 78.1828 },
    'vijayawada': { latitude: 16.5062, longitude: 80.6480 },
    'jodhpur': { latitude: 26.2389, longitude: 73.0243 },
    'madurai': { latitude: 9.9252, longitude: 78.1198 },
    'raipur': { latitude: 21.2514, longitude: 81.6296 },
    'kota': { latitude: 25.2138, longitude: 75.8648 },
    'chandigarh': { latitude: 30.7333, longitude: 76.7794 },
    'guwahati': { latitude: 26.1445, longitude: 91.7362 },
    'mysore': { latitude: 12.2958, longitude: 76.6394 },
    'bareilly': { latitude: 28.3670, longitude: 79.4304 },
    'aligarh': { latitude: 27.8974, longitude: 78.0880 },
    'jalandhar': { latitude: 31.3260, longitude: 75.5762 },
    'bhubaneswar': { latitude: 20.2961, longitude: 85.8245 },
    'salem': { latitude: 11.6643, longitude: 78.1460 },
    'thiruvananthapuram': { latitude: 8.5241, longitude: 76.9366 },
    'kochi': { latitude: 9.9312, longitude: 76.2673 },
    'dehradun': { latitude: 30.3165, longitude: 78.0322 },
    'shimla': { latitude: 31.1048, longitude: 77.1734 },
    'manali': { latitude: 32.2396, longitude: 77.1887 },
    'rishikesh': { latitude: 30.0869, longitude: 78.2676 },
    'haridwar': { latitude: 29.9457, longitude: 78.1642 },
    'mathura': { latitude: 27.4924, longitude: 77.6737 },
    'vrindavan': { latitude: 27.5706, longitude: 77.7006 },
    'pushkar': { latitude: 26.4899, longitude: 74.5511 },
    'mount abu': { latitude: 24.5925, longitude: 72.7156 },
    'ooty': { latitude: 11.4064, longitude: 76.6932 },
    'kodaikanal': { latitude: 10.2381, longitude: 77.4892 },
    'munnar': { latitude: 10.0889, longitude: 77.0595 },
    'alleppey': { latitude: 9.4981, longitude: 76.3388 },
    'varkala': { latitude: 8.7379, longitude: 76.7160 },
    'hampi': { latitude: 15.3350, longitude: 76.4600 },
    'gokarna': { latitude: 14.5492, longitude: 74.3200 },
    'pondicherry': { latitude: 11.9416, longitude: 79.8083 },
    'mahabalipuram': { latitude: 12.6269, longitude: 80.1927 },
    'khajuraho': { latitude: 24.8318, longitude: 79.9199 },
    'orchha': { latitude: 25.3518, longitude: 78.6407 },
    'sanchi': { latitude: 23.4793, longitude: 77.7398 },
    'ajanta': { latitude: 20.5519, longitude: 75.7033 },
    'ellora': { latitude: 20.0269, longitude: 75.1780 },
    'lonavala': { latitude: 18.7537, longitude: 73.4068 },
    'mahabaleshwar': { latitude: 17.9244, longitude: 73.6544 },
    'panchgani': { latitude: 17.9242, longitude: 73.8017 },
    'matheran': { latitude: 18.9847, longitude: 73.2673 },
    'alibag': { latitude: 18.6414, longitude: 72.8722 },
    'panaji': { latitude: 15.4909, longitude: 73.8278 },
    'margao': { latitude: 15.2993, longitude: 74.1240 },
    'vasco da gama': { latitude: 15.3955, longitude: 73.8157 },
    'mapusa': { latitude: 15.5909, longitude: 73.8087 },
    'calangute': { latitude: 15.5435, longitude: 73.7550 },
    'baga': { latitude: 15.5560, longitude: 73.7516 },
    'anjuna': { latitude: 15.5732, longitude: 73.7395 },
    'arambol': { latitude: 15.6869, longitude: 73.7026 },
    'palolem': { latitude: 15.0100, longitude: 74.0233 },
    'dwarka': { latitude: 22.2394, longitude: 68.9678 },
    'somnath': { latitude: 20.8880, longitude: 70.4017 },
    'palitana': { latitude: 21.5222, longitude: 71.8261 },
    'kutch': { latitude: 23.7337, longitude: 69.8597 },
    'diu': { latitude: 20.7144, longitude: 70.9876 },
    'daman': { latitude: 20.3974, longitude: 72.8328 },
    'silvassa': { latitude: 20.2740, longitude: 72.9962 },
    'gangtok': { latitude: 27.3389, longitude: 88.6065 },
    'pelling': { latitude: 27.2152, longitude: 88.2026 },
    'darjeeling': { latitude: 27.0360, longitude: 88.2627 },
    'kalimpong': { latitude: 27.0584, longitude: 88.4678 },
    'kurseong': { latitude: 26.8808, longitude: 88.2813 },
    'mirik': { latitude: 26.8854, longitude: 88.1781 },
    'digha': { latitude: 21.6281, longitude: 87.5069 },
    'mandarmani': { latitude: 21.6586, longitude: 87.7864 },
    'shantiniketan': { latitude: 23.6793, longitude: 87.6777 },
    'puri': { latitude: 19.8135, longitude: 85.8312 },
    'konark': { latitude: 19.8876, longitude: 86.0943 },
    'chilika': { latitude: 19.7165, longitude: 85.3206 },
    'tirupati': { latitude: 13.6288, longitude: 79.4192 }
  };

  const normalizedPlace = place.toLowerCase().split(',')[0].trim();
  return placeCoordinates[normalizedPlace] || null;
};

// Enhanced sun sign calculation with proper date parsing
export const calculateSunSign = (dateOfBirth: string, timeOfBirth?: string): string => {
  const date = parseDDMMYYYY(dateOfBirth);
  if (!date) {
    console.error('Invalid date format for sun sign calculation:', dateOfBirth);
    return 'Aries'; // Default fallback
  }
  
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Basic sun sign calculation (can be enhanced with time and location for more accuracy)
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
};

// Calculate moon sign based on birth details (simplified calculation)
export const calculateMoonSign = (dateOfBirth: string, placeOfBirth: string): string => {
  const date = parseDDMMYYYY(dateOfBirth);
  if (!date) {
    console.error('Invalid date format for moon sign calculation:', dateOfBirth);
    return 'Cancer'; // Default fallback (Moon rules Cancer)
  }
  
  const coordinates = getCoordinatesForPlace(placeOfBirth);
  
  // Simplified moon sign calculation
  // In a real app, this would use complex astronomical calculations
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const moonCycle = (dayOfYear + (coordinates?.longitude || 0) / 15) % 12;
  
  return zodiacSigns[Math.floor(moonCycle)];
};

// Calculate ascendant (rising sign) based on birth time and location
export const calculateAscendant = (dateOfBirth: string, placeOfBirth: string, timeOfBirth?: string): string => {
  const date = parseDDMMYYYY(dateOfBirth);
  if (!date) {
    console.error('Invalid date format for ascendant calculation:', dateOfBirth);
    return 'Leo'; // Default fallback (Sun rules Leo)
  }
  
  const coordinates = getCoordinatesForPlace(placeOfBirth);
  
  if (!coordinates) {
    // Fallback calculation without coordinates
    const hour = timeOfBirth ? parseInt(timeOfBirth.split(':')[0]) : 6; // Default to 6 AM
    const ascendantIndex = (date.getDate() + hour) % 12;
    return zodiacSigns[ascendantIndex];
  }

  // Simplified ascendant calculation using coordinates
  // In a real app, this would use complex astronomical calculations
  const hour = timeOfBirth ? parseInt(timeOfBirth.split(':')[0]) : 6;
  const localTimeOffset = coordinates.longitude / 15; // Rough time zone calculation
  const adjustedHour = (hour + localTimeOffset) % 24;
  const ascendantIndex = Math.floor((adjustedHour * 12) / 24) % 12;
  
  return zodiacSigns[ascendantIndex];
};

// Enhanced astrology reading with comprehensive knowledge base
export const getAstrologyReading = (dateOfBirth: string, placeOfBirth: string, timeOfBirth?: string): AstrologyReading => {
  const coordinates = getCoordinatesForPlace(placeOfBirth);
  const sunSign = calculateSunSign(dateOfBirth, timeOfBirth);
  const moonSign = calculateMoonSign(dateOfBirth, placeOfBirth);
  const ascendant = calculateAscendant(dateOfBirth, placeOfBirth, timeOfBirth);
  
  // Get detailed data from knowledge base
  const sunSignData = ZODIAC_KNOWLEDGE[sunSign.toLowerCase()];
  const moonSignData = ZODIAC_KNOWLEDGE[moonSign.toLowerCase()];
  const ascendantData = ZODIAC_KNOWLEDGE[ascendant.toLowerCase()];

  // Combine traits from all three signs
  const combinedTraits = [
    `Core Identity (${sunSign}): ${sunSignData?.traits[0] || 'Strong character'}`,
    `Emotional Nature (${moonSign}): ${moonSignData?.traits[1] || 'Deep feelings'}`,
    `Outer Personality (${ascendant}): ${ascendantData?.traits[2] || 'Unique approach'}`
  ];

  // Combine strengths from all three signs
  const combinedStrengths = [
    `Sun in ${sunSign}: ${sunSignData?.strengths[0] || 'Core strength'}`,
    `Moon in ${moonSign}: ${moonSignData?.strengths[1] || 'Emotional strength'}`,
    `${ascendant} Rising: ${ascendantData?.strengths[2] || 'Social strength'}`,
    ...sunSignData?.strengths.slice(3, 5) || []
  ];

  // Combine challenges from all three signs
  const combinedChallenges = [
    `Sun in ${sunSign}: ${sunSignData?.challenges[0] || 'Core challenge'}`,
    `Moon in ${moonSign}: ${moonSignData?.challenges[1] || 'Emotional challenge'}`,
    `${ascendant} Rising: ${ascendantData?.challenges[2] || 'Social challenge'}`,
    ...sunSignData?.challenges.slice(3, 5) || []
  ];

  // Combine remedies from all three signs
  const combinedRemedies = [
    `For ${sunSign} Sun: ${sunSignData?.remedies[0] || 'Practice self-awareness'}`,
    `For ${moonSign} Moon: ${moonSignData?.remedies[1] || 'Balance emotions'}`,
    `For ${ascendant} Rising: ${ascendantData?.remedies[2] || 'Align expression'}`,
    ...sunSignData?.remedies.slice(3, 5) || []
  ];

  // Generate location-based insights
  const locationInsights = coordinates ? getLocationBasedInsights(coordinates) : [];

  // Generate personalized predictions
  const pastPredictions = [
    `Your ${sunSign} nature helped you overcome challenges in the past year`,
    `The influence of ${moonSign} moon brought emotional growth and understanding`,
    `Your ${ascendant} ascendant guided you through important life decisions`,
    `Planetary positions in your birth location favored personal development`
  ];

  const futurePredictions = [
    `The next 6 months will bring opportunities aligned with your ${sunSign} energy`,
    `Your ${moonSign} moon sign indicates positive changes in relationships`,
    `Financial stability will improve through your ${ascendant} rising sign influence`,
    `Career growth is indicated by favorable planetary transits for your location`
  ];

  return {
    sunSign,
    moonSign,
    ascendant,
    traits: combinedTraits,
    positivePoints: combinedStrengths,
    negativePoints: combinedChallenges,
    remedies: combinedRemedies,
    pastPredictions,
    futurePredictions,
    luckyNumbers: sunSignData?.numbers || [1, 7, 14],
    luckyColors: sunSignData?.colors || ['Red', 'Gold'],
    compatibility: sunSignData?.compatibility || [],
    coordinates: coordinates || undefined,
    locationInsights,
    detailedAnalysis: {
      sunSignData: sunSignData || ZODIAC_KNOWLEDGE.aries,
      moonSignData: moonSignData || ZODIAC_KNOWLEDGE.cancer,
      ascendantData: ascendantData || ZODIAC_KNOWLEDGE.leo
    }
  };
};

// Enhanced daily horoscope with detailed sections
export const generateDailyHoroscope = (firstName: string, dateOfBirth: string, placeOfBirth?: string): DailyHoroscope => {
  const sunSign = calculateSunSign(dateOfBirth);
  const coordinates = placeOfBirth ? getCoordinatesForPlace(placeOfBirth) : null;
  const signData = ZODIAC_KNOWLEDGE[sunSign.toLowerCase()];
  
  const mainPredictions = [
    `Today brings wonderful cosmic energy for ${firstName}. Your ${sunSign} nature will shine brightly, attracting positive opportunities and meaningful connections. The planetary alignments favor your natural ${signData?.keywords[0].toLowerCase()} abilities.`,
    `The stars are beautifully aligned for you today, ${firstName}. Your ${sunSign} traits will help you navigate the day with grace and confidence. Focus on ${signData?.keywords[1].toLowerCase()} and ${signData?.keywords[2].toLowerCase()} for maximum benefit.`,
    `${firstName}, your ${sunSign} energy is particularly strong today. The universe supports your endeavors in ${signData?.career[0].toLowerCase()} and personal growth. Trust your instincts and embrace new possibilities.`,
    `A day of positive transformation awaits you, ${firstName}. Your ${sunSign} wisdom will guide you toward beneficial decisions. The cosmic energies favor creativity, relationships, and personal development.`,
    `Today's planetary positions enhance your ${sunSign} strengths, ${firstName}. Expect pleasant surprises and opportunities for growth. Your natural ${signData?.keywords[3].toLowerCase()} will attract abundance and joy.`
  ];

  const positiveEnergies = [
    `Your ${sunSign} charisma is magnetic today, drawing positive people and opportunities into your life.`,
    `The universe amplifies your natural ${signData?.keywords[0].toLowerCase()} abilities, making this an excellent day for new beginnings.`,
    `Cosmic energies support your emotional well-being and strengthen your connections with loved ones.`,
    `Your intuitive powers are heightened, helping you make wise decisions that benefit your future.`,
    `The stars bless you with increased confidence and the ability to manifest your desires.`
  ];

  const advices = [
    `Embrace your ${sunSign} nature and trust in your abilities. The universe is conspiring in your favor today.`,
    `Practice gratitude for the blessings in your life. Your positive energy will attract even more abundance.`,
    `Stay open to new opportunities and connections. Your ${sunSign} charm will open many doors today.`,
    `Focus on activities that bring you joy and align with your natural talents. Success follows passion.`,
    `Trust your instincts and take inspired action. The cosmic timing is perfect for your endeavors.`
  ];

  // Generate today's lucky numbers based on sign and date
  const today = new Date();
  const dayNumber = today.getDate();
  const monthNumber = today.getMonth() + 1;
  const baseLuckyNumbers = signData?.numbers || [1, 7, 14];
  const todaysLuckyNumbers = [
    baseLuckyNumbers[0],
    (dayNumber + baseLuckyNumbers[1]) % 31 + 1,
    (monthNumber + baseLuckyNumbers[2]) % 31 + 1
  ];

  // Select today's lucky color
  const signColors = signData?.colors || ['Gold', 'Red'];
  const colorIndex = dayNumber % signColors.length;
  const todaysLuckyColor = signColors[colorIndex];

  return {
    mainPrediction: mainPredictions[Math.floor(Math.random() * mainPredictions.length)],
    luckyNumbers: todaysLuckyNumbers,
    luckyColor: todaysLuckyColor,
    positiveEnergy: positiveEnergies[Math.floor(Math.random() * positiveEnergies.length)],
    advice: advices[Math.floor(Math.random() * advices.length)]
  };
};

// Generate weekly horoscope
export const generateWeeklyHoroscope = (firstName: string, dateOfBirth: string, placeOfBirth?: string): WeeklyHoroscope => {
  const sunSign = calculateSunSign(dateOfBirth);
  const signData = ZODIAC_KNOWLEDGE[sunSign.toLowerCase()];
  
  // Get current week's Monday and Sunday
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekStart = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEnd = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const weeklyOverviews = [
    `This week brings exceptional opportunities for ${firstName}. Your ${sunSign} energy is perfectly aligned with cosmic forces, creating a harmonious flow of positive events. Expect growth in both personal and professional spheres.`,
    `A transformative week awaits you, ${firstName}. The planetary positions favor your ${sunSign} nature, bringing clarity to important decisions and opening new pathways for success. Your natural ${signData?.keywords[0].toLowerCase()} will be your greatest asset.`,
    `The stars shine favorably upon you this week, ${firstName}. Your ${sunSign} traits will help you navigate challenges with grace and attract meaningful opportunities. Focus on ${signData?.keywords[1].toLowerCase()} and ${signData?.keywords[2].toLowerCase()} for optimal results.`,
    `This week promises to be particularly rewarding for your ${sunSign} spirit, ${firstName}. The universe supports your endeavors and blesses you with increased intuition and positive energy. Trust in your abilities and embrace new possibilities.`
  ];

  const weeklyHighlights = [
    `Career advancement and recognition for your talents`,
    `Strengthening of important relationships and new connections`,
    `Financial opportunities and improved stability`,
    `Creative breakthroughs and artistic inspiration`,
    `Health improvements and increased vitality`,
    `Spiritual growth and deeper self-understanding`
  ];

  const luckyDays = [
    'Tuesday - Perfect for new initiatives',
    'Thursday - Ideal for important communications',
    'Saturday - Excellent for social activities',
    'Sunday - Great for reflection and planning'
  ];

  const focusAreas = [
    `${signData?.career[0]} and professional development`,
    `Relationships and emotional connections`,
    `Health and wellness practices`,
    `Creative expression and artistic pursuits`,
    `Financial planning and investments`,
    `Spiritual growth and meditation`
  ];

  return {
    weekStart,
    weekEnd,
    overview: weeklyOverviews[Math.floor(Math.random() * weeklyOverviews.length)],
    highlights: weeklyHighlights.slice(0, 3),
    luckyDays: luckyDays.slice(0, 2),
    focusAreas: focusAreas.slice(0, 3)
  };
};

// Simple daily horoscope for backward compatibility
export const generateSimpleDailyHoroscope = (firstName: string, dateOfBirth: string, placeOfBirth?: string): string => {
  const dailyHoroscope = generateDailyHoroscope(firstName, dateOfBirth, placeOfBirth);
  return dailyHoroscope.mainPrediction;
};

// Function to get astrological insights based on coordinates
export const getLocationBasedInsights = (coordinates: { latitude: number; longitude: number }): string[] => {
  const insights = [];
  
  // Northern hemisphere insights
  if (coordinates.latitude > 0) {
    insights.push("Being born in the Northern Hemisphere gives you strong connection to solar energies and leadership qualities");
    insights.push("Your birth location favors pioneering spirit and the ability to initiate new projects");
  } else {
    insights.push("Southern Hemisphere birth brings intuitive depth and emotional wisdom");
    insights.push("Your location enhances spiritual abilities and artistic expression");
  }
  
  // Eastern longitude insights
  if (coordinates.longitude > 0) {
    insights.push("Eastern birth coordinates indicate early opportunities and quick manifestation of desires");
    insights.push("Your location supports innovation, forward-thinking, and technological advancement");
  } else {
    insights.push("Western coordinates bring stability, traditional wisdom, and methodical approach");
    insights.push("Your birth location favors patience, long-term planning, and sustainable growth");
  }
  
  // Tropical zone insights (between 23.5°N and 23.5°S)
  if (Math.abs(coordinates.latitude) <= 23.5) {
    insights.push("Tropical birth location enhances creativity, passion, and abundance mindset");
    insights.push("Your coordinates support growth, fertility, and natural healing abilities");
  }
  
  // Specific latitude insights
  if (coordinates.latitude > 30) {
    insights.push("Higher latitude birth enhances mental clarity and philosophical thinking");
  } else if (coordinates.latitude > 15) {
    insights.push("Moderate latitude birth balances material and spiritual pursuits");
  } else {
    insights.push("Lower latitude birth enhances emotional intelligence and intuitive abilities");
  }
  
  return insights;
};

// Get detailed sign information
export const getSignDetails = (signName: string): ZodiacSignData | null => {
  return ZODIAC_KNOWLEDGE[signName.toLowerCase()] || null;
};

// Get planetary information
export const getPlanetaryInfo = (planetName: string) => {
  return (PLANETARY_KNOWLEDGE as Record<string, any>)[planetName.toLowerCase()] || null;
};

// Get house information
export const getHouseInfo = (houseNumber: number) => {
  return (HOUSE_KNOWLEDGE as Record<number, any>)[houseNumber] || null;
};