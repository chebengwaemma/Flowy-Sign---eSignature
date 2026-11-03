/** PostCSS — used by `next build --webpack` (Hostinger-safe; avoids Turbopack CSS panic) */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
