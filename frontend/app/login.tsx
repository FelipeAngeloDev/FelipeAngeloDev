import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth } from '../src/contexts/AuthContext';
import { colors } from '../src/theme';

const AUTH_URL = 'https://auth.emergentagent.com';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL as string;

export default function Login() {
  const router = useRouter();
  const { loginWithSessionId, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      const redirectUrl =
        Platform.OS === 'web'
          ? `${BACKEND_URL}/`
          : Linking.createURL('/');

      const authLink = `${AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === 'web') {
        // Full page redirect; AuthContext handles session_id from URL on return.
        if (typeof window !== 'undefined') window.location.href = authLink;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(authLink, redirectUrl);
      if (result.type === 'success' && result.url) {
        const sid = parseSessionId(result.url);
        if (sid) {
          const ok = await loginWithSessionId(sid);
          if (ok) router.replace('/(tabs)');
          else setError('Falha ao autenticar. Tente novamente.');
          return;
        }
      }
      // Fallback: cold-start initial URL
      const initial = await Linking.getInitialURL();
      if (initial) {
        const sid = parseSessionId(initial);
        if (sid) {
          const ok = await loginWithSessionId(sid);
          if (ok) router.replace('/(tabs)');
          else setError('Falha ao autenticar. Tente novamente.');
        }
      }
    } catch (e) {
      setError('Erro ao iniciar login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1760976180663-946ff68fa64c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMGNvbG9yZnVsJTIwM2QlMjBzaGFwZXMlMjBkYXJrfGVufDB8fHx8MTc3ODM2MDIzMHww&ixlib=rb-4.1.0&q=85' }}
      style={styles.bg}
      imageStyle={{ opacity: 0.25 }}
    >
      <View style={styles.overlay} testID="login-screen">
        <View style={{ flex: 1 }} />
        <View style={styles.brandBox}>
          <Text style={styles.logo}>{'</'}<Text style={{ color: colors.brand }}>code</Text>{'>'}</Text>
          <Text style={styles.title}>CodeMaster</Text>
          <Text style={styles.subtitle}>
            Aprenda programação de forma simples, completa e divertida.
          </Text>
        </View>

        <View style={styles.featureRow}>
          <Feature emoji="🐍" label="Python" />
          <Feature emoji="⚡" label="JavaScript" />
          <Feature emoji="🎨" label="HTML/CSS" />
          <Feature emoji="☕" label="Java" />
        </View>

        <View style={{ height: 40 }} />

        <TouchableOpacity
          testID="google-auth-button"
          style={styles.googleBtn}
          onPress={handleGoogle}
          disabled={busy || loading}
          activeOpacity={0.85}
        >
          {(busy || loading) ? (
            <ActivityIndicator color="#0D1117" />
          ) : (
            <>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleText}>Continuar com Google</Text>
            </>
          )}
        </TouchableOpacity>
        {error ? <Text style={styles.error} testID="login-error">{error}</Text> : null}
        <Text style={styles.footer}>Ao continuar você concorda com os termos de uso.</Text>
      </View>
    </ImageBackground>
  );
}

function Feature({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={styles.feat}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={styles.featText}>{label}</Text>
    </View>
  );
}

function parseSessionId(url: string): string | null {
  const hash = url.includes('#') ? url.substring(url.indexOf('#') + 1) : '';
  const query = url.includes('?') ? url.substring(url.indexOf('?') + 1).split('#')[0] : '';
  const search = (s: string) => {
    try {
      const p = new URLSearchParams(s);
      return p.get('session_id');
    } catch { return null; }
  };
  return search(hash) || search(query);
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  overlay: { flex: 1, backgroundColor: 'rgba(13,17,23,0.85)', paddingHorizontal: 28, paddingBottom: 40, paddingTop: 60 },
  brandBox: { alignItems: 'flex-start', gap: 8 },
  logo: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  title: { color: colors.textPrimary, fontSize: 44, fontWeight: '900', letterSpacing: -1.5, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 17, lineHeight: 24, marginTop: 6, maxWidth: 320 },
  featureRow: { flexDirection: 'row', gap: 10, marginTop: 32, flexWrap: 'wrap' },
  feat: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  featText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  googleBtn: {
    backgroundColor: '#FFFFFF', height: 58, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  googleG: { color: '#4285F4', fontSize: 22, fontWeight: '900' },
  googleText: { color: '#0D1117', fontSize: 17, fontWeight: '800' },
  error: { color: colors.error, marginTop: 12, textAlign: 'center', fontWeight: '600' },
  footer: { color: colors.textDisabled, fontSize: 12, textAlign: 'center', marginTop: 18 },
});
