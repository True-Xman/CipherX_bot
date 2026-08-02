/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        neon: "#00FF66",
        cyber: {
          dark: '#0A0A0C',
        }
      },
      boxShadow: {
        'neon-green': '0 0 15px rgba(0, 255, 102, 0.4), inset 0 0 15px rgba(0, 255, 102, 0.1)',
        'neon-glow': '0 0 25px rgba(0, 255, 102, 0.25)',
        'deep-neon': '0 0 30px rgba(0,255,102,0.5), 0 8px 40px rgba(0,255,102,0.08)'
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-spin': 'spin 8s linear infinite',
        'neon-pulse': 'neonPulse 1.8s ease-in-out infinite',
        'scan': 'scan 2s linear infinite'
      },
      keyframes: {
        neonPulse: {
          '0%': { filter: 'drop-shadow(0 0 6px rgba(0,255,102,0.5))' },
          '50%': { filter: 'drop-shadow(0 0 22px rgba(0,255,102,0.95))' },
          '100%': { filter: 'drop-shadow(0 0 6px rgba(0,255,102,0.5))' },
        },
        scan: {
          '0%': { transform: 'translateY(-120%)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '50%': { transform: 'translateY(10%)', opacity: '0.15' },
          '100%': { transform: 'translateY(120%)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
