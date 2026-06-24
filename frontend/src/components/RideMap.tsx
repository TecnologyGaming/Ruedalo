import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { colors, fonts, darkMapStyle } from "@/src/lib/theme";

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
}

export function RideMap({ center, markers = [], polyline, style, showsUserLocation = true }: Props) {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={[{ flex: 1 }, style]}
      customMapStyle={darkMapStyle}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsCompass={false}
      showsPointsOfInterest={false}
    >
      {markers.map((m) => (
        <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lng }} anchor={{ x: 0.5, y: 0.5 }}>
          <PinView type={m.type} label={m.label} />
        </Marker>
      ))}
      {polyline && polyline.length > 1 && (
        <Polyline
          coordinates={polyline.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
          strokeColor={colors.primary}
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}

function PinView({ type, label }: { type: MarkerData["type"]; label?: string }) {
  const isDriver = type === "driver";
  const isDest = type === "destination";
  const bg = isDriver ? colors.primary : isDest ? "#fff" : colors.secondary;
  const ring = isDriver ? colors.primary : colors.secondary;
  return (
    <View style={[pinStyles.outer, { borderColor: ring, shadowColor: ring }]}>
      <View style={[pinStyles.inner, { backgroundColor: bg }]}>
        {label ? <Text style={pinStyles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const pinStyles = StyleSheet.create({
  outer: {
    width: 30, height: 30, borderRadius: 999, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    shadowOpacity: 0.7, shadowRadius: 8, elevation: 8,
  },
  inner: { width: 18, height: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  label: { color: "#0B0C10", fontFamily: fonts.bodyBold, fontSize: 10 },
});
