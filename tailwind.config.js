/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#D6381F',
          hover: '#AE2C18',
        },
        loja: {
          bg: '#F1F2F5',
        },
        texto: {
          principal: '#16181D',
          secundario: '#6B707A',
          terciario: '#8A8F98',
        },
        borda: {
          leve: '#EEF0F3',
          media: '#E7E9ED',
        },
        sucesso: {
          DEFAULT: '#1E8A4C',
          bg: '#EAF7EE',
        },
        categoria: {
          carne: '#F3D8CF',
          acompanhamento: '#FBE7B8',
          guarnicao: '#E6D9C2',
          salada: '#D8E8CB',
          bebida: '#D7E6F2',
          sobremesa: '#F2D9E8',
        },
      },
      borderRadius: {
        sm: '12px',
        md: '16px',
        lg: '22px',
        xl: '28px',
      },
    },
  },
  plugins: [],
}
