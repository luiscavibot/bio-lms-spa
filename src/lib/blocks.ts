import type { BlockType } from "@/services/repositoryService";

export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  THEORY: "Teoría",
  PRACTICE: "Práctica",
  SEMINAR: "Seminario",
};

export const BLOCK_TYPE_PLURAL: Record<BlockType, [string, string]> = {
  THEORY: ["teoría", "teorías"],
  PRACTICE: ["práctica", "prácticas"],
  SEMINAR: ["seminario", "seminarios"],
};

export const BLOCK_TYPES: BlockType[] = ["THEORY", "PRACTICE", "SEMINAR"];

/** «2 teorías · 6 prácticas · 1 seminario» for the blocks of an offering. */
export function blockSummary(blocks: { blockType: BlockType }[]): string {
  return BLOCK_TYPES.map((type) => {
    const count = blocks.filter((block) => block.blockType === type).length;
    return count ? `${count} ${BLOCK_TYPE_PLURAL[type][count === 1 ? 0 : 1]}` : "";
  })
    .filter(Boolean)
    .join(" · ");
}
