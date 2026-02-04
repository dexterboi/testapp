/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#10b981', // Legacy fallback
                    dark: '#059669',
                    light: '#6ee7b7'
                },
                primary: "#C1F45F", // Vibrant lime green
                'app-bg': 'var(--bg-app-bg)',
                'app-surface': 'var(--bg-app-surface)',
                'app-surface-2': 'var(--bg-app-surface-2)',
                'app-text': 'var(--text-app-text)',
                'app-text-muted': 'var(--text-app-text-muted)',
                'app-border': 'var(--border-app-border)',
                dark: '#0f172a',
            },
            fontFamily: {
                display: ["Plus Jakarta Sans", "sans-serif"],
                sans: ["Plus Jakarta Sans", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "24px",
                '3xl': '32px',
                '4xl': '40px',
            },
            spacing: {
                'safe-top': 'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
                'safe-left': 'env(safe-area-inset-left)',
                'safe-right': 'env(safe-area-inset-right)',
            }
        }
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
