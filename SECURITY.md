# 🔐 Guía de Seguridad y HTTP Client

## Configuración de Seguridad Implementada

### 1. **Cookies HttpOnly con AWS Cognito**

Los tokens ahora se almacenan en cookies con las siguientes características:

-   ✅ **HttpOnly**: No accesibles desde JavaScript
-   ✅ **Secure**: Solo se envían por HTTPS (en producción)
-   ✅ **SameSite=Strict**: Protección contra CSRF
-   ✅ **Expiración**: 7 días
-   ✅ **Domain**: Configurado automáticamente según el hostname

**Configuración** (ya implementada en `src/config/cognito.ts`):

```typescript
cookieStorage: {
  domain: window.location.hostname,
  path: '/',
  expires: 7,
  sameSite: 'strict',
  secure: window.location.protocol === 'https:',
}
```

### 2. **Content Security Policy (CSP)**

Implementado en `index.html` para prevenir:

-   ✅ Cross-Site Scripting (XSS)
-   ✅ Inyección de código malicioso
-   ✅ Clickjacking
-   ✅ Data exfiltration

### 3. **Protección de Rutas con Tokens**

El componente `ProtectedRoute` ahora verifica:

1. Usuario autenticado
2. Token de acceso válido
3. Muestra loading mientras verifica sesión
4. Redirige a login si falta autenticación

## 📡 HTTP Client - Cómo Usar

### Configuración Inicial

1. **Crear archivo `.env` en la raíz del proyecto:**

```bash
cp .env.example .env
```

2. **Configurar la URL de tu backend:**

```env
VITE_API_URL=http://localhost:3000/api
# O en producción:
# VITE_API_URL=https://api.biorepo.unmsm.edu.pe
```

### Uso Básico

#### **GET Request**

```typescript
import { httpClient } from '@/lib/httpClient';

// Petición autenticada automáticamente
const courses = await httpClient.get<Course[]>('/courses');

// Petición sin autenticación (pública)
const publicData = await httpClient.get('/public/info', {
	requiresAuth: false,
});
```

#### **POST Request**

```typescript
// Crear un nuevo recurso
const newCourse = await httpClient.post<Course>('/courses', {
	title: 'Biología Molecular',
	description: 'Curso avanzado de biología',
});
```

#### **PUT Request**

```typescript
// Actualizar un recurso
const updated = await httpClient.put<Course>(`/courses/${id}`, {
	title: 'Nuevo título',
});
```

#### **DELETE Request**

```typescript
// Eliminar un recurso
await httpClient.delete(`/courses/${id}`);
```

#### **Upload de Archivos**

```typescript
// Subir un archivo
const file = event.target.files[0];
const result = await httpClient.upload<UploadResponse>(
	'/upload/document',
	file
);
```

### Uso en Componentes React

```typescript
import { useHttpClient } from '@/lib/httpClient';
import { useEffect, useState } from 'react';

function MyComponent() {
	const httpClient = useHttpClient();
	const [data, setData] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await httpClient.get('/api/data');
				setData(result);
			} catch (error) {
				console.error('Error:', error);
			}
		};

		fetchData();
	}, []);

	return <div>{/* render data */}</div>;
}
```

### Manejo Automático de Errores

El httpClient maneja automáticamente:

1. **Token expirado (401):**

    - Intenta renovar la sesión automáticamente
    - Si falla, redirige a login
    - Muestra mensaje al usuario

2. **Errores de red:**

    - Lanza excepciones con mensajes descriptivos
    - Puedes capturarlos con try/catch

3. **Headers automáticos:**
    - Authorization: Bearer {token}
    - Content-Type: application/json

### Ejemplo Completo: Servicio de Cursos

```typescript
// src/services/courseService.ts
import { httpClient } from '@/lib/httpClient';

interface Course {
	id: number;
	title: string;
	description: string;
}

export const courseService = {
	async getAll(): Promise<Course[]> {
		return httpClient.get<Course[]>('/courses');
	},

	async getById(id: number): Promise<Course> {
		return httpClient.get<Course>(`/courses/${id}`);
	},

	async create(course: Omit<Course, 'id'>): Promise<Course> {
		return httpClient.post<Course>('/courses', course);
	},

	async update(id: number, course: Partial<Course>): Promise<Course> {
		return httpClient.put<Course>(`/courses/${id}`, course);
	},

	async delete(id: number): Promise<void> {
		return httpClient.delete(`/courses/${id}`);
	},
};
```

```typescript
// En tu componente
import { courseService } from '@/services/courseService';

function CoursesPage() {
	const [courses, setCourses] = useState<Course[]>([]);

	useEffect(() => {
		courseService.getAll().then(setCourses).catch(console.error);
	}, []);

	// ...
}
```

## 🔒 Características de Seguridad

### Protección Implementada

| Característica       | Estado | Descripción                   |
| -------------------- | ------ | ----------------------------- |
| **HttpOnly Cookies** | ✅     | Tokens no accesibles desde JS |
| **Secure Flag**      | ✅     | Solo HTTPS en producción      |
| **SameSite Strict**  | ✅     | Protección CSRF               |
| **CSP Headers**      | ✅     | Previene XSS                  |
| **Token en Headers** | ✅     | Authorization automático      |
| **Auto-renovación**  | ✅     | Manejo de expiración          |
| **Route Protection** | ✅     | Verificación de tokens        |

### Checklist de Seguridad para Producción

-   [ ] Configurar HTTPS en el servidor
-   [ ] Validar `VITE_API_URL` en producción
-   [ ] Configurar CORS en el backend
-   [ ] Revisar políticas de CSP según necesidades
-   [ ] Configurar rate limiting en API
-   [ ] Implementar logging de seguridad
-   [ ] Revisar expiración de tokens (actualmente 7 días)

## 🚀 Siguientes Pasos

1. **Configurar tu backend para aceptar tokens JWT:**

```javascript
// Ejemplo en Node.js/Express
const jwt = require('jsonwebtoken');

app.use((req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1];
	if (!token) return res.status(401).send('No autorizado');

	// Verificar con las claves públicas de Cognito
	// https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json
	jwt.verify(token, publicKey, (err, decoded) => {
		if (err) return res.status(401).send('Token inválido');
		req.user = decoded;
		next();
	});
});
```

2. **Probar las peticiones:**

```bash
# En la consola del navegador
const token = useAuthStore.getState().getAccessToken();
console.log('Token:', token);
```

3. **Monitorear errores:**
    - Revisa la consola del navegador
    - Los errores 401 activan renovación automática
    - Los errores se loguean con emojis: 🔒 🔑 ❌

## � Sistema de Roles y Permisos con CASL

### Arquitectura del Sistema

El sistema usa **CASL (An isomorphic authorization library)** para gestionar permisos granulares:

1. **Backend** envía permisos del usuario en `/api/v1/auth/me`
2. **Frontend** construye un objeto `Ability` con las reglas recibidas
3. **Componentes** verifican permisos antes de mostrar UI o ejecutar acciones
4. **Validación doble**: Cliente (UX) + Servidor (seguridad real)

### Tipos de Permisos

#### **Roles**

```typescript
'Admin' | 'Teacher' | 'Student';
```

#### **Acciones**

```typescript
'manage'; // Permiso total (wildcard)
'create'; // Crear recursos
'read'; // Ver recursos
'update'; // Actualizar recursos
'delete'; // Eliminar recursos
```

#### **Sujetos (Recursos)**

```typescript
'Course' |
	'Student' |
	'Grade' |
	'User' |
	'Assignment' |
	'Material' |
	'Enrollment' |
	'all';
```

### Uso del Componente `<Can>`

```tsx
import { Can } from '@/components/Can';

// Permiso general
<Can I="create" a="Course">
  <Button>Crear Curso</Button>
</Can>

// Permiso condicional (IMPORTANTE: pasar this={objeto})
<Can I="update" a="Course" this={course}>
  <Button>Editar Curso</Button>
</Can>

// Personalizar según permiso
<Can I="delete" a="Course" passThrough>
  {(allowed) => (
    <Button disabled={!allowed}>
      {allowed ? 'Eliminar' : 'Sin permisos'}
    </Button>
  )}
</Can>
```

### Hooks de Permisos

```tsx
import {
	useCan,
	useUserRole,
	useHasRole,
	useAbility,
} from '@/hooks/usePermissions';

function MyComponent() {
	// Verificar permisos específicos
	const canCreate = useCan('create', 'Course');
	const canEdit = useCan('update', 'Course', course); // Con objeto

	// Obtener rol
	const userRole = useUserRole(); // 'Admin' | 'Teacher' | 'Student'
	const isTeacher = useHasRole('Teacher');

	// Ability completo
	const ability = useAbility();

	if (ability.can('manage', 'all')) {
		// Es administrador
	}
}
```

### Validación en Servicios

```typescript
import { useAuthStore } from '@/store/authStore';
import { httpClient } from '@/lib/httpClient';

export const courseService = {
	async update(courseId: number, course: any) {
		// Verificar permiso antes de llamar al backend
		const ability = useAuthStore.getState().ability;

		if (!ability.can('update', 'Course', course)) {
			throw new Error('No tienes permisos para editar este curso');
		}

		return httpClient.put(`/courses/${courseId}`, course);
	},
};
```

### Menús Dinámicos

```tsx
function NavigationMenu() {
	const ability = useAbility();

	const menuItems = [
		{ label: 'Dashboard', path: '/', show: true },
		{
			label: 'Gestionar Cursos',
			path: '/courses',
			show: ability.can('create', 'Course'),
		},
		{
			label: 'Calificaciones',
			path: '/grades',
			show: ability.can('read', 'Grade'),
		},
		{
			label: 'Admin',
			path: '/admin',
			show: ability.can('manage', 'all'),
		},
	];

	return (
		<nav>
			{menuItems
				.filter((item) => item.show)
				.map((item) => (
					<a href={item.path}>{item.label}</a>
				))}
		</nav>
	);
}
```

### Permisos Condicionales

**⚠️ IMPORTANTE:** Para permisos con `conditions`, SIEMPRE pasar el objeto completo:

```typescript
// ❌ INCORRECTO - No puede validar conditions
ability.can('update', 'Course');

// ✅ CORRECTO - Valida course.teacherId === currentUser.id
ability.can('update', 'Course', course);
```

**Ejemplo de regla con conditions del backend:**

```json
{
	"action": "update",
	"subject": "Course",
	"conditions": { "teacherId": 2 }
}
```

Esto significa: "Solo puede actualizar cursos donde `course.teacherId === 2`"

### Manejo de Errores HTTP

#### **401 - No Autorizado**

-   Token expirado o inválido
-   Sistema intenta renovar sesión automáticamente
-   Si falla, limpia estado y redirige a `/login`
-   Limpia `localStorage` y `sessionStorage`

#### **403 - Forbidden**

-   Usuario no tiene permisos para la acción
-   Muestra mensaje: "No tienes permisos para realizar esta acción"
-   NO limpia sesión (usuario sigue autenticado)
-   Puede redirigir a `/unauthorized`

### Flujo de Autenticación con Permisos

1. **Login exitoso** → Cognito autentica
2. **Obtener permisos** → `GET /api/v1/auth/me`
3. **Construir ability** → `buildAbilityFrom(abilities)`
4. **Guardar en Zustand** → `authStore.ability`
5. **UI reactiva** → Componentes verifican permisos

```tsx
// En Login.tsx
useEffect(() => {
	if (isAuthenticated) {
		fetchUserPermissions().then(() => {
			navigate('/');
		});
	}
}, [isAuthenticated]);
```

### Archivo de Ejemplos

Ver **`PERMISSIONS_EXAMPLES.tsx`** para 10 ejemplos completos:

-   Componente `<Can>`
-   Hooks de permisos
-   Validaciones en servicios
-   Menús dinámicos
-   Formularios con validaciones
-   Tablas con acciones condicionales
-   Dashboards por rol
-   Protección de rutas con permisos

## �📚 Referencias

-   [AWS Cognito JWT Verification](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
-   [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
-   [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
-   [CASL Documentation](https://casl.js.org/v6/en/)
-   [CASL with React](https://casl.js.org/v6/en/package/casl-react)
