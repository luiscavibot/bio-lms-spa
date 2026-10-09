const authorList = new Intl.ListFormat("es", { style: "long", type: "conjunction" });

/**
 * List of material authors for a course with no assigned teacher (informative only):
 * «A», «A y B», «A, B y C». With `limit` (the course card), «A, B, C y otros» beyond it; the
 * course detail shows every author.
 */
export function authorsLine(authors: string[] = [], limit?: number) {
  if (!authors.length) return "";
  if (limit === undefined || authors.length <= limit) return authorList.format(authors);
  return authorList.format([...authors.slice(0, limit), "otros"]);
}
