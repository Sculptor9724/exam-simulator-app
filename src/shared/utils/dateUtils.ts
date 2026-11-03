/**
 * Calculate the duration between two timestamps
 * @param createdAt - The start timestamp (ISO string)
 * @param finishedAt - The end timestamp (ISO string) or null
 * @returns A formatted string showing the duration (e.g., "5m 23s" or "45s")
 */
export const calculateDuration = (
  createdAt: string,
  finishedAt: string | null
): string => {
  if (!finishedAt) return "Ikke afsluttet";

  const start = new Date(createdAt);
  const end = new Date(finishedAt);
  const durationMs = end.getTime() - start.getTime();

  const minutes = Math.floor(durationMs / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Calculate the duration in minutes between two timestamps
 * @param startDate - The start timestamp (ISO string)
 * @param endDate - The end timestamp (ISO string) or null
 * @returns Duration in minutes (rounded to 1 decimal) or null if endDate is null
 */
export const calculateDurationMinutes = (
  startDate: string,
  endDate: string | null
): number | null => {
  if (!endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const minutes = (end.getTime() - start.getTime()) / (1000 * 60);

  return Math.round(minutes * 10) / 10;
};
