import {
	FileText,
	Video,
	Presentation,
	File,
	Link as LinkIcon,
	FileQuestion,
	type LucideIcon,
} from 'lucide-react';
import type { MaterialType } from '@/types/academic';

export function getMaterialIcon(type: MaterialType): LucideIcon {
	switch (type) {
		case 'pdf':
			return FileText;
		case 'video':
			return Video;
		case 'presentation':
			return Presentation;
		case 'document':
			return File;
		case 'link':
			return LinkIcon;
		default:
			return FileQuestion;
	}
}
