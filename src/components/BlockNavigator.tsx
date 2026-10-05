import { useMemo } from "react";
import { BLOCK_TYPE_LABEL, BLOCK_TYPES } from "@/lib/blocks";
import type { OfferingBlock } from "@/services/repositoryService";

/**
 * Chooses a block of an offering: one tab per type present (with how many blocks it has) and,
 * inside, the blocks grouped by section. Hidden when the offering has a single block.
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
  const sections = useMemo(() => {
    const groups = new Map<string, OfferingBlock[]>();
    for (const block of blocks.filter((item) => item.blockType === selected?.blockType)) {
      const key = block.section ?? "";
      groups.set(key, [...(groups.get(key) ?? []), block]);
    }
    return [...groups.entries()];
  }, [blocks, selected?.blockType]);

  if (blocks.length <= 1 || !selected) return null;
  const withSections = sections.some(([section]) => section);
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
      {sections.map(([section, items]) =>
        items.length > 1 || withSections ? (
          <div className="repo-block-chips" key={section || "sin-seccion"}>
            {withSections && <span className="repo-block-chips__label">{section ? `Sección ${section}` : "Sin sección"}</span>}
            {items.map((block) => (
              <button
                key={block.blockId}
                type="button"
                className={block.blockId === selected.blockId ? "active" : ""}
                aria-pressed={block.blockId === selected.blockId}
                onClick={() => onSelect(block.blockId)}
                title={block.displayName}
              >
                {block.name || BLOCK_TYPE_LABEL[block.blockType]}
              </button>
            ))}
          </div>
        ) : null,
      )}
    </nav>
  );
}
