import { httpClient } from "@/lib/httpClient";

const API = "/api/v1";

export type AcademicLevel = "UNDERGRADUATE" | "POSTGRADUATE";
export type BlockType = "THEORY" | "PRACTICE";
export type MaterialCategory =
  "EXTERNAL_LINK" | "PRACTICE_FILE" | "CLASS_SLIDES";

export interface OfferingBlock {
  blockId: number;
  name: string;
  blockType: BlockType;
  maxCapacity: number;
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
  academicLevel: AcademicLevel;
  degreeType: string;
  semesterId: number;
  semesterName: string;
  teacherId?: number;
  teacherName?: string;
  status: string;
  totalSeats: number;
  enrolledCount: number;
  availableSeats: number;
  blocks: OfferingBlock[];
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

export interface Semester {
  semesterId: number;
  semesterName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Teacher {
  userId: number;
  fullName: string;
  email: string;
  code?: string;
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
  externalLinkUrl?: string;
  createdAt: string;
  fileResource?: FileResource;
  uploadedBy?: { firstName: string; lastName: string };
}

export interface Week {
  id: number;
  weekNumber: number;
  topicSummary?: string;
  blockId: number;
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
  getOfferings(
    filters: {
      search?: string;
      programId?: number;
      semesterId?: number;
      academicLevel?: AcademicLevel;
    } = {},
  ) {
    return httpClient.get<{ offerings: Offering[]; total: number }>(
      `${API}/course-offerings${queryString(filters)}`,
    );
  },
  getOffering(id: number) {
    return httpClient.get<Offering>(`${API}/course-offerings/${id}`);
  },
  createOffering(data: {
    courseName: string;
    courseCode?: string;
    description?: string;
    credits?: number;
    programId: number;
    semesterId: number;
    teacherId?: number;
    blockTypes: BlockType[];
  }) {
    return httpClient.post<Offering>(
      `${API}/course-offerings/with-structure`,
      data,
    );
  },
  deleteOffering(id: number) {
    return httpClient.delete<void>(`${API}/course-offerings/${id}`);
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
  resendTeacherInvitation(email: string) {
    return httpClient.post(`${API}/auth/cognito/resend-invitation`, { email });
  },
  resetTeacherTemporaryPassword(email: string, temporaryPassword: string) {
    return httpClient.post(`${API}/auth/cognito/reset-temporary-password`, {
      email,
      temporaryPassword,
    });
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
  createLink(data: { weekId: number; title: string; externalLinkUrl: string }) {
    return httpClient.post<Material>(`${API}/materials/link`, data);
  },
  uploadMaterial(data: {
    weekId: number;
    title: string;
    materialCategory: Exclude<MaterialCategory, "EXTERNAL_LINK">;
    file: File;
  }) {
    const form = new FormData();
    form.append("weekId", String(data.weekId));
    form.append("title", data.title);
    form.append("materialCategory", data.materialCategory);
    form.append("file", data.file);
    return httpClient.uploadForm<Material>(`${API}/materials/upload`, form);
  },
  updateMaterial(
    id: number,
    data: { title?: string; externalLinkUrl?: string },
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
