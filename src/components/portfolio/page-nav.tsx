"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PageNavProps {
  pages: Array<{ title: string; slug: string; isDefault: boolean }>;
  baseUrl: string;
  primaryColor: string;
  textColor: string;
  surfaceColor: string;
}

export function PageNav({ pages, baseUrl, primaryColor, textColor, surfaceColor }: PageNavProps) {
  const pathname = usePathname();

  if (pages.length <= 1) return null;

  return (
    <nav style={{ backgroundColor: surfaceColor, borderBottom: `1px solid ${textColor}15`, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto" }}>
        {pages.map(page => {
          const href = page.isDefault ? baseUrl : `${baseUrl}/${page.slug}`;
          const isActive = pathname === href || (page.isDefault && pathname === baseUrl);
          return (
            <Link
              key={page.slug}
              href={href}
              style={{
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? primaryColor : `${textColor}99`,
                borderBottom: isActive ? `2px solid ${primaryColor}` : "2px solid transparent",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
            >
              {page.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
