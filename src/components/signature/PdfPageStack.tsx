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
  const listRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(1);

  function scrollToPage(number: number) {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-page-wrap="${number}"]`);
    if (!list || !el) return;
    const top = el.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    list.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
    setCurrent(number);
  }

  function onListScroll() {
    const list = listRef.current;
    if (!list) return;
    const marks = [...list.querySelectorAll<HTMLElement>("[data-page-wrap]")];
    const edge = list.getBoundingClientRect().top + 24;
    let seen = 1;
    for (const mark of marks) {
      const box = mark.getBoundingClientRect();
      if (box.top - edge <= 0) seen = Number(mark.dataset.pageWrap || seen);
    }
    setCurrent(seen);
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
    const list = listRef.current;
    if (list) list.scrollTop = 0;
    setCurrent(1);
  }, [pages]);

  if (!source) return null;
  if (error) return <p className="p-4 text-sm text-muted">{error}</p>;
  if (!pdf || !pages.length) return <p className="p-4 text-sm text-muted">Opening document…</p>;

  return (
    <div className="doc-page-scroller">
      <div className="doc-page-nav">
        <button type="button" onClick={() => scrollToPage(Math.max(1, current - 1))} disabled={current <= 1}>
          Previous page
        </button>
        <span>
          Page {current} of {pages.length}
        </span>
        <button
          type="button"
          onClick={() => scrollToPage(Math.min(pages.length, current + 1))}
          disabled={current >= pages.length}
        >
          Next page
        </button>
      </div>
      <div className="doc-page-list" ref={listRef} onScroll={onListScroll}>
        <div className="doc-pages">
          {pages.map((page) => (
            <div key={page.number} className="doc-page-wrap" data-page-wrap={page.number}>
              <p className="doc-page-label">Page {page.number}</p>
              <PdfPageCanvas
                pdf={pdf}
                page={page}
                eager={page.number <= 2}
                onPlace={onPlace}
                overlay={renderOverlay(page.number)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
