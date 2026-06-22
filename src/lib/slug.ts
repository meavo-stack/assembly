export function slugifyPartnerName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isInternalPartnerName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return (
    normalized === "client" ||
    normalized === "direct" ||
    normalized === "meavo" ||
    normalized === "#n/a" ||
    normalized === ""
  );
}
