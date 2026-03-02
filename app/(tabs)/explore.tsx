import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getFavorites, removeFavorite } from '@/lib/storage';
import { Recommendation } from '@/lib/gemini';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

function FavoriteCard({
  item,
  onRemove,
}: {
  item: Recommendation;
  onRemove: (id: string) => void;
}) {
  const isMovie = item.type === 'movie';

  const handleRemove = () => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${item.title}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.id) },
      ],
    );
  };

  return (
    <LinearGradient
      colors={['#FFD700', '#C0C0C0', '#C9A84C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradientBorder}
    >
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            ✨ {item.title}
          </Text>
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove} activeOpacity={0.7}>
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tagRow}>
          <View style={[styles.typeBadge, isMovie ? styles.typeBadgeMovie : styles.typeBadgeTv]}>
            <Text style={[styles.typeBadgeText, isMovie ? styles.typeBadgeMovieText : styles.typeBadgeTvText]}>
              {isMovie ? '🎬 Movie' : '📺 TV Show'}
            </Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.genre}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>⏱ {item.duration}</Text>
          </View>
          {item.rating ? (
            <View style={[styles.tag, styles.ratingTag]}>
              <Text style={[styles.tagText, styles.ratingTagText]}>{item.rating}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.cardExplanation}>{item.explanation}</Text>

      {item.savedAt ? (
        <Text style={styles.savedAt}>
          Saved{' '}
          {new Date(item.savedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      ) : null}
    </View>
    </LinearGradient>
  );
}

function BookFavoriteCard({
  item,
  onRemove,
}: {
  item: Recommendation;
  onRemove: (id: string) => void;
}) {
  const handleRemove = () => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${item.title}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.id) },
      ],
    );
  };

  return (
    <View style={styles.bookCard}>
      <View style={styles.bookCardTitleRow}>
        <Text style={styles.bookModeLabel}>📖  Folklore Mode Pick</Text>
        <TouchableOpacity style={styles.bookRemoveButton} onPress={handleRemove} activeOpacity={0.7}>
          <Text style={styles.bookRemoveButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.bookCardTitle} numberOfLines={2}>{item.title}</Text>

      <View style={styles.bookTagRow}>
        <View style={styles.bookTag}>
          <Text style={styles.bookTagText}>{item.genre}</Text>
        </View>
        <View style={styles.bookTag}>
          <Text style={styles.bookTagText}>⏱ {item.duration}</Text>
        </View>
        {item.rating ? (
          <View style={styles.bookTag}>
            <Text style={styles.bookTagText}>{item.rating}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.bookExplanation}>{item.explanation}</Text>

      {item.savedAt ? (
        <Text style={styles.bookSavedAt}>
          Saved{' '}
          {new Date(item.savedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      ) : null}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🍿</Text>
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptySubtitle}>
        Head to Discover, find something you love,{'\n'}and save it here.
      </Text>
    </View>
  );
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Recommendation[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getFavorites().then((data) => {
        if (active) {
          setFavorites([...data].reverse());
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const handleRemove = async (id: string) => {
    const updated = await removeFavorite(id);
    setFavorites([...updated].reverse());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>✨ My Favorites ✨</Text>
          <Text style={styles.headerSubtitle}>
            {favorites.length > 0
              ? `${favorites.length} saved ${favorites.length === 1 ? 'title' : 'titles'}`
              : 'nothing saved yet'}
          </Text>
        </View>
        <View style={styles.heartDecor}>
          <Text style={styles.heartEmoji}>♥</Text>
        </View>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.type === 'book' ? (
            <BookFavoriteCard item={item} onRemove={handleRemove} />
          ) : (
            <FavoriteCard item={item} onRemove={handleRemove} />
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'lowercase',
  },
  heartDecor: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.goldSubtle,
    borderWidth: 1.5,
    borderColor: Colors.goldBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 20,
    color: Colors.gold,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },

  // Card
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
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  removeButtonText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  typeBadgeMovie: {
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    borderColor: 'rgba(201, 168, 76, 0.3)',
  },
  typeBadgeTv: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    marginBottom: 10,
  },
  savedAt: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Book favorite card (Folklore Mode)
  bookCard: {
    backgroundColor: '#F5F0E8',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.2)',
  },
  bookCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookModeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3D2B1F',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.65,
  },
  bookRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bookRemoveButtonText: {
    color: '#3D2B1F',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  bookCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3D2B1F',
    lineHeight: 24,
    letterSpacing: 0.1,
    marginBottom: 10,
  },
  bookTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
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
    marginBottom: 10,
  },
  bookSavedAt: {
    fontSize: 10,
    color: '#3D2B1F',
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    opacity: 0.5,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
