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

## 📚 Referencias

-   [AWS Cognito JWT Verification](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
-   [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
-   [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
