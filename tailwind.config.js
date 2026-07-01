module.exports = {
  content: [
    './*.html',
    './blog/**/*.html',
    './compliance/**/*.html',
    './games/**/*.html',
    './*-games/**/*.html',
    './browser-games/**/*.html',
    './popular-games/**/*.html',
    './js/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif']
      },
      colors: {
        nexus: { dark: '#06060e', card: '#111125', elevated: '#1a1a2e' }
      }
    }
  }
};
