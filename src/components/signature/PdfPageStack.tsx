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
  eager,
}: {
  pdf: PdfDoc;
  page: PageInfo;
  overlay: ReactNode;
  onPlace?: (page: number, xPct: number, yPct: number) => void;
  eager?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(Boolean(eager));

  useEffect(() => {
    const box = boxRef.current;
    if (!box || near) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setNear(true);
      },
      { root: box.closest(".doc-page-list"), rootMargin: "800px 0px" },
    );
    io.observe(box);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near) return;
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
        const scale = (cssWidth / page.width) * Math.min(window.devicePixelRatio || 1, 1.25);
        const viewport = pdfPage.getViewport({ scale });
        const w = Math.max(1, Math.floor(viewport.width));
        const h = Math.max(1, Math.floor(viewport.height));
        if (canvas.dataset.drawn === "1" && canvas.width === w && canvas.height === h) return;
        canvas.width = w;
        canvas.height = h;
        task?.cancel();
        task = pdfPage.render({ canvas, viewport });
        try {
          await task.promise;
          canvas.dataset.drawn = "1";
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
  }, [pdf, page.number, page.width, near]);

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
  src,
  onPlace,
  renderOverlay,
}: {
  dataUrl?: string;
  /** blob: or https URL. Used instead of a data URL for large files. */
  src?: string;
  onPlace?: (page: number, xPct: number, yPct: number) => void;
  renderOverlay: (page: number) => ReactNode;
}) {
  const source = src || dataUrl || "";
  const stageRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(1);
  const [jump, setJump] = useState("1");

  function showPage(number: number) {
    const next = Math.min(pages.length || 1, Math.max(1, Math.floor(number) || 1));
    setCurrent(next);
    setJump(String(next));
    if (stageRef.current) stageRef.current.scrollTop = 0;
  }

  useEffect(() => {
    let cancelled = false;
    let closed = false;
    let task: { destroy?: () => unknown; promise: Promise<unknown> } | null = null;

    function close() {
      if (closed) return;
      closed = true;
      const pending = task;
      task = null;
      try {
        const done = pending?.destroy?.();
        if (done && typeof (done as Promise<unknown>).catch === "function") {
          void (done as Promise<unknown>).catch(() => {});
        }
      } catch {
        /* viewer already closed */
      }
    }

    setPdf(null);
    setPages([]);
    setError("");
    if (!source) return;
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        task = (
          source.startsWith("data:")
            ? pdfjs.getDocument({ data: dataUrlToBytes(source) || undefined })
            : pdfjs.getDocument({
                url: source,
                withCredentials: !source.startsWith("blob:"),
              })
        ) as { destroy?: () => unknown; promise: Promise<unknown> };
        const doc = (await task.promise) as unknown as PdfDoc;
        if (cancelled) {
          close();
          return;
        }
        const next: PageInfo[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const view = page.getViewport({ scale: 1 });
          next.push({ number: n, width: view.width, height: view.height });
        }
        if (cancelled) {
          close();
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
      close();
    };
  }, [source]);

  useEffect(() => {
    if (!pages.length) return;
    setCurrent(1);
    setJump("1");
    if (stageRef.current) stageRef.current.scrollTop = 0;
  }, [pages]);

  if (!source) return null;
  if (error) return <p className="p-4 text-sm text-muted">{error}</p>;
  if (!pdf || !pages.length) return <p className="p-4 text-sm text-muted">Opening document…</p>;

  const page = pages[current - 1] || pages[0];
  if (!page) return null;

  return (
    <div className="doc-page-scroller">
      <div className="doc-page-nav">
        <button type="button" onClick={() => showPage(current - 1)} disabled={current <= 1}>
          Previous page
        </button>
        <form
          className="doc-page-jump"
          onSubmit={(e) => {
            e.preventDefault();
            const field = e.currentTarget.elements.namedItem("page");
            const raw = field instanceof HTMLInputElement ? field.value : jump;
            showPage(Number(raw));
          }}
        >
          <span>Page</span>
          <input
            name="page"
            aria-label="Page number"
            inputMode="numeric"
            value={jump}
            onChange={(e) => setJump(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={(e) => showPage(Number(e.currentTarget.value))}
          />
          <span>of {pages.length}</span>
        </form>
        <button type="button" onClick={() => showPage(current + 1)} disabled={current >= pages.length}>
          Next page
        </button>
      </div>
      <div className="doc-page-stage" ref={stageRef}>
        <div className="doc-page-sheet" data-page-wrap={page.number}>
          <p className="doc-page-label">Page {page.number}</p>
          <PdfPageCanvas
            key={page.number}
            pdf={pdf}
            page={page}
            eager
            onPlace={onPlace}
            overlay={renderOverlay(page.number)}
          />
        </div>
      </div>
    </div>
  );
}
