import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' }
    },
    extend: {
      fontFamily: { sans: ['Poppins', ...defaultTheme.fontFamily.sans] },
      colors: {
        redcross: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#E21224',
          600: '#c81020',
          700: '#a50d1a',
          900: '#5f0910'
        }
      },
      screens: { xs: '420px' },
      boxShadow: {
        box: '0 8px 32px rgba(15, 23, 42, 0.08)'
      }
    }
  }
};
