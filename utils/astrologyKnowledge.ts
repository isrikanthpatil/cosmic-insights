/**
 * Comprehensive Astrology Knowledge Base
 * Based on classical astrological texts and verified sources
 */

export interface ZodiacSignData {
  dates: string;
  element: string;
  quality: string;
  ruler: string;
  symbol: string;
  traits: string[];
  strengths: string[];
  challenges: string[];
  compatibility: string[];
  career: string[];
  health: string[];
  remedies: string[];
  keywords: string[];
  mythology: string;
  bodyParts: string[];
  colors: string[];
  gemstones: string[];
  numbers: number[];
  mantras: string[];
}

export const ZODIAC_KNOWLEDGE: { [key: string]: ZodiacSignData } = {
  aries: {
    dates: "March 21 - April 19",
    element: "Fire",
    quality: "Cardinal",
    ruler: "Mars",
    symbol: "The Ram",
    traits: [
      "Natural born leader with pioneering spirit",
      "Energetic and enthusiastic approach to life",
      "Courageous and willing to take risks",
      "Independent and self-reliant nature",
      "Quick to act and make decisions",
      "Competitive and goal-oriented"
    ],
    strengths: [
      "Leadership abilities and initiative",
      "Courage to face challenges head-on",
      "Optimistic and positive outlook",
      "Honest and direct communication",
      "Passionate about goals and dreams",
      "Ability to inspire and motivate others",
      "Quick decision-making skills",
      "Resilience in face of setbacks"
    ],
    challenges: [
      "Tendency toward impatience and impulsiveness",
      "Can be aggressive when frustrated",
      "May lack persistence for long-term projects",
      "Prone to anger and quick temper",
      "Sometimes selfish or self-centered",
      "Difficulty with compromise",
      "May rush into situations without planning",
      "Can be insensitive to others' feelings"
    ],
    compatibility: ["Leo", "Sagittarius", "Gemini", "Aquarius"],
    career: [
      "Military and defense services",
      "Sports and athletics",
      "Entrepreneurship and business leadership",
      "Emergency services and rescue work",
      "Sales and marketing",
      "Politics and public service",
      "Surgery and medical fields",
      "Adventure sports and exploration"
    ],
    health: [
      "Head, brain, and eyes are vulnerable areas",
      "Prone to headaches and migraines",
      "Risk of accidents due to impulsive nature",
      "High energy requires regular physical exercise",
      "May suffer from stress-related conditions",
      "Need to manage anger and aggression",
      "Cardiovascular health needs attention",
      "Tendency toward high blood pressure"
    ],
    remedies: [
      "Wear red coral (Moonga) on Tuesday",
      "Chant Hanuman Chalisa daily for strength",
      "Practice meditation to develop patience",
      "Donate red clothes to the needy",
      "Offer water to the Sun at sunrise",
      "Recite Mars mantras on Tuesdays",
      "Practice yoga to channel energy positively",
      "Avoid spicy foods to reduce aggression"
    ],
    keywords: ["Leadership", "Courage", "Initiative", "Energy", "Pioneer", "Warrior"],
    mythology: "Aries is associated with the Golden Fleece sought by Jason and the Argonauts. The ram represents sacrifice, leadership, and the courage to venture into unknown territories.",
    bodyParts: ["Head", "Brain", "Eyes", "Face"],
    colors: ["Red", "Orange", "Bright Yellow"],
    gemstones: ["Red Coral", "Diamond", "Ruby", "Bloodstone"],
    numbers: [1, 8, 15, 22, 29],
    mantras: ["Om Angarakaya Namaha", "Om Gam Ganapataye Namaha"]
  },

  taurus: {
    dates: "April 20 - May 20",
    element: "Earth",
    quality: "Fixed",
    ruler: "Venus",
    symbol: "The Bull",
    traits: [
      "Stable and reliable in all endeavors",
      "Practical approach to life and decisions",
      "Strong appreciation for beauty and comfort",
      "Patient and persistent nature",
      "Loyal and devoted to loved ones",
      "Sensual and pleasure-seeking"
    ],
    strengths: [
      "Unwavering loyalty and dependability",
      "Strong work ethic and determination",
      "Excellent financial management skills",
      "Appreciation for art, music, and beauty",
      "Practical wisdom and common sense",
      "Ability to create comfort and security",
      "Patient and methodical approach",
      "Strong moral values and principles"
    ],
    challenges: [
      "Stubbornness and resistance to change",
      "Possessiveness in relationships",
      "Materialistic tendencies",
      "Laziness when comfortable",
      "Difficulty adapting to new situations",
      "Can be overly cautious",
      "Tendency to hold grudges",
      "May become too focused on material wealth"
    ],
    compatibility: ["Virgo", "Capricorn", "Cancer", "Pisces"],
    career: [
      "Banking and financial services",
      "Agriculture and farming",
      "Arts and creative fields",
      "Luxury goods and fashion",
      "Real estate and property",
      "Cooking and hospitality",
      "Music and entertainment",
      "Interior design and decoration"
    ],
    health: [
      "Neck, throat, and thyroid are sensitive areas",
      "Prone to throat infections and voice problems",
      "Risk of weight gain and obesity",
      "May suffer from diabetes if not careful",
      "Neck and shoulder tension common",
      "Digestive issues from overeating",
      "Need regular exercise to maintain health",
      "Susceptible to stress-related eating"
    ],
    remedies: [
      "Wear white pearl on Friday",
      "Offer white flowers to Goddess Lakshmi",
      "Donate white items on Fridays",
      "Practice yoga for flexibility",
      "Listen to soothing music daily",
      "Recite Venus mantras",
      "Maintain a beautiful living space",
      "Practice gratitude and contentment"
    ],
    keywords: ["Stability", "Beauty", "Patience", "Loyalty", "Comfort", "Persistence"],
    mythology: "Taurus represents the bull that carried Europa across the sea in Greek mythology. It symbolizes strength, fertility, and the connection between earthly pleasures and divine beauty.",
    bodyParts: ["Neck", "Throat", "Thyroid", "Vocal cords"],
    colors: ["Green", "Pink", "White", "Pastel shades"],
    gemstones: ["Diamond", "White Sapphire", "Emerald", "Rose Quartz"],
    numbers: [2, 6, 9, 12, 24],
    mantras: ["Om Shukraya Namaha", "Om Shreem Mahalakshmiyei Namaha"]
  },

  gemini: {
    dates: "May 21 - June 20",
    element: "Air",
    quality: "Mutable",
    ruler: "Mercury",
    symbol: "The Twins",
    traits: [
      "Excellent communication and social skills",
      "Versatile and adaptable nature",
      "Curious and intellectually driven",
      "Quick wit and mental agility",
      "Dual nature with multiple interests",
      "Youthful and energetic personality"
    ],
    strengths: [
      "Outstanding communication abilities",
      "Quick learning and adaptation",
      "Charming and witty personality",
      "Excellent networking skills",
      "Creative and innovative thinking",
      "Ability to see multiple perspectives",
      "Mental flexibility and openness",
      "Natural teaching and writing abilities"
    ],
    challenges: [
      "Inconsistency in behavior and decisions",
      "Tendency toward superficial relationships",
      "Nervousness and restlessness",
      "Difficulty with commitment",
      "Prone to gossip and spreading rumors",
      "Lack of focus and concentration",
      "May be perceived as unreliable",
      "Overthinking and mental anxiety"
    ],
    compatibility: ["Libra", "Aquarius", "Aries", "Leo"],
    career: [
      "Media and journalism",
      "Writing and publishing",
      "Teaching and education",
      "Sales and marketing",
      "Technology and IT",
      "Translation and interpretation",
      "Public relations",
      "Broadcasting and communication"
    ],
    health: [
      "Lungs, arms, and hands are vulnerable",
      "Respiratory issues and breathing problems",
      "Nervous system sensitivity",
      "Anxiety and stress-related disorders",
      "Carpal tunnel and repetitive strain",
      "Insomnia and sleep disturbances",
      "Mental fatigue from overthinking",
      "Allergies and skin sensitivities"
    ],
    remedies: [
      "Wear emerald on Wednesday",
      "Chant Mercury mantras regularly",
      "Donate green items and books",
      "Practice breathing exercises (Pranayama)",
      "Read spiritual and educational books",
      "Maintain a journal for mental clarity",
      "Practice meditation to calm the mind",
      "Engage in creative writing"
    ],
    keywords: ["Communication", "Versatility", "Intelligence", "Curiosity", "Adaptability", "Duality"],
    mythology: "Gemini represents Castor and Pollux, the twin brothers in Greek mythology. They symbolize the duality of human nature and the power of communication and brotherhood.",
    bodyParts: ["Lungs", "Arms", "Hands", "Nervous system"],
    colors: ["Green", "Yellow", "Orange", "Light blue"],
    gemstones: ["Emerald", "Agate", "Citrine", "Aquamarine"],
    numbers: [5, 14, 23, 32, 41],
    mantras: ["Om Budhaya Namaha", "Om Gam Ganapataye Namaha"]
  },

  cancer: {
    dates: "June 21 - July 22",
    element: "Water",
    quality: "Cardinal",
    ruler: "Moon",
    symbol: "The Crab",
    traits: [
      "Deeply emotional and intuitive nature",
      "Nurturing and protective instincts",
      "Strong connection to home and family",
      "Excellent memory and sentimental nature",
      "Caring and compassionate personality",
      "Traditional values and customs"
    ],
    strengths: [
      "Deep empathy and emotional understanding",
      "Unwavering loyalty to family and friends",
      "Strong intuitive and psychic abilities",
      "Tenacious and determined spirit",
      "Excellent memory for details",
      "Natural nurturing and caring abilities",
      "Strong protective instincts",
      "Ability to create emotional security"
    ],
    challenges: [
      "Overly emotional and moody behavior",
      "Extreme sensitivity to criticism",
      "Tendency to be clingy in relationships",
      "Holding onto past hurts and grudges",
      "Pessimistic outlook during difficult times",
      "Difficulty letting go of the past",
      "May retreat into shell when hurt",
      "Prone to emotional manipulation"
    ],
    compatibility: ["Scorpio", "Pisces", "Taurus", "Virgo"],
    career: [
      "Healthcare and nursing",
      "Hospitality and catering",
      "Real estate and property",
      "Childcare and education",
      "Psychology and counseling",
      "Social work and charity",
      "History and archaeology",
      "Food and nutrition"
    ],
    health: [
      "Stomach, breasts, and digestive system",
      "Emotional eating and digestive issues",
      "Breast and chest area sensitivity",
      "Water retention and bloating",
      "Mood-related health problems",
      "Stress affecting stomach",
      "Need for emotional balance",
      "Susceptible to depression"
    ],
    remedies: [
      "Wear pearl on Monday",
      "Offer milk and water to Lord Shiva",
      "Donate white items and food",
      "Practice emotional balance techniques",
      "Spend time near water bodies",
      "Chant Moon mantras on Mondays",
      "Maintain a peaceful home environment",
      "Practice forgiveness and letting go"
    ],
    keywords: ["Emotion", "Nurturing", "Intuition", "Protection", "Family", "Tradition"],
    mythology: "Cancer represents the crab that pinched Hercules during his battle with the Hydra. It symbolizes protection, tenacity, and the importance of home and emotional security.",
    bodyParts: ["Stomach", "Breasts", "Digestive system", "Chest"],
    colors: ["White", "Silver", "Sea green", "Pale blue"],
    gemstones: ["Pearl", "Moonstone", "Silver", "Opal"],
    numbers: [2, 7, 11, 16, 25],
    mantras: ["Om Chandraya Namaha", "Om Namah Shivaya"]
  },

  leo: {
    dates: "July 23 - August 22",
    element: "Fire",
    quality: "Fixed",
    ruler: "Sun",
    symbol: "The Lion",
    traits: [
      "Natural leadership and commanding presence",
      "Creative and artistic expression",
      "Generous and warm-hearted nature",
      "Dramatic and theatrical personality",
      "Confident and self-assured demeanor",
      "Loyal and protective of loved ones"
    ],
    strengths: [
      "Inspiring leadership qualities",
      "Creative self-expression and artistry",
      "Generous and big-hearted nature",
      "Warm and charismatic personality",
      "Confidence in abilities and decisions",
      "Ability to motivate and inspire others",
      "Strong sense of honor and dignity",
      "Natural performer and entertainer"
    ],
    challenges: [
      "Arrogance and excessive pride",
      "Stubborn and inflexible nature",
      "Self-centered and attention-seeking",
      "Dominating personality in relationships",
      "Expensive tastes and extravagance",
      "Difficulty accepting criticism",
      "May become lazy when praised",
      "Tendency to show off"
    ],
    compatibility: ["Aries", "Sagittarius", "Gemini", "Libra"],
    career: [
      "Entertainment and performing arts",
      "Politics and public service",
      "Management and leadership roles",
      "Creative arts and design",
      "Teaching and education",
      "Luxury brands and fashion",
      "Event management",
      "Public speaking and motivation"
    ],
    health: [
      "Heart, spine, and back are vulnerable",
      "Cardiovascular health needs attention",
      "Back problems and spinal issues",
      "High blood pressure from stress",
      "Heart palpitations during excitement",
      "Need for regular cardiovascular exercise",
      "Prone to dramatic health reactions",
      "Stress from overwork and performance"
    ],
    remedies: [
      "Wear ruby on Sunday",
      "Offer water to the Sun at sunrise",
      "Donate gold items and saffron",
      "Practice humility and selfless service",
      "Help others without expecting recognition",
      "Chant Sun mantras daily",
      "Maintain a positive and generous attitude",
      "Practice heart-opening yoga poses"
    ],
    keywords: ["Leadership", "Creativity", "Generosity", "Pride", "Performance", "Royalty"],
    mythology: "Leo represents the Nemean Lion defeated by Hercules. It symbolizes courage, strength, and the divine right to rule, as well as the importance of using power wisely.",
    bodyParts: ["Heart", "Spine", "Back", "Upper back"],
    colors: ["Gold", "Orange", "Red", "Yellow"],
    gemstones: ["Ruby", "Sunstone", "Citrine", "Amber"],
    numbers: [1, 3, 10, 19, 28],
    mantras: ["Om Suryaya Namaha", "Om Hreem Suryaya Namaha"]
  },

  virgo: {
    dates: "August 23 - September 22",
    element: "Earth",
    quality: "Mutable",
    ruler: "Mercury",
    symbol: "The Virgin",
    traits: [
      "Analytical and detail-oriented mind",
      "Practical and methodical approach",
      "Perfectionist tendencies",
      "Helpful and service-oriented nature",
      "Organized and systematic",
      "Health and cleanliness conscious"
    ],
    strengths: [
      "Exceptional attention to detail",
      "Reliable and organized approach",
      "Analytical and problem-solving skills",
      "Helpful and service-minded nature",
      "High standards and quality focus",
      "Practical wisdom and efficiency",
      "Health and wellness awareness",
      "Ability to improve and refine"
    ],
    challenges: [
      "Overly critical of self and others",
      "Excessive worry and anxiety",
      "Perfectionist paralysis",
      "Judgmental attitude",
      "Overthinking situations",
      "Lack of spontaneity",
      "Difficulty expressing emotions",
      "May become overly focused on flaws"
    ],
    compatibility: ["Taurus", "Capricorn", "Cancer", "Scorpio"],
    career: [
      "Healthcare and medicine",
      "Research and analysis",
      "Accounting and finance",
      "Service industries",
      "Editing and proofreading",
      "Quality control and inspection",
      "Nutrition and dietetics",
      "Administrative and clerical work"
    ],
    health: [
      "Digestive system and intestines",
      "Nervous stomach and digestive issues",
      "Anxiety-related health problems",
      "Food allergies and sensitivities",
      "Importance of proper diet",
      "Stress-related digestive disorders",
      "Need for regular health check-ups",
      "Mental health and worry management"
    ],
    remedies: [
      "Wear emerald on Wednesday",
      "Chant Vishnu mantras for peace",
      "Donate green vegetables and grains",
      "Practice acceptance and letting go",
      "Serve the needy and less fortunate",
      "Maintain cleanliness and order",
      "Practice meditation for mental peace",
      "Engage in charitable activities"
    ],
    keywords: ["Analysis", "Service", "Perfection", "Health", "Organization", "Purity"],
    mythology: "Virgo represents Astraea, the goddess of justice who fled to the heavens. She symbolizes purity, service, and the quest for perfection in an imperfect world.",
    bodyParts: ["Digestive system", "Intestines", "Abdomen", "Nervous system"],
    colors: ["Green", "Brown", "Navy blue", "Beige"],
    gemstones: ["Emerald", "Sapphire", "Carnelian", "Moss Agate"],
    numbers: [3, 12, 21, 30, 39],
    mantras: ["Om Budhaya Namaha", "Om Namo Narayanaya"]
  },

  libra: {
    dates: "September 23 - October 22",
    element: "Air",
    quality: "Cardinal",
    ruler: "Venus",
    symbol: "The Scales",
    traits: [
      "Diplomatic and peace-loving nature",
      "Strong sense of justice and fairness",
      "Artistic and aesthetic appreciation",
      "Social and relationship-oriented",
      "Balanced and harmonious approach",
      "Charming and graceful personality"
    ],
    strengths: [
      "Excellent diplomatic and mediation skills",
      "Strong sense of justice and fairness",
      "Natural charm and social grace",
      "Aesthetic sense and artistic appreciation",
      "Ability to see multiple perspectives",
      "Peaceful and harmonious nature",
      "Excellent relationship and partnership skills",
      "Natural ability to bring people together"
    ],
    challenges: [
      "Indecisiveness and difficulty making choices",
      "Tendency toward superficial relationships",
      "Dependence on others for validation",
      "Avoidance of confrontation and conflict",
      "Procrastination and delay in decisions",
      "People-pleasing at expense of self",
      "May compromise too much",
      "Difficulty being alone"
    ],
    compatibility: ["Gemini", "Aquarius", "Leo", "Sagittarius"],
    career: [
      "Law and legal services",
      "Diplomacy and international relations",
      "Arts and creative fields",
      "Fashion and beauty industry",
      "Counseling and mediation",
      "Interior design and decoration",
      "Public relations and marketing",
      "Wedding and event planning"
    ],
    health: [
      "Kidneys, lower back, and skin",
      "Kidney function and urinary system",
      "Lower back pain and problems",
      "Skin conditions and allergies",
      "Balance and equilibrium issues",
      "Stress from relationship problems",
      "Need for harmony and peace",
      "Susceptible to partnership stress"
    ],
    remedies: [
      "Wear diamond or white sapphire on Friday",
      "Offer white flowers to Goddess Lakshmi",
      "Donate white items and sweets",
      "Practice decision-making exercises",
      "Maintain balance in all aspects of life",
      "Create beautiful and harmonious spaces",
      "Practice partnership and cooperation",
      "Engage in artistic and creative activities"
    ],
    keywords: ["Balance", "Justice", "Harmony", "Beauty", "Partnership", "Diplomacy"],
    mythology: "Libra represents the scales of justice held by Astraea. It symbolizes the eternal quest for balance, fairness, and harmony in all relationships and endeavors.",
    bodyParts: ["Kidneys", "Lower back", "Skin", "Adrenal glands"],
    colors: ["Blue", "Pink", "White", "Pastel colors"],
    gemstones: ["Diamond", "Opal", "Lapis Lazuli", "Rose Quartz"],
    numbers: [6, 15, 24, 33, 42],
    mantras: ["Om Shukraya Namaha", "Om Shreem Hreem Kleem"]
  },

  scorpio: {
    dates: "October 23 - November 21",
    element: "Water",
    quality: "Fixed",
    ruler: "Mars/Pluto",
    symbol: "The Scorpion",
    traits: [
      "Intense and passionate nature",
      "Mysterious and secretive personality",
      "Transformative and regenerative power",
      "Strong intuitive and psychic abilities",
      "Determined and focused approach",
      "Loyal and protective of loved ones"
    ],
    strengths: [
      "Incredible determination and willpower",
      "Deep passion and emotional intensity",
      "Strong intuitive and investigative abilities",
      "Resourcefulness in difficult situations",
      "Loyalty and devotion to loved ones",
      "Ability to transform and regenerate",
      "Courage to face life's mysteries",
      "Natural healing and therapeutic abilities"
    ],
    challenges: [
      "Jealousy and possessiveness",
      "Secretive and suspicious nature",
      "Vindictive and revengeful tendencies",
      "Obsessive thoughts and behaviors",
      "Difficulty trusting others",
      "Controlling and manipulative behavior",
      "Tendency to hold grudges",
      "All-or-nothing approach to life"
    ],
    compatibility: ["Cancer", "Pisces", "Virgo", "Capricorn"],
    career: [
      "Psychology and psychiatry",
      "Investigation and detective work",
      "Surgery and medical research",
      "Occult and metaphysical studies",
      "Crisis management",
      "Transformation and healing work",
      "Research and analysis",
      "Insurance and risk assessment"
    ],
    health: [
      "Reproductive organs and elimination system",
      "Sexual and reproductive health",
      "Detoxification and elimination",
      "Immune system strength",
      "Emotional and psychological health",
      "Need for periodic cleansing",
      "Stress from intense emotions",
      "Susceptible to obsessive behaviors"
    ],
    remedies: [
      "Wear red coral on Tuesday",
      "Chant Ganesha mantras for obstacle removal",
      "Donate red items and blood",
      "Practice forgiveness and letting go",
      "Channel intensity into positive transformation",
      "Engage in healing and therapeutic work",
      "Practice meditation for emotional balance",
      "Maintain healthy boundaries"
    ],
    keywords: ["Intensity", "Transformation", "Mystery", "Power", "Regeneration", "Depth"],
    mythology: "Scorpio represents the scorpion that stung Orion. It symbolizes death and rebirth, the power of transformation, and the courage to face life's deepest mysteries.",
    bodyParts: ["Reproductive organs", "Elimination system", "Pelvis", "Colon"],
    colors: ["Red", "Maroon", "Black", "Deep crimson"],
    gemstones: ["Red Coral", "Garnet", "Bloodstone", "Topaz"],
    numbers: [4, 13, 22, 31, 40],
    mantras: ["Om Angarakaya Namaha", "Om Gam Ganapataye Namaha"]
  },

  sagittarius: {
    dates: "November 22 - December 21",
    element: "Fire",
    quality: "Mutable",
    ruler: "Jupiter",
    symbol: "The Archer",
    traits: [
      "Adventurous and freedom-loving spirit",
      "Philosophical and truth-seeking nature",
      "Optimistic and enthusiastic outlook",
      "Honest and straightforward communication",
      "Love for travel and exploration",
      "Teaching and sharing wisdom"
    ],
    strengths: [
      "Inspiring optimism and enthusiasm",
      "Love for learning and teaching",
      "Adventurous and open-minded spirit",
      "Honest and straightforward nature",
      "Philosophical wisdom and insight",
      "Ability to see the bigger picture",
      "Natural teaching and mentoring abilities",
      "Resilience and positive attitude"
    ],
    challenges: [
      "Restlessness and impatience",
      "Tactless and blunt communication",
      "Over-confidence and arrogance",
      "Difficulty with commitment",
      "Tendency to exaggerate",
      "May be irresponsible at times",
      "Intolerance of restrictions",
      "May promise more than can deliver"
    ],
    compatibility: ["Aries", "Leo", "Libra", "Aquarius"],
    career: [
      "Travel and tourism",
      "Education and teaching",
      "Publishing and writing",
      "Sports and athletics",
      "Philosophy and religion",
      "International business",
      "Adventure and outdoor activities",
      "Broadcasting and media"
    ],
    health: [
      "Hips, thighs, and liver",
      "Hip and thigh injuries from sports",
      "Liver problems from excess",
      "Need for physical activity and movement",
      "Sciatica and hip joint issues",
      "Weight gain from overindulgence",
      "Restlessness affecting sleep",
      "Need for outdoor activities"
    ],
    remedies: [
      "Wear yellow sapphire on Thursday",
      "Chant Guru mantras for wisdom",
      "Donate yellow items and books",
      "Practice patience and commitment",
      "Study spiritual and philosophical texts",
      "Engage in teaching and sharing knowledge",
      "Practice gratitude and humility",
      "Maintain ethical and moral conduct"
    ],
    keywords: ["Adventure", "Philosophy", "Freedom", "Optimism", "Truth", "Expansion"],
    mythology: "Sagittarius represents Chiron, the wise centaur who taught heroes. It symbolizes the quest for higher knowledge, wisdom, and the journey toward spiritual enlightenment.",
    bodyParts: ["Hips", "Thighs", "Liver", "Sciatic nerve"],
    colors: ["Yellow", "Orange", "Purple", "Turquoise"],
    gemstones: ["Yellow Sapphire", "Turquoise", "Topaz", "Amethyst"],
    numbers: [3, 9, 18, 27, 36],
    mantras: ["Om Gurave Namaha", "Om Brihaspathaye Namaha"]
  },

  capricorn: {
    dates: "December 22 - January 19",
    element: "Earth",
    quality: "Cardinal",
    ruler: "Saturn",
    symbol: "The Goat",
    traits: [
      "Ambitious and goal-oriented nature",
      "Disciplined and responsible approach",
      "Practical and realistic thinking",
      "Patient and persistent efforts",
      "Traditional values and respect for authority",
      "Strong work ethic and dedication"
    ],
    strengths: [
      "Exceptional discipline and self-control",
      "Strong sense of responsibility",
      "Ambitious and goal-oriented mindset",
      "Patient and methodical approach",
      "Practical wisdom and realism",
      "Excellent organizational and planning skills",
      "Reliability and dependability",
      "Ability to achieve long-term success"
    ],
    challenges: [
      "Pessimistic and negative outlook",
      "Rigid and inflexible thinking",
      "Excessive focus on material success",
      "Workaholic tendencies",
      "Lack of spontaneity and fun",
      "Overly serious and stern demeanor",
      "Difficulty expressing emotions",
      "May become too controlling"
    ],
    compatibility: ["Taurus", "Virgo", "Scorpio", "Pisces"],
    career: [
      "Business and corporate leadership",
      "Government and public administration",
      "Engineering and construction",
      "Finance and banking",
      "Management and supervision",
      "Law and legal services",
      "Architecture and planning",
      "Traditional and established fields"
    ],
    health: [
      "Bones, joints, and skin",
      "Skeletal system and bone density",
      "Arthritis and joint problems",
      "Skin conditions and dryness",
      "Dental and teeth issues",
      "Need for calcium and vitamin D",
      "Stress from overwork",
      "Depression from excessive pressure"
    ],
    remedies: [
      "Wear blue sapphire on Saturday",
      "Chant Shani mantras for discipline",
      "Donate black items and iron",
      "Practice optimism and positive thinking",
      "Balance work with rest and recreation",
      "Serve the elderly and disadvantaged",
      "Practice patience and perseverance",
      "Maintain ethical business practices"
    ],
    keywords: ["Ambition", "Discipline", "Responsibility", "Achievement", "Tradition", "Authority"],
    mythology: "Capricorn represents the sea-goat Pricus, who could manipulate time. It symbolizes the climb to success, the importance of patience, and the wisdom that comes with experience.",
    bodyParts: ["Bones", "Joints", "Skin", "Knees"],
    colors: ["Black", "Dark blue", "Brown", "Gray"],
    gemstones: ["Blue Sapphire", "Garnet", "Onyx", "Jet"],
    numbers: [8, 17, 26, 35, 44],
    mantras: ["Om Shanaye Namaha", "Om Sham Shanicharaya Namaha"]
  },

  aquarius: {
    dates: "January 20 - February 18",
    element: "Air",
    quality: "Fixed",
    ruler: "Saturn/Uranus",
    symbol: "The Water Bearer",
    traits: [
      "Independent and freedom-loving nature",
      "Innovative and progressive thinking",
      "Humanitarian and socially conscious",
      "Eccentric and unique personality",
      "Intellectual and analytical mind",
      "Friendly and group-oriented"
    ],
    strengths: [
      "Original and innovative thinking",
      "Strong sense of independence",
      "Humanitarian spirit and social consciousness",
      "Progressive and forward-thinking ideas",
      "Friendly and sociable nature",
      "Ability to see the future potential",
      "Intellectual and analytical abilities",
      "Natural networking and group skills"
    ],
    challenges: [
      "Emotional detachment and aloofness",
      "Unpredictable and erratic behavior",
      "Stubborn adherence to opinions",
      "Rebellious and contrary nature",
      "Difficulty with emotional intimacy",
      "May seem cold or impersonal",
      "Tendency to be overly idealistic",
      "Resistance to traditional authority"
    ],
    compatibility: ["Gemini", "Libra", "Aries", "Sagittarius"],
    career: [
      "Technology and innovation",
      "Social work and humanitarian causes",
      "Science and research",
      "Aviation and aerospace",
      "Alternative and renewable energy",
      "Group facilitation and networking",
      "Invention and design",
      "Social media and digital platforms"
    ],
    health: [
      "Circulatory system, ankles, and calves",
      "Blood circulation problems",
      "Varicose veins and ankle issues",
      "Nervous system disorders",
      "Irregular heart rhythms",
      "Need for group activities and friendship",
      "Mental health and social connection",
      "Stress from isolation"
    ],
    remedies: [
      "Wear blue sapphire on Saturday",
      "Donate to humanitarian causes",
      "Help social and charitable organizations",
      "Practice emotional connection and intimacy",
      "Meditate regularly for inner peace",
      "Engage in group activities and friendships",
      "Use technology for positive purposes",
      "Practice tolerance and acceptance"
    ],
    keywords: ["Innovation", "Independence", "Humanity", "Progress", "Friendship", "Rebellion"],
    mythology: "Aquarius represents Ganymede, the cup-bearer to the gods. It symbolizes the pouring forth of knowledge, humanitarian service, and the gift of innovation to humanity.",
    bodyParts: ["Circulatory system", "Ankles", "Calves", "Shins"],
    colors: ["Blue", "Turquoise", "Silver", "Electric blue"],
    gemstones: ["Blue Sapphire", "Amethyst", "Aquamarine", "Fluorite"],
    numbers: [4, 8, 13, 22, 31],
    mantras: ["Om Shanaye Namaha", "Om Rahave Namaha"]
  },

  pisces: {
    dates: "February 19 - March 20",
    element: "Water",
    quality: "Mutable",
    ruler: "Jupiter/Neptune",
    symbol: "The Fish",
    traits: [
      "Highly intuitive and psychic abilities",
      "Compassionate and empathetic nature",
      "Artistic and creative imagination",
      "Dreamy and spiritual personality",
      "Selfless and sacrificing for others",
      "Fluid and adaptable approach"
    ],
    strengths: [
      "Deep compassion and empathy",
      "Strong intuitive and psychic abilities",
      "Artistic and creative talents",
      "Spiritual wisdom and connection",
      "Selfless service to others",
      "Imaginative and visionary thinking",
      "Ability to understand others' emotions",
      "Natural healing and therapeutic gifts"
    ],
    challenges: [
      "Escapist tendencies and avoidance",
      "Over-sensitivity to environment",
      "Confused thinking and lack of direction",
      "Difficulty setting boundaries",
      "Gullible and easily deceived",
      "Procrastination and lack of focus",
      "Tendency toward addiction",
      "May become martyrs or victims"
    ],
    compatibility: ["Cancer", "Scorpio", "Taurus", "Capricorn"],
    career: [
      "Arts and creative fields",
      "Healing and therapeutic work",
      "Spirituality and religious service",
      "Charity and social work",
      "Psychology and counseling",
      "Music and entertainment",
      "Photography and film",
      "Marine biology and water-related fields"
    ],
    health: [
      "Feet, immune system, and lymphatic system",
      "Foot problems and circulation issues",
      "Weak immune system and infections",
      "Allergies and sensitivities",
      "Lymphatic drainage problems",
      "Addiction and substance abuse risks",
      "Mental health and emotional stability",
      "Need for spiritual and emotional healing"
    ],
    remedies: [
      "Wear yellow sapphire on Thursday",
      "Chant Vishnu mantras for protection",
      "Donate to temples and spiritual causes",
      "Practice grounding and earthing exercises",
      "Set clear boundaries in relationships",
      "Engage in spiritual practices and meditation",
      "Avoid negative influences and environments",
      "Practice discernment and discrimination"
    ],
    keywords: ["Compassion", "Intuition", "Spirituality", "Imagination", "Sacrifice", "Unity"],
    mythology: "Pisces represents two fish swimming in opposite directions, symbolizing the dual nature of existence - material and spiritual, conscious and unconscious, finite and infinite.",
    bodyParts: ["Feet", "Immune system", "Lymphatic system", "Pineal gland"],
    colors: ["Sea green", "Lavender", "White", "Silver"],
    gemstones: ["Yellow Sapphire", "Aquamarine", "Moonstone", "Amethyst"],
    numbers: [3, 7, 12, 16, 21],
    mantras: ["Om Gurave Namaha", "Om Namo Narayanaya"]
  }
};

export const PLANETARY_KNOWLEDGE = {
  sun: {
    significance: "Represents the soul, ego, vitality, and life force",
    rules: "Leo",
    exalted: "Aries",
    debilitated: "Libra",
    keywords: ["Identity", "Vitality", "Authority", "Father", "Government", "Leadership"],
    influence: "Core personality, self-expression, confidence, leadership abilities, relationship with authority figures",
    remedies: ["Offer water to Sun at sunrise", "Chant Surya mantras", "Wear ruby", "Practice Surya Namaskara"]
  },
  moon: {
    significance: "Represents the mind, emotions, intuition, and mother",
    rules: "Cancer",
    exalted: "Taurus",
    debilitated: "Scorpio",
    keywords: ["Emotions", "Mind", "Mother", "Intuition", "Nurturing", "Cycles"],
    influence: "Emotional nature, instincts, subconscious patterns, relationship with mother, mental peace",
    remedies: ["Wear pearl", "Offer milk to Shiva", "Chant Moon mantras", "Spend time near water"]
  },
  mercury: {
    significance: "Represents communication, intellect, and analytical thinking",
    rules: "Gemini and Virgo",
    exalted: "Virgo",
    debilitated: "Pisces",
    keywords: ["Communication", "Intelligence", "Learning", "Business", "Writing", "Analysis"],
    influence: "Communication skills, learning ability, business acumen, analytical thinking, nervous system",
    remedies: ["Wear emerald", "Chant Mercury mantras", "Donate green items", "Practice meditation"]
  },
  venus: {
    significance: "Represents love, beauty, relationships, and material comforts",
    rules: "Taurus and Libra",
    exalted: "Pisces",
    debilitated: "Virgo",
    keywords: ["Love", "Beauty", "Relationships", "Art", "Luxury", "Harmony"],
    influence: "Romantic relationships, artistic abilities, sense of beauty, material comforts, social skills",
    remedies: ["Wear diamond or white sapphire", "Offer white flowers", "Chant Venus mantras", "Practice gratitude"]
  },
  mars: {
    significance: "Represents energy, action, courage, and conflict",
    rules: "Aries and Scorpio",
    exalted: "Capricorn",
    debilitated: "Cancer",
    keywords: ["Energy", "Action", "Courage", "Conflict", "Sports", "Surgery"],
    influence: "Physical energy, courage, competitive spirit, anger, accidents, surgical procedures",
    remedies: ["Wear red coral", "Chant Mars mantras", "Donate red items", "Practice physical exercise"]
  },
  jupiter: {
    significance: "Represents wisdom, knowledge, spirituality, and expansion",
    rules: "Sagittarius and Pisces",
    exalted: "Cancer",
    debilitated: "Capricorn",
    keywords: ["Wisdom", "Knowledge", "Spirituality", "Teaching", "Expansion", "Fortune"],
    influence: "Spiritual growth, higher learning, teaching abilities, fortune, children, philosophical outlook",
    remedies: ["Wear yellow sapphire", "Chant Jupiter mantras", "Donate yellow items", "Study scriptures"]
  },
  saturn: {
    significance: "Represents discipline, responsibility, limitations, and life lessons",
    rules: "Capricorn and Aquarius",
    exalted: "Libra",
    debilitated: "Aries",
    keywords: ["Discipline", "Responsibility", "Limitations", "Lessons", "Patience", "Endurance"],
    influence: "Life lessons, discipline, delays, obstacles, patience, long-term success, karma",
    remedies: ["Wear blue sapphire", "Chant Saturn mantras", "Serve the poor", "Practice patience"]
  }
};

export const HOUSE_KNOWLEDGE = {
  1: {
    name: "House of Self",
    significance: "Personality, appearance, first impressions, new beginnings, physical body",
    keywords: ["Self", "Personality", "Appearance", "Identity", "New beginnings"],
    life_areas: "Physical appearance, personality traits, first impressions, approach to life, vitality"
  },
  2: {
    name: "House of Wealth",
    significance: "Money, possessions, values, self-worth, material security, speech",
    keywords: ["Wealth", "Values", "Possessions", "Speech", "Self-worth"],
    life_areas: "Financial resources, material possessions, personal values, speech patterns, self-esteem"
  },
  3: {
    name: "House of Communication",
    significance: "Communication, siblings, short journeys, courage, skills",
    keywords: ["Communication", "Siblings", "Courage", "Skills", "Short travels"],
    life_areas: "Communication abilities, relationship with siblings, short-distance travel, manual skills, courage"
  },
  4: {
    name: "House of Home",
    significance: "Home, family, mother, emotional foundation, property, education",
    keywords: ["Home", "Family", "Mother", "Property", "Education"],
    life_areas: "Home environment, family relationships, mother, real estate, emotional security, basic education"
  },
  5: {
    name: "House of Creativity",
    significance: "Children, creativity, romance, speculation, entertainment, intelligence",
    keywords: ["Children", "Creativity", "Romance", "Intelligence", "Entertainment"],
    life_areas: "Children, creative expression, romantic relationships, speculation, entertainment, intelligence"
  },
  6: {
    name: "House of Service",
    significance: "Health, work, service, daily routines, enemies, obstacles",
    keywords: ["Health", "Work", "Service", "Enemies", "Daily routine"],
    life_areas: "Health and wellness, daily work, service to others, enemies, obstacles, pets"
  },
  7: {
    name: "House of Partnership",
    significance: "Marriage, partnerships, business relationships, open enemies",
    keywords: ["Marriage", "Partnership", "Business", "Relationships", "Cooperation"],
    life_areas: "Marriage, business partnerships, one-on-one relationships, open enemies, cooperation"
  },
  8: {
    name: "House of Transformation",
    significance: "Transformation, death, rebirth, occult, inheritance, research",
    keywords: ["Transformation", "Occult", "Inheritance", "Research", "Mysteries"],
    life_areas: "Major life changes, occult studies, inheritance, research, mysteries, longevity"
  },
  9: {
    name: "House of Wisdom",
    significance: "Higher education, philosophy, religion, long journeys, father, guru",
    keywords: ["Philosophy", "Religion", "Higher education", "Father", "Long travels"],
    life_areas: "Higher education, philosophy, religion, long-distance travel, father, spiritual teacher"
  },
  10: {
    name: "House of Career",
    significance: "Career, reputation, status, authority, public image, government",
    keywords: ["Career", "Reputation", "Status", "Authority", "Public image"],
    life_areas: "Professional life, career achievements, public reputation, status, relationship with authority"
  },
  11: {
    name: "House of Gains",
    significance: "Gains, income, friends, hopes, wishes, elder siblings",
    keywords: ["Gains", "Friends", "Hopes", "Income", "Elder siblings"],
    life_areas: "Financial gains, friendships, hopes and wishes, income from profession, elder siblings"
  },
  12: {
    name: "House of Liberation",
    significance: "Losses, expenses, foreign lands, spirituality, liberation, hidden enemies",
    keywords: ["Spirituality", "Foreign lands", "Expenses", "Liberation", "Subconscious"],
    life_areas: "Spiritual liberation, foreign connections, expenses, subconscious mind, hidden enemies"
  }
};