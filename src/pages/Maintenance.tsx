/**
 * Página de Mantenimiento - Solo Administradores
 * CRUD completo para gestión académica
 */

import { useState } from 'react';
import { useHasRole, useCan } from '@/hooks/usePermissions';
import { Unauthorized } from '@/pages/Unauthorized';
import { Card } from '@/components/ui/card';
import { BookOpen, Calendar, Users, GraduationCap, Layers } from 'lucide-react';
import { CoursesManagement } from '@/components/maintenance/CoursesManagement';
import { SemestersManagement } from '@/components/maintenance/SemestersManagement';
import { EnrollmentsManagement } from '@/components/maintenance/EnrollmentsManagement';
import { TeachersManagement } from '@/components/maintenance/TeachersManagement';
import { ProgramsManagement } from '@/components/maintenance/ProgramsManagement';

type MaintenanceSection =
	| 'programs'
	| 'courses'
	| 'semesters'
	| 'enrollments'
	| 'teachers';

export function Maintenance() {
	const [activeSection, setActiveSection] =
		useState<MaintenanceSection>('programs');

	const isAdmin = useHasRole('Admin');
	const canManageAll = useCan('manage', 'all');
	const canAccess = isAdmin || canManageAll;

	if (!canAccess) {
		return <Unauthorized />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-primary/10 -mx-4 px-4 py-8 rounded-2xl border border-primary/20">
				<h1 className="text-4xl font-bold text-primary mb-2">
					Configuración del Sistema
				</h1>
				<p className="text-muted-foreground text-lg">
					Administra programas, cursos, semestres, matrículas y
					profesores
				</p>
			</div>

			{/* Layout con Sidebar */}
			<div className="grid grid-cols-12 gap-6">
				{/* Sidebar */}
				<aside className="col-span-12 md:col-span-3">
					<Card className="p-4 sticky top-24">
						<nav className="space-y-1">
							<button
								className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
									activeSection === 'programs'
										? 'bg-primary/10 text-primary'
										: 'hover:bg-muted'
								}`}
								onClick={() => setActiveSection('programs')}
							>
								<Layers className="w-4 h-4" /> Programas
							</button>
							<button
								className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
									activeSection === 'courses'
										? 'bg-primary/10 text-primary'
										: 'hover:bg-muted'
								}`}
								onClick={() => setActiveSection('courses')}
							>
								<BookOpen className="w-4 h-4" /> Cursos
							</button>
							<button
								className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
									activeSection === 'semesters'
										? 'bg-primary/10 text-primary'
										: 'hover:bg-muted'
								}`}
								onClick={() => setActiveSection('semesters')}
							>
								<Calendar className="w-4 h-4" /> Semestres
							</button>
							<button
								className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
									activeSection === 'enrollments'
										? 'bg-primary/10 text-primary'
										: 'hover:bg-muted'
								}`}
								onClick={() => setActiveSection('enrollments')}
							>
								<GraduationCap className="w-4 h-4" /> Matrículas
							</button>
							<button
								className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
									activeSection === 'teachers'
										? 'bg-primary/10 text-primary'
										: 'hover:bg-muted'
								}`}
								onClick={() => setActiveSection('teachers')}
							>
								<Users className="w-4 h-4" /> Profesores
							</button>
						</nav>
					</Card>
				</aside>

				{/* Contenido principal */}
				<section className="col-span-12 md:col-span-9">
					<Card className="p-6">
						{activeSection === 'programs' && <ProgramsManagement />}
						{activeSection === 'courses' && <CoursesManagement />}
						{activeSection === 'semesters' && (
							<SemestersManagement />
						)}
						{activeSection === 'enrollments' && (
							<EnrollmentsManagement />
						)}
						{activeSection === 'teachers' && <TeachersManagement />}
					</Card>
				</section>
			</div>
		</div>
	);
}
