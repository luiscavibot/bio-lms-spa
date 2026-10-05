const authorList = new Intl.ListFormat("es", { style: "long", type: "conjunction" });

/**
 * Short list of material authors for a course with no assigned teacher (informative only):
 * «A», «A y B», «A, B y C», and «A, B, C y otros» beyond three.
 */
export function authorsLine(authors: string[] = []) {
  if (!authors.length) return "";
  const shown = authors.slice(0, 3);
  return authorList.format(authors.length > 3 ? [...shown, "otros"] : shown);
}
