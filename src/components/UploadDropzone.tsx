"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileUp } from "lucide-react";

export function UploadDropzone() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);

  function goNew() {
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
        goNew();
      }}
    >
      <div className="dropzone-icon">
        <FileUp size={28} strokeWidth={1.5} />
      </div>
      <p className="mt-3 text-[15px] font-medium text-[#1e1919]">
        Drop documents to get signed here
      </p>
      <button type="button" className="btn-upload mt-4" onClick={goNew}>
        Upload
        <span className="opacity-60">▾</span>
      </button>
    </div>
  );
}
