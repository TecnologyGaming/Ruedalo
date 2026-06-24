import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/lib/api";
import { colors, fonts, radii, spacing } from "@/src/lib/theme";
import { MapPin, ArrowRight } from "lucide-react-native";

const STATUS_LABEL: Record<string, string> = {
  requested: "Buscando",
  accepted: "Aceptado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  requested: colors.warning,
  accepted: colors.secondary,
  in_progress: colors.tertiary,
  completed: colors.secondary,
  cancelled: colors.danger,
};

export default function PassengerTrips() {
  const router = useRouter();
  const [rides, setRides] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<any[]>("/rides/mine");
      setRides(r);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis viajes</Text>
        <Text style={styles.subtitle}>{rides.length} en total</Text>
      </View>
      <FlatList
        data={rides}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: spacing.md, gap: 12, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aún no tienes viajes.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              if (["requested", "accepted", "in_progress"].includes(item.status)) router.push(`/ride/${item.id}`);
            }}
            testID={`trip-${item.id}`}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.status, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
              <Text style={styles.price}>${item.price_usd.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <MapPin size={14} color={colors.secondary} />
              <Text style={styles.addr} numberOfLines={1}>{item.origin_address}</Text>
            </View>
            <ArrowRight size={12} color={colors.textMuted} style={{ marginLeft: 6 }} />
            <View style={styles.row}>
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.addr} numberOfLines={1}>{item.dest_address}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleString("es-VE")}</Text>
            {item.rating && (
              <Text style={styles.rating}>Calificación: {"★".repeat(item.rating)}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.md, gap: 4 },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 30 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.body },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 6 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  status: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" },
  price: { color: colors.secondary, fontFamily: fonts.headingBold, fontSize: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  addr: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 13, flex: 1 },
  date: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, marginTop: 6 },
  rating: { color: colors.warning, fontFamily: fonts.bodyMedium, fontSize: 13 },
});
