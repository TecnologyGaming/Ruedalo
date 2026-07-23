// RideVE Theme — Premium Light Modern (Yango & Ridery Inspired)
export const colors = {
  bg: "#F8F9FA",
  surface: "#FFFFFF",
  elevated: "#F1F5F9",
  primary: "#FE2B4C", // Vibrant Crimson Red (Yango inspired)
  primaryDim: "#D61A34",
  secondary: "#10B981", // Emerald Green (Ridery inspired)
  secondaryDim: "#059669",
  tertiary: "#6366F1", // Indigo
  success: "#10B981",
  warning: "#F59E0B", // Amber/Yellow
  danger: "#EF4444",
  textPrimary: "#1E293B", // Rich Slate
  textSecondary: "#475569", // Medium Slate
  textMuted: "#94A3B8", // Light Slate/Placeholder
  border: "#E2E8F0", // Light border
  borderFocus: "#FE2B4C",
  overlay: "rgba(15,23,42,0.45)", // Semi-transparent overlay
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
    shadowColor: "#FE2B4C",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  neonSecondary: {
    shadowColor: "#10B981",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};

// Light map style for react-native-maps (named darkMapStyle for direct compatibility)
export const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#F8F9FA" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#E2E8F0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#F1F5F9" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748B" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#C7D2FE" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#F8F9FA" }] },
];
