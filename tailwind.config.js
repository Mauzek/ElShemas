/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--ui-surface)',
        surface2: 'var(--ui-surface-2)',
        line: 'var(--ui-line)',
        ink: 'var(--ui-ink)',
        muted: 'var(--ui-muted)',
        accent: 'var(--ui-accent)',
      },
      borderRadius: {
        DEFAULT: '11px',
        md: '11px',
        lg: '14px',
        xl: '18px',
        '2xl': '22px',
      },
      fontFamily: {
        ui: ['Manrope', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
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
