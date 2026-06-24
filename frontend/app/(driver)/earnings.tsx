import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp } from "lucide-react-native";

import { useAuth } from "@/src/lib/auth";
import { api } from "@/src/lib/api";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";

export default function DriverEarnings() {
  const { user, refresh } = useAuth();
  const [txns, setTxns] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const t = await api<any[]>("/wallet/history");
      setTxns(t.filter((x) => x.type === "ride_earning"));
      await refresh();
    } catch {}
  }, [refresh]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const total = txns.reduce((s, t) => s + t.amount, 0);
  const today = txns
    .filter((t) => new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Ganancias</Text>
      </View>
      <View style={styles.bigCard}>
        <Text style={styles.bigLabel}>SALDO TOTAL</Text>
        <Text style={styles.bigAmt}>${(user?.wallet_balance ?? 0).toFixed(2)}</Text>
        <View style={styles.row}>
          <View style={styles.smallCard}>
            <Text style={styles.smallLabel}>HOY</Text>
            <Text style={styles.smallAmt}>${today.toFixed(2)}</Text>
          </View>
          <View style={styles.smallCard}>
            <Text style={styles.smallLabel}>HISTÓRICO</Text>
            <Text style={styles.smallAmt}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.section}>Ganancias por viaje</Text>
      <FlatList
        data={txns}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.empty}>Aún sin ganancias.</Text>}
        renderItem={({ item }) => (
          <View style={styles.txn}>
            <View style={styles.txnIcon}><TrendingUp size={16} color={colors.secondary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txnDesc} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.txnDate}>{new Date(item.created_at).toLocaleString("es-VE")}</Text>
            </View>
            <Text style={styles.txnAmt}>+${item.amount.toFixed(2)}</Text>
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
  bigCard: { margin: spacing.md, marginTop: 0, padding: spacing.lg, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.secondary, ...shadows.neonSecondary },
  bigLabel: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, letterSpacing: 2, fontSize: 11 },
  bigAmt: { color: colors.secondary, fontFamily: fonts.headingBold, fontSize: 48, letterSpacing: -1 },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  smallCard: { flex: 1, backgroundColor: colors.elevated, padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  smallLabel: { color: colors.textMuted, fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1.5 },
  smallAmt: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 22, marginTop: 4 },
  section: { color: colors.textSecondary, fontFamily: fonts.bodyBold, letterSpacing: 1.5, fontSize: 12, textTransform: "uppercase", paddingHorizontal: spacing.md, marginBottom: 8, marginTop: 6 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 30, fontFamily: fonts.body },
  txn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  txnIcon: { width: 38, height: 38, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.secondary },
  txnDesc: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 13 },
  txnDate: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  txnAmt: { color: colors.secondary, fontFamily: fonts.headingBold, fontSize: 16 },
});
