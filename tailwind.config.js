/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				/* Paleta institucional. Tonos 50-900 derivados de cada color base (500). */
				brand: {
					DEFAULT: '#4578B8', // Azul institucional
					50: '#F0F4F9',
					100: '#E1E9F4',
					200: '#C3D4E8',
					300: '#9EB9DA',
					400: '#7298C9',
					500: '#4578B8',
					600: '#3B679E',
					700: '#335787',
					800: '#2B4870',
					900: '#223959',
				},
				action: {
					DEFAULT: '#1A69BB', // Azul de acciones: botones, enlaces y foco
					50: '#EDF3FA',
					100: '#DAE7F4',
					200: '#B6CFE9',
					300: '#88B1DC',
					400: '#518DCB',
					500: '#1A69BB',
					600: '#185AA1',
					700: '#174D89',
				},
				gold: {
					DEFAULT: '#FDC912', // Amarillo institucional: solo acentos, nunca texto sobre azul
					100: '#FFF6D9',
					300: '#FEE384',
				},
				cream: {
					DEFAULT: '#FAF1ED', // Crema: superficies puntuales, no el fondo general
					200: '#EFDFD7',
				},
				ink: '#292D32', // Texto principal
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
