// Ruedalo Design System v1.0 — Theme Specification
// EXTRACTED PIXEL-PERFECT from Official Design Mockups
export const colors = {
  // Brand Palette (Official Ruedalo Colors)
  primary: "#0052CC",       // Ruedalo Main Blue (Extracted from mockup)
  primaryDim: "#0045AF",    // Ruedalo Secondary Blue (Darker accent)
  primaryLight: "#26A0EF",  // Logo Blue accent (Lighter variant)
  success: "#10B981",       // Energetic Emerald Green (Wallet, Savings, Success)
  successDim: "#059669",
  warning: "#F59E0B",       // Amber (Alerts, Pending states)
  danger: "#EF4444",        // Rose Red (SOS, Rejections, Errors)
  
  // Neutral Colors (Exact from mockup)
  bg: "#F8FAFC",            // Background off-white
  surface: "#FFFFFF",       // Card and modal surfaces
  elevated: "#F1F5F9",      // Inner gray sections
  border: "#E2E8F0",        // Dividers and structural borders
  borderLight: "#E5E5EA",   // Lighter borders for inactive elements
  borderFocus: "#0052CC",   // Focused inputs
  overlay: "rgba(15,23,42,0.45)", // Semi-transparent modal sheet bg
  
  // Typography Colors (Exact from mockup)
  textPrimary: "#000000",   // Pure black for primary text
  textSecondary: "#6D6D72", // Secondary text
  textMuted: "#8A8A8E",     // Placeholder text in inputs
  
  // Splash Screen Colors
  splashGradientTop: "#0B1A37",    // Splash background gradient top
  splashGradientBottom: "#030812", // Splash background gradient bottom
  splashSkyline: "#1E3B8A",        // Skyline building blocks
  
  // Card Backgrounds
  cardLightBlue: "#F2F2F7",     // Light gray card backgrounds
  cardSecurityBg: "#E5F0FF",    // Security card light blue background
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
};
