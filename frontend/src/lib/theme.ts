// Ruedalo Design System v1.0 — Theme Specification
// COLORES OFICIALES EXACTOS DEL LOGO
export const colors = {
  // Brand Palette (COLORES OFICIALES del logo de Ruedalo)
  primary: "#0066FF",       // Azul Ruedalo OFICIAL del isotipo
  primaryDim: "#0B132B",    // Azul medianoche (texto "Ruedalo")
  primarySlogan: "#2E62FF", // Azul del slogan "Muévete contigo"
  secondary: "#2E62FF",     // Color secundario
  secondaryDim: "#1D4ED8",
  tertiary: "#3B82F6",
  success: "#10B981",       // Energetic Emerald Green
  successDim: "#059669",
  warning: "#F59E0B",
  danger: "#EF4444",
  
  // Neutral Colors
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  elevated: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#E5E5EA",
  borderFocus: "#0066FF",   // Azul oficial
  overlay: "rgba(15,23,42,0.45)",
  
  // Typography Colors
  textPrimary: "#0B132B",   // Azul medianoche (del logo)
  textSecondary: "#6D6D72",
  textMuted: "#8A8A8E",
  
  // Splash Screen
  splashGradientTop: "#0B132B",
  splashGradientBottom: "#030812",
  splashSkyline: "#1E3B8A",
  
  // Card Backgrounds
  cardLightBlue: "#F2F2F7",
  cardSecurityBg: "#E5F0FF",
};

export const fonts = {
  heading: "Poppins-SemiBold",
  headingBold: "Poppins-Bold",
  body: "Poppins-Regular",
  bodyMedium: "Poppins-Medium",
  bodyBold: "Poppins-SemiBold",
  mono: "JetBrainsMono",
};

export const spacing = {
  xs: 4,    // Micro adjustment
  sm: 8,    // Small margins
  md: 16,   // Standard grid spacing
  lg: 24,   // Large layouts
  xl: 32,   // Sections separations
};

export const radii = {
  sm: 8,    // Buttons, inputs (Exact from mockup)
  md: 12,   // Cards, inputs (Exact from mockup)
  lg: 20,   // Standard Ruedalo corners
  pill: 24, // Pill-shaped tabs (Exact from mockup)
  xl: 28,   // Sliders & bottom sheet rounded corners
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  btn: {
    shadowColor: "#2563EB",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  neonPrimary: {
    shadowColor: "#0066FF",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  neonSecondary: {
    shadowColor: "#2E62FF",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
};

export const darkMapStyle: any[] = [];
