export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0e14',
        surface: '#0a0e14',
        'surface-container': '#151a21',
        'surface-container-high': '#1b2028',
        'surface-container-low': '#0f141a',
        primary: '#96f8ff',
        secondary: '#af88ff',
        tertiary: '#5bb1ff',
        onsurface: '#f1f3fc',
        outline: '#72757d',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(150,248,255,0.25)',
      },
    },
  },
  plugins: [],
};
