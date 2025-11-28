# Backend API Requirements - Sistema de Mantenimiento

Este documento detalla todos los endpoints y DTOs necesarios para implementar el sistema de mantenimiento administrativo.

## 1. Gestión de Cursos (Courses)

### 1.1 Listar Todos los Cursos

```
GET /api/v1/courses
```

**Response DTO:**

```typescript
interface CourseListResponseDto {
	courses: CourseDto[];
	total: number;
}

interface CourseDto {
	courseId: number;
	courseCode: string; // Ej: "BIO101"
	courseName: string; // Ej: "Biología General"
	credits: number; // 1-10
	programId: number;
	programName: string; // Nombre del programa académico
	isActive: boolean;
	createdAt: string; // ISO 8601
	updatedAt: string; // ISO 8601
}
```

**Example Response:**

```json
{
	"courses": [
		{
			"courseId": 1,
			"courseCode": "BIO101",
			"courseName": "Biología General",
			"credits": 4,
			"programId": 1,
			"programName": "Biología",
			"isActive": true,
			"createdAt": "2024-01-15T10:00:00Z",
			"updatedAt": "2024-01-15T10:00:00Z"
		}
	],
	"total": 1
}
```

### 1.2 Crear Curso

```
POST /api/v1/courses
```

**Request DTO:**

```typescript
interface CreateCourseDto {
	courseCode: string; // Requerido, único
	courseName: string; // Requerido
	credits: number; // Requerido, 1-10
	programId: number; // Requerido
}
```

**Example Request:**

```json
{
	"courseCode": "QUI101",
	"courseName": "Química General",
	"credits": 4,
	"programId": 1
}
```

**Response:** `CourseDto` (igual que en listar)

### 1.3 Actualizar Curso

```
PUT /api/v1/courses/:courseId
```

**Request DTO:**

```typescript
interface UpdateCourseDto {
	courseCode?: string; // Opcional, único si se proporciona
	courseName?: string; // Opcional
	credits?: number; // Opcional, 1-10
	programId?: number; // Opcional
	isActive?: boolean; // Opcional
}
```

**Response:** `CourseDto`

### 1.4 Eliminar Curso

```
DELETE /api/v1/courses/:courseId
```

**Response:**

```typescript
interface DeleteResponseDto {
	success: boolean;
	message: string;
}
```

---

## 2. Gestión de Semestres (Semesters)

### 2.1 Listar Todos los Semestres

```
GET /api/v1/semesters
```

**Response DTO:**

```typescript
interface SemesterListResponseDto {
	semesters: SemesterDto[];
	total: number;
}

interface SemesterDto {
	semesterId: number;
	year: number; // Ej: 2024
	period: number; // 1 o 2
	name: string; // Auto-generado: "2024-1", "2024-2"
	startDate: string; // ISO 8601 date
	endDate: string; // ISO 8601 date
	isActive: boolean; // Solo un semestre puede estar activo
	createdAt: string;
	updatedAt: string;
}
```

**Example Response:**

```json
{
	"semesters": [
		{
			"semesterId": 1,
			"year": 2024,
			"period": 2,
			"name": "2024-2",
			"startDate": "2024-08-01",
			"endDate": "2024-12-20",
			"isActive": true,
			"createdAt": "2024-07-01T10:00:00Z",
			"updatedAt": "2024-07-01T10:00:00Z"
		}
	],
	"total": 1
}
```

### 2.2 Crear Semestre

```
POST /api/v1/semesters
```

**Request DTO:**

```typescript
interface CreateSemesterDto {
	year: number; // Requerido
	period: number; // Requerido, 1 o 2
	startDate: string; // Requerido, ISO 8601 date
	endDate: string; // Requerido, ISO 8601 date
}
```

**Validaciones:**

-   `period` debe ser 1 o 2
-   `endDate` debe ser posterior a `startDate`
-   El backend debe auto-generar `name` como `${year}-${period}`

**Response:** `SemesterDto`

### 2.3 Actualizar Semestre

```
PUT /api/v1/semesters/:semesterId
```

**Request DTO:**

```typescript
interface UpdateSemesterDto {
	year?: number; // Opcional
	period?: number; // Opcional, 1 o 2
	startDate?: string; // Opcional
	endDate?: string; // Opcional
	isActive?: boolean; // Opcional
}
```

**Nota:** Si `isActive: true`, el backend debe desactivar automáticamente otros semestres.

**Response:** `SemesterDto`

### 2.4 Eliminar Semestre

```
DELETE /api/v1/semesters/:semesterId
```

**Response:** `DeleteResponseDto`

---

## 3. Gestión de Matrículas (Enrollments)

### 3.1 Listar Todas las Matrículas

```
GET /api/v1/enrollments
```

**Query Parameters (opcionales):**

-   `semesterId`: Filtrar por semestre
-   `studentId`: Filtrar por estudiante
-   `status`: Filtrar por estado (active, dropped, completed)

**Response DTO:**

```typescript
interface EnrollmentListResponseDto {
	enrollments: EnrollmentDto[];
	total: number;
}

interface EnrollmentDto {
	enrollmentId: number;
	studentId: number;
	studentName: string; // Nombre completo del estudiante
	studentCode: string; // Código único del estudiante
	courseOfferingId: number; // ID de la oferta de curso (curso en semestre específico)
	courseName: string; // Nombre del curso
	courseCode: string; // Código del curso
	semesterName: string; // Ej: "2024-2"
	enrollmentDate: string; // ISO 8601
	status: 'active' | 'dropped' | 'completed';
	createdAt: string;
	updatedAt: string;
}
```

**Example Response:**

```json
{
	"enrollments": [
		{
			"enrollmentId": 1,
			"studentId": 1,
			"studentName": "Juan Pérez García",
			"studentCode": "20200001",
			"courseOfferingId": 1,
			"courseName": "Biología General",
			"courseCode": "BIO101",
			"semesterName": "2024-2",
			"enrollmentDate": "2024-08-01T10:00:00Z",
			"status": "active",
			"createdAt": "2024-08-01T10:00:00Z",
			"updatedAt": "2024-08-01T10:00:00Z"
		}
	],
	"total": 1
}
```

### 3.2 Crear Matrícula

```
POST /api/v1/enrollments
```

**Request DTO:**

```typescript
interface CreateEnrollmentDto {
	studentId: number; // Requerido
	courseOfferingId: number; // Requerido
}
```

**Validaciones:**

-   Verificar que el estudiante existe
-   Verificar que la oferta de curso existe y está activa
-   Verificar que el estudiante no esté ya matriculado en ese curso en ese semestre
-   Auto-asignar `status: 'active'` y `enrollmentDate` (fecha actual)

**Response:** `EnrollmentDto`

### 3.3 Eliminar Matrícula (Retirar Curso)

```
DELETE /api/v1/enrollments/:enrollmentId
```

**Alternative:** Puede cambiar el status a 'dropped' en lugar de eliminar:

```
PATCH /api/v1/enrollments/:enrollmentId/drop
```

**Response:** `DeleteResponseDto`

### 3.4 Obtener Estudiantes (Para Select)

```
GET /api/v1/students
```

**Response DTO:**

```typescript
interface StudentListDto {
	students: StudentBasicDto[];
	total: number;
}

interface StudentBasicDto {
	studentId: number;
	name: string; // Nombre completo
	code: string; // Código único
	email: string;
	programId: number;
	programName: string;
}
```

### 3.5 Obtener Ofertas de Curso (Para Select)

```
GET /api/v1/course-offerings
```

**Query Parameters:**

-   `semesterId` (opcional): Filtrar por semestre activo si no se especifica

**Response DTO:**

```typescript
interface CourseOfferingListDto {
	offerings: CourseOfferingBasicDto[];
	total: number;
}

interface CourseOfferingBasicDto {
	courseOfferingId: number;
	courseName: string;
	courseCode: string;
	semesterName: string; // Ej: "2024-2"
	section: string; // Ej: "A", "B"
	teacherName?: string; // Opcional si ya tiene docente asignado
	availableSeats: number; // Cupos disponibles
	totalSeats: number; // Cupos totales
}
```

---

## 4. Gestión de Asignación de Docentes (Teacher Assignments)

### 4.1 Listar Todas las Asignaciones

```
GET /api/v1/teacher-assignments
```

**Query Parameters (opcionales):**

-   `semesterId`: Filtrar por semestre
-   `teacherId`: Filtrar por docente

**Response DTO:**

```typescript
interface TeacherAssignmentListDto {
	assignments: TeacherAssignmentDto[];
	total: number;
}

interface TeacherAssignmentDto {
	assignmentId: number;
	teacherId: number;
	teacherName: string; // Nombre completo del docente
	teacherCode: string; // Código único del docente
	courseOfferingId: number;
	courseName: string;
	courseCode: string;
	semesterName: string; // Ej: "2024-2"
	section: string; // Ej: "A", "B"
	assignmentDate: string; // ISO 8601
	createdAt: string;
	updatedAt: string;
}
```

**Example Response:**

```json
{
	"assignments": [
		{
			"assignmentId": 1,
			"teacherId": 1,
			"teacherName": "Dr. Carlos Rodríguez",
			"teacherCode": "D001",
			"courseOfferingId": 1,
			"courseName": "Biología General",
			"courseCode": "BIO101",
			"semesterName": "2024-2",
			"section": "A",
			"assignmentDate": "2024-07-15T10:00:00Z",
			"createdAt": "2024-07-15T10:00:00Z",
			"updatedAt": "2024-07-15T10:00:00Z"
		}
	],
	"total": 1
}
```

### 4.2 Crear Asignación

```
POST /api/v1/teacher-assignments
```

**Request DTO:**

```typescript
interface CreateTeacherAssignmentDto {
	teacherId: number; // Requerido
	courseOfferingId: number; // Requerido
}
```

**Validaciones:**

-   Verificar que el docente existe y está activo
-   Verificar que la oferta de curso existe
-   Verificar que no haya otro docente ya asignado a esa sección
-   Auto-asignar `assignmentDate` (fecha actual)

**Response:** `TeacherAssignmentDto`

### 4.3 Eliminar Asignación

```
DELETE /api/v1/teacher-assignments/:assignmentId
```

**Response:** `DeleteResponseDto`

### 4.4 Obtener Docentes (Para Select)

```
GET /api/v1/teachers
```

**Response DTO:**

```typescript
interface TeacherListDto {
	teachers: TeacherBasicDto[];
	total: number;
}

interface TeacherBasicDto {
	teacherId: number;
	name: string; // Nombre completo
	code: string; // Código único
	email: string;
	departmentId?: number;
	departmentName?: string;
	isActive: boolean;
}
```

---

## 5. Endpoints Adicionales Útiles

### 5.1 Obtener Programas Académicos (Para Select en Cursos)

```
GET /api/v1/programs
```

**Response DTO:**

```typescript
interface ProgramListDto {
	programs: ProgramDto[];
	total: number;
}

interface ProgramDto {
	programId: number;
	programName: string; // Ej: "Biología", "Microbiología"
	programCode: string; // Ej: "BIO", "MICRO"
	facultyId: number;
	facultyName: string;
	isActive: boolean;
}
```

---

## 6. Permisos Requeridos

Todos estos endpoints deben estar protegidos y **solo accesibles para usuarios con rol Admin**:

```typescript
// Validación en backend
if (user.role.roleName !== 'Admin') {
	throw new ForbiddenException(
		'No tienes permisos para realizar esta acción'
	);
}
```

O usando CASL:

```typescript
// El usuario debe tener el permiso:
{
  action: 'manage',
  subject: 'all'
}
```

---

## 7. Estructura de Errores

**Error Response DTO:**

```typescript
interface ErrorResponseDto {
	statusCode: number;
	message: string | string[];
	error: string; // Ej: "Bad Request", "Forbidden"
	timestamp: string; // ISO 8601
	path: string; // Ruta del endpoint
}
```

**Códigos HTTP comunes:**

-   `200 OK`: Operación exitosa
-   `201 Created`: Recurso creado exitosamente
-   `400 Bad Request`: Datos de entrada inválidos
-   `401 Unauthorized`: No autenticado
-   `403 Forbidden`: No tiene permisos (no es Admin)
-   `404 Not Found`: Recurso no encontrado
-   `409 Conflict`: Conflicto (ej: código de curso duplicado)
-   `500 Internal Server Error`: Error del servidor

---

## 8. Resumen de Endpoints

| Método                  | Endpoint                          | Descripción                      |
| ----------------------- | --------------------------------- | -------------------------------- |
| **Cursos**              |
| GET                     | `/api/v1/courses`                 | Listar cursos                    |
| POST                    | `/api/v1/courses`                 | Crear curso                      |
| PUT                     | `/api/v1/courses/:id`             | Actualizar curso                 |
| DELETE                  | `/api/v1/courses/:id`             | Eliminar curso                   |
| **Semestres**           |
| GET                     | `/api/v1/semesters`               | Listar semestres                 |
| POST                    | `/api/v1/semesters`               | Crear semestre                   |
| PUT                     | `/api/v1/semesters/:id`           | Actualizar semestre              |
| DELETE                  | `/api/v1/semesters/:id`           | Eliminar semestre                |
| **Matrículas**          |
| GET                     | `/api/v1/enrollments`             | Listar matrículas                |
| POST                    | `/api/v1/enrollments`             | Crear matrícula                  |
| DELETE                  | `/api/v1/enrollments/:id`         | Eliminar matrícula               |
| GET                     | `/api/v1/students`                | Listar estudiantes (select)      |
| GET                     | `/api/v1/course-offerings`        | Listar ofertas de curso (select) |
| **Asignación Docentes** |
| GET                     | `/api/v1/teacher-assignments`     | Listar asignaciones              |
| POST                    | `/api/v1/teacher-assignments`     | Crear asignación                 |
| DELETE                  | `/api/v1/teacher-assignments/:id` | Eliminar asignación              |
| GET                     | `/api/v1/teachers`                | Listar docentes (select)         |
| **Datos Maestros**      |
| GET                     | `/api/v1/programs`                | Listar programas académicos      |

---

## 9. Notas Importantes

1. **Autenticación**: Todos los endpoints requieren el header `Authorization: Bearer <token>`

2. **Paginación** (opcional): Los endpoints GET pueden implementar paginación:

    ```
    GET /api/v1/courses?page=1&limit=10
    ```

3. **Búsqueda** (opcional): Implementar búsqueda con query parameter:

    ```
    GET /api/v1/courses?search=biologia
    ```

4. **Relaciones**:

    - Un `Course` pertenece a un `Program`
    - Un `CourseOffering` es un curso ofrecido en un semestre específico con sección
    - Un `Enrollment` relaciona un `Student` con un `CourseOffering`
    - Un `TeacherAssignment` relaciona un `Teacher` con un `CourseOffering`

5. **Cascada**: Considerar qué pasa al eliminar:

    - Si se elimina un `Course`, ¿qué pasa con sus `CourseOfferings`?
    - Si se elimina un `Semester`, ¿qué pasa con sus `CourseOfferings` y `Enrollments`?
    - Recomendación: Soft delete (marcar como inactivo) en lugar de eliminar físicamente

6. **Validaciones**:
    - Códigos de curso únicos
    - Solo un semestre activo a la vez
    - No permitir matrículas duplicadas
    - No permitir más de un docente por sección
    - Verificar cupos disponibles al matricular

---

## 10. Ejemplo de Flujo Completo

**Escenario**: Crear un nuevo curso y asignar docente

1. **Admin crea el curso**:

    ```
    POST /api/v1/courses
    {
      "courseCode": "FIS101",
      "courseName": "Física General",
      "credits": 5,
      "programId": 1
    }
    ```

2. **Backend crea `CourseOffering` automáticamente** (o admin lo hace manualmente):

    ```
    POST /api/v1/course-offerings
    {
      "courseId": 3,
      "semesterId": 2,
      "section": "A",
      "totalSeats": 30
    }
    ```

3. **Admin asigna docente**:

    ```
    POST /api/v1/teacher-assignments
    {
      "teacherId": 1,
      "courseOfferingId": 3
    }
    ```

4. **Admin matricula estudiantes**:
    ```
    POST /api/v1/enrollments
    {
      "studentId": 5,
      "courseOfferingId": 3
    }
    ```
