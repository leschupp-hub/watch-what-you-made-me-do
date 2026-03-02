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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
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
          <Text style={styles.headerTitle}>My Favorites</Text>
          <Text style={styles.headerSubtitle}>
            {favorites.length > 0
              ? `${favorites.length} saved ${favorites.length === 1 ? 'title' : 'titles'}`
              : 'Nothing saved yet'}
          </Text>
        </View>
        <View style={styles.heartDecor}>
          <Text style={styles.heartEmoji}>♥</Text>
        </View>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FavoriteCard item={item} onRemove={handleRemove} />}
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
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  heartDecor: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(245, 197, 24, 0.1)',
    borderWidth: 1,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 22,
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
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 24,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.cardElevated,
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
    marginBottom: 10,
  },
  savedAt: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
