"use client";

import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useRef } from "react";

import { apiGet } from "@/lib/api";
import type { Asset } from "@/types";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export function ImageUpload({ value, onChange, compact }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<Asset[]>([]);
  const [libraryLoaded, setLibraryLoaded] = useState(false);

  const loadLibrary = () => {
    if (libraryLoaded) { setShowLibrary(true); return; }
    apiGet<Asset[]>("/assets")
      .then((a) => { setLibraryAssets(a); setLibraryLoaded(true); setShowLibrary(true); })
      .catch(() => setShowLibrary(true));
  };

  const upload = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File size must be under 10MB"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        onChange(data.secure_url);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  if (compact) {
    return (
      <div>
        <div className="flex items-center gap-2">
          {value ? (
            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
              <Image src={value} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
              <button
                onClick={() => onChange("")}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ) : null}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: "var(--b-surface)",
              borderColor: "var(--b-border)",
              color: "var(--b-text-3)",
            }}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {uploading ? "Uploading..." : value ? "Replace" : "Upload"}
          </button>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
        {error && <p className="mt-1 text-[10px] font-medium text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${dragOver ? "border-[var(--b-accent)]" : "border-[var(--b-border)]"}`}
      style={{ backgroundColor: "var(--b-surface)" }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {value ? (
        <div className="relative">
          <Image src={value} alt="" width={400} height={200} className="w-full rounded-lg" style={{ maxHeight: 200, objectFit: "cover" }} unoptimized />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-white/20 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur"
            >
              Replace
            </button>
            <button
              onClick={() => onChange("")}
              className="rounded-md bg-red-500/80 px-3 py-1.5 text-[11px] font-semibold text-white"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2">
          <div className="mb-2 flex gap-1">
            <button
              type="button"
              onClick={() => setShowLibrary(false)}
              className="flex-1 rounded-md py-1 text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor: !showLibrary ? "var(--b-accent-soft, rgba(6,182,212,0.08))" : "transparent",
                color: !showLibrary ? "var(--b-accent, #06b6d4)" : "var(--b-text-4, #52525b)",
              }}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={loadLibrary}
              className="flex-1 rounded-md py-1 text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor: showLibrary ? "var(--b-accent-soft, rgba(6,182,212,0.08))" : "transparent",
                color: showLibrary ? "var(--b-accent, #06b6d4)" : "var(--b-text-4, #52525b)",
              }}
            >
              Library
            </button>
          </div>
          {showLibrary ? (
            <div className="grid grid-cols-3 gap-1 max-h-[200px] overflow-y-auto rounded-lg" style={{ border: "1px solid var(--b-border, rgba(255,255,255,0.08))" }}>
              {libraryAssets.filter((a) => a.type === "image" || a.type === "svg").map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => { onChange(asset.url); setShowLibrary(false); }}
                  className="overflow-hidden transition-transform hover:scale-105"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.thumbnailUrl ?? asset.url} alt={asset.name} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
                </button>
              ))}
              {libraryAssets.filter((a) => a.type === "image" || a.type === "svg").length === 0 && (
                <p className="col-span-3 py-4 text-center text-[10px]" style={{ color: "var(--b-text-4, #52525b)" }}>No images in library</p>
              )}
            </div>
          ) : (
            <div
              className="flex cursor-pointer flex-col items-center gap-2 px-4 py-6"
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--b-accent)" }} />
              ) : (
                <Upload className="h-6 w-6" style={{ color: "var(--b-text-4)" }} />
              )}
              <p className="text-[11px] font-medium" style={{ color: "var(--b-text-3)" }}>
                {uploading ? "Uploading..." : "Drop image or click to browse"}
              </p>
              <p className="text-[9px]" style={{ color: "var(--b-text-4)" }}>
                PNG, JPG, GIF, WebP • Max 10MB
              </p>
            </div>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error && (
        <div className="absolute bottom-2 left-2 right-2 rounded-md bg-red-500/90 px-2.5 py-1.5 text-center text-[10px] font-medium text-white backdrop-blur">
          {error}
        </div>
      )}
    </div>
  );
}
