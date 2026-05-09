import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Flame, Star, ChevronRight } from 'lucide-react-native';
import { useAuth, apiFetch } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme';

type Course = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  level: string;
  lesson_count: number;
};

type Progress = {
  xp: number;
  streak: number;
  completed: string[];
};

export default function Home() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        apiFetch('/api/courses', {}, token),
        apiFetch('/api/progress', {}, token),
      ]);
      if (r1.ok) setCourses(await r1.json());
      if (r2.ok) setProgress(await r2.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const completedFor = (slug: string) =>
    (progress?.completed || []).filter((k) => k.startsWith(`${slug}:`)).length;

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>
    );
  }

  const featured = courses[0];
  const others = courses.slice(1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      testID="home-screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Olá, {user?.name?.split(' ')[0] || 'aluno'}</Text>
          <Text style={styles.headline}>O que vamos{"\n"}aprender hoje?</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: 'rgba(249,115,22,0.3)' }]} testID="streak-stat">
          <Flame color={colors.streak} size={20} />
          <View>
            <Text style={styles.statValue}>{progress?.streak || 0}</Text>
            <Text style={styles.statLabel}>dias seguidos</Text>
          </View>
        </View>
        <View style={[styles.statCard, { borderColor: 'rgba(56,189,248,0.3)' }]} testID="xp-stat">
          <Star color={colors.brand} size={20} />
          <View>
            <Text style={[styles.statValue, { color: colors.brand }]}>{progress?.xp || 0}</Text>
            <Text style={styles.statLabel}>XP total</Text>
          </View>
        </View>
      </View>

      <Text style={styles.section}>Em destaque</Text>

      {/* Featured big card */}
      {featured && (
        <TouchableOpacity
          testID={`course-card-${featured.slug}`}
          activeOpacity={0.9}
          style={[styles.featuredCard, { borderColor: featured.color + '55' }]}
          onPress={() => router.push(`/course/${featured.slug}`)}
        >
          <View style={[styles.iconBubble, { backgroundColor: featured.color + '22', borderColor: featured.color + '66' }]}>
            <Text style={{ fontSize: 36 }}>{featured.icon}</Text>
          </View>
          <View style={{ marginTop: 18, gap: 4 }}>
            <Text style={styles.levelTag}>{featured.level}</Text>
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredSubtitle}>{featured.subtitle}</Text>
          </View>
          <ProgressBar
            done={completedFor(featured.slug)}
            total={featured.lesson_count}
            color={featured.color}
          />
          <View style={styles.featuredCTA}>
            <Text style={styles.ctaText}>Continuar</Text>
            <ChevronRight color={colors.textPrimary} size={18} />
          </View>
        </TouchableOpacity>
      )}

      <Text style={styles.section}>Outras trilhas</Text>

      <View style={styles.grid}>
        {others.map((c) => {
          const done = completedFor(c.slug);
          return (
            <TouchableOpacity
              key={c.slug}
              testID={`course-card-${c.slug}`}
              activeOpacity={0.9}
              style={styles.miniCard}
              onPress={() => router.push(`/course/${c.slug}`)}
            >
              <View style={[styles.miniIcon, { backgroundColor: c.color + '22', borderColor: c.color + '55' }]}>
                <Text style={{ fontSize: 26 }}>{c.icon}</Text>
              </View>
              <Text style={styles.miniTitle}>{c.title}</Text>
              <Text style={styles.miniSub}>{c.lesson_count} lições</Text>
              <View style={[styles.miniBar, { backgroundColor: colors.surfaceElevated }]}>
                <View style={{
                  height: 4,
                  borderRadius: 4,
                  width: `${c.lesson_count ? (done / c.lesson_count) * 100 : 0}%`,
                  backgroundColor: c.color,
                }}/>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <View style={{ marginTop: 16, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 12 }}>
          {done} / {total} lições
        </Text>
        <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 12 }}>{pct}%</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.surfaceElevated, borderRadius: 6, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${pct}%`, backgroundColor: color, borderRadius: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { paddingTop: 60, paddingBottom: 8 },
  hello: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  headline: { color: colors.textPrimary, fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 36, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 22 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1,
  },
  statValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  section: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 32, marginBottom: 12 },
  featuredCard: {
    backgroundColor: colors.surface, borderRadius: 28, padding: 22, borderWidth: 1,
  },
  iconBubble: {
    width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  levelTag: {
    color: colors.brand, fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
  },
  featuredTitle: { color: colors.textPrimary, fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  featuredSubtitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  featuredCTA: {
    marginTop: 18, backgroundColor: colors.brand, height: 48, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  ctaText: { color: '#0D1117', fontWeight: '900', fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  miniCard: {
    width: '48%', backgroundColor: colors.surface, borderRadius: 22,
    padding: 16, borderColor: colors.border, borderWidth: 1, gap: 6,
  },
  miniIcon: {
    width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8,
  },
  miniTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  miniSub: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  miniBar: { height: 4, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
});
