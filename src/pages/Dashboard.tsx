import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { useAcademicStore } from '@/store/academicStoreNew';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { getMaterialIcon } from '@/lib/materialIcons';
import { useMemo } from 'react';

export function Dashboard() {
	const getMyCourses = useAcademicStore((state) => state.getMyCourses);
	const getNewsItems = useAcademicStore((state) => state.getNewsItems);

	const myCourses = useMemo(() => getMyCourses(), [getMyCourses]);
	const newsItems = useMemo(() => getNewsItems(), [getNewsItems]);

	return (
		<div className="space-y-8">
			{/* Hero Section */}
			<section className="bg-primary/10 -mx-4 px-4 py-8 rounded-2xl border border-primary/20">
				<h1 className="text-4xl font-bold text-primary mb-2">
					Mi Dashboard
				</h1>
				<p className="text-muted-foreground text-lg">
					Bienvenido a tu espacio académico personal
				</p>
			</section>

			{/* Mis Cursos */}
			<section>
				<h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
					<div className="w-1 h-8 bg-primary rounded-full"></div>
					Mis Cursos
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{myCourses.map((course) => (
						<Card
							key={course.enrollmentId}
							className="hover:shadow-lg hover:border-primary/40 transition-all duration-200 h-full border-primary/10 bg-card"
						>
							<CardHeader>
								<CardTitle className="text-lg text-primary">
									{course.courseName}
								</CardTitle>
								<CardDescription className="font-medium">
									{course.programName}
								</CardDescription>
								<p className="text-xs text-muted-foreground">
									{course.semesterName}
								</p>
							</CardHeader>
							<CardContent className="space-y-2">
								{course.finalAverage && (
									<p className="text-sm text-gray-600">
										<strong>Promedio:</strong>{' '}
										{course.finalAverage.toFixed(1)}
									</p>
								)}
								{course.lastUpdate && (
									<p className="text-xs text-gray-500 flex items-center gap-2 mt-2">
										<Calendar className="h-3 w-3" />
										Última actualización:{' '}
										{course.lastUpdate.toLocaleDateString(
											'es-PE'
										)}
									</p>
								)}
								<div className="flex flex-wrap gap-2 mt-3">
									{course.blocks.map((block) => (
										<Link
											key={block.blockId}
											to={`/block/${block.blockId}`}
										>
											<button className="text-xs px-3 py-1 bg-primary/5 hover:bg-primary/10 text-primary rounded-md transition-colors border border-primary/20">
												{block.blockName}
											</button>
										</Link>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* Novedades */}
			<section>
				<h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
					<div className="w-1 h-8 bg-accent rounded-full"></div>
					Novedades
				</h2>
				<Card className="border-primary/10 shadow-md">
					<CardContent className="p-0">
						<div className="divide-y divide-primary/10">
							{newsItems.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">
									No hay novedades recientes
								</div>
							) : (
								newsItems.map((item) => {
									const Icon = getMaterialIcon(
										item.materialType as any
									);
									return (
										<div
											key={item.materialId}
											className="p-5 hover:bg-primary/5 transition-colors duration-200 cursor-pointer group"
										>
											<div className="flex items-start gap-4">
												<div className="flex-shrink-0">
													<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
														<Icon className="h-6 w-6 text-primary" />
													</div>
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
														{item.materialTitle}
													</h3>
													<p className="text-sm text-muted-foreground mt-1">
														{item.courseName} •{' '}
														{item.blockName}
													</p>
													<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
														<span className="flex items-center gap-1">
															<Clock className="h-3 w-3" />
															{
																item.uploadedByName
															}
														</span>
														<span>•</span>
														<span className="flex items-center gap-1">
															<Calendar className="h-3 w-3" />
															{item.uploadDate.toLocaleDateString(
																'es-PE'
															)}
														</span>
													</div>
												</div>
											</div>
										</div>
									);
								})
							)}
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
