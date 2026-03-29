"use client";

import type { JSONContent } from "@tiptap/react";

import { AdvancedColorInput } from "@/components/builder/color-picker";
import { TipTapEditor } from "@/components/cms/tiptap-editor";
import { ImageUpload } from "@/components/common/image-upload";
import type { FieldDefinition } from "@/types";

/* ------------------------------------------------------------------ */
/*  Shared input styles                                                */
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

interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  switch (field.type) {
    case "text":
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? `Enter ${field.name.toLowerCase()}…`}
          className={inputClass}
          style={inputStyle}
        />
      );

    case "richtext":
      return (
        <TipTapEditor
          value={value as JSONContent | undefined}
          onChange={(json) => onChange(json)}
          placeholder={field.placeholder ?? `Write ${field.name.toLowerCase()}…`}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={value != null ? Number(value) : ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          placeholder={field.placeholder ?? "0"}
          className={inputClass}
          style={inputStyle}
        />
      );

    case "boolean":
      return (
        <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--b-text, #1c1917)" }}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border accent-primary"
          />
          {field.name}
        </label>
      );

    case "image":
      return (
        <ImageUpload
          value={(value as string) ?? ""}
          onChange={(url) => onChange(url)}
          compact
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      );

    case "select":
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={inputStyle}
        >
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "url":
      return (
        <input
          type="url"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "https://…"}
          className={inputClass}
          style={inputStyle}
        />
      );

    case "color":
      return (
        <AdvancedColorInput
          value={(value as string) ?? ""}
          onChange={(v) => onChange(v)}
          placeholder={field.placeholder ?? "#000000"}
        />
      );

    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      );
  }
}
