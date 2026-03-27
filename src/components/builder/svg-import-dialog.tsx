"use client";

import { FileUp, Code2, X, AlertCircle } from "lucide-react";
import { useState, useRef, useCallback } from "react";

import { sanitizeSvg, type SanitizeResult } from "@/lib/utils/sanitize-svg";

// ─── Props ──────────────────────────────────────────────────────

interface SvgImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (result: { svg: string; viewBox: string; width: number; height: number; filename: string }) => void;
}

// ─── Component ──────────────────────────────────────────────────

export function SvgImportDialog({ open, onClose, onImport }: SvgImportDialogProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [pasteContent, setPasteContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SanitizeResult | null>(null);
  const [filename, setFilename] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPasteContent("");
    setError(null);
    setPreview(null);
    setFilename("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const processSvg = useCallback((raw: string, name: string) => {
    setError(null);
    const result = sanitizeSvg(raw);
    if (!result.success) {
      setError(result.error ?? "Failed to process SVG");
      setPreview(null);
      return;
    }
    setPreview(result);
    setFilename(name);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".svg") && file.type !== "image/svg+xml") {
        setError("Only .svg files are accepted");
        return;
      }

      if (file.size > 100 * 1024) {
        setError("File exceeds 100KB limit");
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) processSvg(content, file.name);
      };
      reader.readAsText(file);
    },
    [processSvg],
  );

  const handlePaste = useCallback(() => {
    if (!pasteContent.trim()) {
      setError("Paste SVG code first");
      return;
    }
    processSvg(pasteContent, "pasted.svg");
  }, [pasteContent, processSvg]);

  const handleImport = useCallback(() => {
    if (!preview || !preview.success) return;
    onImport({
      svg: preview.svg,
      viewBox: preview.viewBox,
      width: preview.width,
      height: preview.height,
      filename,
    });
    handleClose();
  }, [preview, filename, onImport, handleClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="flex w-[480px] flex-col overflow-hidden rounded-xl"
        style={{
          backgroundColor: "var(--b-panel)",
          border: "1px solid var(--b-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--b-border)" }}
        >
          <span className="text-[13px] font-semibold" style={{ color: "var(--b-text)" }}>
            Import SVG
          </span>
          <button onClick={handleClose} className="rounded-md p-1" style={{ color: "var(--b-text-3)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 px-4 pt-3">
          <button
            onClick={() => { setMode("upload"); reset(); }}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              backgroundColor: mode === "upload" ? "var(--b-accent-soft)" : "var(--b-surface)",
              color: mode === "upload" ? "var(--b-accent)" : "var(--b-text-3)",
            }}
          >
            <FileUp className="h-3.5 w-3.5" />
            Upload File
          </button>
          <button
            onClick={() => { setMode("paste"); reset(); }}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              backgroundColor: mode === "paste" ? "var(--b-accent-soft)" : "var(--b-surface)",
              color: mode === "paste" ? "var(--b-accent)" : "var(--b-text-3)",
            }}
          >
            <Code2 className="h-3.5 w-3.5" />
            Paste Code
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {mode === "upload" ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors"
                style={{
                  borderColor: "var(--b-border)",
                  color: "var(--b-text-3)",
                }}
              >
                <FileUp className="h-8 w-8" style={{ color: "var(--b-text-4)" }} />
                <div className="text-center">
                  <span className="text-[12px] font-semibold" style={{ color: "var(--b-text-2)" }}>
                    Click to upload
                  </span>
                  <p className="mt-1 text-[10px]" style={{ color: "var(--b-text-4)" }}>
                    SVG files only, max 100KB
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <div>
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder='<svg viewBox="0 0 200 200">...</svg>'
                rows={8}
                className="w-full rounded-lg border px-3 py-2.5 font-mono text-[11px] outline-none transition-colors focus:border-[var(--b-accent)]"
                style={{
                  backgroundColor: "var(--b-surface)",
                  borderColor: "var(--b-border)",
                  color: "var(--b-text)",
                  resize: "vertical",
                }}
              />
              <button
                onClick={handlePaste}
                className="mt-2 rounded-md px-4 py-1.5 text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: "var(--b-accent-soft)",
                  color: "var(--b-accent)",
                }}
              >
                Process SVG
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Preview */}
          {preview && preview.success && (
            <div className="mt-3">
              <span className="mb-2 block text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--b-text-4)" }}>
                Preview
              </span>
              <div
                className="flex items-center justify-center overflow-hidden rounded-lg p-4"
                style={{ backgroundColor: "var(--b-surface)", border: "1px solid var(--b-border)" }}
              >
                <div
                  style={{ maxWidth: 200, maxHeight: 200, color: "var(--b-text)" }}
                  dangerouslySetInnerHTML={{ __html: preview.svg }}
                />
              </div>
              <div className="mt-2 flex items-center gap-3 text-[10px]" style={{ color: "var(--b-text-4)" }}>
                <span>{filename}</span>
                <span>{preview.viewBox}</span>
                <span>{Math.round(preview.svg.length / 1024)}KB</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-3"
          style={{ borderTop: "1px solid var(--b-border)" }}
        >
          <button
            onClick={handleClose}
            className="rounded-md px-4 py-1.5 text-[11px] font-medium transition-colors"
            style={{ color: "var(--b-text-3)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!preview?.success}
            className="rounded-lg px-4 py-1.5 text-[11px] font-semibold text-white transition-all disabled:opacity-30"
            style={{ backgroundColor: "var(--b-accent)" }}
          >
            Import to Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
