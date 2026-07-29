// Ruedalo Design System v1.0 — Theme Specification
export const colors = {
  // Brand Palette (Yango & Ruedalo Inspired)
  primary: "#2563EB",       // Ruedalo Main Blue
  primaryDim: "#1E40AF",    // Ruedalo Secondary Blue
  success: "#10B981",       // Energetic Emerald Green (Wallet, Savings, Success)
  successDim: "#059669",
  warning: "#F59E0B",       // Amber (Alerts, Pending states)
  danger: "#EF4444",        // Rose Red (SOS, Rejections, Errors)
  
  // Neutral Colors (Pure Luz Premium)
  bg: "#F8FAFC",            // Background off-white
  surface: "#FFFFFF",       // Card and modal surfaces
  elevated: "#F1F5F9",      // Inner gray sections
  border: "#E2E8F0",        // Dividers and structural borders
  borderFocus: "#2563EB",   // Focused inputs
  overlay: "rgba(15,23,42,0.45)", // Semi-transparent modal sheet bg
  
  // Typography Colors
  textPrimary: "#0F172A",   // Rich Dark Slate (H1, H2, labels)
  textSecondary: "#475569", // Medium Slate (descriptions, subtitles)
  textMuted: "#94A3B8",     // Light Slate (placeholders, metadata)
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
  sm: 8,
  md: 12,
  lg: 20,   // Standard Ruedalo 20px corners
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
