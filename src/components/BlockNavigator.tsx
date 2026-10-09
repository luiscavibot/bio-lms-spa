import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOCK_TYPE_LABEL, BLOCK_TYPES } from "@/lib/blocks";
import type { OfferingBlock } from "@/services/repositoryService";

// Utility classes, so they replace the Select defaults instead of losing to them.
const TRIGGER =
  "h-10 w-full self-end rounded-lg border-slate-300 bg-white px-3 text-left font-medium text-slate-800 shadow-sm transition-colors hover:border-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 sm:w-80 [&>svg]:text-slate-500 [&>svg]:opacity-100";
const LIST = "max-h-80 rounded-lg border-slate-200 bg-white p-1 text-slate-800 shadow-lg";
const OPTION =
  "cursor-pointer rounded-md py-2 pl-8 pr-3 text-slate-700 focus:bg-emerald-50 focus:text-emerald-900 data-[state=checked]:font-semibold data-[state=checked]:text-emerald-900 [&_svg]:text-emerald-700";

/**
 * Chooses a block of an offering: one tab per type present (with how many blocks it has) and,
 * below, a list of that type's blocks by their full name. Hidden when the offering has a
 * single block.
 */
export function BlockNavigator({
  blocks,
  selectedId,
  onSelect,
}: {
  blocks: OfferingBlock[];
  selectedId?: number;
  onSelect: (blockId: number) => void;
}) {
  const selected = blocks.find((block) => block.blockId === selectedId) ?? blocks[0];
  const types = BLOCK_TYPES.filter((type) => blocks.some((block) => block.blockType === type));
  // Blocks of the selected type, in the server's order (section, then group).
  const sameType = useMemo(
    () => blocks.filter((block) => block.blockType === selected?.blockType),
    [blocks, selected?.blockType],
  );

  if (blocks.length <= 1 || !selected) return null;
  const option = (block: OfferingBlock) => (
    <SelectItem key={block.blockId} value={String(block.blockId)} className={OPTION}>
      {block.displayName}
    </SelectItem>
  );
  return (
    <nav className="repo-block-nav" aria-label="Bloques del curso">
      {types.length > 1 && (
        <div className="repo-block-tabs" role="tablist">
          {types.map((type) => {
            const count = blocks.filter((block) => block.blockType === type).length;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={selected.blockType === type}
                className={selected.blockType === type ? "active" : ""}
                onClick={() => onSelect(blocks.find((block) => block.blockType === type)!.blockId)}
              >
                {BLOCK_TYPE_LABEL[type]} <span>{count}</span>
              </button>
            );
          })}
        </div>
      )}
      {sameType.length > 1 && (
        <Select value={String(selected.blockId)} onValueChange={(value) => onSelect(Number(value))}>
          <SelectTrigger
            className={TRIGGER}
            aria-label={`Bloque de ${BLOCK_TYPE_LABEL[selected.blockType].toLowerCase()}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={LIST} align="end">
            {sameType.map(option)}
          </SelectContent>
        </Select>
      )}
    </nav>
  );
}
