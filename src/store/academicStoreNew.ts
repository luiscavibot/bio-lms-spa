/**
 * Zustand Store - Compatible con ERD Refactorizado
 * Estado Global de la Aplicación BioRepo
 */

import { create } from 'zustand';
import type {
	User,
	Faculty,
	Program,
	Course,
	Semester,
	CourseOffering,
	Block,
	LibraryFilters,
	MyCourseCard,
	NewsItem,
	BlockDetail,
} from '@/types/academic-new';
import {
	mockFaculty,
	mockPrograms,
	mockCourses,
	mockSemesters,
	mockCourseOfferings,
	mockBlocks,
	mockCurrentUser,
	getMyCourses,
	getNewsItems,
	getBlockDetail,
	getCourseOfferingsByFilters,
} from '@/services/mockDataNew';

interface AcademicState {
	// User State
	currentUser: User | null;
	isAuthenticated: boolean;

	// Data State
	faculty: Faculty | null;
	programs: Program[];
	courses: Course[];
	semesters: Semester[];
	courseOfferings: CourseOffering[];
	blocks: Block[];

	// Filters State
	libraryFilters: LibraryFilters;

	// Actions - Auth
	setUser: (user: User | null) => void;
	setAuthenticated: (isAuth: boolean) => void;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;

	// Actions - Data Loading
	loadFaculty: () => void;
	loadPrograms: (facultyId?: number) => void;
	loadSemesters: () => void;
	loadCourseOfferingsByFilters: (
		facultyId?: number,
		programId?: number,
		semesterId?: number
	) => void;
	loadBlocksByOffering: (courseOfferingId: number) => void;

	// Actions - Filters
	setLibraryFilters: (filters: LibraryFilters) => void;
	clearLibraryFilters: () => void;

	// Helpers - Views
	getMyCourses: () => MyCourseCard[];
	getNewsItems: () => NewsItem[];
	getBlockDetail: (blockId: number) => BlockDetail | null;
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
	// Initial State
	currentUser: null,
	isAuthenticated: false,

	faculty: null,
	programs: [],
	courses: [],
	semesters: [],
	courseOfferings: [],
	blocks: [],

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
			courseOfferings: [],
			blocks: [],
		});
	},

	// Data Actions
	loadFaculty: () => {
		set({ faculty: mockFaculty });
	},

	loadPrograms: (facultyId?: number) => {
		const programs = facultyId
			? mockPrograms.filter((p) => p.facultyId === facultyId)
			: mockPrograms;
		set({ programs });
	},

	loadSemesters: () => {
		set({ semesters: mockSemesters });
	},

	loadCourseOfferingsByFilters: (
		facultyId?: number,
		programId?: number,
		semesterId?: number
	) => {
		const offerings = getCourseOfferingsByFilters(
			facultyId,
			programId,
			semesterId
		);
		set({ courseOfferings: offerings });
	},

	loadBlocksByOffering: (courseOfferingId: number) => {
		const blocks = mockBlocks.filter(
			(b) => b.courseOfferingId === courseOfferingId
		);
		set({ blocks });
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
		return getMyCourses(user.userId);
	},

	getNewsItems: () => {
		const user = get().currentUser;
		if (!user) return [];
		return getNewsItems(user.userId);
	},

	getBlockDetail: (blockId: number) => {
		return getBlockDetail(blockId);
	},
}));
