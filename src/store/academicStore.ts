/**
 * Zustand Store - Estado Global de la Aplicación BioRepo
 */

import { create } from 'zustand';
import type {
	User,
	Program,
	Semester,
	Course,
	Block,
	LibraryFilters,
	MyCourseCard,
	NewsItem,
} from '@/types/academic';
import {
	mockPrograms,
	mockSemesters,
	mockCurrentUser,
	getMyCourses,
	getNewsItems,
	getCoursesByProgramAndSemester,
	getBlockById,
	getCourseById,
	getSemesterById,
	getProgramById,
} from '@/services/mockData';

interface AcademicState {
	// User State
	currentUser: User | null;
	isAuthenticated: boolean;

	// Data State
	programs: Program[];
	semesters: Semester[];
	courses: Course[];

	// Filters State
	libraryFilters: LibraryFilters;

	// Actions
	setUser: (user: User | null) => void;
	setAuthenticated: (isAuth: boolean) => void;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;

	// Data Actions
	loadPrograms: () => void;
	loadSemestersByProgram: (programId: string) => void;
	loadCoursesBySemester: (programId: string, semesterId: string) => void;

	// Filter Actions
	setLibraryFilters: (filters: LibraryFilters) => void;
	clearLibraryFilters: () => void;

	// View Helpers
	getMyCourses: () => MyCourseCard[];
	getNewsItems: () => NewsItem[];
	getCourseDetail: (blockId: string) => {
		block: Block | undefined;
		course: Course | undefined;
		semester: Semester | undefined;
		program: Program | undefined;
	};
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
	// Initial State
	currentUser: null,
	isAuthenticated: false, // Requiere login

	programs: [],
	semesters: [],
	courses: [],

	libraryFilters: {},

	// User Actions
	setUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),

	setAuthenticated: (isAuth) => {
		set({
			isAuthenticated: isAuth,
			currentUser: isAuth ? mockCurrentUser : null,
		});
	},

	login: async (email: string, _password: string) => {
		// Mock login - en producción esto llamaría a AWS Cognito
		await new Promise((resolve) => setTimeout(resolve, 500));

		if (email === mockCurrentUser.email) {
			set({
				currentUser: mockCurrentUser,
				isAuthenticated: true,
			});
		} else {
			throw new Error('Credenciales inválidas');
		}
	},

	logout: () => {
		set({
			currentUser: null,
			isAuthenticated: false,
			courses: [],
			semesters: [],
		});
	},

	// Data Actions
	loadPrograms: () => {
		set({ programs: mockPrograms });
	},

	loadSemestersByProgram: (programId: string) => {
		const semesters = mockSemesters.filter(
			(s) => s.programId === programId
		);
		set({ semesters });
	},

	loadCoursesBySemester: (programId: string, semesterId: string) => {
		const courses = getCoursesByProgramAndSemester(programId, semesterId);
		set({ courses });
	},

	// Filter Actions
	setLibraryFilters: (filters) => {
		set({ libraryFilters: { ...get().libraryFilters, ...filters } });
	},

	clearLibraryFilters: () => {
		set({ libraryFilters: {} });
	},

	// View Helpers
	getMyCourses: () => {
		const user = get().currentUser;
		if (!user) return [];
		return getMyCourses(user.id);
	},

	getNewsItems: () => {
		const user = get().currentUser;
		if (!user) return [];
		return getNewsItems(user.id);
	},

	getCourseDetail: (blockId: string) => {
		const block = getBlockById(blockId);
		const course = block ? getCourseById(block.courseId) : undefined;
		const semester = course
			? getSemesterById(course.semesterId)
			: undefined;
		const program = semester
			? getProgramById(semester.programId)
			: undefined;

		return { block, course, semester, program };
	},
}));
