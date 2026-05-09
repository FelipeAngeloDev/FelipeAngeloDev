import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme';
import Markdown from '../../src/Markdown';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL as string;

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'O que é uma variável?',
  'Explique loops em Python',
  'Diferença entre let e const',
  'Como começar com HTML?',
];

export default function Tutor() {
  const { token } = useAuth();
  const [model, setModel] = useState<'claude' | 'gpt'>('claude');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Msg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await fetch(`${BACKEND_URL}/api/tutor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, model, session_id: sessionId }),
      });
      if (!res.ok) {
        setMessages((m) => [...m, { id: 'e' + Date.now(), role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
      } else {
        const data = await res.json();
        if (!sessionId) setSessionId(data.session_id);
        setMessages((m) => [...m, { id: 'a' + Date.now(), role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages((m) => [...m, { id: 'e' + Date.now(), role: 'assistant', content: 'Sem conexão. Verifique a internet.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tutor IA</Text>
          <Text style={styles.subtitle}>Tire suas dúvidas de programação</Text>
        </View>
        <View style={styles.modelSwitch} testID="model-switch">
          <TouchableOpacity
            testID="model-claude"
            style={[styles.modelBtn, model === 'claude' && styles.modelBtnActive]}
            onPress={() => setModel('claude')}
          >
            <Text style={[styles.modelText, model === 'claude' && styles.modelTextActive]}>Claude</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="model-gpt"
            style={[styles.modelBtn, model === 'gpt' && styles.modelBtnActive]}
            onPress={() => setModel('gpt')}
          >
            <Text style={[styles.modelText, model === 'gpt' && styles.modelTextActive]}>GPT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingBottom: 24, gap: 14 }}
        testID="chat-scroll"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Sparkles color={colors.brand} size={28} />
            </View>
            <Text style={styles.emptyTitle}>Como posso te ajudar?</Text>
            <Text style={styles.emptyText}>
              Pergunte sobre conceitos, peça exemplos de código ou tire dúvidas das lições.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  testID={`suggest-${s}`}
                  style={styles.suggChip}
                  onPress={() => send(s)}
                >
                  <Text style={styles.suggText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
              ]}
              testID={`msg-${m.role}`}
            >
              {m.role === 'assistant'
                ? <Markdown source={m.content} />
                : <Text style={styles.userText}>{m.content}</Text>}
            </View>
          ))
        )}
        {loading && (
          <View style={[styles.bubble, styles.bubbleAi, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <ActivityIndicator color={colors.brand} size="small" />
            <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Pensando...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          testID="chat-input"
          style={styles.input}
          placeholder="Pergunte qualquer coisa..."
          placeholderTextColor={colors.textDisabled}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          testID="chat-send"
          style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Send color="#0D1117" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 22,
    borderBottomColor: colors.border, borderBottomWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 2 },
  modelSwitch: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, padding: 4,
    borderColor: colors.border, borderWidth: 1,
  },
  modelBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  modelBtnActive: { backgroundColor: colors.brand },
  modelText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  modelTextActive: { color: '#0D1117', fontWeight: '900' },
  bubble: {
    borderRadius: 18, padding: 14, maxWidth: '92%',
  },
  bubbleUser: {
    backgroundColor: colors.surfaceElevated, alignSelf: 'flex-end', borderTopRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: colors.surface, alignSelf: 'flex-start', borderTopLeftRadius: 4,
    borderColor: colors.border, borderWidth: 1,
  },
  userText: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 18, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderColor: colors.border, borderWidth: 1,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 6 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300, fontSize: 14 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 18 },
  suggChip: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
  },
  suggText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopColor: colors.border, borderTopWidth: 1, backgroundColor: colors.bg,
  },
  input: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16,
    paddingVertical: 12, color: colors.textPrimary, fontSize: 15, maxHeight: 120,
    borderColor: colors.border, borderWidth: 1, minHeight: 48,
  },
  sendBtn: {
    backgroundColor: colors.brand, width: 48, height: 48, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
});
