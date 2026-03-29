"use client";

import { GripVertical, Plus, Trash2, Save, X, Info } from "lucide-react";
import { useState, useCallback } from "react";

import { apiPatch } from "@/lib/api";
import type { ContentType, FieldDefinition, FieldType } from "@/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "richtext", label: "Rich Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "image", label: "Image" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "url", label: "URL" },
  { value: "color", label: "Color" },
];

const MAX_FIELDS = 20;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nameToKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function generateId(): string {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

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

interface SchemaEditorProps {
  contentType: ContentType;
  onUpdate: (updated: ContentType) => void;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SchemaEditor({
  contentType,
  onUpdate,
  onClose,
}: SchemaEditorProps) {
  const [fields, setFields] = useState<FieldDefinition[]>(
    () => contentType.fields.map((f) => ({ ...f })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- field mutations ---- */

  const addField = useCallback(() => {
    if (fields.length >= MAX_FIELDS) return;
    setFields((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        key: "",
        type: "text" as FieldType,
        required: false,
      },
    ]);
  }, [fields.length]);

  const updateField = useCallback(
    (id: string, patch: Partial<FieldDefinition>) => {
      setFields((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const updated = { ...f, ...patch };
          // Auto-generate key when name changes
          if (patch.name !== undefined) {
            updated.key = nameToKey(patch.name);
          }
          return updated;
        }),
      );
    },
    [],
  );

  const removeField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /* ---- save ---- */

  const handleSave = async () => {
    // Validate: all fields must have a name
    const invalid = fields.some((f) => !f.name.trim());
    if (invalid) {
      setError("All fields must have a name.");
      return;
    }

    // Check for duplicate keys
    const keys = fields.map((f) => f.key);
    const hasDuplicates = new Set(keys).size !== keys.length;
    if (hasDuplicates) {
      setError("Field names must be unique.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await apiPatch<ContentType>(
        `/cms/types/${contentType.id}`,
        { fields },
      );
      onUpdate(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save schema",
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
          <span
            className="text-sm font-medium"
            style={{ color: "var(--b-text, #1c1917)" }}
          >
            Schema: {contentType.name}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: "var(--b-surface, #f0ede8)",
              color: "var(--b-text-2, #57534e)",
            }}
          >
            {fields.length} field{fields.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors hover:opacity-80"
            style={{
              color: "var(--b-text-2, #57534e)",
              backgroundColor: "var(--b-surface, #f0ede8)",
            }}
          >
            <X size={13} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--b-accent, #06b6d4)" }}
          >
            <Save size={13} />
            {saving ? "Saving…" : "Save Schema"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {/* Preset info */}
          {contentType.isPreset && (
            <div
              className="flex items-start gap-2 rounded-md border px-3 py-2 text-[13px]"
              style={{
                borderColor: "rgba(59,130,246,0.2)",
                backgroundColor: "rgba(59,130,246,0.05)",
                color: "rgb(59,130,246)",
              }}
            >
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                This is a preset template. You can customize its fields.
              </span>
            </div>
          )}

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

          {/* Field list */}
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-2 rounded-md border p-2"
              style={{
                borderColor: "var(--b-border, rgba(0,0,0,0.07))",
                backgroundColor: "var(--b-surface, #f0ede8)",
              }}
            >
              {/* Drag handle */}
              <div
                className="flex shrink-0 cursor-grab items-center"
                style={{ color: "var(--b-text-3, #a8a29e)" }}
              >
                <GripVertical size={14} />
              </div>

              {/* Name */}
              <input
                type="text"
                value={field.name}
                onChange={(e) =>
                  updateField(field.id, { name: e.target.value })
                }
                placeholder="Field name"
                className={inputClass}
                style={{ ...inputStyle, maxWidth: 180 }}
              />

              {/* Type dropdown */}
              <select
                value={field.type}
                onChange={(e) =>
                  updateField(field.id, {
                    type: e.target.value as FieldType,
                  })
                }
                className={inputClass}
                style={{ ...inputStyle, maxWidth: 130 }}
              >
                {FIELD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Required checkbox */}
              <label
                className="flex shrink-0 items-center gap-1 text-[11px]"
                style={{ color: "var(--b-text-2, #57534e)" }}
              >
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField(field.id, { required: e.target.checked })
                  }
                  className="h-3.5 w-3.5 rounded border accent-primary"
                />
                Required
              </label>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeField(field.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:opacity-80"
                style={{ color: "rgb(239,68,68)" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {/* Add field button */}
          {fields.length < MAX_FIELDS && (
            <button
              type="button"
              onClick={addField}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed text-[12px] font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: "var(--b-border, rgba(0,0,0,0.07))",
                color: "var(--b-text-2, #57534e)",
              }}
            >
              <Plus size={13} />
              Add Field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
