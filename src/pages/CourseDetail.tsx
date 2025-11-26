import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
	ArrowLeft,
	MapPin,
	Users,
	Clock,
	ExternalLink,
	Download,
} from 'lucide-react';
import { useAcademicStore } from '@/store/academicStoreNew';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMaterialIcon } from '@/lib/materialIcons';

export function CourseDetail() {
	const { blockId } = useParams<{ blockId: string }>();
	const getBlockDetail = useAcademicStore((state) => state.getBlockDetail);

	const blockData = useMemo(() => {
		if (!blockId) return null;
		return getBlockDetail(parseInt(blockId));
	}, [blockId, getBlockDetail]);

	if (!blockId) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">Bloque no encontrado</p>
				<Link
					to="/"
					className="text-primary hover:underline mt-4 inline-block"
				>
					Volver al Dashboard
				</Link>
			</div>
		);
	}

	if (!blockData) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">Cargando...</p>
			</div>
		);
	}

	const { block, course, semester, program, weeks, instructor } = blockData;

	if (!block || !course) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">Curso no encontrado</p>
				<Link
					to="/"
					className="text-primary hover:underline mt-4 inline-block"
				>
					Volver al Dashboard
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<div className="flex items-center gap-2 text-sm text-gray-600">
				<Link to="/" className="hover:text-primary transition-colors">
					<ArrowLeft className="h-4 w-4 inline mr-1" />
					Volver
				</Link>
				{program && semester && (
					<>
						<span>/</span>
						<span>{program.programName}</span>
						<span>/</span>
						<span>{semester.semesterName}</span>
					</>
				)}
			</div>

			{/* Header del Curso */}
			<Card>
				<CardContent className="pt-6">
					<div className="space-y-4">
						{/* Título y Código */}
						<div>
							<h1 className="text-3xl font-bold text-gray-900 mb-2">
								{course.courseName}
								<span className="text-xl font-normal text-gray-500 ml-2">
									|{' '}
									{block.blockType === 'THEORY'
										? 'Teoría'
										: 'Práctica'}
								</span>
							</h1>
							<div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
								{block.blockType === 'PRACTICE' && (
									<span className="font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
										{block.name}
									</span>
								)}
								<span className="text-gray-500">
									{course.credits} créditos
								</span>
							</div>
						</div>

						{/* Información del Bloque */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
							{instructor && (
								<div className="flex items-start gap-3">
									<div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
										<Users className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="text-xs text-gray-500">
											Docente
										</p>
										<p className="text-sm font-medium text-gray-900">
											{instructor.firstName}{' '}
											{instructor.lastName}
										</p>
									</div>
								</div>
							)}

							<div className="flex items-start gap-3">
								<div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
									<Clock className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="text-xs text-gray-500">
										Horario
									</p>
									<p className="text-sm font-medium text-gray-900">
										{block.blockType === 'THEORY'
											? 'Lun-Mié 10:00-12:00'
											: 'Mar-Jue 14:00-17:00'}
									</p>
								</div>
							</div>

							{block.classroomNumber && (
								<div className="flex items-start gap-3">
									<div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
										<MapPin className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="text-xs text-gray-500">
											Aula
										</p>
										<p className="text-sm font-medium text-gray-900">
											{block.classroomNumber}
										</p>
									</div>
								</div>
							)}
						</div>

						{course.description && (
							<div className="pt-4 border-t">
								<p className="text-sm text-gray-600">
									{course.description}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Accordion de Semanas */}
			<div className="space-y-4">
				<h2 className="text-2xl font-semibold text-gray-900">
					Contenido del Curso
				</h2>

				{weeks.length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center text-gray-500">
							<p>
								Aún no hay contenido disponible para este curso
							</p>
						</CardContent>
					</Card>
				) : (
					<Accordion type="single" collapsible className="space-y-2">
						{weeks.map((week) => (
							<AccordionItem
								key={week.weekId}
								value={week.weekId.toString()}
								className="border rounded-lg px-4 bg-white"
							>
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-4 text-left">
										<div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
											<span className="text-sm font-bold text-primary">
												{week.weekNumber}
											</span>
										</div>
										<div>
											<h3 className="font-semibold text-gray-900">
												Semana {week.weekNumber}
											</h3>
											{week.topicSummary && (
												<p className="text-sm text-gray-600 mt-1">
													{week.topicSummary}
												</p>
											)}
											<p className="text-xs text-gray-500 mt-1">
												{week.materials.length}{' '}
												material(es)
											</p>
										</div>
									</div>
								</AccordionTrigger>

								<AccordionContent>
									<div className="space-y-2 pt-4">
										{week.materials.length === 0 ? (
											<p className="text-sm text-gray-500 text-center py-4">
												No hay materiales disponibles
												para esta semana
											</p>
										) : (
											week.materials.map((material) => {
												const Icon = getMaterialIcon(
													material.materialType as any
												);
												return (
													<div
														key={
															material.materialId
														}
														className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
													>
														<div className="flex items-center gap-3 flex-1 min-w-0">
															<div className="flex-shrink-0 h-10 w-10 rounded-lg bg-white flex items-center justify-center">
																<Icon className="h-5 w-5 text-primary" />
															</div>
															<div className="flex-1 min-w-0">
																<h4 className="text-sm font-medium text-gray-900 truncate">
																	{
																		material.title
																	}
																</h4>
																{material.fileResource && (
																	<div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
																		<span>
																			{
																				material
																					.fileResource
																					.fileName
																			}
																		</span>
																		<span>
																			•
																		</span>
																		<span>
																			{(
																				material
																					.fileResource
																					.sizeBytes /
																				1024 /
																				1024
																			).toFixed(
																				2
																			)}{' '}
																			MB
																		</span>
																	</div>
																)}
															</div>
														</div>

														<div className="flex gap-2 ml-4">
															{material.externalLinkUrl && (
																<Button
																	size="sm"
																	variant="outline"
																	asChild
																>
																	<a
																		href={
																			material.externalLinkUrl
																		}
																		target="_blank"
																		rel="noopener noreferrer"
																	>
																		<ExternalLink className="h-4 w-4" />
																	</a>
																</Button>
															)}
															{material.fileResource &&
																material
																	.fileResource
																	.publicUrl && (
																	<Button
																		size="sm"
																		variant="outline"
																		asChild
																	>
																		<a
																			href={
																				material
																					.fileResource
																					.publicUrl
																			}
																			download
																		>
																			<Download className="h-4 w-4" />
																		</a>
																	</Button>
																)}
														</div>
													</div>
												);
											})
										)}
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				)}
			</div>
		</div>
	);
}
