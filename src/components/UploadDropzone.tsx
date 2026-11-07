"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { stashUploads } from "@/lib/pending-uploads";

export function UploadDropzone() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function openWith(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    stashUploads(list);
    router.push("/documents/new");
  }

  return (
    <div
      className={`dropzone ${dragging ? "dropzone-active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        openWith(e.dataTransfer.files);
      }}
    >
      <div className="dropzone-icon">
        <FileUp size={28} strokeWidth={1.5} />
      </div>
      <p className="mt-3 text-[15px] font-medium text-[var(--ink)]">
        Drop documents to get signed here
      </p>
      <button type="button" className="btn-upload mt-4" onClick={() => fileRef.current?.click()}>
        Upload
        <span className="opacity-60">▾</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,.gif,text/plain,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          openWith(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
