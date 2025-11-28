import {
	FileText,
	Link as LinkIcon,
	FileQuestion,
	type LucideIcon,
} from 'lucide-react';
import type { MaterialTypeValue } from '@/types/academic-new';

export function getMaterialIcon(type: MaterialTypeValue): LucideIcon {
	switch (type) {
		case 'FILE':
			return FileText;
		case 'LINK':
			return LinkIcon;
		default:
			return FileQuestion;
	}
}
