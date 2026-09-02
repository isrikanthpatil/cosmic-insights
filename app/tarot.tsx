import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Sparkles, Shuffle } from 'lucide-react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { tap } from '@/utils/haptics';
import { TAROT_DECK, TarotCard, getDailyCard, drawCards } from '@/utils/tarot';

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const SPREAD_POSITIONS = ['Past', 'Present', 'Future'];

export default function TarotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const daily = useMemo(() => getDailyCard(todayKey()), []);
  const [spread, setSpread] = useState<{ card: TarotCard; reversed: boolean }[] | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/more');
  };

  const draw = () => {
    tap();
    setSpread(drawCards(3, { allowReversed: true }));
  };

  const CardBlock = ({ card, reversed, position }: { card: TarotCard; reversed: boolean; position?: string }) => (
    <View style={styles.card}>
      {position && <Text style={styles.position}>{position}</Text>}
      <Text style={styles.cardName}>
        {card.name}{reversed ? '  (Reversed)' : ''}
      </Text>
      <Text style={styles.cardMeta}>
        {card.arcana === 'major' ? 'Major Arcana' : `${card.suit ? card.suit[0].toUpperCase() + card.suit.slice(1) : ''} · Minor Arcana`}
      </Text>
      <View style={styles.keywords}>
        {card.keywords.slice(0, 4).map((k) => (
          <View key={k} style={styles.kw}><Text style={styles.kwText}>{k}</Text></View>
        ))}
      </View>
      <Text style={styles.meaning}>{reversed ? card.reversed : card.upright}</Text>
    </View>
  );

  return (
    <ScreenBackground style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeft size={24} color="#E8C87E" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t('tarot.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Sparkles size={18} color="#E8C87E" />
          <Text style={styles.headerTitle}>{t('tarot.cardOfDay')}</Text>
        </View>
        <Text style={styles.headerSub}>A single card to reflect on today — the same for you all day.</Text>
        <CardBlock card={daily} reversed={false} />

        <View style={[styles.header, { marginTop: 24 }]}>
          <Shuffle size={18} color="#E8C87E" />
          <Text style={styles.headerTitle}>Three-Card Spread</Text>
        </View>
        <Text style={styles.headerSub}>Past · Present · Future. Take a breath, hold your question, and draw.</Text>

        <TouchableOpacity style={styles.drawButton} onPress={draw} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Draw three cards">
          <Shuffle size={18} color="#0B0B1A" />
          <Text style={styles.drawButtonText}>{spread ? 'Draw again' : 'Draw three cards'}</Text>
        </TouchableOpacity>

        {spread?.map((s, i) => (
          <CardBlock key={`${s.card.id}-${i}`} card={s.card} reversed={s.reversed} position={SPREAD_POSITIONS[i]} />
        ))}

        <Text style={styles.disclaimer}>
          Tarot is offered for reflection and self-insight, drawn from the {TAROT_DECK.length}-card Rider–Waite–Smith tradition. It is not a substitute for professional advice.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  topTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  headerSub: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8B88A0', marginTop: 4, marginBottom: 12, lineHeight: 17 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(232,200,126,0.25)', borderRadius: 16, padding: 16, marginBottom: 12 },
  position: { fontSize: 10, fontFamily: 'Inter-SemiBold', color: '#E8C87E', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  cardName: { fontSize: 19, fontFamily: 'PlayfairDisplay-Bold', color: '#F4F1E8' },
  cardMeta: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#B49BE6', marginTop: 2, marginBottom: 10 },
  keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  kw: { backgroundColor: 'rgba(232,200,126,0.10)', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  kwText: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#E8C87E' },
  meaning: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#C7C4D6', lineHeight: 21 },
  drawButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8C87E', paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  drawButtonText: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#0B0B1A' },
  disclaimer: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#6E6B84', lineHeight: 16, textAlign: 'center', marginTop: 16, paddingHorizontal: 8 },
});
