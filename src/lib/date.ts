export function formatDate(dateStr?: string): string {
  if (!dateStr) return "未知日期";
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return dateStr.slice(0, 10);
  }
}