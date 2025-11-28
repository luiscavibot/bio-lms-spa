/**
 * Página de Mantenimiento - Solo Administradores
 * CRUD completo para gestión académica
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { BookOpen, Calendar, Users, GraduationCap } from 'lucide-react';
import { CoursesManagement } from '@/components/maintenance/CoursesManagement';
import { SemestersManagement } from '@/components/maintenance/SemestersManagement';
import { EnrollmentsManagement } from '@/components/maintenance/EnrollmentsManagement';
import { TeachersManagement } from '@/components/maintenance/TeachersManagement';

export function Maintenance() {
	const [activeTab, setActiveTab] = useState('courses');

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-primary/10 -mx-4 px-4 py-8 rounded-2xl border border-primary/20">
				<h1 className="text-4xl font-bold text-primary mb-2">
					Mantenimiento del Sistema
				</h1>
				<p className="text-muted-foreground text-lg">
					Gestión completa de cursos, semestres, matrículas y
					profesores
				</p>
			</div>

			{/* Tabs de Gestión */}
			<Card className="p-6">
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-4 mb-6">
						<TabsTrigger
							value="courses"
							className="flex items-center gap-2"
						>
							<BookOpen className="w-4 h-4" />
							Cursos
						</TabsTrigger>
						<TabsTrigger
							value="semesters"
							className="flex items-center gap-2"
						>
							<Calendar className="w-4 h-4" />
							Semestres
						</TabsTrigger>
						<TabsTrigger
							value="enrollments"
							className="flex items-center gap-2"
						>
							<GraduationCap className="w-4 h-4" />
							Matrículas
						</TabsTrigger>
						<TabsTrigger
							value="teachers"
							className="flex items-center gap-2"
						>
							<Users className="w-4 h-4" />
							Profesores
						</TabsTrigger>
					</TabsList>

					<TabsContent value="courses" className="space-y-4">
						<CoursesManagement />
					</TabsContent>

					<TabsContent value="semesters" className="space-y-4">
						<SemestersManagement />
					</TabsContent>

					<TabsContent value="enrollments" className="space-y-4">
						<EnrollmentsManagement />
					</TabsContent>

					<TabsContent value="teachers" className="space-y-4">
						<TeachersManagement />
					</TabsContent>
				</Tabs>
			</Card>
		</div>
	);
}
