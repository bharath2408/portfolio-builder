"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

import { apiPost, apiPatch } from "@/lib/api";
import { FieldRenderer } from "@/components/cms/field-renderer";
import type { ContentType, ContentEntry } from "@/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--b-surface, #f0ede8)",
  borderColor: "var(--b-border, rgba(0,0,0,0.07))",
  color: "var(--b-text, #1c1917)",
};

const inputClass =
  "h-8 w-full rounded-md border px-2.5 text-[13px] outline-none transition-colors focus:border-primary";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface EntryEditorProps {
  contentType: ContentType;
  entry: ContentEntry | null;
  onSave: (entry: ContentEntry) => void;
  onBack: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EntryEditor({
  contentType,
  entry,
  onSave,
  onBack,
}: EntryEditorProps) {
  const isNew = !entry;

  const [title, setTitle] = useState(entry?.title ?? "");
  const [slug, setSlug] = useState(entry?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [data, setData] = useState<Record<string, unknown>>(
    entry?.data ?? {},
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    entry?.status ?? "DRAFT",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ---- title / slug sync ---- */

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (!slugTouched) {
        setSlug(slugify(value));
      }
    },
    [slugTouched],
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlugTouched(true);
    setSlug(slugify(value));
  }, []);

  /* ---- field data ---- */

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /* ---- validation ---- */

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors._title = "Title is required";
    }

    for (const field of contentType.fields) {
      if (field.required) {
        const val = data[field.key];
        if (val == null || val === "" || val === false) {
          errors[field.key] = `${field.name} is required`;
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ---- save ---- */

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        slug: slug || slugify(title),
        data,
        status,
      };

      let saved: ContentEntry;

      if (isNew) {
        saved = await apiPost<ContentEntry>(
          `/cms/types/${contentType.id}/entries`,
          payload,
        );
      } else {
        saved = await apiPatch<ContentEntry>(
          `/cms/entries/${entry.id}`,
          payload,
        );
      }

      onSave(saved);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save entry",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---- render ---- */

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--b-border, rgba(0,0,0,0.07))" }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-80"
            style={{ color: "var(--b-text-2, #57534e)" }}
          >
            <ArrowLeft size={16} />
          </button>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--b-text, #1c1917)" }}
          >
            {isNew ? "New Entry" : "Edit Entry"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status toggle */}
          <button
            type="button"
            onClick={() =>
              setStatus((s) => (s === "DRAFT" ? "PUBLISHED" : "DRAFT"))
            }
            className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-wide transition-colors"
            style={{
              backgroundColor:
                status === "PUBLISHED"
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(245,158,11,0.1)",
              color:
                status === "PUBLISHED"
                  ? "rgb(34,197,94)"
                  : "rgb(245,158,11)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  status === "PUBLISHED"
                    ? "rgb(34,197,94)"
                    : "rgb(245,158,11)",
              }}
            />
            {status === "PUBLISHED" ? "Published" : "Draft"}
          </button>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--b-accent, #06b6d4)" }}
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Error */}
          {error && (
            <div
              className="rounded-md border px-3 py-2 text-[13px]"
              style={{
                borderColor: "rgba(239,68,68,0.3)",
                backgroundColor: "rgba(239,68,68,0.05)",
                color: "rgb(239,68,68)",
              }}
            >
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label
              className="text-[12px] font-medium"
              style={{ color: "var(--b-text-2, #57534e)" }}
            >
              Title <span style={{ color: "rgb(239,68,68)" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Entry title…"
              className={inputClass}
              style={inputStyle}
            />
            {fieldErrors._title && (
              <p className="text-[11px]" style={{ color: "rgb(239,68,68)" }}>
                {fieldErrors._title}
              </p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label
              className="text-[12px] font-medium"
              style={{ color: "var(--b-text-2, #57534e)" }}
            >
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="auto-generated-from-title"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Dynamic fields */}
          {contentType.fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label
                className="text-[12px] font-medium"
                style={{ color: "var(--b-text-2, #57534e)" }}
              >
                {field.name}
                {field.required && (
                  <span style={{ color: "rgb(239,68,68)" }}> *</span>
                )}
              </label>
              <FieldRenderer
                field={field}
                value={data[field.key]}
                onChange={(val) => handleFieldChange(field.key, val)}
              />
              {fieldErrors[field.key] && (
                <p
                  className="text-[11px]"
                  style={{ color: "rgb(239,68,68)" }}
                >
                  {fieldErrors[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
