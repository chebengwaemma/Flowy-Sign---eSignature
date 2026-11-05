"use client";

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";

type PageInfo = { number: number; width: number; height: number };

type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<{
    getViewport: (opts: { scale: number }) => { width: number; height: number };
    render: (opts: { canvas: HTMLCanvasElement; viewport: { width: number; height: number } }) => { promise?: Promise<void>; cancel: () => void };
  }>;
  destroy: () => void;
};

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const bin = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function PdfPageCanvas({
  pdf,
  page,
  overlay,
  onPlace,
}: {
  pdf: PdfDoc;
  page: PageInfo;
  overlay: ReactNode;
  onPlace?: (page: number, xPct: number, yPct: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let task: { promise?: Promise<void>; cancel: () => void } | null = null;
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;

    const draw = () => {
      void (async () => {
        const pdfPage = await pdf.getPage(page.number);
        if (cancelled) return;
        const cssWidth = box.clientWidth || page.width;
        const scale = (cssWidth / page.width) * (window.devicePixelRatio || 1);
        const viewport = pdfPage.getViewport({ scale });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        task?.cancel();
        task = pdfPage.render({ canvas, viewport });
        try {
          await task.promise;
        } catch {
          /* cancelled render */
        }
      })();
    };

    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(box);
    return () => {
      cancelled = true;
      task?.cancel();
      ro.disconnect();
    };
  }, [pdf, page.number, page.width]);

  function onClick(e: MouseEvent<HTMLDivElement>) {
    if (!onPlace) return;
    if ((e.target as HTMLElement).closest(".doc-mark, .placed-field, .doc-mark-handle, .doc-mark-x")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlace(page.number, Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
  }

  return (
    <div
      ref={boxRef}
      className="doc-page"
      style={{ aspectRatio: `${page.width} / ${page.height}` }}
      onClick={onClick}
    >
      <canvas ref={canvasRef} className="doc-page-canvas" />
      <div className="doc-page-marks">{overlay}</div>
    </div>
  );
}

/** Renders each PDF page at its real aspect ratio so marks sit on the page, not the viewer chrome. */
export function PdfPageStack({
  dataUrl,
  onPlace,
  renderOverlay,
}: {
  dataUrl: string;
  onPlace?: (page: number, xPct: number, yPct: number) => void;
  renderOverlay: (page: number) => ReactNode;
}) {
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loaded: PdfDoc | null = null;
    setPdf(null);
    setPages([]);
    setError("");
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const bytes = dataUrlToBytes(dataUrl);
        if (!bytes) throw new Error("Could not read this PDF");
        const doc = (await pdfjs.getDocument({ data: bytes }).promise) as unknown as PdfDoc;
        loaded = doc;
        const next: PageInfo[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const view = page.getViewport({ scale: 1 });
          next.push({ number: n, width: view.width, height: view.height });
        }
        if (cancelled) {
          doc.destroy();
          return;
        }
        setPdf(doc);
        setPages(next);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || "Could not open this PDF");
      }
    })();
    return () => {
      cancelled = true;
      loaded?.destroy();
    };
  }, [dataUrl]);

  if (error) return <p className="p-4 text-sm text-muted">{error}</p>;
  if (!pdf || !pages.length) return <p className="p-4 text-sm text-muted">Opening document…</p>;

  return (
    <div className="doc-pages">
      {pages.map((page) => (
        <PdfPageCanvas
          key={page.number}
          pdf={pdf}
          page={page}
          onPlace={onPlace}
          overlay={renderOverlay(page.number)}
        />
      ))}
    </div>
  );
}
