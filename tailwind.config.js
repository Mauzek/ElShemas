/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--ui-surface)',
        panel: 'var(--ui-panel)',
        line: 'var(--ui-line)',
        ink: 'var(--ui-ink)',
        muted: 'var(--ui-muted)',
        accent: 'var(--ui-accent)',
        hover: 'var(--ui-hover)',
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
      },
      fontFamily: {
        ui: ['Inter', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        xs: ['11px', '15px'],
        sm: ['12px', '17px'],
        base: ['13px', '19px'],
      },
    },
  },
  plugins: [],
};
