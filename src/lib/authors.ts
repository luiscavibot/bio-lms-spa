/** Short list of material authors for a course with no assigned teacher (informative only). */
export function authorsLine(authors: string[] = []) {
  if (!authors.length) return "";
  const shown = authors.slice(0, 3).join(", ");
  return authors.length > 3 ? `${shown} y otros` : shown;
}
