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
  const [selectedService, setSelectedService] = useState<"moto" | "economico" | "confort">("economico");
  const [instructions, setInputInstructions] = useState("");
  const [payMethod, setPayMethod] = useState<"wallet" | "cash">("wallet");
  
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
      const est = await api<{ price_usd: number; distance_km: number; duration_min: number }>("/rides/estimate", {
        method: "POST",
        body: { origin_lat: myLoc.lat, origin_lng: myLoc.lng, dest_lat: d.lat, dest_lng: d.lng },
      });
      setEstimate(est);
    } catch (e: any) {
      toast(e?.message ?? "No se pudo estimar", "error");
    }
  };

  // Compute tier price based on base estimate
  const getTierPrice = (service: "moto" | "economico" | "confort") => {
    if (!estimate) return 0;
    if (service === "moto") return Math.max(2.0, roundPrice(estimate.price_usd * 0.6));
    if (service === "confort") return Math.max(6.0, roundPrice(estimate.price_usd * 1.35));
    return estimate.price_usd; // economico
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
        {!destination ? (
          <>
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
                {/* Service Categories Cards - Moto, Economico, Confort */}
                <View style={styles.servicesGrid}>
                  {/* Tier 1: Moto */}
                  <TouchableOpacity 
                    style={[styles.serviceCard, selectedService === "moto" && styles.serviceCardActive]}
                    onPress={() => setSelectedService("moto")}
                    testID="service-moto-btn"
                  >
                    <View style={[styles.serviceIconOuter, selectedService === "moto" && { backgroundColor: "#FFF1F2" }]}>
                      <Bike size={20} color={selectedService === "moto" ? colors.primary : colors.textSecondary} />
                    </View>
                    <Text style={styles.serviceName}>Moto Rápida</Text>
                    <Text style={styles.serviceTime}>{estimate.duration_min - 2} min</Text>
                    <Text style={styles.servicePrice}>${getTierPrice("moto").toFixed(2)}</Text>
                    <Text style={styles.servicePriceBs}>Bs. {(getTierPrice("moto") * USD_BS_RATE).toFixed(0)}</Text>
                  </TouchableOpacity>

                  {/* Tier 2: Economico */}
                  <TouchableOpacity 
                    style={[styles.serviceCard, selectedService === "economico" && styles.serviceCardActive]}
                    onPress={() => setSelectedService("economico")}
                    testID="service-economico-btn"
                  >
                    <View style={[styles.serviceIconOuter, selectedService === "economico" && { backgroundColor: "#FFF1F2" }]}>
                      <Car size={20} color={selectedService === "economico" ? colors.primary : colors.textSecondary} />
                    </View>
                    <Text style={styles.serviceName}>Económico</Text>
                    <Text style={styles.serviceTime}>{estimate.duration_min} min</Text>
                    <Text style={styles.servicePrice}>${getTierPrice("economico").toFixed(2)}</Text>
                    <Text style={styles.servicePriceBs}>Bs. {(getTierPrice("economico") * USD_BS_RATE).toFixed(0)}</Text>
                  </TouchableOpacity>

                  {/* Tier 3: Confort */}
                  <TouchableOpacity 
                    style={[styles.serviceCard, selectedService === "confort" && styles.serviceCardActive]}
                    onPress={() => setSelectedService("confort")}
                    testID="service-confort-btn"
                  >
                    <View style={[styles.serviceIconOuter, selectedService === "confort" && { backgroundColor: "#FFF1F2" }]}>
                      <Car size={20} color={selectedService === "confort" ? colors.primary : colors.textSecondary} />
                    </View>
                    <Text style={styles.serviceName}>Confort VIP</Text>
                    <Text style={styles.serviceTime}>{estimate.duration_min + 1} min</Text>
                    <Text style={styles.servicePrice}>${getTierPrice("confort").toFixed(2)}</Text>
                    <Text style={styles.servicePriceBs}>Bs. {(getTierPrice("confort") * USD_BS_RATE).toFixed(0)}</Text>
                  </TouchableOpacity>
                </View>

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
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Shield size={24} color={colors.primary} />
                <Text style={styles.modalTitle}>Verificación de Seguridad</Text>
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setVerifyModal(false)}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSubHeader}>
              <Text style={styles.modalSubTitle}>Tu seguridad es nuestra prioridad</Text>
              <Text style={styles.modalSubDesc}>Completa estas 6 medidas de verificación para tener viajes más seguros y confiables en Venezuela.</Text>
              
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
  balancePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, borderRadius: radii.full, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.primary, ...shadows.neonPrimary },
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

  // Category selection styles
  servicesGrid: { flexDirection: "row", gap: 10, marginVertical: 6 },
  serviceCard: { flex: 1, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 12, alignItems: "center", gap: 4, ...shadows.card },
  serviceCardActive: { borderColor: colors.primary, backgroundColor: "#FEF2F4" },
  serviceIconOuter: { width: 36, height: 36, borderRadius: radii.full, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  serviceName: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 12 },
  serviceTime: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  servicePrice: { color: colors.primary, fontFamily: fonts.headingBold, fontSize: 16, marginTop: 2 },
  servicePriceBs: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 11 },

  instructionContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.bg, paddingHorizontal: 12, height: 44, justifyContent: "center" },
  instructionInput: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 12, width: "100%" },

  paymentSelectorRow: { gap: 8, marginVertical: 4 },
  payOption: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 12, height: 44 },
  payOptionActive: { borderColor: colors.primary, backgroundColor: "#FEF2F4" },
  payOptionTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 12, flex: 1 },
  payOptionActiveTxt: { color: colors.textPrimary, fontFamily: fonts.bodyBold },

  confirmRideBtn: { backgroundColor: colors.primary, height: 50, borderRadius: radii.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, ...shadows.neonPrimary, marginTop: 4 },
  confirmRideBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 15 },

  // Pre-trip Checklist Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 14 },
  modalTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 18 },
  closeModalBtn: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  
  modalSubHeader: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 6 },
  modalSubTitle: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  modalSubDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  progressBarBg: { height: 8, backgroundColor: colors.elevated, borderRadius: 999, marginTop: 6 },
  progressBarFill: { height: 8, backgroundColor: colors.primary, borderRadius: 999 },
  progressCounterTxt: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 11, textAlign: "right" },

  checklistScroll: { gap: 16, paddingVertical: 16, paddingBottom: 30 },
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

  modalDoneBtn: { backgroundColor: colors.primary, height: 48, borderRadius: radii.xl, alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 20, ...shadows.neonPrimary },
  modalDoneBtnTxt: { color: "#fff", fontFamily: fonts.bodyBold, fontSize: 15 },
});
