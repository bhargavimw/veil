/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0F24',
          soft: '#0E1430',
          panel: '#111A3A',
        },
        veil: {
          violet: '#8B5CF6',
          cyan: '#22D3EE',
          green: '#34D399',
          red: '#F43F5E',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};
