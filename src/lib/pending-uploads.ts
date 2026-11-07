let pending: File[] = [];

/** Files chosen on the dashboard, handed to the send wizard on the next page. */
export function stashUploads(files: File[]) {
  pending = files.filter((file) => file.size >= 0);
}

export function takeUploads() {
  const files = pending;
  pending = [];
  return files;
}
