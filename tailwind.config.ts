import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'fdr-orange': 'rgb(204,85,0)',
        'fdr-blue':   'rgb(0,102,204)',
        'fdr-red':    'rgb(204,0,0)',
      },
    },
  },
  plugins: [],
};

export default config;
