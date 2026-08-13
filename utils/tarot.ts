/**
 * Tarot data module — Rider–Waite–Smith deck.
 *
 * Pure TypeScript: no external dependencies, no Node/RN-only APIs.
 * Safe to run on-device.
 */

export interface TarotCard {
  /** kebab-case unique id, e.g. 'the-fool', 'ace-of-cups', 'two-of-swords' */
  id: string;
  /** Display name, e.g. 'The Fool', 'Ace of Cups', 'Two of Swords' */
  name: string;
  arcana: 'major' | 'minor';
  /** Minor arcana only */
  suit?: 'cups' | 'pentacles' | 'swords' | 'wands';
  /** Major: 0–21. Minor: 1–14 (11=Page, 12=Knight, 13=Queen, 14=King). */
  number: number;
  /** 3–5 concise keywords */
  keywords: string[];
  /** Upright interpretation (2–3 sentences) */
  upright: string;
  /** Reversed interpretation (2–3 sentences) */
  reversed: string;
}

/* ------------------------------------------------------------------ *
 * Major Arcana (0–21)
 * ------------------------------------------------------------------ */

const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 'the-fool',
    name: 'The Fool',
    arcana: 'major',
    number: 0,
    keywords: ['new beginnings', 'spontaneity', 'innocence', 'leap of faith'],
    upright:
      'The Fool marks the start of a fresh journey taken with an open, trusting heart. It urges you to embrace new experiences without overthinking the risks, following curiosity and instinct. In love and career alike, this is a signal to take that leap and trust where the path leads.',
    reversed:
      'Reversed, The Fool warns of recklessness, naivety, or leaping before you look. You may be ignoring good advice or avoiding a decision out of fear of commitment. Slow down, weigh the consequences, and make sure your enthusiasm is grounded in reality.',
  },
  {
    id: 'the-magician',
    name: 'The Magician',
    arcana: 'major',
    number: 1,
    keywords: ['manifestation', 'willpower', 'skill', 'resourcefulness'],
    upright:
      'The Magician shows you already hold every tool you need to manifest your goals. With focus, willpower, and clear intention, you can turn ideas into tangible results. This is a powerful time to take action and channel your talents toward what you truly desire.',
    reversed:
      'Reversed, The Magician points to untapped potential, manipulation, or scattered energy. You may be talking a big game without following through, or someone may be using charm to deceive. Realign your intentions with honest action before your plans stall.',
  },
  {
    id: 'the-high-priestess',
    name: 'The High Priestess',
    arcana: 'major',
    number: 2,
    keywords: ['intuition', 'mystery', 'inner voice', 'the subconscious'],
    upright:
      'The High Priestess invites you to trust your intuition and the quiet wisdom beneath the surface. Answers are available, but they come through stillness, dreams, and inner knowing rather than logic. Honor what you feel; a secret or deeper truth is waiting to be revealed.',
    reversed:
      'Reversed, this card suggests you are ignoring your inner voice or letting others drown it out. Hidden information, confusion, or disconnection from your intuition may be clouding the situation. Withdraw from the noise and reconnect with your own truth.',
  },
  {
    id: 'the-empress',
    name: 'The Empress',
    arcana: 'major',
    number: 3,
    keywords: ['abundance', 'nurturing', 'fertility', 'creativity'],
    upright:
      'The Empress radiates abundance, sensuality, and creative fertility. She encourages you to nurture yourself and your projects, allowing ideas, relationships, and beauty to flourish. In love this is warmth and devotion; in work it is a fruitful, creative season.',
    reversed:
      'Reversed, The Empress can indicate creative blocks, neglect of self-care, or smothering, dependent dynamics. You may be giving too much to others and leaving nothing for yourself. Reconnect with what nourishes you and let your natural creativity breathe again.',
  },
  {
    id: 'the-emperor',
    name: 'The Emperor',
    arcana: 'major',
    number: 4,
    keywords: ['authority', 'structure', 'stability', 'leadership'],
    upright:
      'The Emperor stands for structure, authority, and disciplined leadership. He advises you to build solid foundations, set clear boundaries, and take charge with confidence. Success now comes through order, strategy, and steady, responsible action.',
    reversed:
      'Reversed, The Emperor warns of rigidity, domination, or a loss of control. You may be clashing with an overbearing figure, or struggling to assert yourself. Balance firmness with flexibility and reclaim your own authority.',
  },
  {
    id: 'the-hierophant',
    name: 'The Hierophant',
    arcana: 'major',
    number: 5,
    keywords: ['tradition', 'guidance', 'belief systems', 'conformity'],
    upright:
      'The Hierophant represents tradition, spiritual guidance, and established institutions. It suggests learning from a mentor, honoring proven paths, or seeking meaning within a shared belief system. In relationships it can point to commitment and conventional milestones like marriage.',
    reversed:
      'Reversed, The Hierophant challenges you to question dogma and forge your own path. You may feel restricted by convention or rebel against outdated rules. Trust your personal values over what tradition dictates you should do.',
  },
  {
    id: 'the-lovers',
    name: 'The Lovers',
    arcana: 'major',
    number: 6,
    keywords: ['love', 'harmony', 'choices', 'alignment of values'],
    upright:
      'The Lovers speak of deep connection, harmony, and meaningful choices made from the heart. This card highlights a union built on shared values and honest communication. It can also signal a significant decision where you must choose what truly aligns with who you are.',
    reversed:
      'Reversed, The Lovers point to disharmony, misaligned values, or difficult choices avoided. There may be imbalance in a relationship or an internal conflict between desire and duty. Address the tension openly rather than letting it fester.',
  },
  {
    id: 'the-chariot',
    name: 'The Chariot',
    arcana: 'major',
    number: 7,
    keywords: ['determination', 'willpower', 'victory', 'control'],
    upright:
      'The Chariot signals victory through focus, determination, and disciplined willpower. By harnessing opposing forces and staying committed to your direction, you can overcome obstacles. Success is within reach if you keep your drive and confidence steady.',
    reversed:
      'Reversed, The Chariot suggests loss of direction, scattered energy, or forcing an outcome. You may feel pulled in different directions or thwarted by lack of control. Regain focus and align your inner and outer efforts before pushing forward.',
  },
  {
    id: 'strength',
    name: 'Strength',
    arcana: 'major',
    number: 8,
    keywords: ['courage', 'inner strength', 'compassion', 'patience'],
    upright:
      'Strength is the quiet power of courage, patience, and gentle self-mastery. It reminds you that true influence comes from compassion and calm resolve rather than brute force. Tame your fears and inner turmoil with kindness, and you will prevail.',
    reversed:
      'Reversed, Strength points to self-doubt, low confidence, or raw emotions running the show. You may feel overwhelmed or be forcing control instead of finding gentleness. Reconnect with your inner courage and treat yourself with patience.',
  },
  {
    id: 'the-hermit',
    name: 'The Hermit',
    arcana: 'major',
    number: 9,
    keywords: ['introspection', 'solitude', 'inner guidance', 'soul-searching'],
    upright:
      'The Hermit calls for solitude, reflection, and a search for inner truth. Stepping back from the noise allows you to find answers within and gain hard-won wisdom. This is a time for soul-searching and perhaps guiding others with what you learn.',
    reversed:
      'Reversed, The Hermit can mean isolation, loneliness, or withdrawing too far from the world. Alternatively, you may be avoiding necessary reflection by keeping busy. Balance introspection with reconnection to those who matter.',
  },
  {
    id: 'wheel-of-fortune',
    name: 'Wheel of Fortune',
    arcana: 'major',
    number: 10,
    keywords: ['cycles', 'change', 'fate', 'turning point'],
    upright:
      'The Wheel of Fortune turns toward change, luck, and the natural cycles of life. A pivotal turning point is arriving, often bringing welcome opportunity. Stay adaptable and trust that fate is moving in your favor.',
    reversed:
      'Reversed, the Wheel signals bad luck, resistance to change, or feeling stuck in a downturn. Clinging to what was only prolongs the struggle. Accept that cycles turn and look for the lesson in the current chapter.',
  },
  {
    id: 'justice',
    name: 'Justice',
    arcana: 'major',
    number: 11,
    keywords: ['fairness', 'truth', 'cause and effect', 'accountability'],
    upright:
      'Justice represents fairness, truth, and the law of cause and effect. Your past actions are coming to account, and decisions made now should be balanced and honest. Expect clarity, accountability, and outcomes that reflect what is truly deserved.',
    reversed:
      'Reversed, Justice warns of unfairness, dishonesty, or avoiding responsibility for your choices. You may be experiencing an imbalance or refusing to face the truth. Take ownership and act with integrity to set things right.',
  },
  {
    id: 'the-hanged-man',
    name: 'The Hanged Man',
    arcana: 'major',
    number: 12,
    keywords: ['surrender', 'new perspective', 'pause', 'letting go'],
    upright:
      'The Hanged Man invites surrender and a willingness to see things from a new angle. By pausing and releasing the need to control, you gain valuable insight and spiritual perspective. Sometimes progress comes from stillness rather than struggle.',
    reversed:
      'Reversed, The Hanged Man suggests stalling, resistance, or needless martyrdom. You may be delaying an inevitable decision or clinging to an outdated viewpoint. Let go of what no longer serves you and allow movement to return.',
  },
  {
    id: 'death',
    name: 'Death',
    arcana: 'major',
    number: 13,
    keywords: ['endings', 'transformation', 'transition', 'release'],
    upright:
      'Death signals a profound ending that clears the way for transformation and rebirth. A chapter is closing so something new can begin; resisting only causes suffering. Embrace the change and trust that this transition leads to renewal.',
    reversed:
      'Reversed, Death points to resistance to change, fear of endings, or being stuck in the past. You may be clinging to a situation that has already run its course. Allow the necessary release so you can move forward.',
  },
  {
    id: 'temperance',
    name: 'Temperance',
    arcana: 'major',
    number: 14,
    keywords: ['balance', 'moderation', 'patience', 'harmony'],
    upright:
      'Temperance is the art of balance, patience, and blending opposites into harmony. It advises a measured, moderate approach and finding the middle path. In love and work, calm cooperation and steady adjustment bring lasting peace.',
    reversed:
      'Reversed, Temperance indicates imbalance, excess, or impatience throwing you off center. You may be overdoing something or struggling to reconcile conflicting needs. Restore moderation and realign with your long-term purpose.',
  },
  {
    id: 'the-devil',
    name: 'The Devil',
    arcana: 'major',
    number: 15,
    keywords: ['bondage', 'addiction', 'materialism', 'shadow self'],
    upright:
      'The Devil reveals unhealthy attachments, addictions, or patterns that keep you bound. It asks you to recognize where you feel trapped, whether by desire, fear, or dependency. Awareness is the first step to freeing yourself from these self-imposed chains.',
    reversed:
      'Reversed, The Devil signals breaking free from bondage and reclaiming your power. You are confronting your shadow and releasing what once controlled you. Stay vigilant, as the pull of old habits can still tempt you back.',
  },
  {
    id: 'the-tower',
    name: 'The Tower',
    arcana: 'major',
    number: 16,
    keywords: ['sudden upheaval', 'revelation', 'chaos', 'awakening'],
    upright:
      'The Tower brings sudden upheaval that shatters false foundations and illusions. Though disruptive, this shock clears away what was built on shaky ground and reveals the truth. Let the old structure fall so something more authentic can rise.',
    reversed:
      'Reversed, The Tower suggests you are resisting or delaying a necessary collapse, or slowly moving through disaster. Fear of change may be prolonging the tension. Face the truth now to avoid a larger reckoning later.',
  },
  {
    id: 'the-star',
    name: 'The Star',
    arcana: 'major',
    number: 17,
    keywords: ['hope', 'renewal', 'inspiration', 'serenity'],
    upright:
      'The Star shines with hope, healing, and renewed faith after a difficult time. It offers gentle inspiration and the reassurance that you are on the right path. Open yourself to optimism, and let your authentic light guide the way forward.',
    reversed:
      'Reversed, The Star points to discouragement, lost faith, or feeling spiritually disconnected. You may be struggling to see the light amid your challenges. Be gentle with yourself and slowly rebuild hope from within.',
  },
  {
    id: 'the-moon',
    name: 'The Moon',
    arcana: 'major',
    number: 18,
    keywords: ['illusion', 'intuition', 'uncertainty', 'the subconscious'],
    upright:
      'The Moon illuminates the realm of dreams, intuition, and hidden fears. Things may not be as they appear, so trust your instincts as you navigate uncertainty. Let buried emotions surface to be understood rather than feared.',
    reversed:
      'Reversed, The Moon suggests confusion lifting, secrets revealed, or repressed feelings being released. Clarity is beginning to return after a period of anxiety or deception. Trust the truth as it emerges and quiet your unfounded fears.',
  },
  {
    id: 'the-sun',
    name: 'The Sun',
    arcana: 'major',
    number: 19,
    keywords: ['joy', 'success', 'vitality', 'positivity'],
    upright:
      'The Sun is one of the most joyful cards, radiating success, warmth, and vitality. It promises clarity, confidence, and happiness in whatever you undertake. Celebrate your achievements and let your genuine optimism light up everything around you.',
    reversed:
      'Reversed, The Sun points to temporary clouds over your joy, self-doubt, or dimmed enthusiasm. Success may be delayed or your positivity may feel forced. Reconnect with simple pleasures and let your inner light shine through again.',
  },
  {
    id: 'judgement',
    name: 'Judgement',
    arcana: 'major',
    number: 20,
    keywords: ['reckoning', 'awakening', 'renewal', 'inner calling'],
    upright:
      'Judgement heralds an awakening, a moment of reckoning and profound self-reflection. You are called to rise, release the past, and embrace a higher purpose. Honest evaluation of your life leads to renewal and a clear sense of direction.',
    reversed:
      'Reversed, Judgement suggests self-doubt, harsh self-criticism, or ignoring an inner calling. You may be struggling to forgive yourself or avoiding an important reckoning. Listen for the deeper call and let go of unfair judgments.',
  },
  {
    id: 'the-world',
    name: 'The World',
    arcana: 'major',
    number: 21,
    keywords: ['completion', 'fulfillment', 'wholeness', 'accomplishment'],
    upright:
      'The World marks completion, fulfillment, and the joyful close of a major cycle. Your efforts have come full circle, bringing a deep sense of accomplishment and wholeness. Celebrate this success, then step confidently toward the next chapter.',
    reversed:
      'Reversed, The World signals unfinished business, delayed closure, or goals just out of reach. You may feel stuck near the finish line or reluctant to complete something. Identify the loose ends and give the cycle the completion it needs.',
  },
];

/* ------------------------------------------------------------------ *
 * Minor Arcana
 * ------------------------------------------------------------------ */

interface MinorMeaning {
  keywords: string[];
  upright: string;
  reversed: string;
}

type Rank =
  | 'Ace'
  | 'Two'
  | 'Three'
  | 'Four'
  | 'Five'
  | 'Six'
  | 'Seven'
  | 'Eight'
  | 'Nine'
  | 'Ten'
  | 'Page'
  | 'Knight'
  | 'Queen'
  | 'King';

const RANKS: { rank: Rank; number: number; slug: string }[] = [
  { rank: 'Ace', number: 1, slug: 'ace' },
  { rank: 'Two', number: 2, slug: 'two' },
  { rank: 'Three', number: 3, slug: 'three' },
  { rank: 'Four', number: 4, slug: 'four' },
  { rank: 'Five', number: 5, slug: 'five' },
  { rank: 'Six', number: 6, slug: 'six' },
  { rank: 'Seven', number: 7, slug: 'seven' },
  { rank: 'Eight', number: 8, slug: 'eight' },
  { rank: 'Nine', number: 9, slug: 'nine' },
  { rank: 'Ten', number: 10, slug: 'ten' },
  { rank: 'Page', number: 11, slug: 'page' },
  { rank: 'Knight', number: 12, slug: 'knight' },
  { rank: 'Queen', number: 13, slug: 'queen' },
  { rank: 'King', number: 14, slug: 'king' },
];

const CUPS: Record<Rank, MinorMeaning> = {
  Ace: {
    keywords: ['new love', 'emotional beginnings', 'compassion', 'intuition'],
    upright:
      'The Ace of Cups overflows with new emotional beginnings, love, and spiritual connection. A fresh source of joy, compassion, or creative feeling is opening up to you. Let your heart be receptive and allow this warmth to flow freely.',
    reversed:
      'Reversed, the Ace of Cups points to blocked emotions, repressed feelings, or an emotional emptiness. You may be holding love back or feeling drained. Reconnect with your heart and allow yourself to give and receive again.',
  },
  Two: {
    keywords: ['partnership', 'mutual attraction', 'union', 'connection'],
    upright:
      'The Two of Cups celebrates mutual attraction, partnership, and harmonious connection. Two people meet as equals, bound by respect and genuine affection. This is a beautiful omen for love, friendship, and balanced cooperation.',
    reversed:
      'Reversed, the Two of Cups signals imbalance, tension, or a breakdown in a relationship. Miscommunication or unequal effort may be straining the bond. Address the disharmony honestly to restore trust and connection.',
  },
  Three: {
    keywords: ['celebration', 'friendship', 'community', 'joy'],
    upright:
      'The Three of Cups is a joyful card of celebration, friendship, and community. It marks happy gatherings, shared successes, and the support of your circle. Enjoy these moments of togetherness and let good company lift your spirit.',
    reversed:
      'Reversed, the Three of Cups can indicate gossip, overindulgence, or feeling excluded from your group. Social ties may feel strained or superficial. Reassess which connections truly nourish you and set healthier boundaries.',
  },
  Four: {
    keywords: ['apathy', 'contemplation', 'reevaluation', 'discontent'],
    upright:
      'The Four of Cups reflects apathy, boredom, and turning inward in discontent. You may be so focused on what is missing that you overlook an opportunity being offered. Take time to reflect, but stay open to the gift right in front of you.',
    reversed:
      'Reversed, the Four of Cups suggests renewed interest, motivation, and emerging from withdrawal. You are ready to reengage with the world and seize new possibilities. Let go of stagnation and step back into life.',
  },
  Five: {
    keywords: ['loss', 'grief', 'regret', 'disappointment'],
    upright:
      'The Five of Cups dwells on loss, grief, and disappointment over what has gone wrong. It acknowledges real sorrow, yet reminds you that not everything has been lost. When you are ready, turn and notice the cups still standing behind you.',
    reversed:
      'Reversed, the Five of Cups signals acceptance, healing, and moving on from grief. You are forgiving the past and finding hope again. Release regret and allow yourself to look forward with renewed peace.',
  },
  Six: {
    keywords: ['nostalgia', 'childhood', 'reunion', 'innocence'],
    upright:
      'The Six of Cups brings warm nostalgia, cherished memories, and innocent joy. It may signal a reunion, a gift, or reconnecting with someone from your past. Let the sweetness of simpler times comfort and inspire you.',
    reversed:
      'Reversed, the Six of Cups warns of clinging to the past or idealizing what once was. Living in nostalgia may keep you from embracing the present. Honor good memories, but ground yourself firmly in the here and now.',
  },
  Seven: {
    keywords: ['choices', 'illusion', 'fantasy', 'wishful thinking'],
    upright:
      'The Seven of Cups presents many tempting options wrapped in fantasy and illusion. It cautions that not every glittering choice is grounded in reality. Clarify what you truly want before committing, and beware wishful thinking.',
    reversed:
      'Reversed, the Seven of Cups brings clarity and decisive focus after a period of confusion. The fog lifts and you can see which path is real and worthwhile. Commit to a clear goal rather than scattering your energy.',
  },
  Eight: {
    keywords: ['walking away', 'seeking meaning', 'transition', 'letting go'],
    upright:
      'The Eight of Cups is about walking away from what no longer fulfills you in search of deeper meaning. Even if the situation looks fine on the surface, your heart knows it is time to move on. Trust the call to pursue something more meaningful.',
    reversed:
      'Reversed, the Eight of Cups reflects indecision about leaving, or fear of the unknown keeping you stuck. You may drift between staying and going. Get honest about what your soul needs and act with intention.',
  },
  Nine: {
    keywords: ['contentment', 'satisfaction', 'gratitude', 'wish fulfilled'],
    upright:
      'The Nine of Cups is the "wish card," promising contentment, satisfaction, and emotional fulfillment. Your hopes are coming true and there is much to feel grateful for. Savor this well-earned sense of happiness and abundance.',
    reversed:
      'Reversed, the Nine of Cups warns of overindulgence, smugness, or seeking happiness in the wrong places. External pleasures may leave you feeling hollow. Look inward to find what truly satisfies your heart.',
  },
  Ten: {
    keywords: ['harmony', 'family', 'lasting happiness', 'fulfillment'],
    upright:
      'The Ten of Cups radiates lasting happiness, emotional harmony, and loving family bonds. It represents a dream of contentment realized, with deep connection and peace at home. Cherish this fulfillment shared with those you love.',
    reversed:
      'Reversed, the Ten of Cups suggests disharmony in the home, misaligned values, or a gap between the ideal and reality. Family tension or broken expectations may weigh on you. Work to repair the bonds and realign with what truly matters.',
  },
  Page: {
    keywords: ['creative message', 'intuition', 'sensitivity', 'new feelings'],
    upright:
      'The Page of Cups brings gentle, creative energy and messages of the heart. Stay open to intuition, imagination, and unexpected emotional beginnings. A sensitive, curious approach invites love and inspiration into your life.',
    reversed:
      'Reversed, the Page of Cups points to emotional immaturity, insecurity, or creative blocks. You may be avoiding feelings or reacting with moodiness. Reconnect with your inner child and express your emotions in healthy ways.',
  },
  Knight: {
    keywords: ['romance', 'charm', 'idealism', 'following the heart'],
    upright:
      'The Knight of Cups is the romantic dreamer, moving with charm, imagination, and heartfelt intention. An invitation, proposal, or creative pursuit may arrive on a wave of feeling. Follow your heart, but keep your ideals grounded.',
    reversed:
      'Reversed, the Knight of Cups warns of moodiness, unrealistic promises, or a wolf in charming clothing. Emotions may be manipulated or fantasies mistaken for reality. Look past the sweet words to see what is genuinely true.',
  },
  Queen: {
    keywords: ['compassion', 'emotional security', 'nurturing', 'intuition'],
    upright:
      'The Queen of Cups embodies compassion, emotional depth, and intuitive wisdom. She nurtures others while remaining anchored in her own feelings. Lead with empathy and trust your intuition to guide caring, heartfelt decisions.',
    reversed:
      'Reversed, the Queen of Cups can indicate emotional overwhelm, martyrdom, or codependency. You may be giving too much or letting feelings cloud your judgment. Restore your emotional boundaries and care for yourself first.',
  },
  King: {
    keywords: ['emotional balance', 'compassion', 'diplomacy', 'wisdom'],
    upright:
      'The King of Cups masters emotional balance, leading with compassion, calm, and diplomacy. He feels deeply yet stays composed under pressure. Approach challenges with a steady heart and mature, generous wisdom.',
    reversed:
      'Reversed, the King of Cups suggests emotional manipulation, moodiness, or suppressed feelings turning volatile. You may be struggling to manage strong emotions or facing someone who does. Reconnect with balance before reacting.',
  },
};

const PENTACLES: Record<Rank, MinorMeaning> = {
  Ace: {
    keywords: ['opportunity', 'prosperity', 'new venture', 'manifestation'],
    upright:
      'The Ace of Pentacles offers a golden new opportunity for prosperity, security, and material growth. A seed is being planted that, with care, can grow into lasting abundance. Take practical action to nurture this promising beginning.',
    reversed:
      'Reversed, the Ace of Pentacles warns of missed opportunities, poor planning, or shaky financial footing. A promising venture may lack solid grounding. Reassess your resources and plan carefully before moving ahead.',
  },
  Two: {
    keywords: ['balance', 'adaptability', 'prioritization', 'time management'],
    upright:
      'The Two of Pentacles is about juggling multiple priorities with flexibility and grace. You are balancing responsibilities, finances, or commitments and managing them well. Stay adaptable and keep your energy in healthy motion.',
    reversed:
      'Reversed, the Two of Pentacles signals overwhelm, disorganization, or dropping the ball. You may be overcommitted and struggling to keep up. Simplify, reprioritize, and let go of what you cannot sustainably carry.',
  },
  Three: {
    keywords: ['teamwork', 'collaboration', 'skill', 'craftsmanship'],
    upright:
      'The Three of Pentacles honors teamwork, skilled craftsmanship, and collaborative achievement. Your talents are recognized as you build something worthwhile with others. Combine effort and expertise, and quality results will follow.',
    reversed:
      'Reversed, the Three of Pentacles points to poor teamwork, lack of coordination, or unrecognized effort. Misaligned goals or ego may be undermining the project. Clarify roles and rebuild cooperation to move forward.',
  },
  Four: {
    keywords: ['security', 'control', 'saving', 'holding on'],
    upright:
      'The Four of Pentacles reflects a desire for security, stability, and control over resources. Saving and protecting what you have brings a sense of safety. Be mindful, though, that holding too tightly can block flow and growth.',
    reversed:
      'Reversed, the Four of Pentacles suggests either releasing a tight grip or, conversely, reckless spending. You may be learning to loosen up around money and control. Find a healthier balance between security and generosity.',
  },
  Five: {
    keywords: ['hardship', 'insecurity', 'isolation', 'worry'],
    upright:
      'The Five of Pentacles depicts hardship, financial worry, or feeling left out in the cold. It acknowledges struggle and the loneliness that can come with it. Remember that help is nearby if you are willing to reach for it.',
    reversed:
      'Reversed, the Five of Pentacles brings recovery, renewed hope, and the end of a difficult spell. Support arrives and your circumstances begin to improve. Accept the help offered and step out of isolation.',
  },
  Six: {
    keywords: ['generosity', 'charity', 'giving and receiving', 'balance'],
    upright:
      'The Six of Pentacles embodies generosity and the healthy flow of giving and receiving. Resources are being shared fairly, whether you are the giver or the grateful recipient. Kindness and balance strengthen your community and prosperity.',
    reversed:
      'Reversed, the Six of Pentacles warns of strings-attached giving, debt, or imbalanced power in exchanges. Generosity may be used to control, or you may be stuck in dependence. Restore fairness and honest reciprocity.',
  },
  Seven: {
    keywords: ['patience', 'long-term view', 'investment', 'assessment'],
    upright:
      'The Seven of Pentacles is a moment to pause and assess the fruits of your labor. Your investments are growing, but patience and perseverance are still required. Evaluate your progress and decide where to focus for the long term.',
    reversed:
      'Reversed, the Seven of Pentacles points to impatience, wasted effort, or poor returns on your work. You may feel frustrated that results are slow. Reconsider whether your energy is planted in fertile ground.',
  },
  Eight: {
    keywords: ['diligence', 'mastery', 'skill development', 'dedication'],
    upright:
      'The Eight of Pentacles celebrates diligence, focus, and the steady mastery of your craft. Dedicated practice and attention to detail are refining your skills. Keep at it, for consistent effort now builds true expertise.',
    reversed:
      'Reversed, the Eight of Pentacles suggests perfectionism, boredom, or cutting corners. You may be losing motivation or working without heart. Reconnect with the purpose behind your work or channel your energy elsewhere.',
  },
  Nine: {
    keywords: ['independence', 'self-sufficiency', 'luxury', 'reward'],
    upright:
      'The Nine of Pentacles is the reward of self-sufficiency, refinement, and well-earned comfort. Your discipline has created independence and the freedom to enjoy life’s pleasures. Take pride in what you have built on your own.',
    reversed:
      'Reversed, the Nine of Pentacles warns of overworking, financial dependence, or hollow luxury. You may be sacrificing well-being for status or neglecting self-worth. Reconnect with genuine security that comes from within.',
  },
  Ten: {
    keywords: ['legacy', 'wealth', 'family', 'long-term security'],
    upright:
      'The Ten of Pentacles represents lasting wealth, family legacy, and long-term security. It signals stability that can be shared across generations and enjoyed with loved ones. Your foundations are solid enough to endure.',
    reversed:
      'Reversed, the Ten of Pentacles points to financial instability, family disputes, or fleeting success. Long-term plans may be threatened by short-term thinking. Protect your foundations and address conflicts over resources.',
  },
  Page: {
    keywords: ['ambition', 'study', 'new opportunity', 'manifestation'],
    upright:
      'The Page of Pentacles brings a studious, ambitious energy focused on new opportunities. It is a fine time to learn a skill, start a venture, or plant seeds for the future. Approach your goals with curiosity and practical dedication.',
    reversed:
      'Reversed, the Page of Pentacles suggests procrastination, lack of follow-through, or unrealistic plans. You may be dreaming without doing. Turn your ideas into concrete first steps to make real progress.',
  },
  Knight: {
    keywords: ['hard work', 'responsibility', 'routine', 'reliability'],
    upright:
      'The Knight of Pentacles is the dependable, hardworking builder who values routine and consistency. Slow and steady, he sees commitments through to the end. Trust methodical effort and reliability to carry you to success.',
    reversed:
      'Reversed, the Knight of Pentacles can indicate stagnation, boredom, or being overly cautious to the point of inertia. Work may feel dull or progress stuck. Introduce fresh purpose or flexibility to break the monotony.',
  },
  Queen: {
    keywords: ['nurturing', 'practicality', 'resourcefulness', 'security'],
    upright:
      'The Queen of Pentacles blends warmth and practicality, nurturing both people and prosperity. She creates a secure, comfortable environment while managing resources wisely. Care for others and your finances with grounded, generous competence.',
    reversed:
      'Reversed, the Queen of Pentacles warns of work-life imbalance, self-neglect, or smothering. You may be overextending yourself materially or emotionally. Restore balance and remember to nurture your own needs too.',
  },
  King: {
    keywords: ['abundance', 'security', 'leadership', 'discipline'],
    upright:
      'The King of Pentacles is the master of wealth, stability, and disciplined leadership. Through diligence and sound judgment, he enjoys abundance and provides generously. Lead with reliability and let hard-won success support those around you.',
    reversed:
      'Reversed, the King of Pentacles points to greed, materialism, or stubborn control over money. Success may be pursued at the expense of ethics or relationships. Reevaluate what truly matters beyond material gain.',
  },
};

const SWORDS: Record<Rank, MinorMeaning> = {
  Ace: {
    keywords: ['clarity', 'breakthrough', 'truth', 'new ideas'],
    upright:
      'The Ace of Swords cuts through confusion with mental clarity and a powerful breakthrough. A new idea, insight, or truth gives you the sharp focus to move forward. Wield this clarity with honesty and decisive intention.',
    reversed:
      'Reversed, the Ace of Swords signals confusion, clouded judgment, or misused information. You may be struggling to think clearly or communicating poorly. Step back, gather the facts, and seek the truth before acting.',
  },
  Two: {
    keywords: ['difficult choice', 'stalemate', 'indecision', 'avoidance'],
    upright:
      'The Two of Swords depicts a difficult decision at a stalemate, often with emotions blindfolded from view. You may be avoiding a choice to keep an uneasy peace. Remove the blindfold, weigh the truth, and commit to a direction.',
    reversed:
      'Reversed, the Two of Swords suggests indecision breaking, information revealed, or being overwhelmed by choices. The stalemate is shifting, for better or worse. Face the truth you have been avoiding and decide.',
  },
  Three: {
    keywords: ['heartbreak', 'sorrow', 'painful truth', 'grief'],
    upright:
      'The Three of Swords represents heartbreak, painful truth, and deep emotional sorrow. It acknowledges genuine hurt, whether from loss, betrayal, or hard words. Allow yourself to grieve, for facing the pain is the first step to healing.',
    reversed:
      'Reversed, the Three of Swords points to recovery, forgiveness, and releasing old pain. The worst of the heartache is passing as you begin to heal. Let go of lingering resentment and reclaim your peace.',
  },
  Four: {
    keywords: ['rest', 'recovery', 'contemplation', 'recuperation'],
    upright:
      'The Four of Swords calls for rest, recovery, and quiet contemplation after stress. Stepping back to recharge is not weakness but necessary healing. Give yourself permission to pause before re-entering the fray.',
    reversed:
      'Reversed, the Four of Swords suggests restlessness, burnout, or being forced to slow down. You may be resisting needed rest or emerging from a period of recovery. Honor your limits and reintroduce activity gently.',
  },
  Five: {
    keywords: ['conflict', 'defeat', 'winning at all costs', 'discord'],
    upright:
      'The Five of Swords reflects conflict, tension, and hollow victories won at others’ expense. Pride or the need to win may be damaging relationships. Consider whether the fight is truly worth the cost.',
    reversed:
      'Reversed, the Five of Swords signals reconciliation, making amends, or walking away from conflict. You are ready to release resentment and pursue peace. Choose forgiveness over the exhausting need to be right.',
  },
  Six: {
    keywords: ['transition', 'moving on', 'recovery', 'letting go'],
    upright:
      'The Six of Swords carries you away from turbulent waters toward calmer shores. It marks a necessary transition, a gradual move toward healing and stability. Trust that leaving hardship behind leads to smoother days.',
    reversed:
      'Reversed, the Six of Swords suggests resistance to change, unfinished business, or feeling stuck in troubled waters. You may be carrying baggage you need to release. Address what keeps you anchored so you can move forward.',
  },
  Seven: {
    keywords: ['deception', 'strategy', 'stealth', 'getting away with it'],
    upright:
      'The Seven of Swords involves strategy, cunning, and sometimes deception or acting alone. It may warn of dishonesty, or advise a discreet, clever approach. Be mindful of trust, and make sure your own tactics are ethical.',
    reversed:
      'Reversed, the Seven of Swords points to confession, coming clean, or getting caught. Hidden truths are surfacing and honesty is needed. Release the burden of deception and act with integrity.',
  },
  Eight: {
    keywords: ['restriction', 'self-imposed limits', 'powerlessness', 'entrapment'],
    upright:
      'The Eight of Swords depicts feeling trapped, restricted, and powerless within a mental prison. Yet the bindings are looser than they appear, and much of the limitation is self-imposed. Shift your perspective and you will find a way out.',
    reversed:
      'Reversed, the Eight of Swords signals liberation, new clarity, and freeing yourself from limiting beliefs. You are recognizing your own power to escape the trap. Take that first courageous step toward freedom.',
  },
  Nine: {
    keywords: ['anxiety', 'worry', 'fear', 'sleepless nights'],
    upright:
      'The Nine of Swords embodies anxiety, worry, and the fears that keep you awake at night. Your mind may be magnifying troubles far beyond their reality. Bring these fears into the light, for they lose power once examined.',
    reversed:
      'Reversed, the Nine of Swords suggests anxiety beginning to ease, hope returning, or facing your fears. The worst of the worry is lifting as you seek support. Release the nightmares and let recovery begin.',
  },
  Ten: {
    keywords: ['painful ending', 'rock bottom', 'betrayal', 'closure'],
    upright:
      'The Ten of Swords marks a painful but final ending, hitting rock bottom before a new dawn. Though it feels like defeat, the worst is now behind you. Accept the closure, for from here the only way is up.',
    reversed:
      'Reversed, the Ten of Swords points to recovery, resisting the end, or fear of further pain. You are slowly rising from a difficult low. Release the last of the hurt and allow yourself to begin again.',
  },
  Page: {
    keywords: ['curiosity', 'new ideas', 'vigilance', 'communication'],
    upright:
      'The Page of Swords is alert, curious, and hungry for truth and new ideas. It is a good time to ask questions, learn, and communicate with sharp honesty. Stay vigilant and channel your mental energy constructively.',
    reversed:
      'Reversed, the Page of Swords warns of gossip, hasty words, or scattered, defensive thinking. You may be all talk or using words to cut rather than clarify. Slow down and think before you speak.',
  },
  Knight: {
    keywords: ['ambition', 'drive', 'fast action', 'directness'],
    upright:
      'The Knight of Swords charges forward with ambition, intellect, and fearless drive. Focused and direct, he pursues goals with speed and conviction. Act boldly, but make sure your haste does not outrun your wisdom.',
    reversed:
      'Reversed, the Knight of Swords suggests recklessness, impatience, or aggressive, scattered energy. You may be rushing in without a plan or bulldozing others. Temper your drive with thought and consideration.',
  },
  Queen: {
    keywords: ['clarity', 'independence', 'honesty', 'sharp intellect'],
    upright:
      'The Queen of Swords leads with sharp intellect, honesty, and clear, unbiased judgment. She values truth and independence, cutting through emotion to see things as they are. Speak your truth directly and set firm, fair boundaries.',
    reversed:
      'Reversed, the Queen of Swords can indicate coldness, bitterness, or overly harsh criticism. Past pain may be hardening your heart. Balance your clear thinking with compassion for yourself and others.',
  },
  King: {
    keywords: ['authority', 'intellect', 'truth', 'fair judgment'],
    upright:
      'The King of Swords rules with intellectual authority, integrity, and fair, rational judgment. He makes decisions guided by truth, logic, and clear ethical principles. Lead with your head, uphold high standards, and communicate with clarity.',
    reversed:
      'Reversed, the King of Swords warns of manipulation, cold ruthlessness, or misuse of power. Logic may be twisted to justify harsh or self-serving ends. Realign your intellect with honesty and compassion.',
  },
};

const WANDS: Record<Rank, MinorMeaning> = {
  Ace: {
    keywords: ['inspiration', 'new energy', 'passion', 'potential'],
    upright:
      'The Ace of Wands ignites a spark of inspiration, passion, and creative potential. A new venture, idea, or burst of energy is ready to be pursued. Seize the moment and let your enthusiasm fuel bold action.',
    reversed:
      'Reversed, the Ace of Wands signals delays, lack of motivation, or a false start. Your creative spark may feel blocked or your timing off. Reconnect with what truly excites you before pushing ahead.',
  },
  Two: {
    keywords: ['planning', 'future vision', 'decisions', 'progress'],
    upright:
      'The Two of Wands is about planning ahead and envisioning a bigger future. You hold the world in your hands and must decide how far you dare to reach. Map your ambitions and take the first steps beyond your comfort zone.',
    reversed:
      'Reversed, the Two of Wands suggests fear of the unknown, playing it safe, or poor planning. You may be hesitating to leave familiar ground. Clarify your vision and gather the courage to move forward.',
  },
  Three: {
    keywords: ['expansion', 'foresight', 'progress', 'opportunity'],
    upright:
      'The Three of Wands shows your plans in motion as you look toward expanding horizons. Early efforts are paying off and new opportunities are on the way. Stay confident and keep your vision set on growth.',
    reversed:
      'Reversed, the Three of Wands points to delays, obstacles, or a lack of foresight in your plans. Progress may stall or expectations fall short. Reassess your strategy and prepare more thoroughly before advancing.',
  },
  Four: {
    keywords: ['celebration', 'harmony', 'homecoming', 'milestones'],
    upright:
      'The Four of Wands celebrates joyful milestones, harmony, and a sense of belonging. It marks weddings, homecomings, and happy communal occasions. Pause to enjoy this stability and the fruits of your shared efforts.',
    reversed:
      'Reversed, the Four of Wands suggests a delayed celebration, transition, or tension within home and family. The sense of harmony may feel incomplete. Address underlying issues so true stability can be restored.',
  },
  Five: {
    keywords: ['conflict', 'competition', 'disagreement', 'tension'],
    upright:
      'The Five of Wands reflects competition, clashing egos, and lively disagreement. The conflict is often more chaotic than serious, testing your ideas against others. Channel the friction constructively and stand your ground with respect.',
    reversed:
      'Reversed, the Five of Wands signals conflict resolution, avoiding a fight, or inner tension. You may be seeking harmony or suppressing disagreement. Address issues openly rather than letting them simmer.',
  },
  Six: {
    keywords: ['victory', 'recognition', 'success', 'public reward'],
    upright:
      'The Six of Wands is the card of victory, public recognition, and well-earned success. Your efforts are being acknowledged and confidence carries you forward. Enjoy the applause and let this momentum propel you.',
    reversed:
      'Reversed, the Six of Wands points to lack of recognition, self-doubt, or a fall from favor. Success may feel delayed or unappreciated. Reconnect with your own sense of accomplishment regardless of outside praise.',
  },
  Seven: {
    keywords: ['defense', 'perseverance', 'standing your ground', 'challenge'],
    upright:
      'The Seven of Wands is about standing firm and defending your position against challenge. You have the higher ground, so hold your convictions with courage. Perseverance now protects what you have worked to build.',
    reversed:
      'Reversed, the Seven of Wands suggests feeling overwhelmed, giving up, or growing exhausted from constant defense. You may be losing confidence in the fight. Decide which battles truly deserve your energy.',
  },
  Eight: {
    keywords: ['swift action', 'momentum', 'movement', 'news'],
    upright:
      'The Eight of Wands brings swift movement, momentum, and rapid developments. Things are accelerating, and news, travel, or messages arrive quickly. Act on this fast-moving energy while the pace is in your favor.',
    reversed:
      'Reversed, the Eight of Wands signals delays, frustration, or losing momentum. Plans may stall or communication may be tangled. Be patient and address whatever is blocking the natural flow.',
  },
  Nine: {
    keywords: ['resilience', 'persistence', 'last stand', 'boundaries'],
    upright:
      'The Nine of Wands embodies resilience and persistence in the face of near-exhaustion. Though weary and wary, you are close to the finish and must not give up now. Draw on your inner strength and defend your boundaries.',
    reversed:
      'Reversed, the Nine of Wands suggests burnout, defensiveness, or refusing to let your guard down. Old wounds may keep you overly cautious. Rest and release the past so you can heal rather than merely brace.',
  },
  Ten: {
    keywords: ['burden', 'responsibility', 'hard work', 'overload'],
    upright:
      'The Ten of Wands depicts carrying a heavy burden of responsibilities and obligations. You may be overloaded, taking on far more than your fair share. Delegate what you can and lighten the load before it wears you down.',
    reversed:
      'Reversed, the Ten of Wands signals releasing burdens, delegating, or finally putting down what is too heavy. You are learning that you need not carry everything alone. Free yourself from unnecessary weight.',
  },
  Page: {
    keywords: ['enthusiasm', 'exploration', 'new ideas', 'free spirit'],
    upright:
      'The Page of Wands bursts with enthusiasm, curiosity, and a free-spirited thirst for adventure. It is a wonderful time to explore new ideas and follow your excitement. Embrace fresh possibilities with youthful courage.',
    reversed:
      'Reversed, the Page of Wands suggests scattered energy, procrastination, or fear of pursuing your passion. Big ideas may lack direction or follow-through. Focus your enthusiasm and commit to concrete action.',
  },
  Knight: {
    keywords: ['adventure', 'passion', 'energy', 'impulsiveness'],
    upright:
      'The Knight of Wands charges after adventure with passion, charisma, and fearless energy. Bold and spontaneous, he pursues his desires with fiery confidence. Follow your excitement, but channel that fire toward a clear goal.',
    reversed:
      'Reversed, the Knight of Wands warns of impulsiveness, recklessness, or fizzling enthusiasm. You may start projects you never finish or act without thinking. Ground your fiery energy with patience and planning.',
  },
  Queen: {
    keywords: ['confidence', 'warmth', 'determination', 'charisma'],
    upright:
      'The Queen of Wands is confident, warm, and magnetic, radiating vitality and determination. She pursues her passions boldly while inspiring and uplifting others. Own your power, express your authentic self, and let your charisma shine.',
    reversed:
      'Reversed, the Queen of Wands can indicate self-doubt, jealousy, or a demanding, insecure streak. Your inner fire may be dimmed or turned inward. Reconnect with your confidence and lead from genuine self-assurance.',
  },
  King: {
    keywords: ['vision', 'leadership', 'boldness', 'inspiration'],
    upright:
      'The King of Wands is a visionary leader who inspires with boldness, charisma, and big-picture thinking. He turns ambitious ideas into reality and rallies others to his cause. Lead with confidence, creativity, and a clear, daring vision.',
    reversed:
      'Reversed, the King of Wands warns of arrogance, impulsiveness, or a domineering, hot-tempered leadership style. Vision may outrun patience or respect for others. Temper your ambition with humility and thoughtful timing.',
  },
};

const SUIT_DATA: {
  suit: NonNullable<TarotCard['suit']>;
  label: string;
  meanings: Record<Rank, MinorMeaning>;
}[] = [
  { suit: 'cups', label: 'Cups', meanings: CUPS },
  { suit: 'pentacles', label: 'Pentacles', meanings: PENTACLES },
  { suit: 'swords', label: 'Swords', meanings: SWORDS },
  { suit: 'wands', label: 'Wands', meanings: WANDS },
];

function buildMinorArcana(): TarotCard[] {
  const cards: TarotCard[] = [];
  for (const { suit, label, meanings } of SUIT_DATA) {
    for (const { rank, number, slug } of RANKS) {
      const meaning = meanings[rank];
      cards.push({
        id: `${slug}-of-${suit}`,
        name: `${rank} of ${label}`,
        arcana: 'minor',
        suit,
        number,
        keywords: meaning.keywords,
        upright: meaning.upright,
        reversed: meaning.reversed,
      });
    }
  }
  return cards;
}

/** The complete 78-card Rider–Waite–Smith deck. */
export const TAROT_DECK: TarotCard[] = [...MAJOR_ARCANA, ...buildMinorArcana()];

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Simple, dependency-free string hash (djb2 variant).
 * Returns a non-negative 32-bit integer.
 */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // hash * 33 + charCode, kept within 32-bit range.
    hash = (hash * 33 + input.charCodeAt(i)) | 0;
  }
  // Force to a non-negative value.
  return hash >>> 0;
}

/**
 * Deterministic daily card: the same seed always yields the same card.
 * Pass a stable seed such as a 'YYYY-MM-DD' date string.
 */
export function getDailyCard(seed: string): TarotCard {
  const index = hashString(seed) % TAROT_DECK.length;
  return TAROT_DECK[index];
}

/**
 * Draw `count` unique random cards for a spread.
 * Each result includes a `reversed` flag (only ever true when
 * `opts.allowReversed` is set). Uses Math.random (fine for readings).
 */
export function drawCards(
  count: number,
  opts?: { allowReversed?: boolean }
): { card: TarotCard; reversed: boolean }[] {
  const allowReversed = opts?.allowReversed ?? false;
  const n = Math.max(0, Math.min(Math.floor(count), TAROT_DECK.length));

  // Fisher–Yates shuffle on a copy of the indices, take the first `n`.
  const indices = TAROT_DECK.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }

  const results: { card: TarotCard; reversed: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const card = TAROT_DECK[indices[i]];
    const reversed = allowReversed ? Math.random() < 0.5 : false;
    results.push({ card, reversed });
  }
  return results;
}
