# 🎯 Sistema de Roles y Permisos - Implementación Completa

## ✅ Archivos Creados/Actualizados

### 📁 Tipos y Configuración

-   ✅ `src/types/permissions.ts` - Tipos TypeScript para roles, permisos y abilities
-   ✅ `.env` - Configuración de API: `http://localhost:3000/api/v1`
-   ✅ `.env.example` - Template actualizado
-   ✅ `.gitignore` - Agregado .env

### 🔧 Servicios y Lógica

-   ✅ `src/services/authService.ts` - Servicio para llamar `GET /api/v1/auth/me`
-   ✅ `src/lib/abilityBuilder.ts` - Constructor de CASL Ability desde reglas del backend
-   ✅ `src/store/authStore.ts` - Actualizado con `backendUser`, `ability`, `fetchUserPermissions()`
-   ✅ `src/lib/httpClient.ts` - Mejorado con manejo de 401 y 403

### 🎨 UI y Componentes

-   ✅ `src/components/Can.tsx` - Componente para mostrar/ocultar según permisos
-   ✅ `src/pages/Unauthorized.tsx` - Página de "Acceso Denegado" (403)
-   ✅ `src/router/AppRouter.tsx` - Ruta `/unauthorized` agregada
-   ✅ `src/pages/Login.tsx` - Llama `fetchUserPermissions()` después de login

### 🪝 Hooks Personalizados

-   ✅ `src/hooks/usePermissions.ts` - 6 hooks:
    -   `useAbility()` - Acceso al objeto CASL ability
    -   `useCan()` - Verificar permisos
    -   `useCannot()` - Verificar falta de permisos
    -   `useBackendUser()` - Usuario con datos de roles
    -   `useUserRole()` - Rol actual del usuario
    -   `useHasRole()` - Verificar rol específico

### 📚 Documentación

-   ✅ `SECURITY.md` - Actualizado con sección completa de roles y permisos
-   ✅ `PERMISSIONS_EXAMPLES.tsx` - 10 ejemplos prácticos de uso

---

## 🔐 Roles Disponibles

```typescript
'Admin' | 'Teacher' | 'Student';
```

---

## ⚡ Acciones Disponibles

```typescript
'manage'; // Permiso total (*)
'create'; // Crear recursos
'read'; // Ver/leer recursos
'update'; // Actualizar recursos
'delete'; // Eliminar recursos
```

---

## 📦 Sujetos (Recursos)

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

---

## 🚀 Cómo Funciona

### 1. Login y Obtención de Permisos

```typescript
// En Login.tsx (ya implementado)
useEffect(() => {
	if (isAuthenticated) {
		// Automáticamente llama al backend
		fetchUserPermissions().then(() => {
			navigate('/');
		});
	}
}, [isAuthenticated]);
```

### 2. Backend Responde con Permisos

**Endpoint:** `GET /api/v1/auth/me`

**Respuesta esperada:**

```json
{
	"user": {
		"userId": 1,
		"email": "juan.perez@unmsm.edu.pe",
		"firstName": "Juan",
		"lastName": "Pérez",
		"cognitoId": "abc-123",
		"role": {
			"roleId": 2,
			"roleName": "Teacher",
			"description": "Profesor"
		}
	},
	"abilities": [
		{
			"action": "create",
			"subject": "Course"
		},
		{
			"action": "update",
			"subject": "Course",
			"conditions": { "teacherId": 1 }
		},
		{
			"action": "read",
			"subject": "Grade"
		}
	]
}
```

### 3. Frontend Construye Ability

```typescript
// Automático en authStore.fetchUserPermissions()
const ability = buildAbilityFrom(abilities);
```

### 4. Uso en Componentes

#### **Opción 1: Componente `<Can>`**

```tsx
import { Can } from '@/components/Can';

<Can I="create" a="Course">
  <Button>Crear Curso</Button>
</Can>

// Con objeto para validación condicional
<Can I="update" a="Course" this={course}>
  <Button>Editar</Button>
</Can>
```

#### **Opción 2: Hooks**

```tsx
import { useCan, useUserRole, useHasRole } from '@/hooks/usePermissions';

const canCreate = useCan('create', 'Course');
const canEdit = useCan('update', 'Course', course);
const isTeacher = useHasRole('Teacher');
const userRole = useUserRole();

if (canCreate) {
	// Mostrar botón crear
}
```

#### **Opción 3: Ability directo**

```tsx
import { useAbility } from '@/hooks/usePermissions';

const ability = useAbility();

if (ability.can('manage', 'all')) {
	// Es administrador
}
```

---

## 🔒 Manejo de Errores HTTP

### **401 - No Autorizado (Token Expirado)**

1. httpClient detecta 401
2. Intenta renovar sesión con `checkAuth()`
3. Si falla:
    - Ejecuta `logout()`
    - Limpia `localStorage` y `sessionStorage`
    - Redirige a `/login`
4. Mensaje: "Sesión expirada. Por favor, inicia sesión nuevamente."

### **403 - Forbidden (Sin Permisos)**

1. httpClient detecta 403
2. Lanza error específico
3. Usuario permanece autenticado
4. Puede redirigir a `/unauthorized`
5. Mensaje: "No tienes permisos para realizar esta acción"

---

## ⚠️ IMPORTANTE: Permisos Condicionales

Para permisos con `conditions`, **SIEMPRE** pasar el objeto completo:

```typescript
// ❌ INCORRECTO - No puede validar conditions
ability.can('update', 'Course');

// ✅ CORRECTO - Valida course.teacherId
ability.can('update', 'Course', course);
```

**Ejemplo de regla condicional:**

```json
{
	"action": "update",
	"subject": "Course",
	"conditions": { "teacherId": 2 }
}
```

Significa: "Solo puede actualizar cursos donde `course.teacherId === 2`"

---

## 📝 Ejemplos de Uso del Backend

### **Ejemplo 1: Estudiante**

```json
{
	"user": {
		"userId": 5,
		"role": { "roleName": "Student" }
	},
	"abilities": [
		{ "action": "read", "subject": "Course" },
		{ "action": "read", "subject": "Material" },
		{
			"action": "read",
			"subject": "Grade",
			"conditions": { "studentId": 5 }
		}
	]
}
```

**Permisos:**

-   ✅ Ver todos los cursos
-   ✅ Ver materiales
-   ✅ Ver solo SUS calificaciones (studentId === 5)
-   ❌ No puede crear/editar/eliminar nada

### **Ejemplo 2: Profesor**

```json
{
	"user": {
		"userId": 3,
		"role": { "roleName": "Teacher" }
	},
	"abilities": [
		{ "action": "create", "subject": "Course" },
		{
			"action": "update",
			"subject": "Course",
			"conditions": { "teacherId": 3 }
		},
		{
			"action": "delete",
			"subject": "Course",
			"conditions": { "teacherId": 3 }
		},
		{ "action": "create", "subject": "Assignment" },
		{ "action": "update", "subject": "Grade" },
		{ "action": "read", "subject": "Student" }
	]
}
```

**Permisos:**

-   ✅ Crear cursos
-   ✅ Editar/eliminar solo SUS cursos (teacherId === 3)
-   ✅ Crear tareas
-   ✅ Actualizar calificaciones
-   ✅ Ver estudiantes
-   ❌ No puede editar cursos de otros profesores

### **Ejemplo 3: Administrador**

```json
{
	"user": {
		"userId": 1,
		"role": { "roleName": "Admin" }
	},
	"abilities": [{ "action": "manage", "subject": "all" }]
}
```

**Permisos:**

-   ✅ Permiso total sobre todos los recursos
-   ✅ Sin restricciones

---

## 🧪 Testing del Sistema

### 1. Verificar que el backend responde correctamente

```bash
# En terminal
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/v1/auth/me
```

### 2. Verificar en consola del navegador

```javascript
// Después de login
const store = useAuthStore.getState();
console.log('Usuario backend:', store.backendUser);
console.log('Ability:', store.ability);
console.log('¿Puede crear cursos?', store.ability.can('create', 'Course'));
```

### 3. Probar errores 401/403

```javascript
// Simular token expirado (en DevTools)
localStorage.clear();
// Hacer request → debe redirigir a login

// Simular sin permisos
// Intentar acción no permitida → debe mostrar error 403
```

---

## 📋 Checklist de Integración

### Backend

-   [ ] Endpoint `GET /api/v1/auth/me` implementado
-   [ ] Retorna `user` con `role: { roleName }`
-   [ ] Retorna `abilities` array con `action`, `subject`, `conditions`
-   [ ] Valida JWT token en header `Authorization: Bearer {token}`
-   [ ] CORS configurado para permitir `http://localhost:5173`
-   [ ] Retorna 401 si token inválido/expirado
-   [ ] Retorna 403 si sin permisos

### Frontend

-   [x] Dependencias instaladas (`@casl/ability`, `@casl/react`)
-   [x] `.env` configurado con `VITE_API_URL=http://localhost:3000/api/v1`
-   [x] authStore con `fetchUserPermissions()`
-   [x] Login llama `fetchUserPermissions()` después de autenticar
-   [x] httpClient maneja 401 y 403
-   [x] Componente `<Can>` creado
-   [x] Hooks de permisos creados
-   [x] Página `/unauthorized` creada
-   [ ] Probar con usuario real del backend

---

## 🔗 Archivos Importantes

| Archivo                       | Propósito                  |
| ----------------------------- | -------------------------- |
| `src/types/permissions.ts`    | Tipos TypeScript           |
| `src/services/authService.ts` | Llamada a `/auth/me`       |
| `src/lib/abilityBuilder.ts`   | Constructor de CASL        |
| `src/store/authStore.ts`      | Estado global con permisos |
| `src/components/Can.tsx`      | Componente de UI           |
| `src/hooks/usePermissions.ts` | Hooks personalizados       |
| `SECURITY.md`                 | Documentación completa     |
| `PERMISSIONS_EXAMPLES.tsx`    | 10 ejemplos prácticos      |

---

## 🎓 Próximos Pasos

1. **Levantar el backend** en `http://localhost:3000`
2. **Probar login** con usuario real
3. **Verificar** que `/api/v1/auth/me` retorne permisos
4. **Usar componente `<Can>`** en la UI
5. **Implementar menús dinámicos** según rol
6. **Personalizar dashboards** por tipo de usuario

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica que `.env` tenga la URL correcta
2. Revisa consola del navegador (errores 401/403)
3. Verifica que el backend esté corriendo
4. Comprueba que el token se envíe en headers
5. Revisa `SECURITY.md` para más detalles
6. Consulta `PERMISSIONS_EXAMPLES.tsx` para ejemplos

---

**🎉 Sistema completamente implementado y listo para usar!**
