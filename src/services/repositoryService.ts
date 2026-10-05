import { httpClient } from "@/lib/httpClient";

const API = "/api/v1";

export type AcademicLevel = "UNDERGRADUATE" | "POSTGRADUATE";
export type BlockType = "THEORY" | "PRACTICE";
export type MaterialCategory =
  | "EXTERNAL_LINK"
  | "PRACTICE_FILE"
  | "CLASS_SLIDES"
  | "ASSIGNMENT_FILE"
  | "ANNOUNCEMENT_FILE";
/** Categories a person can choose when adding a material by hand. */
export type UploadableMaterialCategory = "PRACTICE_FILE" | "CLASS_SLIDES";
export type LinkMaterialSubtype = "VIDEO" | "ARTICLE" | "THESIS" | "WEBSITE";

export interface OfferingBlock {
  blockId: number;
  name: string;
  blockType: BlockType;
  maxCapacity: number;
  teacherId?: number;
  teacherName?: string;
  assignedStudentCount: number;
  hasSyllabus: boolean;
  canManage: boolean;
}

export interface Offering {
  offeringId: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  description?: string;
  credits: number;
  programId: number;
  programName: string;
  planId: number;
  planCode: string;
  academicLevel: AcademicLevel;
  degreeType: string;
  semesterId: number;
  semesterName: string;
  startDate: string;
  endDate: string;
  teacherId?: number;
  teacherName?: string;
  /** Authors of its materials, shown while no teacher is assigned. */
  authors: string[];
  status: string;
  totalSeats: number;
  enrolledCount: number;
  availableSeats: number;
  blocks: OfferingBlock[];
}

// A type alias, not an interface, so it can be passed as query-string parameters.
export type OfferingFilters = {
  search?: string;
  courseId?: number;
  programId?: number;
  planId?: number;
  semesterId?: number;
  academicLevel?: AcademicLevel;
};

export interface OfferingFacets {
  academicLevels: AcademicLevel[];
  programIds: number[];
  semesterIds: number[];
  planIds: number[];
}

/** A subject of the curriculum; it is taught in one offering per semester. */
export interface Course {
  courseId: number;
  courseCode: string;
  courseName: string;
  credits: number;
  programId: number;
  programName: string;
  planId: number;
  planCode: string;
  academicLevel: AcademicLevel;
  description?: string;
  isActive: boolean;
  offeringCount: number;
}

export interface Program {
  programId: number;
  programName: string;
  programCode: string;
  facultyId: number;
  facultyName: string;
  academicLevel: AcademicLevel;
  degreeType: "BACHELOR" | "MASTER" | "DOCTORATE" | "DIPLOMA";
  isActive: boolean;
}

export interface CurriculumPlan {
  planId: number;
  planCode: string;
  isActive: boolean;
  courseCount: number;
}

export interface Semester {
  semesterId: number;
  semesterName: string;
  year: number;
  period: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Teacher {
  userId: number;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  code?: string;
  authProvider: "AWS_COGNITO" | "AUTH0" | "LOCAL";
}

export type Student = Teacher;

export interface Enrollment {
  enrollmentId: number;
  userId: number;
  studentName: string;
  studentCode: string;
  courseOfferingId: number;
  courseName: string;
  courseCode: string;
  semesterName: string;
  enrollmentDate: string;
  status: "ACTIVE" | "COMPLETED" | "DROPPED" | "WITHDRAWN";
  practiceBlockId?: number;
  practiceBlockName?: string;
}

export interface BlockConfigurationItem {
  blockId: number;
  name: string;
  blockType: BlockType;
  maxCapacity: number;
  teacherId?: number;
  teacherName?: string;
  assignedStudentCount: number;
}

export interface CourseBlockConfiguration {
  courseOfferingId: number;
  courseName: string;
  courseCode: string;
  semesterName: string;
  principalTeacherId?: number;
  principalTeacherName?: string;
  blocks: BlockConfigurationItem[];
}

export interface FileResource {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Material {
  id: number;
  title: string;
  materialType: "FILE" | "LINK";
  materialCategory: MaterialCategory;
  linkSubtype?: LinkMaterialSubtype;
  externalLinkUrl?: string;
  createdAt: string;
  fileResource?: FileResource;
  uploadedBy?: { firstName: string; lastName: string };
  /** Text that accompanied the material. */
  description?: string | null;
  /** Who published it originally (informative; grants no access). */
  authorName?: string | null;
}

export interface Week {
  id: number;
  weekNumber: number;
  topicSummary?: string;
  blockId: number;
  weekStartDate: string;
  weekEndDate: string;
  isLocked: boolean;
  canManage: boolean;
  materials: Material[];
}

function queryString(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.size ? `?${params.toString()}` : "";
}

export const repositoryService = {
  getOfferings(filters: OfferingFilters & { page?: number; limit?: number } = {}) {
    return httpClient.get<{ offerings: Offering[]; total: number }>(
      `${API}/course-offerings${queryString(filters)}`,
    );
  },
  /** Filter values that still yield courses; each list ignores its own filter. */
  getOfferingFacets(filters: OfferingFilters = {}) {
    return httpClient.get<OfferingFacets>(
      `${API}/course-offerings/facets${queryString(filters)}`,
    );
  },
  getSyllabusAccess(blockId: number) {
    return httpClient.get<{ url: string; expiresIn?: number }>(
      `${API}/blocks/${blockId}/syllabus/access`,
    );
  },
  getOffering(id: number) {
    return httpClient.get<Offering>(`${API}/course-offerings/${id}`);
  },
  /** New offering (a course taught in one semester) of an existing course. */
  createOffering(data: {
    courseId: number;
    semesterId: number;
    teacherId?: number;
    practiceBlockCount: number;
    startDate: string;
    endDate: string;
  }) {
    return httpClient.post<Offering>(`${API}/course-offerings`, data);
  },
  getCourses(
    filters: {
      search?: string;
      programId?: number;
      planId?: number;
      academicLevel?: AcademicLevel;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return httpClient.get<{ courses: Course[]; total: number }>(
      `${API}/courses${queryString(filters)}`,
    );
  },
  createCourse(data: {
    courseName: string;
    courseCode?: string;
    description?: string;
    credits: number;
    programId: number;
    planId: number;
  }) {
    return httpClient.post<Course>(`${API}/courses`, data);
  },
  deleteOffering(id: number) {
    return httpClient.delete<void>(`${API}/course-offerings/${id}`);
  },
  updateCourse(
    id: number,
    data: {
      courseName: string;
      courseCode: string;
      description: string;
      credits: number;
      programId: number;
      planId: number;
    },
  ) {
    return httpClient.put(`${API}/courses/${id}`, data);
  },
  updateOfferingSchedule(
    id: number,
    data: { startDate: string; endDate: string },
  ) {
    return httpClient.patch<Offering>(
      `${API}/course-offerings/${id}/schedule`,
      data,
    );
  },
  deleteCourse(id: number) {
    return httpClient.delete(`${API}/courses/${id}`);
  },
  getCurriculumPlans() {
    return httpClient.get<{ plans: CurriculumPlan[]; total: number }>(
      `${API}/curriculum-plans`,
    );
  },
  createCurriculumPlan(data: { planCode: string }) {
    return httpClient.post<CurriculumPlan>(`${API}/curriculum-plans`, data);
  },
  updateCurriculumPlan(
    id: number,
    data: { planCode: string; isActive: boolean },
  ) {
    return httpClient.put<CurriculumPlan>(`${API}/curriculum-plans/${id}`, data);
  },
  deleteCurriculumPlan(id: number) {
    return httpClient.delete<void>(`${API}/curriculum-plans/${id}`);
  },
  getPrograms() {
    return httpClient.get<{ programs: Program[]; total: number }>(
      `${API}/programs`,
    );
  },
  createProgram(data: {
    programName: string;
    programCode: string;
    facultyId: number;
    academicLevel: AcademicLevel;
    degreeType: Program["degreeType"];
  }) {
    return httpClient.post<Program>(`${API}/programs`, data);
  },
  updateProgram(
    id: number,
    data: {
      programName: string;
      programCode: string;
      academicLevel: AcademicLevel;
      degreeType: Program["degreeType"];
    },
  ) {
    return httpClient.put<Program>(`${API}/programs/${id}`, data);
  },
  deleteProgram(id: number) {
    return httpClient.delete<void>(`${API}/programs/${id}`);
  },
  getFaculties() {
    return httpClient.get<{ faculties: { id: number; facultyName: string }[] }>(
      `${API}/faculties`,
    );
  },
  getSemesters() {
    return httpClient.get<{ semesters: Semester[]; total: number }>(
      `${API}/semesters`,
    );
  },
  createSemester(data: {
    year: number;
    period: number;
    startDate: string;
    endDate: string;
  }) {
    return httpClient.post<Semester>(`${API}/semesters`, data);
  },
  updateSemester(
    id: number,
    data: {
      year: number;
      period: number;
      startDate: string;
      endDate: string;
    },
  ) {
    return httpClient.put<Semester>(`${API}/semesters/${id}`, data);
  },
  deleteSemester(id: number) {
    return httpClient.delete<void>(`${API}/semesters/${id}`);
  },
  getTeachers() {
    return httpClient.get<{ users: Teacher[]; total: number }>(
      `${API}/users/teachers/list`,
    );
  },
  createTeacher(data: {
    email: string;
    name: string;
    familyName: string;
    temporaryPassword: string;
  }) {
    return httpClient.post(`${API}/auth/cognito/create-user`, {
      email: data.email,
      userGroup: "Teacher",
      name: data.name,
      family_name: data.familyName,
      temporaryPassword: data.temporaryPassword,
      sendWelcomeEmail: true,
    });
  },
  updateTeacher(id: number, data: { firstName: string; lastName: string }) {
    return httpClient.patch(`${API}/users/${id}`, data);
  },
  deleteTeacher(email: string) {
    return httpClient.deleteWithBody(`${API}/auth/cognito/delete-user`, {
      email,
    });
  },
  resendTeacherInvitation(email: string) {
    return httpClient.post(`${API}/auth/cognito/resend-invitation`, { email });
  },
  resetTeacherTemporaryPassword(email: string, temporaryPassword: string) {
    return httpClient.post<{
      message: string;
      email: string;
      accountProvisioned: boolean;
    }>(`${API}/auth/cognito/reset-temporary-password`, {
      email,
      temporaryPassword,
    });
  },
  getStudents() {
    return httpClient.get<{ users: Student[]; total: number }>(
      `${API}/users/students/list`,
    );
  },
  createStudent(data: {
    email: string;
    name: string;
    familyName: string;
    temporaryPassword: string;
  }) {
    return httpClient.post(`${API}/auth/cognito/create-user`, {
      email: data.email,
      userGroup: "Student",
      name: data.name,
      family_name: data.familyName,
      temporaryPassword: data.temporaryPassword,
      sendWelcomeEmail: true,
    });
  },
  updateStudent(id: number, data: { firstName: string; lastName: string }) {
    return httpClient.patch(`${API}/users/${id}`, data);
  },
  deleteStudent(email: string) {
    return httpClient.deleteWithBody(`${API}/auth/cognito/delete-user`, {
      email,
    });
  },
  resendStudentInvitation(email: string) {
    return httpClient.post(`${API}/auth/cognito/resend-invitation`, { email });
  },
  resetStudentTemporaryPassword(email: string, temporaryPassword: string) {
    return httpClient.post<{
      message: string;
      email: string;
      accountProvisioned: boolean;
    }>(`${API}/auth/cognito/reset-temporary-password`, {
      email,
      temporaryPassword,
    });
  },
  getEnrollments(
    filters: {
      semesterId?: number;
      userId?: number;
      courseOfferingId?: number;
    } = {},
  ) {
    return httpClient.get<{ enrollments: Enrollment[]; total: number }>(
      `${API}/enrollments${queryString(filters)}`,
    );
  },
  createEnrollment(data: { userId: number; courseOfferingId: number }) {
    return httpClient.post<Enrollment>(`${API}/enrollments`, data);
  },
  deleteEnrollment(id: number) {
    return httpClient.delete(`${API}/enrollments/${id}`);
  },
  assignEnrollmentPracticeBlock(id: number, blockId: number | null) {
    return httpClient.put<Enrollment>(`${API}/enrollments/${id}/practice-block`, {
      blockId,
    });
  },
  getBlockConfiguration(courseOfferingId: number) {
    return httpClient.get<CourseBlockConfiguration>(
      `${API}/blocks/configuration/${courseOfferingId}`,
    );
  },
  assignPrincipalTeacher(courseOfferingId: number, teacherId: number) {
    return httpClient.put<CourseBlockConfiguration>(
      `${API}/blocks/course-offerings/${courseOfferingId}/principal`,
      { teacherId },
    );
  },
  createPracticeBlock(data: {
    courseOfferingId: number;
    maxCapacity: number;
    teacherId?: number;
  }) {
    return httpClient.post<CourseBlockConfiguration>(`${API}/blocks/practice`, data);
  },
  updatePracticeBlock(
    id: number,
    data: { name: string; maxCapacity: number; teacherId: number | null },
  ) {
    return httpClient.patch<CourseBlockConfiguration>(`${API}/blocks/${id}`, data);
  },
  deletePracticeBlock(id: number) {
    return httpClient.delete<CourseBlockConfiguration>(`${API}/blocks/${id}`);
  },
  getWeeks(blockId: number) {
    return httpClient.get<Week[]>(`${API}/weeks?blockId=${blockId}`);
  },
  createWeek(data: {
    blockId: number;
    weekNumber: number;
    topicSummary?: string;
  }) {
    return httpClient.post<Week>(`${API}/weeks`, data);
  },
  updateWeek(id: number, data: { topicSummary?: string }) {
    return httpClient.patch<Week>(`${API}/weeks/${id}`, data);
  },
  deleteWeek(id: number) {
    return httpClient.delete<void>(`${API}/weeks/${id}`);
  },
  createLink(data: {
    weekId: number;
    title: string;
    externalLinkUrl: string;
    linkSubtype: LinkMaterialSubtype;
    description?: string;
  }) {
    return httpClient.post<Material>(`${API}/materials/link`, data);
  },
  uploadMaterial(data: {
    weekId: number;
    title: string;
    materialCategory: UploadableMaterialCategory;
    file: File;
    description?: string;
  }) {
    const form = new FormData();
    form.append("weekId", String(data.weekId));
    form.append("title", data.title);
    form.append("materialCategory", data.materialCategory);
    if (data.description) form.append("description", data.description);
    form.append("file", data.file);
    return httpClient.uploadForm<Material>(`${API}/materials/upload`, form);
  },
  updateMaterial(
    id: number,
    data: {
      title?: string;
      externalLinkUrl?: string;
      linkSubtype?: LinkMaterialSubtype;
      description?: string;
    },
  ) {
    return httpClient.patch<Material>(`${API}/materials/${id}`, data);
  },
  deleteMaterial(id: number) {
    return httpClient.delete<void>(`${API}/materials/${id}`);
  },
  getMaterialAccess(id: number) {
    return httpClient.get<{ url: string; expiresIn?: number }>(
      `${API}/materials/${id}/access`,
    );
  },
};
