/**
 * I-Tourism Planner — Tailwind design tokens
 * Extracted from the approved mockup (I-Tourism Planner | Vacation Dashboard concept).
 * Scope note: only the VISUAL LANGUAGE (color, type, radius, shadow) is taken from
 * that mockup. Its screens (itinerary builder, map, rentals) are Phase 3+ features —
 * do not build those components yet. Use these tokens for MVP screens: search,
 * property detail, booking, payment, and the owner dashboard.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EAF6F0", 100: "#CDEBDD", 300: "#7FC7A4",
          500: "#2E7D5B", 600: "#256B4D", 700: "#1D5A40", 900: "#123A2A",
        },
        accent: {
          50: "#FDF1E6", 100: "#FADFC2", 400: "#EE9142",
          500: "#E8791C", 600: "#C9650F", 700: "#A3520C",
        },
        info: { 50: "#EAF2FF", 100: "#CFE2FF", 500: "#2563EB", 600: "#1D4ED8" },
        success: { 50: "#EEFBF0", 500: "#16A34A", 600: "#15803D" },
        warning: { 50: "#FEF6E7", 500: "#D97706", 600: "#B45309" },
        danger:  { 50: "#FDECEC", 500: "#DC2626", 600: "#B91C1C" },
        ink: { 900: "#1F2937", 600: "#4B5563", 400: "#9CA3AF" },
        surface: { DEFAULT: "#FFFFFF", muted: "#F7F8F9", border: "#E5E7EB" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        "heading-lg": ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        "heading-md": ["1.05rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        "label-sm": ["0.75rem", { lineHeight: "1rem", fontWeight: "500", letterSpacing: "0.02em" }],
        body: ["0.9375rem", { lineHeight: "1.375rem", fontWeight: "400" }],
      },
      borderRadius: { card: "0.75rem", pill: "9999px", control: "0.5rem" },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)",
        "card-hover": "0 4px 8px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.06)",
      },
      spacing: { 18: "4.5rem" },
    },
  },
  plugins: [],
};
