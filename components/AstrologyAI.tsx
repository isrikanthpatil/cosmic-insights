import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Send, Sparkles, Book } from 'lucide-react-native';
import { calculateSunSign, calculateMoonSign, calculateAscendant, getCoordinatesForPlace, getLocationBasedInsights } from '@/utils/astrology';
import { sanitizeInput, securityMonitor, rateLimiter } from '@/utils/security';
import { pb } from '@/utils/pocketbase';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AstrologyAIProps {
  userProfile?: {
    firstName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    timeOfBirth?: string;
  };
}

export default function AstrologyAI({ userProfile }: AstrologyAIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm AskAstro, your personal astrology guide. I can answer questions about astrology, zodiac signs, planetary influences, and provide insights based on ancient astrological wisdom. I can also provide personalized readings based on your birth details. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs for the typewriter reveal: the active interval timer and the
  // ScrollView so we can keep the view pinned to the bottom as text grows.
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);

  // Clean up any in-flight typing interval on unmount to avoid
  // state-update-after-unmount warnings.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

  // Appends an assistant message with empty text, then progressively fills its
  // `text` field word-by-word via setInterval until the full reply is shown.
  const revealAssistantMessage = (fullText: string) => {
    const messageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: messageId,
      text: '',
      isUser: false,
      timestamp: new Date(),
    };

    // Stop the loader and show the (empty) bubble immediately.
    setIsLoading(false);
    setMessages(prev => [...prev, aiMessage]);

    // Split into words while preserving the whitespace between them so the
    // reassembled text matches the original exactly.
    const tokens = fullText.match(/\S+\s*/g) ?? [fullText];
    let index = 0;

    // Clear any previous reveal still running.
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    typingIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        return;
      }

      index += 1;
      const partial = tokens.slice(0, index).join('');
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, text: partial } : m))
      );

      if (index >= tokens.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      }
    }, 35);
  };

  // Enhanced astrology knowledge base with coordinate-based insights
  const astrologyKnowledge = {
    zodiacSigns: {
      aries: {
        dates: "March 21 - April 19",
        element: "Fire",
        quality: "Cardinal",
        ruler: "Mars",
        symbol: "The Ram",
        traits: "Energetic, pioneering, courageous, independent, competitive, leadership-oriented",
        strengths: "Natural leadership, enthusiasm, courage, determination, honesty, passion",
        challenges: "Impatience, impulsiveness, aggression, selfishness, short temper, lack of persistence",
        compatibility: "Leo, Sagittarius, Gemini, Aquarius",
        career: "Military, sports, entrepreneurship, emergency services, leadership roles",
        health: "Head, brain, eyes - prone to headaches and accidents, high energy needs exercise",
        remedies: "Wear red coral on Tuesday, chant Hanuman Chalisa, practice meditation for patience"
      },
      taurus: {
        dates: "April 20 - May 20",
        element: "Earth",
        quality: "Fixed",
        ruler: "Venus",
        symbol: "The Bull",
        traits: "Stable, practical, reliable, sensual, stubborn, patient, artistic",
        strengths: "Patience, reliability, devotion, responsibility, stability, artistic sense",
        challenges: "Stubbornness, possessiveness, materialism, resistance to change, laziness",
        compatibility: "Virgo, Capricorn, Cancer, Pisces",
        career: "Banking, agriculture, arts, luxury goods, real estate, cooking",
        health: "Neck, throat, thyroid - watch for throat issues and weight gain",
        remedies: "Wear white pearl on Friday, offer white flowers to Venus, practice yoga"
      },
      gemini: {
        dates: "May 21 - June 20",
        element: "Air",
        quality: "Mutable",
        ruler: "Mercury",
        symbol: "The Twins",
        traits: "Communicative, versatile, curious, adaptable, intellectual, social",
        strengths: "Intelligence, wit, adaptability, communication, versatility, charm",
        challenges: "Inconsistency, superficiality, nervousness, indecision, restlessness",
        compatibility: "Libra, Aquarius, Aries, Leo",
        career: "Media, writing, teaching, sales, technology, journalism, translation",
        health: "Lungs, arms, hands - respiratory issues possible, nervous system sensitivity",
        remedies: "Wear emerald on Wednesday, chant Mercury mantras, practice breathing exercises"
      },
      cancer: {
        dates: "June 21 - July 22",
        element: "Water",
        quality: "Cardinal",
        ruler: "Moon",
        symbol: "The Crab",
        traits: "Emotional, nurturing, intuitive, protective, caring, traditional",
        strengths: "Empathy, loyalty, intuition, tenacity, protective nature, emotional depth",
        challenges: "Moodiness, over-sensitivity, clinginess, pessimism, holding grudges",
        compatibility: "Scorpio, Pisces, Taurus, Virgo",
        career: "Healthcare, hospitality, real estate, childcare, psychology, cooking",
        health: "Stomach, breasts, digestive system - emotional eating, digestive issues",
        remedies: "Wear pearl on Monday, offer milk to Shiva, spend time near water"
      },
      leo: {
        dates: "July 23 - August 22",
        element: "Fire",
        quality: "Fixed",
        ruler: "Sun",
        symbol: "The Lion",
        traits: "Confident, generous, dramatic, creative, charismatic, proud",
        strengths: "Leadership, creativity, generosity, warmth, confidence, inspiration",
        challenges: "Arrogance, stubbornness, self-centeredness, attention-seeking, domination",
        compatibility: "Aries, Sagittarius, Gemini, Libra",
        career: "Entertainment, politics, management, arts, teaching, luxury brands",
        health: "Heart, spine, back - cardiovascular health important, watch for back problems",
        remedies: "Wear ruby on Sunday, offer water to Sun, practice humility"
      },
      virgo: {
        dates: "August 23 - September 22",
        element: "Earth",
        quality: "Mutable",
        ruler: "Mercury",
        symbol: "The Virgin",
        traits: "Analytical, practical, perfectionist, helpful, organized, detail-oriented",
        strengths: "Organization, reliability, analytical skills, helpfulness, precision",
        challenges: "Criticism, worry, perfectionism, overthinking, judgmental attitude",
        compatibility: "Taurus, Capricorn, Cancer, Scorpio",
        career: "Healthcare, research, accounting, service industries, editing, analysis",
        health: "Digestive system, intestines - diet important, stress-related issues",
        remedies: "Wear emerald on Wednesday, serve the needy, practice acceptance"
      },
      libra: {
        dates: "September 23 - October 22",
        element: "Air",
        quality: "Cardinal",
        ruler: "Venus",
        symbol: "The Scales",
        traits: "Diplomatic, harmonious, social, indecisive, artistic, balanced",
        strengths: "Diplomacy, fairness, social skills, aesthetics, peace-making, charm",
        challenges: "Indecisiveness, superficiality, dependency, avoidance, people-pleasing",
        compatibility: "Gemini, Aquarius, Leo, Sagittarius",
        career: "Law, diplomacy, arts, fashion, counseling, design, mediation",
        health: "Kidneys, lower back, skin - balance important, kidney function",
        remedies: "Wear diamond on Friday, maintain life balance, practice decision-making"
      },
      scorpio: {
        dates: "October 23 - November 21",
        element: "Water",
        quality: "Fixed",
        ruler: "Mars/Pluto",
        symbol: "The Scorpion",
        traits: "Intense, passionate, mysterious, transformative, determined, intuitive",
        strengths: "Determination, passion, intuition, resourcefulness, loyalty, transformation",
        challenges: "Jealousy, secrecy, vindictiveness, obsession, suspicion, control",
        compatibility: "Cancer, Pisces, Virgo, Capricorn",
        career: "Psychology, investigation, surgery, research, occult sciences, transformation",
        health: "Reproductive organs, elimination system - detoxification important",
        remedies: "Wear red coral on Tuesday, practice forgiveness, channel intensity positively"
      },
      sagittarius: {
        dates: "November 22 - December 21",
        element: "Fire",
        quality: "Mutable",
        ruler: "Jupiter",
        symbol: "The Archer",
        traits: "Adventurous, philosophical, optimistic, freedom-loving, honest, enthusiastic",
        strengths: "Optimism, honesty, adventurous spirit, philosophy, teaching, inspiration",
        challenges: "Restlessness, tactlessness, over-confidence, impatience, commitment issues",
        compatibility: "Aries, Leo, Libra, Aquarius",
        career: "Travel, education, publishing, sports, philosophy, international business",
        health: "Hips, thighs, liver - watch for excess, need for physical activity",
        remedies: "Wear yellow sapphire on Thursday, study spiritual texts, practice patience"
      },
      capricorn: {
        dates: "December 22 - January 19",
        element: "Earth",
        quality: "Cardinal",
        ruler: "Saturn",
        symbol: "The Goat",
        traits: "Ambitious, disciplined, practical, responsible, patient, traditional",
        strengths: "Discipline, responsibility, ambition, patience, practical thinking, work ethic",
        challenges: "Pessimism, rigidity, materialism, workaholism, lack of spontaneity",
        compatibility: "Taurus, Virgo, Scorpio, Pisces",
        career: "Business, government, engineering, management, finance, administration",
        health: "Bones, joints, skin - skeletal system, need for calcium and vitamin D",
        remedies: "Wear blue sapphire on Saturday, balance work and life, practice optimism"
      },
      aquarius: {
        dates: "January 20 - February 18",
        element: "Air",
        quality: "Fixed",
        ruler: "Saturn/Uranus",
        symbol: "The Water Bearer",
        traits: "Independent, innovative, humanitarian, eccentric, progressive, intellectual",
        strengths: "Originality, independence, humanitarianism, innovation, friendship, vision",
        challenges: "Detachment, unpredictability, stubbornness, rebellion, aloofness",
        compatibility: "Gemini, Libra, Aries, Sagittarius",
        career: "Technology, social work, science, aviation, innovation, humanitarian work",
        health: "Circulatory system, ankles, calves - circulation important, varicose veins",
        remedies: "Help humanitarian causes, practice emotional connection, meditate regularly"
      },
      pisces: {
        dates: "February 19 - March 20",
        element: "Water",
        quality: "Mutable",
        ruler: "Jupiter/Neptune",
        symbol: "The Fish",
        traits: "Intuitive, compassionate, artistic, dreamy, spiritual, empathetic",
        strengths: "Compassion, intuition, artistic ability, spirituality, empathy, imagination",
        challenges: "Escapism, over-sensitivity, confusion, lack of boundaries, gullibility",
        compatibility: "Cancer, Scorpio, Taurus, Capricorn",
        career: "Arts, healing, spirituality, charity work, psychology, music, film",
        health: "Feet, immune system - avoid escapist behaviors, strengthen immunity",
        remedies: "Wear yellow sapphire on Thursday, set clear boundaries, practice grounding"
      }
    },
    planets: {
      sun: "Represents ego, identity, vitality, and life force. Rules Leo. Shows your core self and life purpose.",
      moon: "Represents emotions, instincts, subconscious, and nurturing. Rules Cancer. Shows your emotional nature.",
      mercury: "Represents communication, intellect, and reasoning. Rules Gemini and Virgo. Shows how you think and communicate.",
      venus: "Represents love, beauty, harmony, and values. Rules Taurus and Libra. Shows what you value and how you love.",
      mars: "Represents energy, action, desire, and aggression. Rules Aries and Scorpio. Shows how you assert yourself.",
      jupiter: "Represents expansion, wisdom, luck, and philosophy. Rules Sagittarius and Pisces. Shows growth and opportunities.",
      saturn: "Represents discipline, responsibility, limitations, and lessons. Rules Capricorn and Aquarius. Shows life lessons.",
      uranus: "Represents innovation, rebellion, and sudden changes. Co-rules Aquarius. Shows where you're unique.",
      neptune: "Represents spirituality, dreams, and illusions. Co-rules Pisces. Shows spiritual and creative inspiration.",
      pluto: "Represents transformation, power, and regeneration. Co-rules Scorpio. Shows deep transformation."
    },
    houses: {
      first: "Self, appearance, first impressions, new beginnings, personality, physical body",
      second: "Money, possessions, values, self-worth, material security, talents",
      third: "Communication, siblings, short trips, learning, neighbors, daily activities",
      fourth: "Home, family, roots, emotional foundation, mother, private life",
      fifth: "Creativity, romance, children, self-expression, hobbies, speculation",
      sixth: "Health, work, daily routines, service, pets, employees",
      seventh: "Partnerships, marriage, open enemies, cooperation, contracts",
      eighth: "Transformation, shared resources, death, rebirth, occult, inheritance",
      ninth: "Philosophy, higher education, long journeys, spirituality, publishing, law",
      tenth: "Career, reputation, authority, public image, father, achievements",
      eleventh: "Friends, groups, hopes, wishes, humanitarian causes, social networks",
      twelfth: "Subconscious, spirituality, hidden enemies, sacrifice, karma, past lives"
    },
    aspects: {
      conjunction: "0° - Planets blend energies, intensification, new beginnings",
      sextile: "60° - Harmonious, opportunities, talents, easy flow of energy",
      square: "90° - Tension, challenges, growth through conflict, dynamic energy",
      trine: "120° - Harmony, ease, natural talents, flowing energy",
      opposition: "180° - Polarity, awareness, balance needed, projection"
    }
  };

  const generateResponse = (question: string): string => {
    // Security: Sanitize input question
    const sanitizedQuestion = sanitizeInput.text(question);
    if (sanitizedQuestion !== question) {
      securityMonitor.logSuspiciousActivity('Potentially malicious input in astrology AI', {
        originalLength: question.length,
        sanitizedLength: sanitizedQuestion.length
      });
    }
    
    const lowerQuestion = question.toLowerCase();
    
    // Personalized responses if user profile is available
    if (userProfile) {
      const userSunSign = calculateSunSign(userProfile.dateOfBirth);
      const userMoonSign = calculateMoonSign(userProfile.dateOfBirth, userProfile.placeOfBirth);
      const userAscendant = calculateAscendant(userProfile.dateOfBirth, userProfile.placeOfBirth, userProfile.timeOfBirth);
      const coordinates = getCoordinatesForPlace(userProfile.placeOfBirth);
      
      // Personal chart questions
      if (lowerQuestion.includes('my chart') || lowerQuestion.includes('my birth chart')) {
        return `${userProfile.firstName}, your birth chart shows:\n\n🌞 Sun Sign: ${userSunSign} - Your core identity and life purpose\n🌙 Moon Sign: ${userMoonSign} - Your emotional nature and instincts\n⬆️ Ascendant: ${userAscendant} - How others see you and your approach to life\n\n${coordinates ? `Your birth coordinates (${coordinates.latitude.toFixed(2)}°, ${coordinates.longitude.toFixed(2)}°) add unique influences to your chart.` : 'Your birth location adds special influences to your cosmic blueprint.'}`;
      }
      
      if (lowerQuestion.includes('my sun sign') || lowerQuestion.includes('my zodiac')) {
        const signData = astrologyKnowledge.zodiacSigns[userSunSign.toLowerCase() as keyof typeof astrologyKnowledge.zodiacSigns];
        if (signData) {
          return `${userProfile.firstName}, your Sun sign is ${userSunSign}! ${signData.traits}. Your strengths include ${signData.strengths}, and areas for growth include ${signData.challenges}.`;
        }
      }
      
      if (lowerQuestion.includes('my moon sign')) {
        const signData = astrologyKnowledge.zodiacSigns[userMoonSign.toLowerCase() as keyof typeof astrologyKnowledge.zodiacSigns];
        if (signData) {
          return `Your Moon sign is ${userMoonSign}, ${userProfile.firstName}. This governs your emotional nature and shows that ${signData.traits.split(',')[0]} and ${signData.traits.split(',')[1]} are key aspects of your inner self.`;
        }
      }
      
      if (lowerQuestion.includes('my ascendant') || lowerQuestion.includes('my rising')) {
        const signData = astrologyKnowledge.zodiacSigns[userAscendant.toLowerCase() as keyof typeof astrologyKnowledge.zodiacSigns];
        if (signData) {
          return `Your Ascendant (Rising sign) is ${userAscendant}, ${userProfile.firstName}. This means others see you as ${signData.traits.split(',')[0]} and ${signData.traits.split(',')[1]}. It's your mask to the world and how you approach new situations.`;
        }
      }
      
      if (lowerQuestion.includes('my compatibility') || lowerQuestion.includes('relationship')) {
        const signData = astrologyKnowledge.zodiacSigns[userSunSign.toLowerCase() as keyof typeof astrologyKnowledge.zodiacSigns];
        if (signData) {
          return `${userProfile.firstName}, as a ${userSunSign}, you're most compatible with: ${signData.compatibility}. Your ${userMoonSign} Moon adds emotional compatibility with water and earth signs, while your ${userAscendant} Ascendant influences first impressions in relationships.`;
        }
      }
      
      if (lowerQuestion.includes('my career') || lowerQuestion.includes('profession')) {
        const signData = astrologyKnowledge.zodiacSigns[userSunSign.toLowerCase() as keyof typeof astrologyKnowledge.zodiacSigns];
        if (signData) {
          return `Career paths that suit your ${userSunSign} nature, ${userProfile.firstName}: ${signData.career}. Your ${userMoonSign} Moon suggests you need emotional fulfillment in work, while your ${userAscendant} Ascendant shows how you present professionally.`;
        }
      }
      
      if (lowerQuestion.includes('my health')) {
        const signData = astrologyKnowledge.zodiacSigns[userSunSign.toLowerCase() as keyof typeof astrologyKnowledge.zodiacSigns];
        if (signData) {
          return `Health considerations for your ${userSunSign} constitution, ${userProfile.firstName}: ${signData.health}. Your ${userMoonSign} Moon affects emotional health, and your birth location's coordinates may influence your circadian rhythms and energy patterns.`;
        }
      }
      
      if (lowerQuestion.includes('my remedies') || lowerQuestion.includes('suggestions')) {
        const signData = astrologyKnowledge.zodiacSigns[userSunSign.toLowerCase() as keyof typeof astrologyKnowledge.zodiacSigns];
        if (signData) {
          return `Personalized remedies for you, ${userProfile.firstName}: ${signData.remedies}. Based on your birth coordinates, spending time in nature and aligning with your local sunrise/sunset times will enhance your cosmic connection.`;
        }
      }
      
      if (coordinates && (lowerQuestion.includes('location') || lowerQuestion.includes('coordinates') || lowerQuestion.includes('birthplace'))) {
        const insights = getLocationBasedInsights(coordinates);
        return `Your birth location (${userProfile.placeOfBirth}) at coordinates ${coordinates.latitude.toFixed(2)}°N, ${coordinates.longitude.toFixed(2)}°E brings special influences:\n\n${insights.join('\n\n')}`;
      }
    }
    
    // Check for zodiac sign questions
    for (const [sign, data] of Object.entries(astrologyKnowledge.zodiacSigns)) {
      if (lowerQuestion.includes(sign)) {
        if (lowerQuestion.includes('trait') || lowerQuestion.includes('personality')) {
          return `${sign.charAt(0).toUpperCase() + sign.slice(1)} (${data.dates}) is a ${data.element} sign ruled by ${data.ruler}. Key traits include: ${data.traits}. Strengths: ${data.strengths}. Areas for growth: ${data.challenges}.`;
        }
        if (lowerQuestion.includes('compatibility') || lowerQuestion.includes('relationship')) {
          return `${sign.charAt(0).toUpperCase() + sign.slice(1)} is most compatible with: ${data.compatibility}. This ${data.element} sign works well with complementary elements and qualities.`;
        }
        if (lowerQuestion.includes('career') || lowerQuestion.includes('work')) {
          return `Career paths that suit ${sign.charAt(0).toUpperCase() + sign.slice(1)}: ${data.career}. This ${data.quality} ${data.element} sign thrives in environments that match their natural energy.`;
        }
        if (lowerQuestion.includes('health')) {
          return `Health considerations for ${sign.charAt(0).toUpperCase() + sign.slice(1)}: ${data.health}. As a ${data.element} sign, maintaining balance in this area is important.`;
        }
        if (lowerQuestion.includes('remedies') || lowerQuestion.includes('suggestions')) {
          return `Remedies for ${sign.charAt(0).toUpperCase() + sign.slice(1)}: ${data.remedies}. These practices help balance the natural energies of this sign.`;
        }
        return `${sign.charAt(0).toUpperCase() + sign.slice(1)} (${data.dates}) is a ${data.quality} ${data.element} sign ruled by ${data.ruler}. Symbol: ${data.symbol}. ${data.traits}`;
      }
    }

    // Check for planet questions
    for (const [planet, description] of Object.entries(astrologyKnowledge.planets)) {
      if (lowerQuestion.includes(planet)) {
        return `${planet.charAt(0).toUpperCase() + planet.slice(1)}: ${description}`;
      }
    }

    // Check for house questions
    if (lowerQuestion.includes('house')) {
      for (const [house, description] of Object.entries(astrologyKnowledge.houses)) {
        if (lowerQuestion.includes(house) || lowerQuestion.includes(house + 'th')) {
          return `The ${house} house represents: ${description}`;
        }
      }
    }

    // Check for aspect questions
    for (const [aspect, description] of Object.entries(astrologyKnowledge.aspects)) {
      if (lowerQuestion.includes(aspect)) {
        return `${aspect.charAt(0).toUpperCase() + aspect.slice(1)} aspect: ${description}`;
      }
    }

    // General astrology questions
    if (lowerQuestion.includes('element')) {
      return "The four elements in astrology are Fire (Aries, Leo, Sagittarius) - energetic and passionate; Earth (Taurus, Virgo, Capricorn) - practical and grounded; Air (Gemini, Libra, Aquarius) - intellectual and communicative; Water (Cancer, Scorpio, Pisces) - emotional and intuitive.";
    }

    if (lowerQuestion.includes('quality') || lowerQuestion.includes('modality')) {
      return "The three qualities are Cardinal (Aries, Cancer, Libra, Capricorn) - initiators and leaders; Fixed (Taurus, Leo, Scorpio, Aquarius) - stable and determined; Mutable (Gemini, Virgo, Sagittarius, Pisces) - adaptable and flexible.";
    }

    if (lowerQuestion.includes('birth chart') || lowerQuestion.includes('natal chart')) {
      return "A birth chart is a map of the sky at the exact moment and location of your birth. It shows the positions of all planets in the zodiac signs and houses, revealing your personality, potential, and life path. The three most important components are your Sun sign (core identity), Moon sign (emotions), and Rising sign (how others see you).";
    }

    if (lowerQuestion.includes('coordinates') || lowerQuestion.includes('location') || lowerQuestion.includes('birthplace')) {
      return "Your birth location's coordinates are crucial for accurate astrological calculations. They determine your exact Ascendant, house cusps, and planetary positions. The latitude affects the speed of rising signs, while longitude determines local time corrections for precise planetary positions.";
    }

    // Default response
    return "I can help you with questions about zodiac signs, planets, houses, aspects, and general astrological concepts. Try asking about specific signs, planetary influences, or astrological terms. For personalized insights, ask about 'my chart', 'my sun sign', or 'my compatibility'. For example: 'Tell me about Leo' or 'What does Mercury represent?' or 'What's my moon sign?'";
  };

  // Calls the server-side LLM proxy. Returns the reply string on success,
  // or null on timeout / any error / empty reply (never throws).
  const askLLM = async (
    question: string,
    history: { role: string; content: string }[]
  ): Promise<string | null> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const context = userProfile
        ? {
            firstName: userProfile.firstName,
            sunSign: calculateSunSign(userProfile.dateOfBirth, userProfile.timeOfBirth),
            moonSign: calculateMoonSign(userProfile.dateOfBirth, userProfile.placeOfBirth),
            ascendant: calculateAscendant(userProfile.dateOfBirth, userProfile.placeOfBirth, userProfile.timeOfBirth),
          }
        : { firstName: 'there', sunSign: '', moonSign: '', ascendant: '' };

      const result = await pb.send('/api/ask', {
        method: 'POST',
        body: { question, context, history },
        signal: controller.signal,
      });

      const reply = result?.reply;
      if (typeof reply === 'string' && reply.trim().length > 0) {
        return reply;
      }
      return null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Security: Validate and sanitize input
    const sanitizedInput = sanitizeInput.text(inputText);
    if (sanitizedInput.length === 0) {
      securityMonitor.logSuspiciousActivity('Empty input after sanitization in astrology AI');
      return;
    }

    // Security: Rate limiting for AI queries
    const userId = userProfile?.firstName || 'anonymous';
    if (!rateLimiter.isAllowed(userId, 'ai-query')) {
      securityMonitor.logSuspiciousActivity('Rate limit exceeded for AI queries', { userId });
      return;
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      text: sanitizedInput,
      isUser: true,
      timestamp: new Date(),
    };

    // Build conversation history from prior turns BEFORE appending the new
    // user message, so the brand-new question isn't duplicated in `history`.
    // Exclude the initial greeting (id '1') and keep only the last 6 turns.
    const history = messages
      .filter(m => m.id !== '1')
      .slice(-6)
      .map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text }));

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Try the server-side LLM proxy first; fall back to the offline engine.
    const llmReply = await askLLM(sanitizedInput, history);
    const response =
      typeof llmReply === 'string' && llmReply.trim().length > 0
        ? llmReply
        : generateResponse(sanitizedInput);

    // Reveal the reply with a typewriter animation (turns off the loader as
    // it begins). Applies equally to LLM and local-fallback replies.
    revealAssistantMessage(response);

    securityMonitor.logEvent('AI query processed', {
      userId,
      questionLength: sanitizedInput.length,
      responseLength: response.length,
    });
  };

  const suggestedQuestions = userProfile ? [
    "What's my birth chart?",
    "Tell me about my sun sign",
    "What's my moon sign?",
    "Show my compatibility",
    "What are my remedies?",
    "How does my birthplace affect me?"
  ] : [
    "What are the traits of Aries?",
    "Tell me about Mercury retrograde",
    "What do the houses represent?",
    "Explain the fire signs",
    "What is a birth chart?",
    "How do coordinates affect astrology?"
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Sparkles size={24} color="#FFD700" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>AskAstro</Text>
          <Text style={styles.headerSubtitle}>
            {userProfile ? `Personalized insights for ${userProfile.firstName}` : 'Ask me anything about astrology'}
          </Text>
        </View>
        <Book size={20} color="#B8B8B8" />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.aiMessageText,
              ]}>
                {message.text}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingWrapper}>
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={styles.loadingText}>Consulting the stars...</Text>
            </View>
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try asking:</Text>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionButton}
                onPress={() => setInputText(question)}
              >
                <Text style={styles.suggestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={userProfile ? "Ask about your chart..." : "Ask about astrology..."}
            placeholderTextColor="#666"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={!inputText.trim() ? "#666" : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    margin: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: '#FF6B6B',
    borderBottomRightRadius: 3,
  },
  aiMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 3,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#E0E0E0',
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginTop: 3,
  },
  loadingWrapper: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 12,
    borderBottomLeftRadius: 3,
    gap: 6,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#B8B8B8',
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  suggestionButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FF6B6B',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    maxHeight: 80,
    paddingVertical: 6,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});