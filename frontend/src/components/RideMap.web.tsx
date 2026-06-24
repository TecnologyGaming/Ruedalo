import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { colors, fonts } from "@/src/lib/theme";

export interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  type: "user" | "driver" | "destination" | "origin";
  label?: string;
}

interface Props {
  center: { lat: number; lng: number };
  markers?: MarkerData[];
  polyline?: { lat: number; lng: number }[];
  style?: any;
  showsUserLocation?: boolean;
  onRegionChange?: (lat: number, lng: number) => void;
}

export function RideMap({ markers = [], style }: Props) {
  const { width } = Dimensions.get("window");
  return (
    <View style={[fallback.wrap, { width: "100%", minHeight: 300 }, style]}>
      <View style={fallback.grid}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h${i}`} style={[fallback.line, { top: `${(i + 1) * 10}%` }]} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`v${i}`} style={[fallback.lineV, { left: `${(i + 1) * 10}%` }]} />
        ))}
      </View>
      <View style={fallback.center}>
        <View style={fallback.pulse} />
        <View style={fallback.pin} />
      </View>
      {markers.map((m, i) => {
        const angle = (i / Math.max(1, markers.length)) * Math.PI * 2;
        const r = 80 + (i % 3) * 25;
        const left = width / 2 + Math.cos(angle) * r - 14;
        const top = 200 + Math.sin(angle) * r - 14;
        const isDriver = m.type === "driver";
        return (
          <View
            key={m.id}
            style={[
              fallback.marker,
              { left, top, backgroundColor: isDriver ? colors.primary : m.type === "destination" ? "#fff" : colors.secondary },
            ]}
          />
        );
      })}
      <Text style={fallback.note}>Mapa interactivo en vivo en iOS/Android · Vista preview web</Text>
    </View>
  );
}

const fallback = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, overflow: "hidden", position: "relative" },
  grid: { ...StyleSheet.absoluteFillObject },
  line: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: colors.elevated, opacity: 0.5 },
  lineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: colors.elevated, opacity: 0.5 },
  center: { position: "absolute", top: "50%", left: "50%", marginLeft: -16, marginTop: -16, alignItems: "center", justifyContent: "center", width: 32, height: 32 },
  pulse: { position: "absolute", width: 60, height: 60, borderRadius: 999, backgroundColor: colors.secondary, opacity: 0.2 },
  pin: { width: 18, height: 18, borderRadius: 999, backgroundColor: colors.secondary, borderWidth: 3, borderColor: colors.bg },
  marker: { position: "absolute", width: 28, height: 28, borderRadius: 999, borderWidth: 3, borderColor: colors.bg },
  note: { position: "absolute", bottom: 12, alignSelf: "center", color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, paddingHorizontal: 20, textAlign: "center" },
});
