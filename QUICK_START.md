# 🚀 Quick Start Guide - BioRepo

## ¿Qué es BioRepo?

BioRepo es el **Repositorio Académico Digital** para la Facultad de Ciencias Biológicas de la UNMSM. Permite organizar y acceder a materiales educativos de forma estructurada por programa, semestre, curso, grupo y semana.

---

## 🎯 Características Principales

### ✅ Implementado

-   ✨ **Dashboard Personal**: Acceso rápido a tus cursos y novedades
-   📚 **Biblioteca Global**: Explorador de todos los cursos disponibles
-   📖 **Vista de Curso**: Accordion semanal con materiales organizados
-   🎨 **UI Moderna**: Shadcn UI + Tailwind CSS (diseño académico profesional)
-   🔐 **Rutas Protegidas**: Sistema de autenticación preparado
-   📱 **Responsive**: Funciona en desktop, tablet y móvil

---

## ⚡ Inicio Rápido

### 1. Instalación

```bash
cd /mnt/development_disk/Projects/DB/unmsm-fcb-academic-repository
npm install
```

### 2. Desarrollo

```bash
npm run dev
```

Abre: **http://localhost:5173**

### 3. Build Producción

```bash
npm run build
npm run preview
```

---

## 🗂️ Estructura del Proyecto

```
src/
├── components/
│   ├── ui/              # Componentes Shadcn UI
│   │   ├── accordion.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── select.tsx
│   └── Layout.tsx       # Header + Footer
│
├── pages/               # Páginas principales
│   ├── Dashboard.tsx    # Vista personal (/)
│   ├── Library.tsx      # Explorador (/library)
│   └── CourseDetail.tsx # Detalle (/course/:blockId)
│
├── router/
│   └── AppRouter.tsx    # Rutas de la app
│
├── store/
│   └── academicStore.ts # Estado global (Zustand)
│
├── services/
│   └── mockData.ts      # Datos de ejemplo UNMSM
│
├── types/
│   └── academic.ts      # Interfaces TypeScript
│
└── lib/
    ├── utils.ts         # Helpers
    └── materialIcons.ts # Iconos por tipo
```

---

## 🎓 Modelo de Datos

### Jerarquía (6 niveles)

```
Program (Carrera)
  ├── Semester (Ciclo: 2025-I)
      ├── Course (Materia: Biología Celular)
          ├── Block (Grupo A - El usuario se inscribe aquí)
              ├── Week (Semana 1)
                  └── Material (PDF, Video, PPT)
```

### Ejemplo Real

```
Microbiología y Parasitología
  └── 2025-II
      └── Microbiología General (BM301)
          ├── Grupo A - Mañana
          │   ├── Semana 1: Intro a Microbiología
          │   │   ├── presentacion.pptx
          │   │   ├── estructura-bacteriana.pdf
          │   │   └── video-microscopia.mp4
          │   └── Semana 2: Crecimiento Microbiano
          └── Grupo B - Tarde
```

---

## 🧭 Navegación

### 1. Dashboard (`/`)

**Componentes**:

-   **Mis Cursos**: Cards de los bloques donde estás inscrito
-   **Novedades**: Materiales recientes ordenados por fecha

**Datos Mock**: Usuario "Juan Pérez" inscrito en "Microbiología General - Grupo A"

---

### 2. Biblioteca (`/library`)

**Filtros**:

1. Selecciona **Programa** → Carga semestres
2. Selecciona **Semestre** → Carga cursos

**Resultado**: Grid de cursos con botones a cada grupo

---

### 3. Detalle del Curso (`/course/:blockId`)

**Vista Tipo "Classroom"**:

-   **Header**: Info del bloque (código, profesor, horario, aula)
-   **Accordion de Semanas**: Click para expandir
    -   Cada semana muestra sus materiales
    -   Iconos según tipo (PDF, Video, PPT)
    -   Botones de descarga/visualización

---

## 🎨 Componentes UI

### Shadcn UI (Importados)

Todos los componentes están en `src/components/ui/`:

```typescript
// Ejemplo de uso
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion';
```

### Alias de Importación

-   `@/` → `/src/`
-   Ejemplo: `@/components/Layout` → `/src/components/Layout.tsx`

---

## 🔧 Estado Global (Zustand)

### Uso del Store

```typescript
import { useAcademicStore } from '@/store/academicStore';

// En un componente
function MiComponente() {
	const myCourses = useAcademicStore((state) => state.getMyCourses());
	const loadPrograms = useAcademicStore((state) => state.loadPrograms());

	useEffect(() => {
		loadPrograms();
	}, []);

	return <div>{/* Renderizar cursos */}</div>;
}
```

### Principales Métodos

| Método                            | Descripción                           |
| --------------------------------- | ------------------------------------- |
| `loadPrograms()`                  | Carga lista de carreras               |
| `loadSemestersByProgram(id)`      | Carga semestres de una carrera        |
| `loadCoursesBySemester(pid, sid)` | Carga cursos de un semestre           |
| `getMyCourses()`                  | Obtiene cursos del usuario actual     |
| `getNewsItems()`                  | Obtiene novedades ordenadas por fecha |
| `getCourseDetail(blockId)`        | Obtiene detalle completo de un bloque |

---

## 📦 Dependencias

### Core

-   `react` + `react-dom`: Framework
-   `react-router-dom`: Routing
-   `zustand`: Estado global
-   `@tanstack/react-query`: Data fetching (preparado)

### UI

-   `@radix-ui/react-*`: Primitives (Accordion, Select)
-   `lucide-react`: Iconos
-   `tailwindcss`: Estilos
-   `class-variance-authority`: Variants de componentes

---

## 🎯 Datos Mock

### Usuario Actual

```typescript
{
  id: 'user-1',
  email: 'juan.perez@unmsm.edu.pe',
  firstName: 'Juan',
  lastName: 'Pérez García',
  role: 'student',
  programId: 'prog-1', // Microbiología
  enrolledBlocks: ['block-1'] // Grupo A
}
```

### Programas Disponibles

1. Microbiología y Parasitología
2. Genética y Biotecnología
3. Ciencias Biológicas

### Cursos de Ejemplo

-   **Microbiología General** (BM301) - 2 grupos
-   **Biología Celular** (BB201)
-   **Genética Molecular** (BG401)

---

## 🔮 Próximas Integraciones

### Backend (Pendiente)

1. **AWS Cognito**: Autenticación real
2. **API REST**: Endpoints de datos
3. **AWS S3**: Almacenamiento de archivos
4. **TanStack Query**: Cache y sincronización

### Variables de Entorno (`.env`)

```env
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=tu_pool_id
VITE_CLIENT_ID=tu_client_id
VITE_API_URL=https://api.biorepo.unmsm.edu.pe
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@/...'"

**Solución**: Verifica `tsconfig.app.json`:

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["./src/*"]
		}
	}
}
```

### Error: Estilos no cargan

**Solución**: Verifica que `src/index.css` esté importado en `main.tsx`

### Port 5173 ocupado

**Solución**:

```bash
# Cambiar puerto en vite.config.ts
export default defineConfig({
  server: { port: 3000 }
})
```

---

## 📚 Recursos Adicionales

-   **Documentación Técnica**: Ver `TECHNICAL_DOCS.md`
-   **TypeScript Types**: Ver `src/types/academic.ts`
-   **Shadcn UI**: https://ui.shadcn.com/
-   **Tailwind CSS**: https://tailwindcss.com/

---

## ✅ Checklist de Desarrollo

-   [x] Setup inicial Vite + React + TypeScript
-   [x] Configuración Tailwind + Shadcn UI
-   [x] Modelo de datos TypeScript
-   [x] Zustand store
-   [x] React Router
-   [x] Páginas principales (Dashboard, Library, CourseDetail)
-   [x] Componentes UI (Accordion, Card, Select, Button)
-   [x] Datos mock UNMSM
-   [x] Responsive design

### Siguiente Fase

-   [ ] Integrar AWS Cognito
-   [ ] Conectar API backend
-   [ ] Implementar TanStack Query
-   [ ] Sistema de carga de archivos
-   [ ] Tests unitarios
-   [ ] Deploy a producción

---

**¡Listo para desarrollar!** 🚀

Para más detalles técnicos, consulta `TECHNICAL_DOCS.md`
