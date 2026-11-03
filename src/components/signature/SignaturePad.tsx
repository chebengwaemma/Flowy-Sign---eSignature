"use client";

import { useRef, useState } from "react";
import type { SignatureMark, SignatureStyle } from "@/lib/types";
import { normalizeSignatureStyle } from "@/lib/signature-styles";
import { ESignatureGenerator } from "@/components/signature/ESignatureGenerator";

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

export function SignaturePad({
  defaultName,
  value,
  onChange,
}: {
  defaultName: string;
  value: SignatureMark | null;
  onChange: (mark: SignatureMark | null) => void;
}) {
  const [mode, setMode] = useState<"typed" | "image">(value?.mode || "typed");
  const [text, setText] = useState(value?.text || defaultName);
  const [style, setStyle] = useState<SignatureStyle>(
    normalizeSignatureStyle(value?.style || "elegant"),
  );
  const [imageDataUrl, setImageDataUrl] = useState(value?.imageDataUrl || "");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function emitTyped(nextText: string, nextStyle: SignatureStyle) {
    const trimmed = nextText.trim();
    if (!trimmed) {
      onChange(null);
      return;
    }
    onChange({ mode: "typed", text: trimmed, style: nextStyle });
  }

  function emitImage(dataUrl: string) {
    if (!dataUrl) {
      onChange(null);
      return;
    }
    onChange({ mode: "image", imageDataUrl: dataUrl, text: defaultName });
  }

  async function onFile(file: File | null) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Upload a PNG, JPG, or WebP signature image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 1.5 MB.");
      return;
    }
    const dataUrl = await readAsDataUrl(file);
    setImageDataUrl(dataUrl);
    setMode("image");
    emitImage(dataUrl);
  }

  return (
    <div className="sig-pad">
      <div className="sig-pad-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={mode === "typed" ? "active" : ""}
          aria-selected={mode === "typed"}
          onClick={() => {
            setMode("typed");
            emitTyped(text, style);
          }}
        >
          Type name
        </button>
        <button
          type="button"
          role="tab"
          className={mode === "image" ? "active" : ""}
          aria-selected={mode === "image"}
          onClick={() => {
            setMode("image");
            emitImage(imageDataUrl);
          }}
        >
          Upload image
        </button>
      </div>

      {mode === "typed" ? (
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="sig-name">
              Your full legal name
            </label>
            <input
              id="sig-name"
              className="field"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                emitTyped(e.target.value, style);
              }}
              placeholder={defaultName}
            />
          </div>

          <ESignatureGenerator
            name={text}
            style={style}
            onStyleChange={(next) => {
              setStyle(next);
              emitTyped(text, next);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          <button type="button" className="sig-upload-zone" onClick={() => fileRef.current?.click()}>
            {imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageDataUrl} alt="Your signature" className="sig-upload-preview" />
            ) : (
              <span>
                Click to upload a signature image
                <br />
                <small>PNG, JPG, or WebP · max 1.5 MB</small>
              </span>
            )}
          </button>
          {imageDataUrl && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setImageDataUrl("");
                emitImage("");
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Remove image
            </button>
          )}
        </div>
      )}

      {error && <p className="send-error mt-3">{error}</p>}
    </div>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
