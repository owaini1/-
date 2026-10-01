/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: { cairo: ['Cairo', 'sans-serif'] },
      colors: {
        ink: '#0F172A',
        slate: '#1E293B',
        mint: '#10B981',
        mintdark: '#059669',
        amber: '#F59E0B',
        paper: '#F8FAFC'
      }
    }
  }
};
