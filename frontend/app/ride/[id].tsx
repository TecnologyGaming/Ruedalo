import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, ActivityIndicator, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { ArrowLeft, MessageSquare, Phone, Star, X, Send, MapPin, Navigation } from "lucide-react-native";

import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { RideMap, MarkerData } from "@/src/components/RideMap";
import { NeonButton } from "@/src/components/NeonButton";
import { toast } from "@/src/components/Toast";

const STATUS_LABEL: Record<string, string> = {
  requested: "Buscando conductor...",
  accepted: "Conductor en camino",
  in_progress: "En viaje",
  completed: "Viaje completado",
  cancelled: "Viaje cancelado",
};

export default function RideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [ride, setRide] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [working, setWorking] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const intervalRef = useRef<any>(null);

  const isPassenger = user?.role === "passenger";
  const isDriver = user?.role === "driver";

  useEffect(() => {
    if (id !== "demo-ride-123") return;
    
    // Step 0: requested (Buscando conductor...)
    // After 6 seconds, transition to Step 1: accepted (Conductor en camino)
    const t1 = setTimeout(() => {
      setDemoStep(1);
      toast("¡Conductor encontrado! Carlos M. ha aceptado tu viaje.", "success");
    }, 6000);

    // After 14 seconds, transition to Step 2: in_progress (En viaje)
    const t2 = setTimeout(() => {
      setDemoStep(2);
      toast("El viaje ha iniciado. Te diriges a tu destino.", "info");
    }, 14000);

    // After 22 seconds, transition to Step 3: completed (Viaje completado)
    const t3 = setTimeout(() => {
      setDemoStep(3);
      toast("¡Has llegado a tu destino! Califica tu viaje.", "success");
    }, 22000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [id]);

  const load = useCallback(async () => {
    if (!id) return;
    
    if (id === "demo-ride-123") {
      const mock = {
        id: "demo-ride-123",
        passenger_id: user?.id || "pasajero-demo",
        passenger_name: user?.name || "Luis Pasajero",
        passenger_phone: user?.phone || "0414-1111111",
        driver_id: demoStep >= 1 ? "driver-demo" : null,
        driver_name: demoStep >= 1 ? "Carlos M." : null,
        driver_phone: demoStep >= 1 ? "0414-2233445" : null,
        driver_lat: demoStep >= 1 ? 10.5012 : null,
        driver_lng: demoStep >= 1 ? -66.8533 : null,
        origin_lat: 10.4998,
        origin_lng: -66.8517,
        origin_address: "Plaza Altamira, Caracas",
        dest_lat: 10.4806,
        dest_lng: -66.9036,
        dest_address: "Plaza Bolívar, Caracas",
        price_usd: 4.50,
        distance_km: 6.2,
        duration_min: 15,
        status: demoStep >= 3 ? "completed" : demoStep >= 2 ? "in_progress" : "requested",
        created_at: "2026-08-02T00:00:00Z",
        accepted_at: demoStep >= 1 ? "2026-08-02T00:01:00Z" : null,
        completed_at: demoStep >= 3 ? "2026-08-02T00:16:00Z" : null,
        rated: false,
        rating: null
      };
      setRide(mock);
      if (mock.status === "completed" && isPassenger && !mock.rated) {
        setRateOpen(true);
      }
      return;
    }

    try {
      const r = await api<any>(`/rides/${id}`);
      setRide(r);
      if (r.status === "completed" && isPassenger && !r.rated) {
        setRateOpen(true);
      }
    } catch {}
  }, [id, isPassenger, user, demoStep]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 4000);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  const cancel = async () => {
    setWorking(true);
    try {
      await api(`/rides/${id}/cancel`, { method: "POST" });
      toast("Viaje cancelado", "info");
      router.back();
    } catch (e: any) { toast(e?.message ?? "Error", "error"); }
    finally { setWorking(false); }
  };

  const startRide = async () => {
    setWorking(true);
    try { await api(`/rides/${id}/start`, { method: "POST" }); await load(); toast("Viaje iniciado", "success"); }
    catch (e: any) { toast(e?.message ?? "Error", "error"); }
    finally { setWorking(false); }
  };

  const completeRide = async () => {
    setWorking(true);
    try { await api(`/rides/${id}/complete`, { method: "POST" }); await load(); toast("Viaje completado", "success"); }
    catch (e: any) { toast(e?.message ?? "Error", "error"); }
    finally { setWorking(false); }
  };

  const submitRating = async () => {
    setWorking(true);
    try {
      await api("/rides/rate", { method: "POST", body: { ride_id: id, rating, comment } });
      toast("¡Gracias por tu calificación!", "success");
      setRateOpen(false);
      router.back();
    } catch (e: any) { toast(e?.message ?? "Error", "error"); }
    finally { setWorking(false); }
  };

  if (!ride) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  const center = isPassenger
    ? { lat: ride.origin_lat, lng: ride.origin_lng }
    : { lat: ride.origin_lat, lng: ride.origin_lng };

  const markers: MarkerData[] = [
    { id: "origin", lat: ride.origin_lat, lng: ride.origin_lng, type: "origin" },
    { id: "dest", lat: ride.dest_lat, lng: ride.dest_lng, type: "destination" },
    ...(ride.driver_lat && ride.driver_lng ? [{ id: "driver", lat: ride.driver_lat, lng: ride.driver_lng, type: "driver" as const }] : []),
  ];

  return (
    <View style={styles.root}>
      <RideMap center={center} markers={markers} polyline={[{ lat: ride.origin_lat, lng: ride.origin_lng }, { lat: ride.dest_lat, lng: ride.dest_lng }]} />

      <SafeAreaView edges={["top"]} style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} testID="ride-back-btn"><ArrowLeft size={20} color="#fff" /></TouchableOpacity>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: ride.status === "completed" ? colors.secondary : ride.status === "cancelled" ? colors.danger : colors.primary }]} />
            <Text style={styles.statusLabel}>{STATUS_LABEL[ride.status]}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        {ride.driver_name ? (
          <View style={styles.driverCard}>
            <View style={styles.avatar}><Text style={styles.avTxt}>{ride.driver_name?.[0]}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{isPassenger ? ride.driver_name : ride.passenger_name}</Text>
              <Text style={styles.driverRole}>{isPassenger ? "Tu conductor" : "Pasajero"}</Text>
            </View>
            <TouchableOpacity style={styles.commIcon} onPress={() => setChatOpen(true)} testID="open-chat-btn">
              <MessageSquare size={18} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.commIcon} onPress={() => Linking.openURL(`tel:${isPassenger ? ride.driver_phone : ride.passenger_phone}`)} testID="call-btn">
              <Phone size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.searching}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.searchingTxt}>Buscando conductor cercano...</Text>
          </View>
        )}

        <View style={styles.routeBox}>
          <View style={styles.routeRow}><View style={[styles.routeDot, { backgroundColor: colors.secondary }]} /><Text style={styles.routeAddr} numberOfLines={1}>{ride.origin_address}</Text></View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}><View style={[styles.routeDot, { backgroundColor: colors.primary }]} /><Text style={styles.routeAddr} numberOfLines={1}>{ride.dest_address}</Text></View>
        </View>

        <View style={styles.metaRow}>
          <View><Text style={styles.metaLabel}>PRECIO</Text><Text style={styles.metaVal}>${ride.price_usd.toFixed(2)}</Text></View>
          <View><Text style={styles.metaLabel}>DISTANCIA</Text><Text style={styles.metaVal}>{ride.distance_km} km</Text></View>
          <View><Text style={styles.metaLabel}>DURACIÓN</Text><Text style={styles.metaVal}>{Math.round(ride.duration_min)} min</Text></View>
        </View>

        {ride.status === "requested" && isPassenger && (
          <NeonButton title="Cancelar viaje" variant="danger" onPress={cancel} loading={working} testID="cancel-ride-btn" />
        )}
        {ride.status === "accepted" && isDriver && (
          <NeonButton title="Iniciar viaje" onPress={startRide} loading={working} icon={<Navigation size={16} color="#fff" />} testID="start-ride-btn" />
        )}
        {ride.status === "in_progress" && isDriver && (
          <NeonButton title="Completar viaje" onPress={completeRide} loading={working} testID="complete-ride-btn" />
        )}
        {ride.status === "completed" && isPassenger && !ride.rated && (
          <NeonButton title="Calificar al conductor" onPress={() => setRateOpen(true)} icon={<Star size={16} color="#fff" />} testID="open-rate-btn" />
        )}
        {(ride.status === "completed" || ride.status === "cancelled") && (
          <NeonButton title="Volver al inicio" variant="secondary" onPress={() => router.replace("/")} testID="ride-home-btn" />
        )}
      </View>

      {/* Chat modal */}
      <Modal visible={chatOpen} animationType="slide" onRequestClose={() => setChatOpen(false)} presentationStyle="pageSheet">
        <ChatSheet rideId={id} onClose={() => setChatOpen(false)} />
      </Modal>

      {/* Rating modal */}
      <Modal visible={rateOpen} animationType="fade" transparent onRequestClose={() => setRateOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.rateCard}>
            <TouchableOpacity style={styles.rateClose} onPress={() => setRateOpen(false)}><X size={20} color={colors.textPrimary} /></TouchableOpacity>
            <Text style={styles.rateTitle}>¿Cómo estuvo tu viaje?</Text>
            <Text style={styles.rateSub}>Califica a {ride.driver_name}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)} testID={`star-${s}`}>
                  <Star size={36} color={s <= rating ? colors.warning : colors.border} fill={s <= rating ? colors.warning : "transparent"} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.rateInput}
              placeholder="Deja un comentario (opcional)"
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              testID="rate-comment-input"
            />
            <NeonButton title="Enviar calificación" onPress={submitRating} loading={working} testID="submit-rating-btn" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ChatSheet({ rideId, onClose }: { rideId: string; onClose: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const m = await api<any[]>(`/messages/${rideId}`);
      setMessages(m);
    } catch {}
  }, [rideId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api(`/messages/${rideId}`, { method: "POST", body: { text: text.trim() } });
      setText("");
      await load();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) { toast(e?.message ?? "Error", "error"); }
    finally { setSending(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior="translate-with-padding" style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <View style={chatStyles.header}>
          <Text style={chatStyles.title}>Chat del viaje</Text>
          <TouchableOpacity onPress={onClose} testID="close-chat-btn"><X size={24} color="#fff" /></TouchableOpacity>
        </View>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.md, gap: 8 }}
          ListEmptyComponent={<Text style={chatStyles.empty}>Aún no hay mensajes</Text>}
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            return (
              <View style={[chatStyles.bubble, mine ? chatStyles.bubbleMine : chatStyles.bubbleTheirs]}>
                <Text style={[chatStyles.text, mine ? { color: "#fff" } : { color: colors.textPrimary }]}>{item.text}</Text>
                <Text style={[chatStyles.time, mine ? { color: "rgba(255,255,255,0.7)" } : { color: colors.textMuted }]}>
                  {new Date(item.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
        />
        <View style={chatStyles.inputBar}>
          <TextInput
            style={chatStyles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.textMuted}
            testID="chat-input"
          />
          <TouchableOpacity style={chatStyles.sendBtn} onPress={send} disabled={sending || !text.trim()} testID="chat-send-btn">
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: { flexDirection: "row", padding: spacing.md, alignItems: "center", gap: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 999, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadows.card },
  statusPill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  statusDot: { width: 10, height: 10, borderRadius: 999 },
  statusLabel: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13, flex: 1 },

  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.md, paddingBottom: spacing.lg + 8, gap: 12, borderTopWidth: 1, borderTopColor: colors.border, ...shadows.card },
  handle: { width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border, alignSelf: "center" },
  driverCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: colors.elevated, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avTxt: { color: "#fff", fontFamily: fonts.headingBold, fontSize: 18 },
  driverName: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  driverRole: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  commIcon: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },

  searching: { flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: colors.elevated, borderRadius: radii.md },
  searchingTxt: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },

  routeBox: { backgroundColor: colors.elevated, borderRadius: radii.md, padding: 14, gap: 6 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  routeDot: { width: 12, height: 12, borderRadius: 999 },
  routeLine: { width: 1, height: 12, backgroundColor: colors.border, marginLeft: 5 },
  routeAddr: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 13, flex: 1 },

  metaRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  metaLabel: { color: colors.textMuted, fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1.5 },
  metaVal: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18, marginTop: 2 },

  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: 24 },
  rateCard: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 24, width: "100%", borderWidth: 1, borderColor: colors.border, gap: 12 },
  rateClose: { position: "absolute", top: 12, right: 12, padding: 6 },
  rateTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 22, textAlign: "center" },
  rateSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, textAlign: "center" },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 8 },
  rateInput: { backgroundColor: colors.elevated, color: colors.textPrimary, fontFamily: fonts.body, padding: 12, borderRadius: radii.md, minHeight: 70, textAlignVertical: "top" },
});

const chatStyles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 20 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 60, fontFamily: fonts.body },
  bubble: { padding: 10, borderRadius: 18, maxWidth: "78%" },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: "flex-start", backgroundColor: colors.elevated, borderBottomLeftRadius: 4 },
  text: { fontFamily: fonts.body, fontSize: 14 },
  time: { fontFamily: fonts.body, fontSize: 10, marginTop: 2, alignSelf: "flex-end" },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 8, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.elevated, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, color: colors.textPrimary, fontFamily: fonts.body, fontSize: 14 },
  sendBtn: { width: 46, height: 46, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadows.neonPrimary },
});
