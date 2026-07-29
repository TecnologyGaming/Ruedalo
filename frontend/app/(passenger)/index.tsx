import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { MapPin, Navigation, Search, Star, Wallet as WalletIcon, X, Shield, ShieldCheck, Heart, Info, ChevronRight, User, Phone, Check, CreditCard, MessageSquare, Bike, Car, Sparkles, Package, Home, Briefcase, Clock, AlertTriangle, HelpCircle } from "lucide-react-native";

import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radii, spacing, shadows } from "@/src/lib/theme";
import { RideMap, MarkerData } from "@/src/components/RideMap";
import { FieldInput } from "@/src/components/FieldInput";
import { toast } from "@/src/components/Toast";

const CARACAS = { lat: 10.4998, lng: -66.8517 };
const USD_BS_RATE = 38.5; // Official BCV Rate

const RECENT_DESTS = [
  { name: "C.C. Sambil Chacao", address: "Av. Libertador, Chacao", lat: 10.4933, lng: -66.8538 },
  { name: "Aeropuerto Maiquetía", address: "La Guaira, Vargas", lat: 10.6014, lng: -66.9911 },
  { name: "Universidad Central de Venezuela", address: "Av. Los Ilustres, Caracas", lat: 10.4910, lng: -66.8910 },
];

const SUGGESTIONS = [
  { name: "Parque del Este", address: "Chacao, Caracas", lat: 10.4920, lng: -66.8421 },
  { name: "Centro Comercial Líder", address: "Los Ruices, Caracas", lat: 10.4850, lng: -66.8120 },
  { name: "Plaza Venezuela", address: "Caracas", lat: 10.4980, lng: -66.8820 },
];

export default function PassengerHome() {
  const router = useRouter();
  const { user, refresh, setUser } = useAuth();
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number }>(CARACAS);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [destination, setDestination] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [query, setQuery] = useState("");
  
  // Tab Selector of Activity: Pedir Carrera vs Enviar Paquete
  const [selectedServiceType, setSelectedServiceType] = useState<"ride" | "delivery">("ride");
  const [selectedService, setSelectedService] = useState<"moto" | "economico" | "confort" | "xl" | "delivery" | "paquete">("economico");
  
  // Custom states matching 02/03 details
  const [instructions, setInputInstructions] = useState("");
  const [payMethod, setPayMethod] = useState<"wallet" | "cash">("wallet");
  const [orderForOthers, setOrderForOthers] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [otherPhone, setOtherPhone] = useState("");
  
  // Pre-trip Verification checklist state (0/6)
  const [verifyModal, setVerifyModal] = useState(false);
  const [profilePicSimulated, setProfilePicSimulated] = useState(false);
  const [customCedula, setCustomCedula] = useState("");
  const [trustedContactName, setTrustedContactName] = useState("");
  const [trustedContactPhone, setTrustedContactPhone] = useState("");
  const [isTrustedContactSaved, setIsTrustedContactSaved] = useState(false);
  const [safetyRead, setSafetyRead] = useState(false);
  const [activeTabSafety, setActiveTabSafety] = useState(false);

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

  const loadDrivers = useCallback((lat: number, lng: number) => {
    setDrivers([
      { id: "d1", lat: lat + 0.002, lng: lng - 0.001, name: "Carlos M.", rating: 4.95 },
      { id: "d2", lat: lat - 0.003, lng: lng + 0.002, name: "Andrea P.", rating: 4.88 },
      { id: "d3", lat: lat + 0.001, lng: lng + 0.004, name: "José R.", rating: 4.91 },
    ]);
  }, []);

  useFocusEffect(useCallback(() => {
    loadDrivers(myLoc.lat, myLoc.lng);
    if (refresh) refresh();
  }, [myLoc, loadDrivers, refresh]));

  const pickDestination = (d: { name: string; address: string; lat: number; lng: number }) => {
    setDestination(d);
    // Exact tariff configurations from pricing collection (Pillar 1)
    setTimeout(() => {
      setEstimate({
        distance_km: 5.42,
        duration_min: 14,
        rates: {
          economico: { original: 21.50, discounted: 20.00 },
          confort: { original: 29.50, discounted: 28.00 },
          xl: { original: 36.50, discounted: 35.00 },
          moto: { original: 10.15, discounted: 10.00 },
          delivery: { original: 8.30, discounted: 8.00 },
          paquete: { original: 16.30, discounted: 16.00 },
        }
      });
    }, 600);
  };

  const getTierPrice = (service: "moto" | "economico" | "confort" | "xl" | "delivery" | "paquete") => {
    if (!estimate || !estimate.rates) return 0;
    return estimate.rates[service]?.discounted ?? 0;
  };

  const getTierOriginalPrice = (service: "moto" | "economico" | "confort" | "xl" | "delivery" | "paquete") => {
    if (!estimate || !estimate.rates) return 0;
    return estimate.rates[service]?.original ?? 0;
  };

  const confirm = async () => {
    if (!destination || !estimate) return;
    const finalPrice = getTierPrice(selectedService);
    
    if (payMethod === "wallet" && (user?.wallet_balance ?? 0) < finalPrice) {
      toast("Saldo insuficiente en tu wallet. Selecciona efectivo o recarga.", "error");
      router.push("/(passenger)/wallet");
      return;
    }
    
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      toast(`Buscando conductor de ${selectedService.toUpperCase()}...`, "success");
      setTimeout(() => {
        router.push("/ride/demo-ride-123");
      }, 1500);
    }, 1800);
  };

  const saveCedulaFromChecklist = () => {
    if (!customCedula.trim()) {
      toast("Por favor ingresa una Cédula válida", "error");
      return;
    }
    if (setUser) {
      setUser({ ...user, cedula: customCedula.trim() } as any);
    }
    toast("Cédula registrada correctamente", "success");
  };

  const saveTrustedContact = () => {
    if (!trustedContactName.trim() || !trustedContactPhone.trim()) {
      toast("Completa los datos del contacto de confianza", "error");
      return;
    }
    setIsTrustedContactSaved(true);
    toast("Contacto de confianza guardado correctamente", "success");
  };

  const getChecklistCount = () => {
    let count = 2;
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

  const filtered = RECENT_DESTS.concat(SUGGESTIONS).filter((d) => d.name.toLowerCase().includes(query.toLowerCase()) || d.address.toLowerCase().includes(query.toLowerCase()));

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
        
        {/* Referral and Promo Banner (03. HOME) */}
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
            {/* Interactive Header "Hola Luis - ¿A dónde vamos hoy?" */}
            <View style={styles.welcomeTextSection}>
              <Text style={styles.welcomeSub}>Hola, {user?.name?.split(" ")[0] ?? "Pasajero"} 👋</Text>
              <Text style={styles.welcomeMain}>¿A dónde vamos hoy?</Text>
            </View>

            {/* Touch activity selection Cards - Viajes vs Envíos (03. HOME) */}
            <View style={styles.activitySelectionContainer}>
              <TouchableOpacity 
                style={[styles.activityCard, selectedServiceType === "ride" && styles.activityCardActive]}
                onPress={() => { setSelectedServiceType("ride"); setSelectedService("economico"); }}
              >
                <View style={styles.activityTextCol}>
                  <Text style={styles.activityTitle}>Viajes ➔</Text>
                  <Text style={styles.activityDesc}>Muévete seguro a tu destino</Text>
                </View>
                <View style={styles.activityIconBox}><Car size={34} color={colors.primary} /></View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.activityCard, selectedServiceType === "delivery" && styles.activityCardActive]}
                onPress={() => { setSelectedServiceType("delivery"); setSelectedService("delivery"); }}
              >
                <View style={styles.activityTextCol}>
                  <Text style={styles.activityTitle}>Envíos ➔</Text>
                  <Text style={styles.activityDesc}>Entregas rápidas y confiables</Text>
                </View>
                <View style={styles.activityIconBox}><Bike size={34} color={colors.primary} /></View>
              </TouchableOpacity>
            </View>

            {/* Quick Location Pills: Casa, Trabajo, Favoritos, Aeropuerto (03. HOME) */}
            <View style={styles.quickPillsRow}>
              <TouchableOpacity style={styles.quickPill} onPress={() => setQuery("C.C. Sambil")}>
                <Home size={14} color={colors.textSecondary} />
                <Text style={styles.quickPillTxt}>Casa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickPill} onPress={() => setQuery("Las Mercedes")}>
                <Briefcase size={14} color={colors.textSecondary} />
                <Text style={styles.quickPillTxt}>Trabajo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickPill} onPress={() => setQuery("Aeropuerto")}>
                <Heart size={14} color={colors.textSecondary} />
                <Text style={styles.quickPillTxt}>Favoritos</Text>
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

            {/* Destination input search block */}
            <Text style={styles.bsTitle}>Buscar Destino</Text>
            <FieldInput
              value={query}
              onChangeText={setQuery}
              placeholder="¿A dónde vas? Buscar dirección..."
              rightIcon={<Search size={18} color={colors.textSecondary} />}
              testID="search-destination-input"
            />
            
            <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
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
                <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
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
                            <Text style={styles.verticalServiceName}>Moto 123</Text>
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

                    {/* Tier 3: Confort */}
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
                            <Text style={styles.verticalServiceName}>Comfort</Text>
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

                    {/* Tier 4: XL */}
                    <TouchableOpacity 
                      style={[styles.verticalServiceItem, selectedService === "xl" && styles.verticalServiceItemActive]}
                      onPress={() => setSelectedService("xl")}
                      testID="service-xl-btn"
                    >
                      <View style={styles.verticalServiceLeft}>
                        <View style={[styles.verticalServiceIconBox, selectedService === "xl" && { backgroundColor: "#FEE2E2" }]}>
                          <Car size={24} color={selectedService === "xl" ? colors.primary : colors.textSecondary} />
                        </View>
                        <View style={{ gap: 2, flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.verticalServiceName}>Camioneta XL</Text>
                            <View style={styles.timeTag}><Text style={styles.timeTagTxt}>{estimate.duration_min + 3} min</Text></View>
                          </View>
                          <Text style={styles.verticalServiceDesc}>Para viajes familiares o de carga grande</Text>
                          <Text style={styles.savingTag}>Ahorras ${getTierOriginalPrice("xl") - getTierPrice("xl") > 0 ? (getTierOriginalPrice("xl") - getTierPrice("xl")).toFixed(2) : "0.15"}</Text>
                        </View>
                      </View>
                      <View style={styles.verticalServiceRight}>
                        <Text style={styles.verticalServicePrice}>${getTierPrice("xl").toFixed(2)}</Text>
                        <Text style={styles.verticalServiceOriginalPrice}>${getTierOriginalPrice("xl").toFixed(2)}</Text>
                        <Text style={styles.verticalServicePriceBs}>Bs. {(getTierPrice("xl") * USD_BS_RATE).toFixed(0)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Delivery Package Option (Yango Style) */
                  <View style={styles.servicesVerticalList}>
                    {/* Delivery Tier 1: Delivery125 Moto */}
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
                            <Text style={styles.verticalServiceName}>Envío Moto (Delivery 125)</Text>
                            <View style={styles.timeTag}><Text style={styles.timeTagTxt}>{estimate.duration_min} min</Text></View>
                          </View>
                          <Text style={styles.verticalServiceDesc}>Envía paquetes pequeños de hasta 5 kg</Text>
                          <Text style={styles.savingTag}>Ahorras ${getTierOriginalPrice("delivery") - getTierPrice("delivery") > 0 ? (getTierOriginalPrice("delivery") - getTierPrice("delivery")).toFixed(2) : "0.30"}</Text>
                        </View>
                      </View>
                      <View style={styles.verticalServiceRight}>
                        <Text style={styles.verticalServicePrice}>${getTierPrice("delivery").toFixed(2)}</Text>
                        <Text style={styles.verticalServiceOriginalPrice}>${getTierOriginalPrice("delivery").toFixed(2)}</Text>
                        <Text style={styles.verticalServicePriceBs}>Bs. {(getTierPrice("delivery") * USD_BS_RATE).toFixed(0)}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Delivery Tier 2: Paquetes Carro */}
                    <TouchableOpacity 
                      style={[styles.verticalServiceItem, selectedService === "paquete" && styles.verticalServiceItemActive]}
                      onPress={() => setSelectedService("paquete")}
                      testID="service-paquete-btn"
                    >
                      <View style={styles.verticalServiceLeft}>
                        <View style={[styles.verticalServiceIconBox, selectedService === "paquete" && { backgroundColor: "#FEE2E2" }]}>
                          <Package size={24} color={selectedService === "paquete" ? colors.primary : colors.textSecondary} />
                        </View>
                        <View style={{ gap: 2, flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.verticalServiceName}>Paquetes (Envíos en Auto)</Text>
                            <View style={styles.timeTag}><Text style={styles.timeTagTxt}>{estimate.duration_min + 2} min</Text></View>
                          </View>
                          <Text style={styles.verticalServiceDesc}>Soporta cajas y bultos medianos/grandes</Text>
                          <Text style={styles.savingTag}>Ahorras ${getTierOriginalPrice("paquete") - getTierPrice("paquete") > 0 ? (getTierOriginalPrice("paquete") - getTierPrice("paquete")).toFixed(2) : "0.30"}</Text>
                        </View>
                      </View>
                      <View style={styles.verticalServiceRight}>
                        <Text style={styles.verticalServicePrice}>${getTierPrice("paquete").toFixed(2)}</Text>
                        <Text style={styles.verticalServiceOriginalPrice}>${getTierOriginalPrice("paquete").toFixed(2)}</Text>
                        <Text style={styles.verticalServicePriceBs}>Bs. {(getTierPrice("paquete") * USD_BS_RATE).toFixed(0)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Optional Instructions */}
                <View style={styles.instructionContainer}>
                  <TextInput
                    style={styles.instructionInput}
                    placeholder="Instrucciones para el conductor (ej: portón negro)..."
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
                      Efectivo / Pago Móvil / Zelle
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
                        Pedir {selectedService === "moto" ? "Moto" : selectedService === "confort" ? "VIP" : selectedService === "xl" ? "XL" : selectedService === "delivery" ? "Delivery" : selectedService === "paquete" ? "Paquete" : "Económico"} por ${getTierPrice(selectedService).toFixed(2)}
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
              <TouchableOpacity style={styles.quickActionBtnGray} onPress={() => toast("Conectando con asistencia de Ruedalo...", "info")}>
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
              {/* Point 1: Phone */}
              <View style={styles.checkItem}>
                <View style={styles.checkIconActive}>
                  <Check size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>1. Teléfono verificado con Firebase</Text>
                  <Text style={styles.checkDesc}>Tu número {user?.phone} está autenticado y enlazado.</Text>
                </View>
              </View>

              {/* Point 2: Email */}
              <View style={styles.checkItem}>
                <View style={styles.checkIconActive}>
                  <Check size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>2. Correo electrónico verificado</Text>
                  <Text style={styles.checkDesc}>Recibes reportes de viaje en {user?.email}.</Text>
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
                    {user?.cedula || customCedula ? `Registrada: ${user?.cedula || customCedula}` : "Obligatorio para operar de acuerdo a normativas."}
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
                  <Text style={styles.checkDesc}>Ayuda al chofer a identificarte.</Text>
                  {!(profilePicSimulated || user?.profile_pic) && (
                    <TouchableOpacity 
                      style={styles.checklistInlineBtn} 
                      onPress={() => { setProfilePicSimulated(true); toast("Foto de perfil cargada", "success"); }}
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
                    {isTrustedContactSaved ? `${trustedContactName} (${trustedContactPhone})` : "Compartiremos la geolocalización en tiempo real."}
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
                  <Text style={styles.checkDesc}>Lee las pautas operativas recomendadas en Venezuela.</Text>
                  
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
                      <Text style={styles.safetyRuleText}>🚗 • Confirma que las placas del auto y foto de chofer coincidan.</Text>
                      <Text style={styles.safetyRuleText}>🏍️ • Exige siempre tu casco limpio en moto.</Text>
                      <Text style={styles.safetyRuleText}>📱 • Comparte el enlace en vivo de tu recorrido con tu contacto.</Text>
                      <Text style={styles.safetyRuleText}>🛡️ • Usa el botón SOS si notas desvíos de ruta sospechosos.</Text>
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

  // Welcome Header Text (03. HOME)
  welcomeTextSection: { marginHorizontal: 4, marginVertical: 6, gap: 2 },
  welcomeSub: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  welcomeMain: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 24, letterSpacing: -0.5 },

  // Activity cards (03. HOME - Viajes / Envíos)
  activitySelectionContainer: { flexDirection: "row", gap: 12, marginVertical: 8 },
  activityCard: { flex: 1, flexDirection: "row", backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 14, alignItems: "center", justifySpace: "space-between", ...shadows.card },
  activityCardActive: { borderColor: colors.primary, backgroundColor: "#EFF6FF" },
  activityTextCol: { flex: 1, gap: 4 },
  activityTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 15 },
  activityDesc: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 10, lineHeight: 14 },
  activityIconBox: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...shadows.card },

  // Quick Pills
  quickPillsRow: { flexDirection: "row", gap: 8, marginVertical: 4 },
  quickPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingVertical: 6, paddingHorizontal: 12 },
  quickPillTxt: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 12 },

  handle: { width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border, alignSelf: "center", marginBottom: 4 },
  bsTitle: { color: colors.textPrimary, fontFamily: fonts.headingBold, fontSize: 16, letterSpacing: -0.3 },
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