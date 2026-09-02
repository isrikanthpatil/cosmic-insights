import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Platform, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useRouter } from 'expo-router';
import { MessageCircle, Send, Sparkles, LogIn } from 'lucide-react-native';
import { calculateSunSign, calculateMoonSign, calculateAscendant, getCoordinatesForPlace, getSignDetails } from '@/utils/astrology';
import { getNumerologyReading } from '@/utils/numerology';
import { sanitizeInput, securityMonitor, rateLimiter } from '@/utils/security';
import { pb } from '@/utils/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { tap } from '@/utils/haptics';
import { showToast } from '@/utils/toast';

// Sentinel error thrown by askLLM when the server returns HTTP 429 for a guest
// who has exhausted their free daily questions. handleSend surfaces this as a
// sign-in nudge rather than silently falling back to the offline engine.
const GUEST_LIMIT = 'guest_limit';
const DEFAULT_GUEST_LIMIT_MESSAGE =
  "You've used your 2 free questions for today. Sign in for unlimited AskAstro.";
const GREETING_BODY =
  "I'm AskAstro. Ask me anything about your chart, zodiac, or numerology — or add your birth details for a personalised reading.";
const makeGreeting = (name?: string): Message => ({
  id: '1',
  text: name ? `Namaste ${name} 🙏 ${GREETING_BODY}` : `Namaste 🙏 ${GREETING_BODY}`,
  isUser: false,
  timestamp: new Date(),
});

// Suggested follow-up questions shown as tappable chips after each reply, so the
// chat feels like a guided conversation rather than a one-shot Q&A.
const FOLLOWUP_POOL = [
  'What about my career?',
  'How is my love life?',
  'Any remedies for me?',
  'What does today hold?',
  'My lucky numbers & colours?',
  'What are my strengths?',
  'Tell me about my Moon sign',
  'Which planetary period am I in?',
];

// Deterministic per-turn pick of 3 follow-ups (stable across re-renders via the
// message-count seed), excluding whatever was just asked.
const pickFollowUps = (seed: number, exclude: string): string[] => {
  const ex = exclude.trim().toLowerCase();
  const pool = FOLLOWUP_POOL.filter((q) => q.toLowerCase() !== ex);
  const out: string[] = [];
  for (let i = 0; out.length < 3 && i < pool.length; i++) {
    out.push(pool[(seed + i) % pool.length]);
  }
  return out;
};

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
    lastName?: string;
    gender?: 'male' | 'female';
  };
}

// Three gently pulsing dots — the "AskAstro is typing…" affordance shown while a
// reply is being prepared.
function TypingDots() {
  const d0 = useRef(new Animated.Value(0.3)).current;
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(360 - delay),
        ]),
      );
    const anims = [make(d0, 0), make(d1, 180), make(d2, 360)];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [d0, d1, d2]);
  return (
    <View style={styles.typingDotsRow}>
      {[d0, d1, d2].map((v, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: v, transform: [{ scale: v }] }]} />
      ))}
    </View>
  );
}

export default function AstrologyAI({ userProfile }: AstrologyAIProps) {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([makeGreeting(userProfile?.firstName)]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // True once a guest has hit the daily free-question limit; shows a sign-in
  // CTA beneath the conversation.
  const [guestLimitReached, setGuestLimitReached] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Reset the whole conversation when the subject/identity changes — sign-in,
  // sign-out, guest→account, or "explore another chart". Otherwise the previous
  // person's personalized answers, a stale greeting, and the "used your 2 free
  // questions" bubble linger under a header that now names someone else.
  useEffect(() => {
    setMessages([makeGreeting(userProfile?.firstName)]);
    setInputText('');
    setGuestLimitReached(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.firstName, userProfile?.dateOfBirth, user?.id]);

  // Keyboard avoidance: Android edge-to-edge breaks the standard
  // KeyboardAvoidingView, so we lift the card manually. The keyboard overlays
  // from the screen bottom, over the tab bar, so raising the card by
  // (keyboardHeight − tabBarHeight) puts the input just above the keyboard.
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const kb = useKeyboardHeight();

  const scrollViewRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Add the assistant's reply as a single, complete message. We deliberately do
  // NOT stream it character-by-character — a person sends a whole message at once,
  // so the reply appears in full after the "typing…" indicator, which feels more
  // human and less like a bot spitting out tokens.
  const addAssistantMessage = (fullText: string) => {
    if (!isMountedRef.current) return;
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: fullText,
      isUser: false,
      timestamp: new Date(),
    };
    setIsLoading(false);
    setMessages(prev => [...prev, aiMessage]);
  };

  // Enhanced astrology knowledge base with coordinate-based insights
  const astrologyKnowledge = {
    zodiacSigns: {
      aries: {
        dates: "April 14 - May 14",
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
        dates: "May 15 - June 14",
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
        dates: "June 15 - July 15",
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
        dates: "July 16 - August 16",
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
        dates: "August 17 - September 16",
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
        dates: "September 17 - October 16",
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
        dates: "October 17 - November 15",
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
        dates: "November 16 - December 15",
        element: "Water",
        quality: "Fixed",
        ruler: "Mars",
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
        dates: "December 16 - January 14",
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
        dates: "January 15 - February 12",
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
        dates: "February 13 - March 14",
        element: "Air",
        quality: "Fixed",
        ruler: "Saturn",
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
        dates: "March 15 - April 13",
        element: "Water",
        quality: "Mutable",
        ruler: "Jupiter",
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
      sun: "Surya — represents the soul (atma), ego, vitality and life force. Rules Leo (Simha). Shows your core self and purpose.",
      moon: "Chandra — represents the mind (manas), emotions, instincts and nurturing. Rules Cancer (Karka). Shows your emotional nature.",
      mercury: "Budha — represents communication, intellect and reasoning. Rules Gemini (Mithuna) and Virgo (Kanya). Shows how you think and speak.",
      venus: "Shukra — represents love, beauty, harmony and values. Rules Taurus (Vrishabha) and Libra (Tula). Shows what you value and how you love.",
      mars: "Mangala — represents energy, action, courage and drive. Rules Aries (Mesha) and Scorpio (Vrishchika). Shows how you assert yourself.",
      jupiter: "Guru (Brihaspati) — represents wisdom, dharma, expansion and fortune. Rules Sagittarius (Dhanu) and Pisces (Meena). Shows growth and blessings.",
      saturn: "Shani — represents discipline, responsibility, karma and life lessons. Rules Capricorn (Makara) and Aquarius (Kumbha). Shows where you must persevere.",
      rahu: "The north lunar node — a shadow graha (chhaya) signifying desire, ambition and worldly gains. It has no rulership and amplifies the sign/house it occupies.",
      ketu: "The south lunar node — a shadow graha signifying detachment, spirituality, past-life karma and moksha. It has no rulership and turns focus inward."
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

    // "Which sun sign / zodiac sign" questions — answer sensibly instead of
    // mismatching to a planet definition.
    if (
      lowerQuestion.includes('sun sign') ||
      lowerQuestion.includes('zodiac sign') ||
      lowerQuestion.includes('star sign') ||
      lowerQuestion.includes('which sign')
    ) {
      return "Your sign depends on your exact birth date. Astropanth uses the Vedic (sidereal) zodiac, which differs by roughly one sign from Western sun signs. Add your birth details in Profile for your precise Sun, Moon and Ascendant — or ask 'what's my sun sign?'.";
    }

    // Check for planet questions — but not when the question is about a SIGN
    // (e.g. "which sun sign" should never return the Sun planet definition).
    if (!lowerQuestion.includes('sign') && !lowerQuestion.includes('zodiac')) {
      for (const [planet, description] of Object.entries(astrologyKnowledge.planets)) {
        if (lowerQuestion.includes(planet)) {
          return `${planet.charAt(0).toUpperCase() + planet.slice(1)}: ${description}`;
        }
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
  // or null on timeout / any error / empty reply.
  //
  // Exception: when the server returns HTTP 429 with body { error:'guest_limit' }
  // (a guest who has used their free daily questions) it throws an Error whose
  // message is GUEST_LIMIT carrying the server message, so handleSend can show
  // a sign-in nudge instead of silently using the offline fallback.
  const askLLM = async (
    question: string,
    history: { role: string; content: string }[]
  ): Promise<string | null> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      let context: Record<string, string | number>;
      if (userProfile) {
        const sunSign = calculateSunSign(userProfile.dateOfBirth, userProfile.timeOfBirth);
        const moonSign = calculateMoonSign(userProfile.dateOfBirth, userProfile.placeOfBirth);
        const ascendant = calculateAscendant(userProfile.dateOfBirth, userProfile.placeOfBirth, userProfile.timeOfBirth);

        context = { firstName: userProfile.firstName, sunSign, moonSign, ascendant };

        // Enrich with sign element/quality/ruler — never break the chat on failure.
        try {
          const signDetails = getSignDetails(sunSign);
          context.element = signDetails?.element ?? '';
          context.quality = signDetails?.quality ?? '';
          context.ruler = signDetails?.ruler ?? '';
        } catch {
          // omit sign-detail fields on failure
        }

        // Enrich with numerology numbers — lastName/gender may be absent on the
        // prop, so fall back to safe defaults.
        try {
          const numerology = getNumerologyReading(
            userProfile.firstName,
            userProfile.lastName ?? '',
            userProfile.dateOfBirth,
            userProfile.gender ?? 'male'
          );
          context.birthNumber = numerology.birthNumber;
          context.destinyNumber = numerology.destinyNumber;
          context.kuaNumber = numerology.kuaNumber;
        } catch {
          // omit numerology fields on failure
        }

        // Build a compact CURATED KNOWLEDGE string so the LLM can be grounded in
        // the user's own reading. Any failure here just omits `knowledge`; it
        // must never break the chat.
        try {
          const sun = getSignDetails(sunSign);      // may be null
          const moon = getSignDetails(moonSign);
          const asc = getSignDetails(ascendant);
          const numero = getNumerologyReading(
            userProfile.firstName,
            userProfile.lastName ?? '',
            userProfile.dateOfBirth,
            userProfile.gender ?? 'male'
          );
          const parts: string[] = [];
          if (sun) parts.push(
            `SUN ${sunSign}: element ${sun.element}, quality ${sun.quality}, ruler ${sun.ruler}. ` +
            `Traits: ${sun.traits.slice(0, 4).join('; ')}. Strengths: ${sun.strengths.slice(0, 4).join('; ')}. ` +
            `Challenges: ${sun.challenges.slice(0, 4).join('; ')}. Remedies: ${sun.remedies.slice(0, 2).join('; ')}. ` +
            `Gemstone: ${sun.gemstones?.[0] ?? ''}. Lucky colors: ${(sun.colors || []).slice(0, 2).join(', ')}. Mantra: ${sun.mantras?.[0] ?? ''}.`
          );
          if (moon) parts.push(`MOON ${moonSign} (emotional nature): ${moon.traits.slice(0, 3).join('; ')}.`);
          if (asc) parts.push(`ASCENDANT ${ascendant} (outward style): ${asc.traits.slice(0, 3).join('; ')}.`);
          parts.push(`NUMEROLOGY: Birth Number ${numero.birthNumber} (${numero.birthNumberMeaning}); Destiny Number ${numero.destinyNumber} (${numero.destinyNumberMeaning}); Kua ${numero.kuaNumber} (${numero.kuaNumberMeaning}).`);
          context.knowledge = parts.join('\n');
        } catch {
          // omit curated knowledge on failure
        }
      } else {
        context = { firstName: 'there', sunSign: '', moonSign: '', ascendant: '' };
      }

      const result = await pb.send('/api/ask', {
        method: 'POST',
        body: { question, context, history, lang },
        signal: controller.signal,
      });

      const reply = result?.reply;
      if (typeof reply === 'string' && reply.trim().length > 0) {
        return reply;
      }
      return null;
    } catch (error: any) {
      // Guest daily-limit exceeded: surface it rather than falling back.
      if (error?.status === 429) {
        const serverMessage =
          error?.response?.message ||
          error?.data?.message ||
          error?.response?.error ||
          DEFAULT_GUEST_LIMIT_MESSAGE;
        const limitError = new Error(GUEST_LIMIT);
        (limitError as any).userMessage =
          typeof serverMessage === 'string' && serverMessage.trim().length > 0
            ? serverMessage
            : DEFAULT_GUEST_LIMIT_MESSAGE;
        throw limitError;
      }
      // All other failures (timeout / network / 5xx) → offline fallback.
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  const handleSend = async (presetText?: string) => {
    // `presetText` is a string only when called from a follow-up chip; event
    // handlers (onPress/onSubmitEditing) pass an event object, so we ignore that.
    const raw = typeof presetText === 'string' ? presetText : inputText;
    if (!raw.trim()) return;
    if (isLoading) return; // prevent double-submit from Enter/keyboard while a reply is in flight
    tap();

    // Security: Validate and sanitize input
    const sanitizedInput = sanitizeInput.text(raw);
    if (sanitizedInput.length === 0) {
      securityMonitor.logSuspiciousActivity('Empty input after sanitization in astrology AI');
      return;
    }

    // Security: Rate limiting for AI queries
    const userId = userProfile?.firstName || 'anonymous';
    if (!rateLimiter.isAllowed(userId, 'ai-query')) {
      securityMonitor.logSuspiciousActivity('Rate limit exceeded for AI queries', { userId });
      showToast('Please wait a moment before asking again.', 'info');
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

    const startedAt = Date.now();
    // Hold the "typing…" indicator for a natural, varied 3–5s (randomised per reply)
    // so answers feel considered rather than machine-instant, then show the reply.
    const thinkMs = 3000 + Math.floor(Math.random() * 2001);
    const finishWith = async (text: string) => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < thinkMs) {
        await new Promise((r) => setTimeout(r, thinkMs - elapsed));
      }
      addAssistantMessage(text);
    };

    // Try the server-side LLM proxy first; fall back to the offline engine.
    let llmReply: string | null = null;
    try {
      llmReply = await askLLM(sanitizedInput, history);
    } catch (error: any) {
      if (error?.message === GUEST_LIMIT) {
        const limitMessage: string =
          (error as any).userMessage || DEFAULT_GUEST_LIMIT_MESSAGE;
        setGuestLimitReached(true);
        // Surface the limit both as a toast and as an assistant message, with a
        // persistent sign-in CTA rendered below the conversation.
        showToast(limitMessage, 'info');
        await finishWith(limitMessage);
        return;
      }
      // Any other unexpected throw → fall back to the offline engine.
      llmReply = null;
    }

    const response =
      typeof llmReply === 'string' && llmReply.trim().length > 0
        ? llmReply
        : generateResponse(sanitizedInput);

    await finishWith(response);

    securityMonitor.logEvent('AI query processed', {
      userId,
      questionLength: sanitizedInput.length,
      responseLength: response.length,
    });
  };

  const suggestedQuestions = userProfile ? [
    "What's my birth chart?",
    "Tell me about my sun sign",
    "What are my remedies?"
  ] : [
    "What is a birth chart?",
    "What are the traits of Aries?",
    "What do the houses represent?"
  ];

  // Follow-up chips after the latest reply (not the greeting, not while typing,
  // not once a guest has hit the limit).
  const lastMsg = messages[messages.length - 1];
  const lastUserText = [...messages].reverse().find((m) => m.isUser)?.text ?? '';
  const followUps =
    !isLoading && !guestLimitReached && messages.length > 1 && lastMsg && !lastMsg.isUser
      ? pickFollowUps(messages.length, lastUserText)
      : [];

  return (
    <View
      style={[
        styles.container,
        {
          marginTop: insets.top + 8,
          paddingBottom: kb > 0 ? Math.max(0, kb - tabBarHeight) : 0,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Sparkles size={24} color="#E8C87E" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>AskAstro</Text>
          <Text style={styles.headerSubtitle}>
            {userProfile ? `Personalized insights for ${userProfile.firstName}` : 'Ask me anything about astrology'}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => {
          const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (message.isUser) {
            return (
              <View key={message.id} style={[styles.messageWrapper, styles.userMessageWrapper]}>
                <View style={[styles.messageBubble, styles.userMessage]}>
                  <Text style={[styles.messageText, styles.userMessageText]}>{message.text}</Text>
                </View>
                <Text style={styles.timestamp}>{time}</Text>
              </View>
            );
          }
          return (
            <View key={message.id} style={[styles.messageWrapper, styles.aiMessageWrapper]}>
              <View style={styles.aiRow}>
                <View style={styles.aiAvatar}>
                  <Sparkles size={15} color="#E8C87E" />
                </View>
                <View style={styles.aiRowBody}>
                  <Text style={styles.aiName}>AskAstro</Text>
                  <View style={[styles.messageBubble, styles.aiMessage, styles.aiBubbleFull]}>
                    <Text style={[styles.messageText, styles.aiMessageText]}>{message.text}</Text>
                  </View>
                  <Text style={styles.timestamp}>{time}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {isLoading && (
          <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
            <View style={styles.aiRow}>
              <View style={styles.aiAvatar}>
                <Sparkles size={15} color="#E8C87E" />
              </View>
              <View style={styles.aiRowBody}>
                <Text style={styles.aiName}>AskAstro is typing…</Text>
                <View style={[styles.messageBubble, styles.aiMessage, styles.typingBubble]}>
                  <TypingDots />
                </View>
              </View>
            </View>
          </View>
        )}

        {followUps.length > 0 && (
          <View style={styles.followUpWrap}>
            {followUps.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.followUpChip}
                onPress={() => handleSend(q)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Ask: ${q}`}
              >
                <Text style={styles.followUpText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try asking:</Text>
            <View style={styles.suggestionsGroup}>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  onPress={() => setInputText(question)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask: ${question}`}
                >
                  <Text style={styles.suggestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {guestLimitReached && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitBannerText}>
            {DEFAULT_GUEST_LIMIT_MESSAGE}
          </Text>
          <View style={styles.limitActions}>
            <TouchableOpacity
              style={styles.limitSignInButton}
              onPress={() => {
                tap();
                router.push('/login');
              }}
              activeOpacity={0.85}
            >
              <LogIn size={16} color="#0B0B1A" />
              <Text style={styles.limitSignInText}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                tap();
                router.push('/premium');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.limitPlusLink}>Go Plus for unlimited</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={userProfile ? "Ask about your chart..." : "Ask about astrology..."}
            placeholderTextColor="#8B88A0"
            selectionColor="#E8C87E"
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            onFocus={() => {
              // When the keyboard opens, keep the latest message + the input in view.
              setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
            }}
            onSubmitEditing={() => handleSend()}
            onKeyPress={(e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
              // Web: send on Enter (without Shift); Shift+Enter inserts a newline.
              if (Platform.OS === 'web') {
                const nativeEvent = e.nativeEvent as unknown as {
                  key?: string;
                  shiftKey?: boolean;
                  preventDefault?: () => void;
                };
                if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
                  nativeEvent.preventDefault?.();
                  handleSend();
                }
              }
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Send size={20} color={!inputText.trim() ? "#8B88A0" : "#0B0B1A"} />
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          For guidance and self-reflection — not professional advice.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    margin: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#F4F1E8',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7C4D6',
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
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '92%',
  },
  aiRowBody: {
    flexShrink: 1,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 200, 126, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.30)',
    marginTop: 2,
  },
  aiName: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#8B88A0',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aiBubbleFull: {
    maxWidth: '100%',
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E8C87E',
  },
  followUpWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
    marginLeft: 38, // align under the AI bubbles (past the avatar)
  },
  followUpChip: {
    backgroundColor: 'rgba(232, 200, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.30)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  followUpText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#E8C87E',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  userMessage: {
    backgroundColor: 'rgba(232, 200, 126, 0.12)',
    borderColor: 'rgba(232, 200, 126, 0.35)',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 21,
  },
  userMessageText: {
    color: '#F4F1E8',
  },
  aiMessageText: {
    color: '#C7C4D6',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B88A0',
    marginTop: 4,
  },
  loadingWrapper: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E8C87E',
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#E8C87E',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  suggestionsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.25)',
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#F4F1E8',
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: 'rgba(232, 200, 126, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 126, 0.30)',
    borderLeftWidth: 4,
    borderLeftColor: '#E8C87E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  limitBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#F4F1E8',
    lineHeight: 18,
  },
  limitActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  limitSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8C87E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  limitSignInText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#0B0B1A',
  },
  limitPlusLink: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#E8C87E',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  disclaimer: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6E6B84',
    textAlign: 'center',
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F4F1E8',
    maxHeight: 80,
    paddingVertical: 6,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8C87E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});