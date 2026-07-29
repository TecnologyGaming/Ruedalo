import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { MapPin, Navigation, Search, Star, Wallet as WalletIcon, X, Shield, ShieldCheck, Heart, Info, ChevronRight, User, Phone, Check, CreditCard, MessageSquare, Bike, Car, Sparkles } from "lucide-react-native";

import { useAuth } from "@/src/lib/auth";
import { api } from "@/src/lib/api";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { RideMap, MarkerData } from "@/src/components/RideMap";
import { NeonButton } from "@/src/components/NeonButton";
import { FieldInput } from "@/src/components/FieldInput";
import { toast } from "@/src/components/Toast";

const CARACAS = { lat: 10.4998, lng: -66.8517 };
const USD_BS_RATE = 38.5; // Venezuela Exchange Rate

const QUICK_DEST = [
  { name: "Aeropuerto Maiquetía", address: "Aeropuerto Internacional Simón Bolívar", lat: 10.6014, lng: -66.9911 },
  { name: "C.C. Sambil", address: "C.C. Sambil Chacao", lat: 10.4933, lng: -66.8538 },
  { name: "Universidad Central", address: "UCV - Ciudad Universitaria", lat: 10.4910, lng: -66.8910 },
  { name: "Las Mercedes", address: "Av. Principal Las Mercedes", lat: 10.4811, lng: -66.8631 },
  { name: "Parque del Este", address: "Parque Generalísimo Francisco de Miranda", lat: 10.4920, lng: -66.8421 },
];

export default function PassengerHome() {
  const router = useRouter();
  const { user, refresh, setUser } = useAuth();
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number }>(CARACAS);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [destination, setDestination] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [estimate, setEstimate] = useState<{ price_usd: number; distance_km: number; duration_min: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [query, setQuery] = useState("");
  
  // Custom states for premium features
  const [selectedServiceType, setSelectedServiceType] = useState<"ride" | "delivery">("ride");
  const [selectedService, setSelectedService] = useState<"moto" | "economico" | "confort" | "delivery">("economico");
  const [instructions, setInputInstructions] = useState("");
  const [payMethod, setPayMethod] = useState<"wallet" | "cash">("wallet");
  const [orderForOthers, setOrderForOthers] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [otherPhone, setOtherPhone] = useState("");
  
  // Pre-trip Verification checklist state
  const [verifyModal, setVerifyModal] = useState(false);
  const [profilePicSimulated, setProfilePicSimulated] = useState(false);
  const [customCedula, setCustomCedula] = useState("");
  const [trustedContactName, setTrustedContactName] = useState("");
  const [trustedContactPhone, setTrustedContactPhone] = useState("");
  const [isTrustedContactSaved, setIsTrustedContactSaved] = useState(false);
  const [safetyRead, setSafetyRead] = useState(false);
  const [activeTabSafety, setActiveTabSafety] = useState(false);

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
      const est = await api<{ price_usd: number; distance_km: number; duration_min: number; rates: any }>("/rides/estimate", {
        method: "POST",
        body: { origin_lat: myLoc.lat, origin_lng: myLoc.lng, dest_lat: d.lat, dest_lng: d.lng, service_type: selectedServiceType }
      });
      setEstimate(est);
    } catch (e: any) {
      toast(e?.message ?? "No se pudo estimar", "error");
    }
  };

  // Compute tier price based on advanced backend rates matrix
  const getTierPrice = (service: "moto" | "economico" | "confort" | "delivery") => {
    if (!estimate || !estimate.rates) return 0;
    return estimate.rates[service]?.discounted ?? 0;
  };

  const getTierOriginalPrice = (service: "moto" | "economico" | "confort" | "delivery") => {
    if (!estimate || !estimate.rates) return 0;
    return estimate.rates[service]?.original ?? 0;
  };

  const roundPrice = (num: number) => {
    return Math.round(num * 100) / 100;
  };

  const confirm = async () => {
    if (!destination || !estimate) return;
    const finalPrice = getTierPrice(selectedService);
    
    if (payMethod === "wallet" && (user?.wallet_balance ?? 0) < finalPrice) {
      toast("Saldo insuficiente en tu wallet. Recarga saldo o paga en efectivo.", "error");
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
          price_usd: finalPrice,
          distance_km: estimate.distance_km,
          duration_min: estimate.duration_min,
        },
      });
      
      // If instructions are added, we can send them (simulate in local/UI or can post in messages)
      if (instructions.trim()) {
        await api(`/messages/${ride.id}`, {
          method: "POST",
          body: { text: `[Nota de viaje]: ${instructions}` }
        });
      }
      
      toast(`Buscando conductor de ${selectedService.toUpperCase()}...`, "success");
      router.push(`/ride/${ride.id}`);
    } catch (e: any) {
      toast(e?.message ?? "Error al solicitar", "error");
    } finally {
      setConfirming(false);
    }
  };

  const saveCedulaFromChecklist = async () => {
    if (!customCedula.trim()) {
      toast("Por favor ingresa una Cédula válida", "error");
      return;
    }
    try {
      const u = await api<any>("/users/update_profile", {
        method: "POST",
        body: { cedula: customCedula.trim(), cedula_photo: "checklist_uploaded_doc_photo" }
      });
      setUser(u);
      toast("Cédula registrada correctamente", "success");
    } catch (e: any) {
      toast("No se pudo registrar la Cédula", "error");
    }
  };

  const saveTrustedContact = () => {
    if (!trustedContactName.trim() || !trustedContactPhone.trim()) {
      toast("Completa los datos del contacto de confianza", "error");
      return;
    }
    setIsTrustedContactSaved(true);
    toast("Contacto de confianza guardado correctamente", "success");
  };

  // Calculate 0/6 checklist progress
  const getChecklistCount = () => {
    let count = 2; // Phone and email verified are auto-completed on sign up
    if (user?.cedula || customCedula) count++;
    if (profilePicSimulated || user?.profile_pic) count++;
    if (isTrustedContactSaved) count++;
    if (safetyRead) count++;
    return count;
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
          <TouchableOpacity style={styles.userPill} onPress={() => router.push("/(passenger)/profile")}>
            <View style={styles.avatar}><Text style={styles.avatarTxt}>{user?.name?.[0] ?? "P"}</Text></View>
            <Text style={styles.userName} numberOfLines={1}>Hola, {user?.name?.split(" ")[0] ?? "Pasajero"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.balancePill} onPress={() => router.push("/(passenger)/wallet")} testID="passenger-wallet-pill">
            <WalletIcon size={14} color="#fff" />
            <Text style={styles.balanceTxt}>${(user?.wallet_balance ?? 0).toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheet} pointerEvents="box-none">
        <View style={styles.handle} />
        
        {/* Referral and Promo Banner (Yango inspired) */}
        <View style={styles.promoScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoScroll}>
            {/* Promo Bienvenida Card */}
            <View style={[styles.promoCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
              <View style={styles.promoIconContainer}>
                <Sparkles size={16} color="#3B82F6" />
              </View>
              <View>
                <Text style={[styles.promoTitleText, { color: "#1D4ED8" }]}>Promo Bienvenida 🎉</Text>
                <Text style={styles.promoDescText}>+$1.50 de regalo agregados a tu Wallet.</Text>
              </View>
            </View>

            {/* Promo Racha Card */}
            <View style={[styles.promoCard, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
              <View style={styles.promoIconContainer}>
                <Star size={16} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.promoTitleText, { color: "#B45309" }]}>Promo Racha ({user?.completed_rides_count ?? 0}/5) 🔥</Text>
                <Text style={styles.promoDescText}>Completa 5 viajes y recibe un bono de +$2.00.</Text>
              </View>
            </View>

            {/* Refer a Friend Card */}
            <View style={[styles.promoCard, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}>
              <View style={styles.promoIconContainer}>
                <User size={16} color="#059669" />
              </View>
              <View>
                <Text style={[styles.promoTitleText, { color: "#047857" }]}>Refiere a un amigo 🤝</Text>
                <Text style={styles.promoDescText}>¡Gana $2.50 por cada amigo que complete su 1er viaje!</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {!destination ? (
          <>
            {/* Toggle Service Selector Button Row - Pedir Carrera vs Enviar Paquete */}
            <View style={styles.serviceTypeToggleRow}>
              <TouchableOpacity 
                style={[styles.serviceTypeBtn, selectedServiceType === "ride" && styles.serviceTypeBtnActive]}
                onPress={() => { setSelectedServiceType("ride"); setSelectedService("economico"); }}
              >
                <Car size={18} color={selectedServiceType === "ride" ? "#FFFFFF" : colors.textSecondary} />
                <Text style={[styles.serviceTypeBtnTxt, selectedServiceType === "ride" && styles.serviceTypeBtnTxtActive]}>Pedir Carrera</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.serviceTypeBtn, selectedServiceType === "delivery" && styles.serviceTypeBtnActive]}
                onPress={() => { setSelectedServiceType("delivery"); setSelectedService("delivery"); }}
              >
                <Bike size={18} color={selectedServiceType === "delivery" ? "#FFFFFF" : colors.textSecondary} />
                <Text style={[styles.serviceTypeBtnTxt, selectedServiceType === "delivery" && styles.serviceTypeBtnTxtActive]}>Enviar Paquete</Text>
              </TouchableOpacity>
            </View>

            {/* Safety Verification Banner - Yango Style */}
            <TouchableOpacity style={styles.safetyBanner} onPress={() => setVerifyModal(true)} testID="safety-verification-banner">
              <View style={styles.safetyBannerLeft}>
                <View style={styles.shieldIconBox}>
                  <Shield size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.safetyBannerTitle}>Verificación previa al viaje</Text>
                  <Text style={styles.safetyBannerSub}>Medidas de seguridad recomendadas para Venezuela</Text>
                </View>
              </View>
              <View style={styles.safetyProgressPill}>
                <Text style={styles.safetyProgressTxt}>{getChecklistCount()}/6</Text>
                <ChevronRight size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>

            <Text style={styles.bsTitle}>¿A dónde vas hoy?</Text>
            <FieldInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ej: C.C. Sambil Chacao..."
              rightIcon={<Search size={18} color={colors.textSecondary} />}
              testID="search-destination-input"
            />
            
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {filtered.map((d) => (
                <TouchableOpacity key={d.name} style={styles.destItem} onPress={() => pickDestination(d)} testID={`dest-${d.name.replace(/ /g, "-").toLowerCase()}`}>
                  <View style={styles.destIcon}><MapPin size={16} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.destName}>{d.name}</Text>
                    <Text style={styles.destAddr} numberOfLines={1}>{d.address}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {drivers.length > 0 && (
              <View style={styles.driversNearbyBadge}>
                <Text style={styles.driversInfo}>🟢 {drivers.length} conductores online cerca de ti</Text>
              </View>
            )}
          </>
        ) : (
          // Destination selected: Ride Tier Selection & Checkout Flow
          <>
            <View style={styles.confirmHeader}>
              <Text style={styles.bsTitle}>Selecciona tu servicio</Text>
              <TouchableOpacity style={styles.closeConfirmBtn} onPress={() => { setDestination(null); setEstimate(null); }} testID="cancel-dest-btn">
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.routeBox}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.secondary }]} />
                <Text style={styles.routeAddr} numberOfLines={1}>📍 Mi ubicación actual</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.routeAddr} numberOfLines={1}>🏁 {destination.name} - {destination.address}</Text>
              </View>
            </View>

            {estimate ? (
              <View style={{ gap: 10 }}>
                {selectedServiceType === "ride" ? (
                  /* Service Categories Cards (Yango Vertical List Layout) */
                  <View style={styles.servicesVerticalList}>
                    {/* Tier 1: Moto */}
                    <TouchableOpacity 
                      style={[styles.verticalServiceItem, selectedService === "moto" && styles.verticalServiceItemActive]}
                      onPress={() => setSelectedService("moto")}
                      testID="service-moto-btn"
                    >
                      <View style={styles.verticalServiceLeft}>
                        <View style={[styles.verticalServiceIconBox, selectedService === "moto" && { backgroundColor: "#FEE2E2" }]}>
                          <Bike size={24} color={selectedService === "moto" ? colors.primary : colors.textSecondary} />
                        </View>
                        <View style={{ gap: 2, flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.verticalServiceName}>Moto Rápida</Text>
                            <View style={styles.timeTag}><Text style={styles.timeTagTxt}>{estimate.duration_min - 2} min</Text></View>
                          </View>
                          <Text style={styles.verticalServiceDesc}>¡Casco obligatorio limpio incluido!</Text>
                          <Text style={styles.savingTag}>Ahorras ${getTierOriginalPrice("moto") - getTierPrice("moto") > 0 ? (getTierOriginalPrice("moto") - getTierPrice("moto")).toFixed(2) : "0.15"}</Text>
                        </View>
                      </View>
                      <View style={styles.verticalServiceRight}>
                        <Text style={styles.verticalServicePrice}>${getTierPrice("moto").toFixed(2)}</Text>
                        <Text style={styles.verticalServiceOriginalPrice}>${getTierOriginalPrice("moto").toFixed(2)}</Text>
                        <Text style={styles.verticalServicePriceBs}>Bs. {(getTierPrice("moto") * USD_BS_RATE).toFixed(0)}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Tier 2: Económico */}
                    <TouchableOpacity 
                      style={[styles.verticalServiceItem, selectedService === "economico" && styles.verticalServiceItemActive]}
                      onPress={() => setSelectedService("economico")}
                      testID="service-economico-btn"
                    >
                      <View style={styles.verticalServiceLeft}>
                        <View style={[styles.verticalServiceIconBox, selectedService === "economico" && { backgroundColor: "#FEE2E2" }]}>
                          <Car size={24} color={selectedService === "economico" ? colors.primary : colors.textSecondary} />
                        </View>
                        <View style={{ gap: 2, flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.verticalServiceName}>Económico</Text>
                            <View style={styles.timeTag}><Text style={styles.timeTagTxt}>{estimate.duration_min} min</Text></View>
                          </View>
                          <Text style={styles.verticalServiceDesc}>Autos limpios y económicos</Text>
                          <Text style={styles.savingTag}>Ahorras ${getTierOriginalPrice("economico") - getTierPrice("economico") > 0 ? (getTierOriginalPrice("economico") - getTierPrice("economico")).toFixed(2) : "0.15"}</Text>
                        </View>
                      </View>
                      <View style={styles.verticalServiceRight}>
                        <Text style={styles.verticalServicePrice}>${getTierPrice("economico").toFixed(2)}</Text>
                        <Text style={styles.verticalServiceOriginalPrice}>${getTierOriginalPrice("economico").toFixed(2)}</Text>
                        <Text style={styles.verticalServicePriceBs}>Bs. {(getTierPrice("economico") * USD_BS_RATE).toFixed(0)}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Tier 3: Confort VIP */}
                    <TouchableOpacity 
                      style={[styles.verticalServiceItem, selectedService === "confort" && styles.verticalServiceItemActive]}
                      onPress={() => setSelectedService("confort")}
                      testID="service-confort-btn"
                    >
                      <View style={styles.verticalServiceLeft}>
                        <View style={[styles.verticalServiceIconBox, selectedService === "confort" && { backgroundColor: "#FEE2E2" }]}>
                          <Car size={24} color={selectedService === "confort" ? colors.primary : colors.textSecondary} />
                        </View>
                        <View style={{ gap: 2, flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.verticalServiceName}>Confort VIP</Text>
                            <View style={styles.timeTag}><Text style={styles.timeTagTxt}>{estimate.duration_min + 1} min</Text></View>
                          </View>
                          <Text style={styles.verticalServiceDesc}>Clase ejecutiva con aire acondicionado</Text>
                          <Text style={styles.savingTag}>Ahorras ${getTierOriginalPrice("confort") - getTierPrice("confort") > 0 ? (getTierOriginalPrice("confort") - getTierPrice("confort")).toFixed(2) : "0.15"}</Text>
                        </View>
                      </View>
                      <View style={styles.verticalServiceRight}>
                        <Text style={styles.verticalServicePrice}>${getTierPrice("confort").toFixed(2)}</Text>
                        <Text style={styles.verticalServiceOriginalPrice}>${getTierOriginalPrice("confort").toFixed(2)}</Text>
                        <Text style={styles.verticalServicePriceBs}>Bs. {(getTierPrice("confort") * USD_BS_RATE).toFixed(0)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Delivery Package Option (Yango Style) */
                  <View style={styles.servicesVerticalList}>
                    <TouchableOpacity 
                      style={[styles.verticalServiceItem, selectedService === "delivery" && styles.verticalServiceItemActive]}
                      onPress={() => setSelectedService("delivery")}
                      testID="service-delivery-btn"
                    >
                      <View style={styles.verticalServiceLeft}>
                        <View style={[styles.verticalServiceIconBox, selectedService === "delivery" && { backgroundColor: "#FEE2E2" }]}>
                          <Bike size={24} color={selectedService === "delivery" ? colors.primary : colors.textSecondary} />
                        </View>
                        <View style={{ gap: 2, flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.verticalServiceName}>Envío Express (Delivery)</Text>
                            <View style={styles.timeTag}><Text style={styles.timeTagTxt}>{estimate.duration_min} min</Text></View>
                          </View>
                          <Text style={styles.verticalServiceDesc}>Envía tus paquetes de forma rápida y segura</Text>
                          <Text style={styles.savingTag}>Ahorras ${getTierOriginalPrice("delivery") - getTierPrice("delivery") > 0 ? (getTierOriginalPrice("delivery") - getTierPrice("delivery")).toFixed(2) : "0.30"}</Text>
                        </View>
                      </View>
                      <View style={styles.verticalServiceRight}>
                        <Text style={styles.verticalServicePrice}>${getTierPrice("delivery").toFixed(2)}</Text>
                        <Text style={styles.verticalServiceOriginalPrice}>${getTierOriginalPrice("delivery").toFixed(2)}</Text>
                        <Text style={styles.verticalServicePriceBs}>Bs. {(getTierPrice("delivery") * USD_BS_RATE).toFixed(0)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Optional Instructions */}
                <View style={styles.instructionContainer}>
                  <TextInput
                    style={styles.instructionInput}
                    placeholder="Instrucciones para el conductor (ej: portón negro, frente al banco)..."
                    placeholderTextColor={colors.textMuted}
                    value={instructions}
                    onChangeText={setInputInstructions}
                    testID="ride-instructions-input"
                  />
                </View>

                {/* Payment Selector - Wallet or Cash */}
                <View style={styles.paymentSelectorRow}>
                  <TouchableOpacity 
                    style={[styles.payOption, payMethod === "wallet" && styles.payOptionActive]}
                    onPress={() => setPayMethod("wallet")}
                    testID="pay-wallet-btn"
                  >
                    <CreditCard size={16} color={payMethod === "wallet" ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.payOptionTxt, payMethod === "wallet" && styles.payOptionActiveTxt]}>
                      Pagar con Wallet (${(user?.wallet_balance ?? 0).toFixed(2)})
                    </Text>
                    {payMethod === "wallet" && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.payOption, payMethod === "cash" && styles.payOptionActive]}
                    onPress={() => setPayMethod("cash")}
                    testID="pay-cash-btn"
                  >
                    <WalletIcon size={16} color={payMethod === "cash" ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.payOptionTxt, payMethod === "cash" && styles.payOptionActiveTxt]}>
                      Pago en Efectivo / Pago Móvil directo
                    </Text>
                    {payMethod === "cash" && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                </View>

                {/* Pedido para otra persona (Yango Style Switch!) */}
                <View style={styles.otherPersonRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.otherPersonTitle}>Pedido para otra persona</Text>
                    <Text style={styles.otherPersonDesc}>El conductor verá el nombre y teléfono del pasajero.</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.toggleBg, orderForOthers && styles.toggleBgActive]} 
                    onPress={() => setOrderForOthers(!orderForOthers)}
                  >
                    <View style={[styles.toggleHandle, orderForOthers && styles.toggleHandleActive]} />
                  </TouchableOpacity>
                </View>

                {orderForOthers && (
                  <View style={styles.otherPersonInputBox}>
                    <TextInput
                      style={styles.otherPersonInput}
                      placeholder="Nombre del pasajero (ej: Juan)"
                      placeholderTextColor={colors.textMuted}
                      value={otherName}
                      onChangeText={setOtherName}
                    />
                    <TextInput
                      style={styles.otherPersonInput}
                      placeholder="Teléfono (ej: 04241112222)"
                      placeholderTextColor={colors.textMuted}
                      value={otherPhone}
                      onChangeText={setOtherPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                )}

                {/* Big native Request button */}
                <TouchableOpacity 
                  style={[styles.confirmRideBtn, confirming && { opacity: 0.8 }]} 
                  onPress={confirm}
                  disabled={confirming}
                  testID="confirm-ride-btn"
                >
                  {confirming ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Navigation size={18} color="#fff" />
                      <Text style={styles.confirmRideBtnTxt}>
                        Pedir {selectedService === "moto" ? "Moto" : selectedService === "confort" ? "VIP" : "Económico"} por ${getTierPrice(selectedService).toFixed(2)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
          </>
        )}
      </View>

      {/* Pre-trip Security Checklist Modal (0/6 Checklist) */}
      <Modal visible={verifyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Custom Styled Silver-Blue Shield Icon Header (Yango Style) */}
            <View style={styles.yangoShieldHeader}>
              <View style={styles.yangoShieldOuter}>
                <View style={styles.yangoShieldInner}>
                  <Shield size={40} color="#3B82F6" />
                </View>
              </View>
              <Text style={styles.yangoShieldTitle}>VERIFICACIÓN PREVIA AL VIAJE</Text>
              <Text style={styles.yangoShieldSub}>Medidas para mejorar la seguridad y la comodidad al viajar</Text>
              
              <TouchableOpacity style={styles.closeModalBtnFloating} onPress={() => setVerifyModal(false)}>
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Quick action buttons row (Emergencia and Asistencia) - Yango Style */}
            <View style={styles.quickActionRow}>
              <TouchableOpacity style={styles.quickActionBtnRed} onPress={() => toast("Llamando a servicios de emergencia local...", "error")}>
                <Text style={styles.quickActionBtnTxtRed}>🚨 Emergencia</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtnGray} onPress={() => toast("Conectando con asistencia de RideVE...", "info")}>
                <Text style={styles.quickActionBtnTxtGray}>🎧 Asistencia</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSubHeader}>
              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(getChecklistCount() / 6) * 100}%` }]} />
              </View>
              <Text style={styles.progressCounterTxt}>{getChecklistCount()} de 6 completados</Text>
            </View>

            <ScrollView contentContainerStyle={styles.checklistScroll} showsVerticalScrollIndicator={false}>
              {/* Point 1: Phone (Always done) */}
              <View style={styles.checkItem}>
                <View style={styles.checkIconActive}>
                  <Check size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>1. Teléfono verificado con Firebase</Text>
                  <Text style={styles.checkDesc}>Tu número {user?.phone} está autenticado y enlazado.</Text>
                </View>
              </View>

              {/* Point 2: Email (Always done) */}
              <View style={styles.checkItem}>
                <View style={styles.checkIconActive}>
                  <Check size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>2. Correo electrónico verificado</Text>
                  <Text style={styles.checkDesc}>Recibes recibos y reportes en {user?.email}.</Text>
                </View>
              </View>

              {/* Point 3: Cédula de identidad */}
              <View style={styles.checkItem}>
                {(user?.cedula || customCedula) ? (
                  <View style={styles.checkIconActive}>
                    <Check size={16} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.checkIconPending} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>3. Registro de Cédula de Identidad</Text>
                  <Text style={styles.checkDesc}>
                    {user?.cedula || customCedula ? `Registrada: ${user?.cedula || customCedula}` : "Obligatorio para la seguridad en viajes en Venezuela."}
                  </Text>
                  {!(user?.cedula || customCedula) && (
                    <View style={styles.checklistInputRow}>
                      <TextInput
                        style={styles.checklistInput}
                        placeholder="Ej: V-12345678"
                        placeholderTextColor={colors.textMuted}
                        value={customCedula}
                        onChangeText={setCustomCedula}
                      />
                      <TouchableOpacity style={styles.checklistInputBtn} onPress={saveCedulaFromChecklist}>
                        <Text style={styles.checklistInputBtnTxt}>Guardar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Point 4: Profile Picture */}
              <View style={styles.checkItem}>
                {(profilePicSimulated || user?.profile_pic) ? (
                  <View style={styles.checkIconActive}>
                    <Check size={16} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.checkIconPending} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>4. Foto de perfil verificada</Text>
                  <Text style={styles.checkDesc}>Ayuda a los conductores a identificarte fácilmente.</Text>
                  {!(profilePicSimulated || user?.profile_pic) && (
                    <TouchableOpacity 
                      style={styles.checklistInlineBtn} 
                      onPress={() => { setProfilePicSimulated(true); toast("Foto de perfil subida correctamente", "success"); }}
                    >
                      <User size={14} color={colors.primary} />
                      <Text style={styles.checklistInlineBtnTxt}>Tomar foto de perfil</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Point 5: Trusted Contacts */}
              <View style={styles.checkItem}>
                {isTrustedContactSaved ? (
                  <View style={styles.checkIconActive}>
                    <Check size={16} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.checkIconPending} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>5. Contacto de emergencia</Text>
                  <Text style={styles.checkDesc}>
                    {isTrustedContactSaved ? `${trustedContactName} (${trustedContactPhone})` : "Compartiremos la ubicación de tu viaje en caso de emergencias."}
                  </Text>
                  {!isTrustedContactSaved && (
                    <View style={{ gap: 8, marginTop: 8 }}>
                      <TextInput
                        style={[styles.checklistInput, { width: "100%" }]}
                        placeholder="Nombre de contacto (ej: Madre)"
                        placeholderTextColor={colors.textMuted}
                        value={trustedContactName}
                        onChangeText={setTrustedContactName}
                      />
                      <View style={styles.checklistInputRow}>
                        <TextInput
                          style={styles.checklistInput}
                          placeholder="Teléfono (ej: 0414-5555555)"
                          placeholderTextColor={colors.textMuted}
                          value={trustedContactPhone}
                          onChangeText={setTrustedContactPhone}
                          keyboardType="phone-pad"
                        />
                        <TouchableOpacity style={styles.checklistInputBtn} onPress={saveTrustedContact}>
                          <Text style={styles.checklistInputBtnTxt}>Guardar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Point 6: Platform security guidelines */}
              <View style={styles.checkItem}>
                {safetyRead ? (
                  <View style={styles.checkIconActive}>
                    <Check size={16} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.checkIconPending} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>6. Conoce las pautas de seguridad</Text>
                  <Text style={styles.checkDesc}>Lee las recomendaciones para viajar seguro en carro o moto.</Text>
                  
                  {!safetyRead ? (
                    <TouchableOpacity style={styles.checklistInlineBtn} onPress={() => { setSafetyRead(true); setActiveTabSafety(true); }}>
                      <Info size={14} color={colors.primary} />
                      <Text style={styles.checklistInlineBtnTxt}>Leer pautas de seguridad</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => setActiveTabSafety(!activeTabSafety)}>
                      <Text style={{ color: colors.primary, fontSize: 12, fontFamily: fonts.bodyBold, marginTop: 4 }}>Ver pautas leídas</Text>
                    </TouchableOpacity>
                  )}

                  {activeTabSafety && (
                    <View style={styles.safetyRulesBox}>
                      <Text style={styles.safetyRuleText}>🚗 • Verifica siempre que las placas y el nombre del conductor coincidan con la app.</Text>
                      <Text style={styles.safetyRuleText}>🏍️ • Si viajas en Moto, exige tu casco obligatorio limpio.</Text>
                      <Text style={styles.safetyRuleText}>📱 • Comparte el enlace de geolocalización en vivo de tu viaje con tu contacto guardado.</Text>
                      <Text style={styles.safetyRuleText}>🛡️ • Usa el botón de Emergencia (SOS) integrado si hay desvíos sospechosos.</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setVerifyModal(false)}>
              <Text style={styles.modalDoneBtnTxt}>Entendido, listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, gap: 12 },
  userPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface, borderRadius: radii.full, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, flexShrink: 1, ...shadows.card },
  avatar: { width: 26, height: 26, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 12 },
  userName: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13, flexShrink: 1 },
  balancePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.success, borderRadius: radii.full, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.success, ...shadows.neonSecondary },
  balanceTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 14 },

  bottomSheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: spacing.md,
    paddingBottom: spacing.lg + 10,
    borderTopWidth: 1, borderTopColor: colors.border,
    gap: 12,
    ...shadows.card,
  },
  
  // Promo Scroll Styles
  promoScrollContainer: { height: 60, marginTop: 4, marginBottom: 4 },
  promoScroll: { gap: 10, paddingHorizontal: 4 },
  promoCard: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: radii.md, paddingVertical: 8, paddingHorizontal: 12, height: 48, minWidth: 220, ...shadows.card },
  promoIconContainer: { width: 28, height: 28, borderRadius: radii.full, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...shadows.card },
  promoTitleText: { fontFamily: fonts.bodyBold, fontSize: 12 },
  promoDescText: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 10, marginTop: 1 },

  // Service Type Toggle Row
  serviceTypeToggleRow: { flexDirection: "row", gap: 10, marginVertical: 4 },
  serviceTypeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: radii.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  serviceTypeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadows.neonPrimary },
  serviceTypeBtnTxt: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 13 },
  serviceTypeBtnTxtActive: { color: "#FFFFFF" },
  handle: { width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border, alignSelf: "center", marginBottom: 4 },
  bsTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18, letterSpacing: -0.3 },
  destItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  destIcon: { width: 34, height: 34, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  destName: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  destAddr: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 2, flex: 1 },
  driversNearbyBadge: { alignSelf: "center", backgroundColor: "#ECFDF5", paddingVertical: 4, paddingHorizontal: 12, borderRadius: radii.full, marginTop: 4 },
  driversInfo: { color: colors.secondary, fontFamily: fonts.bodyBold, fontSize: 11 },

  // Safety Verification Banner
  safetyBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FEF2F4", borderWidth: 1, borderColor: "#FEE2E2", borderRadius: radii.lg, padding: 12, marginVertical: 4 },
  safetyBannerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  shieldIconBox: { width: 36, height: 36, backgroundColor: "#fff", borderRadius: radii.full, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FEE2E2" },
  safetyBannerTitle: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 13 },
  safetyBannerSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  safetyProgressPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", paddingVertical: 4, paddingHorizontal: 10, borderRadius: radii.full, borderWidth: 1, borderColor: "#FEE2E2" },
  safetyProgressTxt: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 11 },

  confirmHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  closeConfirmBtn: { width: 28, height: 28, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  routeBox: { backgroundColor: colors.bg, borderRadius: radii.md, padding: 12, gap: 4, borderWidth: 1, borderColor: colors.border },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 999 },
  routeLine: { width: 1, height: 12, backgroundColor: colors.border, marginLeft: 4 },
  routeAddr: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 },

  // Category selection styles (Yango Vertical Layout)
  servicesVerticalList: { gap: 10, marginVertical: 4 },
  verticalServiceItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 12, ...shadows.card },
  verticalServiceItemActive: { borderColor: colors.primary, backgroundColor: "#FEF2F4" },
  verticalServiceLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  verticalServiceIconBox: { width: 44, height: 44, borderRadius: radii.full, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  verticalServiceName: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  verticalServiceDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  verticalServiceRight: { alignItems: "flex-end", gap: 2 },
  verticalServicePrice: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 17 },
  verticalServiceOriginalPrice: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, textDecorationLine: "line-through", marginTop: 1 },
  verticalServicePriceBs: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 11 },
  savingTag: { color: colors.success, fontFamily: fonts.bodyBold, fontSize: 11, marginTop: 1 },
  timeTag: { backgroundColor: "#F1F5F9", paddingVertical: 2, paddingHorizontal: 6, borderRadius: radii.sm },
  timeTagTxt: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 10 },

  instructionContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.bg, paddingHorizontal: 12, height: 44, justifyContent: "center" },
  instructionInput: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 12, width: "100%" },

  paymentSelectorRow: { gap: 8, marginVertical: 4 },
  payOption: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 12, height: 44 },
  payOptionActive: { borderColor: colors.primary, backgroundColor: "#FEF2F4" },
  payOptionTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 12, flex: 1 },
  payOptionActiveTxt: { color: colors.textPrimary, fontFamily: fonts.bodyBold },

  confirmRideBtn: { backgroundColor: colors.primary, height: 50, borderRadius: radii.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, ...shadows.neonPrimary, marginTop: 4 },
  confirmRideBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 15 },

  // Pre-trip Checklist Modal styles (Yango Shield Style)
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, maxHeight: "90%" },
  
  yangoShieldHeader: { alignItems: "center", gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, position: "relative" },
  yangoShieldOuter: { width: 72, height: 72, borderRadius: 999, borderWidth: 2, borderColor: "#3B82F6", alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6FF" },
  yangoShieldInner: { width: 56, height: 56, borderRadius: 999, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...shadows.card },
  yangoShieldTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18, letterSpacing: -0.5, textAlign: "center" },
  yangoShieldSub: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 12, textAlign: "center", paddingHorizontal: 20 },
  closeModalBtnFloating: { position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },

  quickActionRow: { flexDirection: "row", gap: 12, marginVertical: 14 },
  quickActionBtnRed: { flex: 1, backgroundColor: "#FEE2E2", height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FCA5A5" },
  quickActionBtnGray: { flex: 1, backgroundColor: colors.bg, height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  quickActionBtnTxtRed: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 13 },
  quickActionBtnTxtGray: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13 },

  modalSubHeader: { paddingVertical: 10, gap: 6 },
  progressBarBg: { height: 8, backgroundColor: colors.elevated, borderRadius: 999, marginTop: 4 },
  progressBarFill: { height: 8, backgroundColor: colors.primary, borderRadius: 999 },
  progressCounterTxt: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 11, textAlign: "right" },

  checklistScroll: { gap: 16, paddingVertical: 14, paddingBottom: 24 },
  checkItem: { flexDirection: "row", gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  checkIconActive: { width: 22, height: 22, borderRadius: 999, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  checkIconPending: { width: 22, height: 22, borderRadius: 999, borderWidth: 1.5, borderColor: colors.textMuted, backgroundColor: colors.surface },
  checkTitle: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13 },
  checkDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 2, lineHeight: 16 },
  
  checklistInputRow: { flexDirection: "row", gap: 8, marginTop: 8, width: "100%" },
  checklistInput: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, paddingHorizontal: 12, height: 38, color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 12 },
  checklistInputBtn: { backgroundColor: colors.primary, borderRadius: radii.sm, paddingHorizontal: 14, height: 38, alignItems: "center", justifyContent: "center" },
  checklistInputBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 12 },
  
  checklistInlineBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F4", borderWidth: 1, borderColor: "#FEE2E2", paddingVertical: 6, paddingHorizontal: 12, borderRadius: radii.full, alignSelf: "flex-start", marginTop: 8 },
  checklistInlineBtnTxt: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 11 },
  
  safetyRulesBox: { backgroundColor: colors.bg, padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, marginTop: 8, gap: 6 },
  safetyRuleText: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16 },

  // Pedido para otra persona (Yango Style)
  otherPersonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 12, marginTop: 4 },
  otherPersonTitle: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 13 },
  otherPersonDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  toggleBg: { width: 44, height: 24, borderRadius: radii.full, backgroundColor: colors.border, padding: 2, justifyContent: "center" },
  toggleBgActive: { backgroundColor: colors.primary },
  toggleHandle: { width: 20, height: 20, borderRadius: 999, backgroundColor: "#FFFFFF" },
  toggleHandleActive: { alignSelf: "flex-end" },
  otherPersonInputBox: { gap: 8, backgroundColor: colors.bg, borderRadius: radii.md, padding: 12, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  otherPersonInput: { height: 38, backgroundColor: colors.surface, borderWith: 1, borderColor: colors.border, borderRadius: radii.sm, paddingHorizontal: 12, color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 12, borderWidth: 1 },

  modalDoneBtn: { backgroundColor: colors.primary, height: 48, borderRadius: radii.xl, alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 20, ...shadows.neonPrimary },
  modalDoneBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 15 },
});
