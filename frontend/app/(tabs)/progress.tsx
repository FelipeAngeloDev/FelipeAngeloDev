import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Flame, Star, Trophy, BookOpen } from 'lucide-react-native';
import { apiFetch, useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme';

type Course = { slug: string; title: string; icon: string; color: string; lesson_count: number };

export default function Progress() {
  const { token } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      apiFetch('/api/progress', {}, token),
      apiFetch('/api/courses', {}, token),
    ]);
    if (r1.ok) setProgress(await r1.json());
    if (r2.ok) setCourses(await r2.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  }

  const totalCompleted = (progress?.completed || []).length;
  const totalLessons = courses.reduce((s, c) => s + c.lesson_count, 0);
  const overallPct = totalLessons ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} testID="progress-screen">
      <Text style={styles.h1}>Seu Progresso</Text>
      <Text style={styles.h1Sub}>Continue avançando nos seus estudos</Text>

      <View style={styles.heroCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.heroLabel}>PROGRESSO GERAL</Text>
            <Text style={styles.heroPct}>{overallPct}%</Text>
            <Text style={styles.heroSub}>{totalCompleted} de {totalLessons} lições</Text>
          </View>
          <Trophy color={colors.warning} size={42} />
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${overallPct}%` }]} />
        </View>
      </View>

      <View style={styles.gridStats}>
        <View style={styles.statBox}>
          <Flame color={colors.streak} size={22} />
          <Text style={styles.statBoxValue}>{progress?.streak || 0}</Text>
          <Text style={styles.statBoxLabel}>Sequência (dias)</Text>
        </View>
        <View style={styles.statBox}>
          <Star color={colors.brand} size={22} />
          <Text style={[styles.statBoxValue, { color: colors.brand }]}>{progress?.xp || 0}</Text>
          <Text style={styles.statBoxLabel}>XP total</Text>
        </View>
        <View style={styles.statBox}>
          <BookOpen color={colors.success} size={22} />
          <Text style={[styles.statBoxValue, { color: colors.success }]}>{totalCompleted}</Text>
          <Text style={styles.statBoxLabel}>Lições concluídas</Text>
        </View>
      </View>

      <Text style={styles.section}>Trilhas</Text>
      {courses.map((c) => {
        const done = (progress?.completed || []).filter((k: string) => k.startsWith(`${c.slug}:`)).length;
        const pct = c.lesson_count ? Math.round((done / c.lesson_count) * 100) : 0;
        return (
          <View key={c.slug} style={styles.row} testID={`progress-${c.slug}`}>
            <View style={[styles.rowIcon, { backgroundColor: c.color + '22', borderColor: c.color + '55' }]}>
              <Text style={{ fontSize: 22 }}>{c.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.rowTitle}>{c.title}</Text>
                <Text style={styles.rowPct}>{done}/{c.lesson_count}</Text>
              </View>
              <View style={styles.miniBar}>
                <View style={{ height: 5, width: `${pct}%`, backgroundColor: c.color, borderRadius: 5 }} />
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  h1: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', paddingTop: 60, letterSpacing: -0.5 },
  h1Sub: { color: colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 20 },
  heroCard: {
    backgroundColor: colors.surface, borderRadius: 24, padding: 22,
    borderColor: colors.border, borderWidth: 1, gap: 14,
  },
  heroLabel: { color: colors.brand, letterSpacing: 2, fontWeight: '900', fontSize: 11 },
  heroPct: { color: colors.textPrimary, fontSize: 48, fontWeight: '900', letterSpacing: -2, lineHeight: 52 },
  heroSub: { color: colors.textSecondary, fontWeight: '600' },
  barBg: { height: 10, backgroundColor: colors.surfaceElevated, borderRadius: 10, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: colors.success, borderRadius: 10 },
  gridStats: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 6,
    borderColor: colors.border, borderWidth: 1, alignItems: 'flex-start',
  },
  statBoxValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  statBoxLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  section: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 28, marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: 18, padding: 14, marginBottom: 10,
    borderColor: colors.border, borderWidth: 1,
  },
  rowIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rowTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  rowPct: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  miniBar: { height: 5, backgroundColor: colors.surfaceElevated, borderRadius: 5, overflow: 'hidden', marginTop: 8 },
});
