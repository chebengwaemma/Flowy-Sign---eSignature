/** Reassemble a stored file in the browser. Each part stays small enough for the host. */
export async function loadStoredFileUrl(fileId: string, signToken?: string): Promise<string> {
  const query = new URLSearchParams();
  if (signToken) query.set("sign", signToken);
  const metaRes = await fetch(`/api/files/${encodeURIComponent(fileId)}?meta=1&${query}`);
  const meta = await metaRes.json().catch(() => ({}));
  if (!metaRes.ok) throw new Error(meta.error || "Could not open the file");
  const parts = Number(meta.parts) || 1;
  const buffers: Uint8Array[] = [];
  for (let part = 0; part < parts; part++) {
    const res = await fetch(`/api/files/${encodeURIComponent(fileId)}?part=${part}&${query}`);
    if (!res.ok) throw new Error("Could not open the file");
    buffers.push(new Uint8Array(await res.arrayBuffer()));
  }
  const total = buffers.reduce((sum, part) => sum + part.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of buffers) {
    merged.set(part, offset);
    offset += part.byteLength;
  }
  const blob = new Blob([merged.buffer], { type: meta.mime || "application/pdf" });
  return URL.createObjectURL(blob);
}
