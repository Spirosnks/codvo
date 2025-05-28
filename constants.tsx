import type React from "react"

export const GEMINI_API_KEY_ENV_VAR = "GEMINI_API_KEY"

export const MODEL_TEXT = "gemini-2.5-flash-preview-04-17"
export const MODEL_IMAGE_GEN = "imagen-3.0-generate-002" // Not used in this app, but good to have

// Nouvelle palette de couleurs
export const COLORS = {
  primary: "#ddf928", // La couleur principale demandée
  primaryDark: "#b9cc21", // Version plus foncée pour les hovers
  primaryLight: "#e7fa6e", // Version plus claire pour les accents
  dark: "#1a1a1a", // Fond sombre
  darkGray: "#2a2a2a", // Gris foncé pour les contrastes
  mediumGray: "#3a3a3a", // Gris moyen pour les bordures
  lightGray: "#f0f0f0", // Gris clair pour le texte sur fond sombre
  text: "#f8f8f8", // Texte principal
  textDark: "#111111", // Texte sur fond clair
}

export const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={`animate-spin -ml-1 mr-3 h-5 w-5 text-white ${className || ""}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

export const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 ${className || ""}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
    />
  </svg>
)

export const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 ${className || ""}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.158 0a.225.225 0 0 1 .225.225A.225.225 0 0 1 12.75 8.7V8.25Z"
    />
  </svg>
)

export const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 ${className || ""}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.53 16.122a3 3 0 0 0-2.122.442L4.108 19.5a2.25 2.25 0 0 1-3.182 0l-.001-.001a2.25 2.25 0 0 1 0-3.182l2.01-2.01a3 3 0 0 0 .442-2.122V9.531a3 3 0 0 0-2.122-.442L.002 7.076a2.25 2.25 0 0 1 0-3.182l.001-.001a2.25 2.25 0 0 1 3.182 0L5.39 6.001a3 3 0 0 0 2.122-.442V3.478a3 3 0 0 0 .442-2.122L9.967.002a2.25 2.25 0 0 1 3.182 0l.001.001a2.25 2.25 0 0 1 0 3.182L11.14 5.39a3 3 0 0 0-.442 2.122v2.123a3 3 0 0 0 2.122.442l2.01 2.009a2.25 2.25 0 0 1 0 3.182l-.001.001a2.25 2.25 0 0 1-3.182 0l-2.01-2.01a3 3 0 0 0-.442-2.122v-2.122a3 3 0 0 0-2.122-.442L7.879 9.967a2.25 2.25 0 0 1-3.182 0l-.001-.001a2.25 2.25 0 0 1 0-3.182l2.01-2.01M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
)
