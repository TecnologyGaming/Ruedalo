import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2, MapPin, Navigation } from "lucide-react-native";

import { api } from "@/src/lib/api";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { toast } from "@/src/components/Toast";

const STATUS_COLOR: Record<string, string> = {
  requested: colors.warning,
  accepted: colors.primary,
  in_progress: colors.primary,
  completed: colors.success || "#10B981",
  cancelled: colors.danger,
};

const STATUS_LABEL: Record<string, string> = {
  requested: "BUSCANDO",
  accepted: "ACEPTADO",
  in_progress: "EN VIAJE",
  completed: "COMPLETADO",
  cancelled: "CANCELADO",
};

export default function AdminRides() {
  const [rides, setRides] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<any[]>("/admin/rides");
      setRides(r);
    } catch (e: any) {
      toast(e?.message ?? "Error al cargar carreras", "error");
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const deleteRide = async (id: string) => {
    setWorking(id);
    try {
      await api(`/rides/${id}`, { method: "DELETE" });
      toast("Carrera eliminada correctamente", "success");
      await load();
    } catch (e: any) {
      toast(e?.message ?? "Error al eliminar carrera", "error");
    } finally {
      setWorking(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Carreras</Text>
        <Text style={styles.subtitle}>{rides.length} registradas en el sistema</Text>
      </View>

      <FlatList
        data={rides}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.md, gap: 12, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No hay carreras activas o registradas.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.passengerName}>Pasajero: {item.passenger_name}</Text>
                <Text style={styles.passengerPhone}>Tel: {item.passenger_phone}</Text>
              </View>
              <Text style={styles.price}>${item.price_usd.toFixed(2)}</Text>
            </View>

            <View style={styles.routeBox}>
              <View style={styles.routeRow}>
                <MapPin size={14} color={colors.secondary} />
                <Text style={styles.routeAddr} numberOfLines={1}>{item.origin_address}</Text>
              </View>
              <View style={styles.routeRow}>
                <Navigation size={14} color={colors.primary} />
                <Text style={styles.routeAddr} numberOfLines={1}>{item.dest_address}</Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsText}>
                Distancia/Vehículo: {item.distance_km} km · {Math.round(item.duration_min)} min
              </Text>
              {item.driver_name ? (
                <Text style={styles.driverText}>Conductor: {item.driver_name}</Text>
              ) : (
                <Text style={styles.searchingText}>Conductor: Buscando...</Text>
              )}
            </View>

            <View style={styles.bottomRow}>
              <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[item.status] }]}>
                <Text style={[styles.statusTxt, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_LABEL[item.status] || item.status.toUpperCase()}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.deleteBtn, working === item.id && styles.btnDisabled]}
                onPress={() => deleteRide(item.id)}
                disabled={working === item.id}
                testID={`delete-ride-${item.id}`}
              >
                <Trash2 size={16} color="#fff" />
                <Text style={styles.deleteTxt}>Eliminar</Text>
              </TouchableOpacity>
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
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 10, ...shadows.card },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  passengerName: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  passengerPhone: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  price: { color: colors.primary, fontFamily: fonts.headingBold, fontSize: 20 },
  routeBox: { backgroundColor: colors.elevated, borderRadius: radii.md, padding: 10, gap: 6 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeAddr: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 12, flex: 1 },
  detailsRow: { flexDirection: "column", gap: 2, paddingVertical: 2 },
  detailsText: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  driverText: { color: colors.success || "#10B981", fontFamily: fonts.bodyBold, fontSize: 11 },
  searchingText: { color: colors.warning, fontFamily: fonts.bodyMedium, fontSize: 11 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusTxt: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1 },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.danger, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, ...shadows.btn },
  btnDisabled: { opacity: 0.6 },
  deleteTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 12 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 30, fontFamily: fonts.body },
});
