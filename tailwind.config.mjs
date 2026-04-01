/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'admin-primary':       'rgb(var(--admin-primary) / <alpha-value>)',
        'admin-primary-hover': 'rgb(var(--admin-primary-hover) / <alpha-value>)',
        'admin-primary-light': 'rgb(var(--admin-primary-light) / <alpha-value>)',
        'admin-danger':        'rgb(var(--admin-danger) / <alpha-value>)',
        'admin-warning':       'rgb(var(--admin-warning) / <alpha-value>)',
        'admin-success':       'rgb(var(--admin-success) / <alpha-value>)',
        'admin-bg':            'rgb(var(--admin-bg) / <alpha-value>)',
        'admin-surface':       'rgb(var(--admin-surface) / <alpha-value>)',
        'admin-border':        'rgb(var(--admin-border) / <alpha-value>)',
        'admin-text':          'rgb(var(--admin-text) / <alpha-value>)',
        'admin-text-muted':    'rgb(var(--admin-text-muted) / <alpha-value>)',
      },
      borderRadius: {
        'admin-sm': 'var(--admin-radius-sm)',
        'admin-md': 'var(--admin-radius-md)',
        'admin-lg': 'var(--admin-radius-lg)',
        'admin-xl': 'var(--admin-radius-xl)',
      },
    },
  },
  plugins: [],
};
