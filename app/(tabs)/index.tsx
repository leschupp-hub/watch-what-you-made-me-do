import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/auth';
import { getRecommendations, Recommendation } from '@/lib/gemini';
import { addFavorite, isFavorite } from '@/lib/storage';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { GradientText } from '@/components/GradientText';

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
    <LinearGradient
      colors={['#FFD700', '#C0C0C0', '#C9A84C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradientBorder}
    >
      <View style={styles.card}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            ✨ {rec.title}
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
          {rec.rating ? (
            <View style={[styles.tag, styles.ratingTag]}>
              <Text style={[styles.tagText, styles.ratingTagText]}>{rec.rating}</Text>
            </View>
          ) : null}
        </View>

        {/* Explanation */}
        <Text style={styles.cardExplanation}>{rec.explanation}</Text>

        {/* Save button */}
        {saved ? (
          <View style={styles.saveButtonSaved}>
            <Text style={styles.saveButtonTextSaved}>♥  Saved to Favorites</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.saveButtonWrapper}
            onPress={() => onSave(rec)}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={['#FFD700', '#C9A84C', '#A8893A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>♡  Save to Favorites</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

function BookCard({
  rec,
  onSave,
  saved,
}: {
  rec: Recommendation;
  onSave: (rec: Recommendation) => void;
  saved: boolean;
}) {
  return (
    <View style={styles.bookCard}>
      <Text style={styles.bookModeLabel}>📖  Folklore Mode Pick</Text>

      <Text style={styles.bookTitle}>{rec.title}</Text>

      <View style={styles.tagRow}>
        <View style={styles.bookTag}>
          <Text style={styles.bookTagText}>{rec.genre}</Text>
        </View>
        <View style={styles.bookTag}>
          <Text style={styles.bookTagText}>⏱ {rec.duration}</Text>
        </View>
        {rec.rating ? (
          <View style={styles.bookTag}>
            <Text style={styles.bookTagText}>{rec.rating}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.bookExplanation}>{rec.explanation}</Text>

      {saved ? (
        <View style={styles.bookSaveButtonSaved}>
          <Text style={styles.bookSaveButtonTextSaved}>♥  Saved to Favorites</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.bookSaveButton}
          onPress={() => onSave(rec)}
          activeOpacity={0.75}
        >
          <Text style={styles.bookSaveButtonText}>♡  Save to Favorites</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { user, signOut } = useAuth();

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [nostalgiaMode, setNostalgiaMode] = useState(false);

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
        { nostalgiaMode },
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
            <Text style={styles.headerGreeting}>welcome back,</Text>
            <Text style={styles.headerName}>{displayEmail}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.7}>
            <Text style={styles.logoutText}>sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Hero text */}
        <View style={styles.hero}>
          <Text style={styles.heroSnake}>✨ 🐍 ✨</Text>
          <GradientText
            style={styles.heroAppName}
            colors={['#FFFFFF', '#FFD700', '#C9A84C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {'Watch What You\nMade Me Do'}
          </GradientText>
          <Text style={styles.heroTitle}>What should you watch tonight?</Text>
          <Text style={styles.heroSubtitle}>Tell us your mood — we'll find the perfect pick.</Text>
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

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <SectionHeader title="Preferences" subtitle="Customize your recommendations" />

          <TouchableOpacity
            style={[styles.toggleRow, nostalgiaMode && styles.toggleRowActive]}
            onPress={() => setNostalgiaMode((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, nostalgiaMode && styles.toggleLabelActive]}>
                Nostalgia Mode 📺
              </Text>
              <Text style={styles.toggleSubtitle}>Only movies & shows from 1990–2005</Text>
            </View>
            <Switch
              value={nostalgiaMode}
              onValueChange={setNostalgiaMode}
              trackColor={{ false: Colors.border, true: 'rgba(201, 168, 76, 0.5)' }}
              thumbColor={nostalgiaMode ? Colors.goldBright : '#555555'}
              ios_backgroundColor={Colors.border}
            />
          </TouchableOpacity>

        </View>

        {/* ── CTA ── */}
        <TouchableOpacity
          style={[styles.ctaButtonWrapper, !canFetch && styles.ctaButtonDisabled]}
          onPress={handleGetRecommendations}
          disabled={!canFetch}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#FFD700', '#C9A84C', '#A8893A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            {isLoading ? (
              <View style={styles.ctaLoading}>
                <ActivityIndicator color="#0A0A0A" size="small" />
                <Text style={styles.ctaText}>  Finding your picks…</Text>
              </View>
            ) : (
              <Text style={styles.ctaText}>✨ Discover Now ✨</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.recommendationsTitle}>✨ Your Picks ✨</Text>
            <Text style={styles.recommendationsSubtitle}>
              Based on your {selectedMood?.toLowerCase()} mood
            </Text>
            {recommendations.map((rec) =>
              rec.type === 'book' ? (
                <BookCard
                  key={rec.id}
                  rec={rec}
                  saved={savedIds.has(rec.id)}
                  onSave={handleSave}
                />
              ) : (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  saved={savedIds.has(rec.id)}
                  onSave={handleSave}
                />
              ),
            )}
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
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'lowercase',
  },
  headerName: {
    fontSize: 17,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  logoutText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'lowercase',
  },

  // Hero
  hero: {
    marginBottom: Spacing.xl,
    alignItems: 'flex-start',
  },
  heroSnake: {
    fontSize: 22,
    marginBottom: Spacing.sm,
  },
  heroAppName: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.gold,
    lineHeight: 40,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 21,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.3,
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
  ctaButtonWrapper: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    shadowColor: '#FFD700',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  ctaButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.3,
  },
  ctaText: {
    color: '#0A0A0A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    fontSize: 14,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  recommendationsSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.lg,
    textTransform: 'capitalize',
    letterSpacing: 0.4,
  },

  // Recommendation card
  cardGradientBorder: {
    borderRadius: BorderRadius.lg + 2,
    padding: 1.5,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
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
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  typeBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  typeBadgeMovie: {
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
  },
  typeBadgeTv: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeBadgeMovieText: {
    color: Colors.gold,
  },
  typeBadgeTvText: {
    color: '#AAAAAA',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.cardElevated,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  ratingTag: {
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderColor: 'rgba(201, 168, 76, 0.3)',
  },
  ratingTagText: {
    color: Colors.gold,
    fontWeight: '700',
  },
  cardExplanation: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 14,
  },

  // Save button — prominent raised gold look
  saveButtonWrapper: {
    borderRadius: BorderRadius.md,
    shadowColor: '#FFD700',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  saveButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonSaved: {
    backgroundColor: Colors.goldSubtle,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    color: '#0A0A0A',
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  saveButtonTextSaved: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Book card (Folklore Mode)
  bookCard: {
    backgroundColor: '#F5F0E8',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.2)',
  },
  bookModeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3D2B1F',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    opacity: 0.65,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3D2B1F',
    lineHeight: 24,
    letterSpacing: 0.1,
    marginBottom: 10,
  },
  bookTag: {
    backgroundColor: 'rgba(61, 43, 31, 0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.2)',
  },
  bookTagText: {
    fontSize: 11,
    color: '#3D2B1F',
    fontWeight: '500',
  },
  bookExplanation: {
    fontSize: 14,
    color: '#5C3D2E',
    lineHeight: 21,
    marginBottom: 14,
  },
  bookSaveButton: {
    backgroundColor: '#3D2B1F',
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  bookSaveButtonText: {
    fontSize: 13,
    color: '#F5F0E8',
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bookSaveButtonSaved: {
    backgroundColor: 'rgba(61, 43, 31, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.3)',
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  bookSaveButtonTextSaved: {
    fontSize: 13,
    color: '#3D2B1F',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Preference toggles
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
  },
  toggleRowActive: {
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.goldBorder,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.2,
  },
  toggleLabelActive: {
    color: Colors.gold,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
