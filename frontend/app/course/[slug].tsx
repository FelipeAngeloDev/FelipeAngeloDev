import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, CheckCircle2, Lock, PlayCircle } from 'lucide-react-native';
import { apiFetch, useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme';

type Lesson = { id: string; title: string };
type Course = {
  slug: string; title: string; subtitle: string; description: string;
  icon: string; color: string; level: string; lessons: Lesson[];
};

export default function CourseDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      apiFetch(`/api/courses/${slug}`, {}, token),
      apiFetch('/api/progress', {}, token),
    ]);
    if (r1.ok) setCourse(await r1.json());
    if (r2.ok) {
      const p = await r2.json();
      setCompleted(new Set((p.completed || []).filter((k: string) => k.startsWith(`${slug}:`))));
    }
    setLoading(false);
  }, [slug, token]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !course) {
    return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  }

  const doneCount = completed.size;
  const total = course.lessons.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  // Determine which lesson is "next" (unlocked next lesson is the first non-completed)
  let nextIdx = course.lessons.findIndex((l) => !completed.has(`${course.slug}:${l.id}`));
  if (nextIdx === -1) nextIdx = total - 1;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 60 }} testID="course-detail">
      <View style={[styles.heroBg, { backgroundColor: course.color + '15', borderBottomColor: course.color + '33' }]}>
        <TouchableOpacity testID="back-button" style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>

        <View style={[styles.heroIcon, { backgroundColor: course.color + '22', borderColor: course.color + '66' }]}>
          <Text style={{ fontSize: 44 }}>{course.icon}</Text>
        </View>
        <Text style={styles.levelTag}>{course.level}</Text>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.subtitle}>{course.subtitle}</Text>
        <Text style={styles.description}>{course.description}</Text>

        <View style={styles.progressBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.progressLabel}>{doneCount} / {total} lições concluídas</Text>
            <Text style={[styles.progressLabel, { color: course.color }]}>{pct}%</Text>
          </View>
          <View style={styles.barBg}>
            <View style={{ height: 8, width: `${pct}%`, backgroundColor: course.color, borderRadius: 8 }} />
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
        <Text style={styles.sectionTitle}>Lições</Text>
        {course.lessons.map((l, i) => {
          const isDone = completed.has(`${course.slug}:${l.id}`);
          const isLocked = i > nextIdx;
          return (
            <TouchableOpacity
              key={l.id}
              testID={`lesson-${l.id}`}
              activeOpacity={0.85}
              disabled={isLocked}
              style={[styles.lessonCard, isLocked && { opacity: 0.45 }]}
              onPress={() => router.push(`/lesson/${course.slug}/${l.id}`)}
            >
              <View style={[styles.lessonNumber, { backgroundColor: isDone ? colors.success + '22' : course.color + '22', borderColor: isDone ? colors.success : course.color }]}>
                {isDone ? (
                  <CheckCircle2 color={colors.success} size={20} />
                ) : isLocked ? (
                  <Lock color={colors.textDisabled} size={18} />
                ) : (
                  <Text style={[styles.lessonNumberText, { color: course.color }]}>{i + 1}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>{l.title}</Text>
                <Text style={styles.lessonMeta}>
                  {isDone ? 'Concluído' : isLocked ? 'Bloqueado' : 'Disponível'}
                </Text>
              </View>
              {!isLocked && !isDone && <PlayCircle color={course.color} size={26} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  heroBg: { paddingTop: 60, paddingHorizontal: 22, paddingBottom: 24, borderBottomWidth: 1 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderColor: colors.border, borderWidth: 1,
    marginBottom: 14,
  },
  heroIcon: {
    width: 86, height: 86, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  levelTag: { color: colors.textSecondary, fontWeight: '900', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginTop: 16 },
  title: { color: colors.textPrimary, fontSize: 36, fontWeight: '900', letterSpacing: -1.5, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 12 },
  progressBox: { marginTop: 22, gap: 6 },
  progressLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  barBg: { height: 8, backgroundColor: colors.surfaceElevated, borderRadius: 8, overflow: 'hidden' },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  lessonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 18, padding: 14, marginBottom: 10,
  },
  lessonNumber: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  lessonNumberText: { fontWeight: '900', fontSize: 16 },
  lessonTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  lessonMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '600' },
});
