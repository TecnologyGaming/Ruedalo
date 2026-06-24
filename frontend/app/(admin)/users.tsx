import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/lib/api";
import { colors, fonts, radii, spacing } from "@/src/lib/theme";

const ROLE_COLOR: Record<string, string> = {
  passenger: colors.secondary,
  driver: colors.primary,
  admin: colors.tertiary,
};

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const load = useCallback(async () => {
    try { const u = await api<any[]>("/admin/users"); setUsers(u); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios</Text>
        <Text style={styles.subtitle}>{users.length} registrados</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: spacing.md, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avTxt}>{item.name?.[0]}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View style={[styles.badge, { borderColor: ROLE_COLOR[item.role] }]}>
                <Text style={[styles.badgeTxt, { color: ROLE_COLOR[item.role] }]}>{item.role.toUpperCase()}</Text>
              </View>
              <Text style={styles.bal}>${(item.wallet_balance ?? 0).toFixed(2)}</Text>
              {item.role === "driver" && (
                <Text style={[styles.onlineDot, { color: item.is_online ? colors.secondary : colors.textMuted }]}>
                  {item.is_online ? "● En línea" : "○ Offline"}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.md },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 30 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18 },
  name: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  email: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  phone: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  badgeTxt: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.5 },
  bal: { color: colors.secondary, fontFamily: fonts.bodyBold, fontSize: 13 },
  onlineDot: { fontFamily: fonts.body, fontSize: 10 },
});
