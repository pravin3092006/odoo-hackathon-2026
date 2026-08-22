/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B2432',      // deep navy - primary text / sidebar
        flow: '#0F9D8C',     // teal - primary brand action
        flowdark: '#0B7A6D',
        amber: '#F5A623',    // accent - warnings / highlights
        cream: '#F6F5F1',    // app background
        slate: {
          650: '#4B5563'
        }
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,36,50,0.06), 0 1px 12px rgba(27,36,50,0.04)'
      }
    }
  },
  plugins: []
}
