# BioRepo - Repositorio Académico FCB-UNMSM

<div align="center">
  <h3>Plataforma Oficial de Repositorio Académico</h3>
  <p>Facultad de Ciencias Biológicas - Universidad Nacional Mayor de San Marcos</p>
</div>

## 🎯 Descripción

**BioRepo** es la plataforma de repositorio académico diseñada para la Facultad de Ciencias Biológicas de la UNMSM. Proporciona un sistema organizado y jerárquico para gestionar materiales educativos, siguiendo estándares académicos y de usabilidad enterprise.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

-   **Frontend Framework**: React 18 + TypeScript + Vite
-   **UI Components**: Shadcn UI + Tailwind CSS
-   **State Management**: Zustand
-   **Data Fetching**: TanStack Query (preparado para integración)
-   **Routing**: React Router v6
-   **Authentication**: AWS Cognito (estructura preparada)
-   **Icons**: Lucide React

### Modelo de Datos Jerárquico

El sistema implementa una jerarquía estricta de 6 niveles:

```
Program (Carrera)
    └── Semester (Ciclo Académico)
        └── Course (Materia)
            └── Block (Grupo/Sección)
                └── Week (Semana)
                    └── Material (Archivo/Recurso)
```

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			// Other configs...

			// Remove tseslint.configs.recommended and replace with this
			tseslint.configs.recommendedTypeChecked,
			// Alternatively, use this for stricter rules
			tseslint.configs.strictTypeChecked,
			// Optionally, add this for stylistic rules
			tseslint.configs.stylisticTypeChecked,

			// Other configs...
		],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.node.json', './tsconfig.app.json'],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			// Other configs...
			// Enable lint rules for React
			reactX.configs['recommended-typescript'],
			// Enable lint rules for React DOM
			reactDom.configs.recommended,
		],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.node.json', './tsconfig.app.json'],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```
