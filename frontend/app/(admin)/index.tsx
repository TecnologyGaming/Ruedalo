import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, X } from "lucide-react-native";

import { api } from "@/src/lib/api";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { toast } from "@/src/components/Toast";

const FILTERS = [
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
  { key: "all", label: "Todas" },
];

export default function AdminRecharges() {
  const [filter, setFilter] = useState("pending");
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const q = filter === "all" ? "" : `?status_filter=${filter}`;
      const [list, s] = await Promise.all([
        api<any[]>(`/admin/recharges${q}`),
        api<any>("/admin/stats"),
      ]);
      setItems(list);
      setStats(s);
    } catch (e: any) {
      toast(e?.message ?? "Error", "error");
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const approve = async (id: string) => {
    setWorking(id);
    try {
      await api(`/admin/recharges/${id}/approve`, { method: "POST" });
      toast("Recarga aprobada", "success");
      await load();
    } catch (e: any) { toast(e?.message ?? "Error", "error"); }
    finally { setWorking(null); }
  };

  const reject = async (id: string) => {
    setWorking(id);
    try {
      await api(`/admin/recharges/${id}/reject`, { method: "POST" });
      toast("Recarga rechazada", "info");
      await load();
    } catch (e: any) { toast(e?.message ?? "Error", "error"); }
    finally { setWorking(null); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Admin</Text>
        <Text style={styles.subtitle}>Recargas Pago Móvil</Text>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <Stat label="Pendientes" value={stats.pending_recharges} color={colors.warning} />
          <Stat label="Usuarios" value={stats.total_users} color={colors.secondary} />
          <Stat label="Online" value={stats.online_drivers} color={colors.primary} />
          <Stat label="Viajes" value={stats.completed_rides} color={colors.tertiary} />
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            testID={`filter-${f.key}`}
          >
            <Text style={[styles.chipTxt, filter === f.key && styles.chipTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: spacing.md, gap: 10, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.secondary} />}
        ListEmptyComponent={<Text style={styles.empty}>Sin solicitudes.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.userName}>{item.user_name}</Text>
                <Text style={styles.email}>{item.user_email}</Text>
              </View>
              <Text style={styles.amt}>${item.amount_usd.toFixed(2)}</Text>
            </View>
            <Row label="Referencia" value={item.reference} />
            <Row label="Banco emisor" value={item.sender_bank} />
            <Row label="Teléfono" value={item.sender_phone} />
            <Row label="Fecha" value={new Date(item.created_at).toLocaleString("es-VE")} />
            <View style={[styles.statusBadge, item.status === "pending" ? { borderColor: colors.warning } : item.status === "approved" ? { borderColor: colors.secondary } : { borderColor: colors.danger }]}>
              <Text style={[styles.statusTxt, item.status === "pending" ? { color: colors.warning } : item.status === "approved" ? { color: colors.secondary } : { color: colors.danger }]}>
                {item.status === "pending" ? "PENDIENTE" : item.status === "approved" ? "APROBADA" : "RECHAZADA"}
              </Text>
            </View>
            {item.status === "pending" && (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actBtn, { backgroundColor: colors.danger }]} onPress={() => reject(item.id)} disabled={working === item.id} testID={`reject-recharge-${item.id}`}>
                  <X size={16} color="#fff" /><Text style={styles.actTxt}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actBtn, { backgroundColor: colors.secondary }]} onPress={() => approve(item.id)} disabled={working === item.id} testID={`approve-recharge-${item.id}`}>
                  <Check size={16} color={colors.bg} /><Text style={[styles.actTxt, { color: colors.bg }]}>Aprobar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.stat, { borderColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowL}>{label}</Text>
      <Text style={styles.rowV}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.md, gap: 2 },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 30 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  statsRow: { flexDirection: "row", paddingHorizontal: spacing.md, gap: 8, marginBottom: 12 },
  stat: { flex: 1, padding: 10, borderRadius: radii.md, borderWidth: 1, backgroundColor: colors.surface, alignItems: "center" },
  statValue: { fontFamily: fonts.headingBold, fontSize: 22 },
  statLabel: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 10, marginTop: 2 },
  filterRow: { paddingHorizontal: spacing.md, gap: 8, height: 56, alignItems: "center" },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, height: 36, justifyContent: "center", flexShrink: 0 },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.elevated },
  chipTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 12 },
  chipTxtActive: { color: colors.primary },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 30, fontFamily: fonts.body },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 6 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  userName: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  email: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  amt: { color: colors.secondary, fontFamily: fonts.headingBold, fontSize: 26 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  rowL: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12 },
  rowV: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 12 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, marginTop: 4 },
  statusTxt: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.5 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 999 },
  actTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 13 },
});
