import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { MapPin, Navigation, Search, Star, Wallet as WalletIcon, X } from "lucide-react-native";

import { useAuth } from "@/src/lib/auth";
import { api } from "@/src/lib/api";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { RideMap, MarkerData } from "@/src/components/RideMap";
import { NeonButton } from "@/src/components/NeonButton";
import { FieldInput } from "@/src/components/FieldInput";
import { toast } from "@/src/components/Toast";

const CARACAS = { lat: 10.4998, lng: -66.8517 };

// Quick destinations around Caracas for demo
const QUICK_DEST = [
  { name: "Aeropuerto Maiquetía", address: "Aeropuerto Internacional Simón Bolívar", lat: 10.6014, lng: -66.9911 },
  { name: "C.C. Sambil", address: "C.C. Sambil Chacao", lat: 10.4933, lng: -66.8538 },
  { name: "Universidad Central", address: "UCV - Ciudad Universitaria", lat: 10.4910, lng: -66.8910 },
  { name: "Las Mercedes", address: "Av. Principal Las Mercedes", lat: 10.4811, lng: -66.8631 },
  { name: "Parque del Este", address: "Parque Generalísimo Francisco de Miranda", lat: 10.4920, lng: -66.8421 },
];

export default function PassengerHome() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number }>(CARACAS);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [destination, setDestination] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [estimate, setEstimate] = useState<{ price_usd: number; distance_km: number; duration_min: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [query, setQuery] = useState("");

  const loadActive = useCallback(async () => {
    try {
      const a = await api<any>("/rides/active");
      setActive(a);
    } catch {}
  }, []);

  const loadDrivers = useCallback(async (lat: number, lng: number) => {
    try {
      const d = await api<any[]>(`/drivers/nearby?lat=${lat}&lng=${lng}`);
      setDrivers(d);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setMyLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        } catch {}
      }
    })();
  }, []);

  useFocusEffect(useCallback(() => {
    loadActive();
    loadDrivers(myLoc.lat, myLoc.lng);
    refresh();
    const t = setInterval(() => {
      loadActive();
      loadDrivers(myLoc.lat, myLoc.lng);
    }, 5000);
    return () => clearInterval(t);
  }, [myLoc, loadActive, loadDrivers, refresh]));

  useEffect(() => {
    if (active) {
      router.push(`/ride/${active.id}`);
    }
  }, [active, router]);

  const pickDestination = async (d: { name: string; address: string; lat: number; lng: number }) => {
    setDestination(d);
    try {
      const est = await api<{ price_usd: number; distance_km: number; duration_min: number }>("/rides/estimate", {
        method: "POST",
        body: { origin_lat: myLoc.lat, origin_lng: myLoc.lng, dest_lat: d.lat, dest_lng: d.lng },
      });
      setEstimate(est);
    } catch (e: any) {
      toast(e?.message ?? "No se pudo estimar", "error");
    }
  };

  const confirm = async () => {
    if (!destination || !estimate) return;
    if ((user?.wallet_balance ?? 0) < estimate.price_usd) {
      toast("Saldo insuficiente. Recarga tu wallet.", "error");
      router.push("/(passenger)/wallet");
      return;
    }
    setConfirming(true);
    try {
      const ride = await api<any>("/rides/request", {
        method: "POST",
        body: {
          origin_lat: myLoc.lat,
          origin_lng: myLoc.lng,
          origin_address: "Mi ubicación",
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          dest_address: destination.address,
          price_usd: estimate.price_usd,
          distance_km: estimate.distance_km,
          duration_min: estimate.duration_min,
        },
      });
      toast("Buscando conductor...", "success");
      router.push(`/ride/${ride.id}`);
    } catch (e: any) {
      toast(e?.message ?? "Error", "error");
    } finally {
      setConfirming(false);
    }
  };

  const markers: MarkerData[] = [
    { id: "me", lat: myLoc.lat, lng: myLoc.lng, type: "user" },
    ...drivers.map((d) => ({ id: d.id, lat: d.lat, lng: d.lng, type: "driver" as const })),
    ...(destination ? [{ id: "dest", lat: destination.lat, lng: destination.lng, type: "destination" as const }] : []),
  ];

  const filtered = QUICK_DEST.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()) || d.address.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={styles.root}>
      <RideMap center={myLoc} markers={markers} polyline={destination ? [myLoc, destination] : undefined} />

      <SafeAreaView edges={["top"]} style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View style={styles.userPill}>
            <View style={styles.avatar}><Text style={styles.avatarTxt}>{user?.name?.[0] ?? "P"}</Text></View>
            <Text style={styles.userName} numberOfLines={1}>Hola, {user?.name?.split(" ")[0] ?? "Pasajero"}</Text>
          </View>
          <TouchableOpacity style={styles.balancePill} onPress={() => router.push("/(passenger)/wallet")} testID="passenger-wallet-pill">
            <WalletIcon size={14} color={colors.secondary} />
            <Text style={styles.balanceTxt}>${(user?.wallet_balance ?? 0).toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheet} pointerEvents="box-none">
        <View style={styles.handle} />
        {!destination ? (
          <>
            <Text style={styles.bsTitle}>¿A dónde vas?</Text>
            <FieldInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar destino..."
              rightIcon={<Search size={18} color={colors.textSecondary} />}
              testID="search-destination-input"
            />
            <ScrollView style={{ maxHeight: 240 }}>
              {filtered.map((d) => (
                <TouchableOpacity key={d.name} style={styles.destItem} onPress={() => pickDestination(d)} testID={`dest-${d.name.replace(/ /g, "-").toLowerCase()}`}>
                  <View style={styles.destIcon}><MapPin size={16} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.destName}>{d.name}</Text>
                    <Text style={styles.destAddr} numberOfLines={1}>{d.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {drivers.length > 0 && (
              <Text style={styles.driversInfo}>{drivers.length} conductores cerca</Text>
            )}
          </>
        ) : (
          <>
            <View style={styles.confirmHeader}>
              <Text style={styles.bsTitle}>Confirma tu viaje</Text>
              <TouchableOpacity onPress={() => { setDestination(null); setEstimate(null); }} testID="cancel-dest-btn">
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.routeBox}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.secondary }]} />
                <Text style={styles.routeAddr} numberOfLines={1}>Mi ubicación</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.routeAddr} numberOfLines={1}>{destination.address}</Text>
              </View>
            </View>
            {estimate ? (
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>PRECIO ESTIMADO</Text>
                  <Text style={styles.price} testID="estimated-price-text">${estimate.price_usd.toFixed(2)}</Text>
                </View>
                <View style={styles.metaRight}>
                  <Text style={styles.metaItem}>{estimate.distance_km} km</Text>
                  <Text style={styles.metaItem}>{estimate.duration_min} min</Text>
                </View>
              </View>
            ) : (
              <ActivityIndicator color={colors.secondary} />
            )}
            <NeonButton
              title={confirming ? "Solicitando..." : "Solicitar viaje"}
              onPress={confirm}
              loading={confirming}
              disabled={!estimate}
              testID="confirm-ride-btn"
              icon={<Navigation size={18} color="#fff" />}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, gap: 12 },
  userPill: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: radii.full, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, flexShrink: 1, ...shadows.card },
  avatar: { width: 30, height: 30, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontFamily: fonts.bodyBold },
  userName: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 13, flexShrink: 1 },
  balancePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface, borderRadius: radii.full, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.secondary, ...shadows.neonSecondary },
  balanceTxt: { color: colors.secondary, fontFamily: fonts.bodyBold, fontSize: 14 },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.md,
    paddingBottom: spacing.lg + 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
    ...shadows.card,
  },
  handle: { width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border, alignSelf: "center" },
  bsTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 20 },
  destItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  destIcon: { width: 36, height: 36, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  destName: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  destAddr: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  driversInfo: { color: colors.secondary, fontFamily: fonts.bodyMedium, fontSize: 12, textAlign: "center", marginTop: 4 },

  confirmHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeBox: { backgroundColor: colors.elevated, borderRadius: radii.md, padding: 14, gap: 6 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  routeDot: { width: 12, height: 12, borderRadius: 999 },
  routeLine: { width: 1, height: 14, backgroundColor: colors.border, marginLeft: 5 },
  routeAddr: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 14, flex: 1 },

  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingVertical: 6 },
  priceLabel: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1.5 },
  price: { color: colors.secondary, fontFamily: fonts.headingBold, fontSize: 38, letterSpacing: -1 },
  metaRight: { alignItems: "flex-end", gap: 4 },
  metaItem: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 13 },
});
