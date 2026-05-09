import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react-native';
import { apiFetch, useAuth } from '../../../src/contexts/AuthContext';
import { colors } from '../../../src/theme';
import Markdown from '../../../src/Markdown';

type Lesson = {
  id: string;
  title: string;
  theory: string;
  exercise: {
    type: string;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
};

export default function LessonScreen() {
  const { slug, id } = useLocalSearchParams<{ slug: string; id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<{ course: any; lesson: Lesson } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    const r = await apiFetch(`/api/courses/${slug}/lessons/${id}`, {}, token);
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, [slug, id, token]);

  useEffect(() => { load(); }, [load]);

  const submit = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  const complete = async () => {
    setCompleting(true);
    try {
      const r = await apiFetch('/api/progress/complete', {
        method: 'POST',
        body: JSON.stringify({ course_slug: slug, lesson_id: id }),
      }, token);
      if (r.ok) {
        const data = await r.json();
        const msg = `Lição concluída!\n+${data.xp_gained || 0} XP\nXP total: ${data.xp}\nSequência: ${data.streak} dia(s)`;
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') window.alert(msg);
          router.back();
        } else {
          Alert.alert(
            'Lição concluída!',
            `+${data.xp_gained || 0} XP\nXP total: ${data.xp}\nSequência: ${data.streak} dia(s)`,
            [{ text: 'Continuar', onPress: () => router.back() }]
          );
        }
      } else {
        router.back();
      }
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !data) {
    return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  }

  const { lesson, course } = data;
  const isCorrect = submitted && selected === lesson.exercise.correct;
  const accent = course.color || colors.brand;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <TouchableOpacity testID="lesson-back" style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerCourse}>{course.title}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 22, paddingBottom: 40 }} testID="lesson-screen">
        <View style={[styles.theoryCard, { borderColor: accent + '33' }]}>
          <Markdown source={lesson.theory} />
        </View>

        <Text style={styles.exerciseLabel}>EXERCÍCIO PRÁTICO</Text>
        <View style={styles.exerciseCard}>
          <Markdown source={lesson.exercise.question} />

          <View style={{ gap: 10, marginTop: 18 }}>
            {lesson.exercise.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrectAnswer = i === lesson.exercise.correct;
              let bg = colors.surfaceElevated;
              let border = colors.border;
              let textColor = colors.textPrimary;
              if (submitted) {
                if (isCorrectAnswer) { bg = 'rgba(42,204,21,0.15)'; border = colors.success; }
                else if (isSelected) { bg = 'rgba(239,68,68,0.15)'; border = colors.error; }
              } else if (isSelected) {
                border = accent;
                bg = accent + '20';
              }
              return (
                <TouchableOpacity
                  key={i}
                  testID={`opt-${i}`}
                  disabled={submitted}
                  style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]}
                  onPress={() => setSelected(i)}
                >
                  <View style={[styles.optionLetter, { borderColor: border }]}>
                    <Text style={[styles.optionLetterText, { color: textColor }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
                  {submitted && isCorrectAnswer && <CheckCircle2 color={colors.success} size={20} />}
                  {submitted && isSelected && !isCorrectAnswer && <XCircle color={colors.error} size={20} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {submitted && (
            <View style={[styles.feedback, { backgroundColor: isCorrect ? 'rgba(42,204,21,0.1)' : 'rgba(239,68,68,0.1)' }]} testID="feedback">
              <Text style={[styles.feedbackTitle, { color: isCorrect ? colors.success : colors.error }]}>
                {isCorrect ? '✓ Resposta correta!' : '✗ Não foi dessa vez'}
              </Text>
              <Text style={styles.feedbackText}>{lesson.exercise.explanation}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!submitted ? (
          <TouchableOpacity
            testID="submit-answer"
            disabled={selected === null}
            style={[styles.cta, { backgroundColor: accent, opacity: selected === null ? 0.4 : 1 }]}
            onPress={submit}
          >
            <Text style={styles.ctaText}>Verificar resposta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="complete-lesson"
            style={[styles.cta, { backgroundColor: isCorrect ? colors.success : colors.brand }]}
            onPress={complete}
            disabled={completing}
          >
            {completing
              ? <ActivityIndicator color="#0D1117" />
              : <Text style={styles.ctaText}>{isCorrect ? 'Concluir lição (+20 XP)' : 'Continuar mesmo assim'}</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: {
    paddingTop: 60, paddingHorizontal: 22, paddingBottom: 16,
    flexDirection: 'row', gap: 12, alignItems: 'center',
    borderBottomColor: colors.border, borderBottomWidth: 1,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderColor: colors.border, borderWidth: 1,
  },
  headerCourse: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  theoryCard: {
    backgroundColor: colors.surface, borderRadius: 22, padding: 20, borderWidth: 1,
  },
  exerciseLabel: {
    color: colors.brand, letterSpacing: 2, fontWeight: '900', fontSize: 11, marginTop: 26, marginBottom: 10,
  },
  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: 22, padding: 18,
    borderColor: colors.border, borderWidth: 1,
  },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5,
  },
  optionLetter: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLetterText: { fontWeight: '900', fontSize: 13 },
  optionText: { flex: 1, fontWeight: '600', fontSize: 14 },
  feedback: { marginTop: 16, padding: 14, borderRadius: 14, gap: 6 },
  feedbackTitle: { fontWeight: '900', fontSize: 14 },
  feedbackText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  footer: {
    paddingHorizontal: 22, paddingBottom: 28, paddingTop: 12,
    borderTopColor: colors.border, borderTopWidth: 1, backgroundColor: colors.bg,
  },
  cta: {
    height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#0D1117', fontWeight: '900', fontSize: 16 },
});
