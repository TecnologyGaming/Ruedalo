import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { MapPin, Navigation, Zap } from "lucide-react-native";

import { useAuth } from "@/src/lib/auth";
import { api } from "@/src/lib/api";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { RideMap, MarkerData } from "@/src/components/RideMap";
import { NeonButton } from "@/src/components/NeonButton";
import { toast } from "@/src/components/Toast";

const CARACAS = { lat: 10.4998, lng: -66.8517 };

export default function DriverHome() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [loc, setLoc] = useState(CARACAS);
  const [online, setOnline] = useState<boolean>(!!user?.is_online);
  const [requests, setRequests] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => { setOnline(!!user?.is_online); }, [user?.is_online]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const l = await Location.getCurrentPositionAsync({});
          const next = { lat: l.coords.latitude, lng: l.coords.longitude };
          setLoc(next);
          api("/drivers/location", { method: "POST", body: next }).catch(() => {});
        } catch {}
      }
    })();
  }, []);

  const load = useCallback(async () => {
    try {
      const [active, list] = await Promise.all([
        api<any>("/rides/active"),
        api<any[]>("/rides/available"),
      ]);
      setActive(active);
      setRequests(list);
      await refresh();
    } catch {}
  }, [refresh]);

  useFocusEffect(useCallback(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]));

  useEffect(() => {
    if (active) router.push(`/ride/${active.id}`);
  }, [active, router]);

  const toggleOnline = async (v: boolean) => {
    setOnline(v);
    try {
      await api("/drivers/online", { method: "POST", body: { is_online: v, lat: loc.lat, lng: loc.lng } });
      toast(v ? "Estás en línea" : "Desconectado", v ? "success" : "info");
      await refresh();
    } catch (e: any) {
      toast(e?.message ?? "Error", "error");
    }
  };

  const accept = async (rideId: string) => {
    setAcceptingId(rideId);
    try {
      await api(`/rides/${rideId}/accept`, { method: "POST" });
      toast("Viaje aceptado", "success");
      router.push(`/ride/${rideId}`);
    } catch (e: any) {
      toast(e?.message ?? "Error", "error");
    } finally {
      setAcceptingId(null);
    }
  };

  const markers: MarkerData[] = [
    { id: "me", lat: loc.lat, lng: loc.lng, type: "user" },
    ...requests.map((r) => ({ id: r.id, lat: r.origin_lat, lng: r.origin_lng, type: "destination" as const })),
  ];

  return (
    <View style={styles.root}>
      <RideMap center={loc} markers={markers} />

      <SafeAreaView edges={["top"]} style={styles.top} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View style={styles.userPill}>
            <View style={styles.avatar}><Text style={styles.avatarTxt}>{user?.name?.[0] ?? "C"}</Text></View>
            <View>
              <Text style={styles.hello}>{user?.name}</Text>
              <Text style={styles.rating}>★ {(user?.rating_avg ?? 5).toFixed(2)}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, online ? styles.statusPillOn : styles.statusPillOff]}>
            <View style={[styles.statusDot, { backgroundColor: online ? colors.secondary : colors.danger }]} />
            <Text style={[styles.statusText, { color: online ? colors.secondary : colors.danger }]}>{online ? "EN LÍNEA" : "OFFLINE"}</Text>
            <Switch value={online} onValueChange={toggleOnline} thumbColor={online ? colors.secondary : "#ccc"} trackColor={{ false: "#333", true: colors.secondaryDim }} testID="go-online-switch" />
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.bottom} pointerEvents="box-none">
        <View style={styles.handle} />
        <Text style={styles.title}>Solicitudes disponibles</Text>
        {!online ? (
          <View style={styles.offBox}>
            <Zap size={32} color={colors.primary} />
            <Text style={styles.offText}>Activa el modo en línea para recibir viajes</Text>
          </View>
        ) : requests.length === 0 ? (
          <Text style={styles.noReq}>Sin solicitudes por ahora. Mantente cerca de zonas activas.</Text>
        ) : (
          <ScrollView style={{ maxHeight: 320 }}>
            {requests.map((r) => (
              <View key={r.id} style={styles.reqCard}>
                <View style={styles.reqHead}>
                  <View>
                    <Text style={styles.reqPassenger}>{r.passenger_name}</Text>
                    <Text style={styles.reqMeta}>{r.distance_km} km · {Math.round(r.duration_min)} min</Text>
                  </View>
                  <Text style={styles.reqPrice}>${r.price_usd.toFixed(2)}</Text>
                </View>
                <View style={styles.reqRow}><MapPin size={12} color={colors.secondary} /><Text style={styles.reqAddr} numberOfLines={1}>{r.origin_address}</Text></View>
                <View style={styles.reqRow}><MapPin size={12} color={colors.primary} /><Text style={styles.reqAddr} numberOfLines={1}>{r.dest_address}</Text></View>
                <NeonButton
                  title="Aceptar viaje"
                  onPress={() => accept(r.id)}
                  loading={acceptingId === r.id}
                  icon={<Navigation size={16} color="#fff" />}
                  testID={`accept-ride-${r.id}`}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: { flexDirection: "row", padding: spacing.md, alignItems: "center", gap: 12, justifyContent: "space-between" },
  userPill: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: radii.full, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  avatar: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: colors.bg, fontFamily: fonts.bodyBold },
  hello: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 13 },
  rating: { color: colors.warning, fontFamily: fonts.body, fontSize: 11 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, backgroundColor: colors.surface },
  statusPillOn: { borderColor: colors.secondary, ...shadows.neonSecondary },
  statusPillOff: { borderColor: colors.danger },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  statusText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.5 },

  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.md, paddingBottom: spacing.lg + 6, gap: 12, borderTopWidth: 1, borderTopColor: colors.border, ...shadows.card },
  handle: { width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border, alignSelf: "center" },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18 },
  offBox: { alignItems: "center", gap: 8, padding: 20 },
  offText: { color: colors.textSecondary, fontFamily: fonts.body, textAlign: "center" },
  noReq: { color: colors.textMuted, fontFamily: fonts.body, textAlign: "center", padding: 20 },
  reqCard: { backgroundColor: colors.elevated, borderRadius: radii.lg, padding: 14, gap: 8, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  reqHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reqPassenger: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  reqMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  reqPrice: { color: colors.secondary, fontFamily: fonts.headingBold, fontSize: 22 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reqAddr: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 12, flex: 1 },
});
