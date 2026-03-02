import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '@/context/auth';
import { getRecommendations, Recommendation } from '@/lib/gemini';
import { addFavorite, isFavorite } from '@/lib/storage';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

// ─── Data ─────────────────────────────────────────────────────────────────────

const MOODS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Relaxed', emoji: '😌' },
  { label: 'Excited', emoji: '🤩' },
  { label: 'Anxious', emoji: '😬' },
  { label: 'Angry', emoji: '😤' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Thoughtful', emoji: '🤔' },
];

const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror',
  'Sci-Fi', 'Romance', 'Thriller', 'Documentary',
  'Animation', 'Fantasy',
];

const TIME_OPTIONS = [
  { label: '< 30 min', value: 'under 30 minutes' },
  { label: '30–60 min', value: '30 to 60 minutes' },
  { label: '1–2 hrs', value: '1 to 2 hours' },
  { label: '2+ hrs', value: 'more than 2 hours' },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function RecommendationCard({
  rec,
  onSave,
  saved,
}: {
  rec: Recommendation;
  onSave: (rec: Recommendation) => void;
  saved: boolean;
}) {
  const isMovie = rec.type === 'movie';

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {rec.title}
        </Text>
        <View style={[styles.typeBadge, isMovie ? styles.typeBadgeMovie : styles.typeBadgeTv]}>
          <Text style={[styles.typeBadgeText, isMovie ? styles.typeBadgeMovieText : styles.typeBadgeTvText]}>
            {isMovie ? '🎬 Movie' : '📺 TV Show'}
          </Text>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{rec.genre}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>⏱ {rec.duration}</Text>
        </View>
      </View>

      {/* Explanation */}
      <Text style={styles.cardExplanation}>{rec.explanation}</Text>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveButton, saved && styles.saveButtonSaved]}
        onPress={() => onSave(rec)}
        activeOpacity={0.75}
        disabled={saved}
      >
        <Text style={[styles.saveButtonText, saved && styles.saveButtonTextSaved]}>
          {saved ? '♥  Saved to Favorites' : '♡  Save to Favorites'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { user, signOut } = useAuth();

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const displayEmail = user?.email?.split('@')[0] ?? 'there';

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const handleGetRecommendations = async () => {
    if (!selectedMood || !selectedTime) {
      Alert.alert('Almost there!', 'Please select your mood and how much time you have.');
      return;
    }

    setIsLoading(true);
    setRecommendations([]);

    try {
      const results = await getRecommendations(
        selectedMood,
        selectedGenres,
        selectedTime,
      );
      setRecommendations(results);

      // Check which ones are already favorited
      const savedChecks = await Promise.all(results.map((r) => isFavorite(r.id)));
      const alreadySaved = new Set(results.filter((_, i) => savedChecks[i]).map((r) => r.id));
      setSavedIds(alreadySaved);
    } catch (err) {
      console.error('[Gemini] getRecommendations failed:', err);
      Alert.alert(
        'Oops!',
        'Could not fetch recommendations right now. Check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (rec: Recommendation) => {
    try {
      await addFavorite(rec);
      setSavedIds((prev) => new Set(prev).add(rec.id));
    } catch {
      Alert.alert('Error', 'Could not save to favorites.');
    }
  };

  const canFetch = !!selectedMood && !!selectedTime && !isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Welcome back,</Text>
            <Text style={styles.headerName}>{displayEmail} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Hero text */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>What should you{'\n'}watch tonight?</Text>
          <Text style={styles.heroSubtitle}>Tell us about your mood and we'll find the perfect pick.</Text>
        </View>

        {/* ── Mood ── */}
        <View style={styles.section}>
          <SectionHeader title="How are you feeling?" subtitle="Pick one that resonates right now" />
          <View style={styles.chipGrid}>
            {MOODS.map((mood) => {
              const active = selectedMood === mood.label;
              return (
                <TouchableOpacity
                  key={mood.label}
                  style={[styles.moodChip, active && styles.chipActive]}
                  onPress={() => setSelectedMood(mood.label)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Genre ── */}
        <View style={styles.section}>
          <SectionHeader title="What are you in the mood for?" subtitle="Select any genres (optional)" />
          <View style={styles.chipGrid}>
            {GENRES.map((genre) => {
              const active = selectedGenres.includes(genre);
              return (
                <TouchableOpacity
                  key={genre}
                  style={[styles.genreChip, active && styles.chipActive]}
                  onPress={() => toggleGenre(genre)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Time ── */}
        <View style={styles.section}>
          <SectionHeader title="How much time do you have?" />
          <View style={styles.timeRow}>
            {TIME_OPTIONS.map((opt) => {
              const active = selectedTime === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.timeChip, active && styles.timeChipActive]}
                  onPress={() => setSelectedTime(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── CTA ── */}
        <TouchableOpacity
          style={[styles.ctaButton, !canFetch && styles.ctaButtonDisabled]}
          onPress={handleGetRecommendations}
          disabled={!canFetch}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={styles.ctaLoading}>
              <ActivityIndicator color={Colors.background} size="small" />
              <Text style={styles.ctaText}>  Finding your picks…</Text>
            </View>
          ) : (
            <Text style={styles.ctaText}>✨  Discover Now</Text>
          )}
        </TouchableOpacity>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.recommendationsTitle}>Your Picks</Text>
            <Text style={styles.recommendationsSubtitle}>
              Based on your {selectedMood?.toLowerCase()} mood
            </Text>
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                saved={savedIds.has(rec.id)}
                onSave={handleSave}
              />
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerGreeting: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  headerName: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  logoutText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  // Hero
  hero: {
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 3,
  },

  // Chips (mood + genre)
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 5,
  },
  moodEmoji: {
    fontSize: 15,
  },
  genreChip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.gold,
  },
  chipLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: Colors.gold,
    fontWeight: '600',
  },

  // Time chips
  timeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.gold,
  },
  timeChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: Colors.gold,
  },

  // CTA button
  ctaButton: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaButtonDisabled: {
    opacity: 0.35,
    shadowOpacity: 0,
  },
  ctaText: {
    color: Colors.background,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Recommendations section
  recommendationsSection: {
    marginBottom: Spacing.lg,
  },
  recommendationsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  recommendationsSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.lg,
    textTransform: 'capitalize',
  },

  // Recommendation card
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 24,
  },
  typeBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  typeBadgeMovie: {
    backgroundColor: 'rgba(245, 197, 24, 0.15)',
  },
  typeBadgeTv: {
    backgroundColor: 'rgba(99, 179, 237, 0.15)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadgeMovieText: {
    color: Colors.gold,
  },
  typeBadgeTvText: {
    color: '#63B3ED',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.cardElevated,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cardExplanation: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 14,
  },
  saveButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonSaved: {
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.gold,
  },
  saveButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveButtonTextSaved: {
    color: Colors.gold,
  },
});
