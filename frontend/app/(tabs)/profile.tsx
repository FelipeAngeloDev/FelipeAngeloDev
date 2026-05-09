import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { LogOut, Mail, Code2, Award } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth, apiFetch } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme';

export default function Profile() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<any>(null);

  const load = useCallback(async () => {
    const r = await apiFetch('/api/progress', {}, token);
    if (r.ok) setProgress(await r.json());
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} testID="profile-screen">
      <Text style={styles.h1}>Perfil</Text>

      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: 28 }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name} testID="profile-name">{user?.name}</Text>
        <View style={styles.emailRow}>
          <Mail size={14} color={colors.textSecondary} />
          <Text style={styles.email} testID="profile-email">{user?.email}</Text>
        </View>

        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Award color={colors.brand} size={20} />
            <Text style={styles.miniStatVal}>{progress?.xp || 0}</Text>
            <Text style={styles.miniStatLabel}>XP</Text>
          </View>
          <View style={[styles.miniStat, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Code2 color={colors.success} size={20} />
            <Text style={styles.miniStatVal}>{(progress?.completed || []).length}</Text>
            <Text style={styles.miniStatLabel}>Lições</Text>
          </View>
        </View>
      </View>

      <Text style={styles.section}>Sobre o app</Text>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>CodeMaster</Text>
        <Text style={styles.aboutText}>
          Aprenda Python, JavaScript, HTML/CSS e Java com lições curtas, exercícios práticos
          e um tutor IA disponível 24/7.
        </Text>
      </View>

      <TouchableOpacity testID="logout-button" style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut color={colors.error} size={18} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22 },
  h1: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', paddingTop: 60, marginBottom: 22 },
  card: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 24, padding: 22, alignItems: 'center', gap: 8,
  },
  avatarWrap: { padding: 3, borderRadius: 60, borderColor: colors.brand, borderWidth: 2 },
  avatar: { width: 90, height: 90, borderRadius: 50 },
  name: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 6 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  email: { color: colors.textSecondary, fontSize: 13 },
  miniStats: {
    flexDirection: 'row', marginTop: 16, backgroundColor: colors.bg,
    borderRadius: 14, padding: 12, width: '100%',
  },
  miniStat: { flex: 1, alignItems: 'center', gap: 4 },
  miniStatVal: { color: colors.textPrimary, fontWeight: '900', fontSize: 22 },
  miniStatLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  section: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 26, marginBottom: 10 },
  aboutCard: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 18, padding: 18, gap: 8,
  },
  aboutTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 16 },
  aboutText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  logoutBtn: {
    marginTop: 28, backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)', borderWidth: 1,
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  logoutText: { color: colors.error, fontWeight: '800', fontSize: 15 },
});
