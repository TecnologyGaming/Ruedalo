// RideVE Theme — Vibrant Neon (Magenta + Cyan)
export const colors = {
  bg: "#0B0C10",
  surface: "#14151F",
  elevated: "#1F2133",
  primary: "#FF007F",
  primaryDim: "#D6006B",
  secondary: "#00E5FF",
  secondaryDim: "#00B8CC",
  tertiary: "#8A2BE2",
  success: "#00E5FF",
  warning: "#FFB800",
  danger: "#FF2A55",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A4B8",
  textMuted: "#6B6F85",
  border: "#2A2D43",
  borderFocus: "#00E5FF",
  overlay: "rgba(11,12,16,0.85)",
};

export const fonts = {
  heading: "Outfit",
  headingBold: "Outfit-Bold",
  body: "DMSans",
  bodyMedium: "DMSans-Medium",
  bodyBold: "DMSans-Bold",
  mono: "JetBrainsMono",
};

export const radii = {
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shadows = {
  neonPrimary: {
    shadowColor: "#FF007F",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  neonSecondary: {
    shadowColor: "#00E5FF",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

// Dark map style for react-native-maps
export const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0B0C10" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#A0A4B8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0C10" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1F2133" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#14151F" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2A2D43" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6B6F85" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#05060B" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#14151F" }] },
];
