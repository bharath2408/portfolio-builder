"use client";

import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";

import type { ResumeData } from "@/lib/utils/extract-resume";

// ─── Styles ──────────────────────────────────────────────────────

function createStyles(accent: string) {
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#333333",
      paddingTop: 40,
      paddingBottom: 40,
      paddingHorizontal: 40,
    },

    // ── Header ─────────────────────────────────────────────
    header: {
      marginBottom: 16,
    },
    name: {
      fontSize: 24,
      fontFamily: "Helvetica-Bold",
      color: accent,
      marginBottom: 2,
    },
    title: {
      fontSize: 12,
      color: "#555555",
      marginBottom: 6,
    },
    contactLine: {
      fontSize: 9,
      color: "#666666",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    contactItem: {
      marginRight: 2,
    },
    contactLink: {
      color: "#666666",
      textDecoration: "none",
    },
    separator: {
      marginHorizontal: 4,
      color: "#999999",
    },
    divider: {
      borderBottomWidth: 1.5,
      borderBottomColor: accent,
      marginTop: 12,
      marginBottom: 14,
      opacity: 0.4,
    },

    // ── Section ────────────────────────────────────────────
    section: {
      marginBottom: 12,
    },
    sectionHeader: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: accent,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 0.75,
      borderBottomColor: accent,
    },

    // ── Experience ─────────────────────────────────────────
    experienceItem: {
      marginBottom: 8,
    },
    experienceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 2,
    },
    experienceTitleLine: {
      flexDirection: "row",
      flexShrink: 1,
    },
    experienceTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#222222",
    },
    experienceCompany: {
      fontSize: 10,
      color: "#555555",
    },
    experienceDate: {
      fontSize: 9,
      color: "#888888",
      flexShrink: 0,
    },
    experienceDescription: {
      fontSize: 9,
      color: "#444444",
      lineHeight: 1.5,
    },

    // ── Projects ───────────────────────────────────────────
    projectItem: {
      marginBottom: 8,
    },
    projectTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#222222",
    },
    projectUrl: {
      fontSize: 8,
      color: accent,
      marginLeft: 6,
      textDecoration: "none",
    },
    projectTechRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      marginBottom: 2,
    },
    projectTech: {
      fontSize: 8,
      color: accent,
      backgroundColor: accent + "15",
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 3,
    },
    projectDescription: {
      fontSize: 9,
      color: "#444444",
      lineHeight: 1.5,
    },

    // ── Skills ─────────────────────────────────────────────
    skillItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },
    skillName: {
      fontSize: 9,
      color: "#333333",
      width: 100,
    },
    skillBarBg: {
      flex: 1,
      height: 6,
      backgroundColor: "#E5E7EB",
      borderRadius: 3,
    },
    skillBarFill: {
      height: 6,
      backgroundColor: accent,
      borderRadius: 3,
    },
    skillPercent: {
      fontSize: 8,
      color: "#888888",
      width: 30,
      textAlign: "right",
    },

    // ── Technologies ───────────────────────────────────────
    techList: {
      fontSize: 9,
      color: "#444444",
      lineHeight: 1.6,
    },

    // ── Summary ────────────────────────────────────────────
    summaryText: {
      fontSize: 10,
      color: "#444444",
      lineHeight: 1.6,
    },
  });
}

// ─── Component ───────────────────────────────────────────────────

interface ResumePDFProps {
  data: ResumeData;
  accentColor: string;
}

export function ResumePDF({ data, accentColor }: ResumePDFProps) {
  const styles = createStyles(accentColor);

  // Build contact parts
  const contactParts: Array<{ text: string; href?: string }> = [];
  if (data.email) contactParts.push({ text: data.email, href: `mailto:${data.email}` });
  if (data.phone) contactParts.push({ text: data.phone });
  if (data.location) contactParts.push({ text: data.location });
  if (data.website) contactParts.push({ text: data.website, href: data.website.startsWith("http") ? data.website : `https://${data.website}` });
  if (data.linkedin) contactParts.push({ text: data.linkedin.replace(/^https?:\/\/(www\.)?/, ""), href: data.linkedin.startsWith("http") ? data.linkedin : `https://${data.linkedin}` });
  if (data.github) contactParts.push({ text: data.github.replace(/^https?:\/\/(www\.)?/, ""), href: data.github.startsWith("http") ? data.github : `https://${data.github}` });

  const hasExperience = data.experience.length > 0;
  const hasProjects = data.projects.length > 0;
  const hasSkills = data.skills.length > 0;
  const hasTech = data.technologies.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.name}</Text>
          {data.title ? <Text style={styles.title}>{data.title}</Text> : null}
          {contactParts.length > 0 && (
            <View style={styles.contactLine}>
              {contactParts.map((part, i) => (
                <View key={i} style={{ flexDirection: "row" }}>
                  {i > 0 && <Text style={styles.separator}>|</Text>}
                  {part.href ? (
                    <Link src={part.href} style={styles.contactLink}>
                      <Text style={styles.contactItem}>{part.text}</Text>
                    </Link>
                  ) : (
                    <Text style={styles.contactItem}>{part.text}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Summary ─────────────────────────────────────── */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Summary</Text>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </View>
        )}

        {/* ── Experience ──────────────────────────────────── */}
        {hasExperience && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Experience</Text>
            {data.experience.map((exp, i) => (
              <View key={i} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View style={styles.experienceTitleLine}>
                    <Text style={styles.experienceTitle}>{exp.title}</Text>
                    {exp.company && (
                      <Text style={styles.experienceCompany}>
                        {" — "}
                        {exp.company}
                      </Text>
                    )}
                  </View>
                  {exp.date && (
                    <Text style={styles.experienceDate}>{exp.date}</Text>
                  )}
                </View>
                {exp.description && (
                  <Text style={styles.experienceDescription}>
                    {exp.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Projects ────────────────────────────────────── */}
        {hasProjects && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Projects</Text>
            {data.projects.map((proj, i) => (
              <View key={i} style={styles.projectItem}>
                <View style={styles.projectTitleRow}>
                  <Text style={styles.projectTitle}>{proj.title}</Text>
                  {proj.url && (
                    <Link
                      src={
                        proj.url.startsWith("http")
                          ? proj.url
                          : `https://${proj.url}`
                      }
                      style={styles.projectUrl}
                    >
                      <Text>{proj.url.replace(/^https?:\/\/(www\.)?/, "")}</Text>
                    </Link>
                  )}
                </View>
                {proj.techStack.length > 0 && (
                  <View style={styles.projectTechRow}>
                    {proj.techStack.map((tech, j) => (
                      <Text key={j} style={styles.projectTech}>
                        {tech}
                      </Text>
                    ))}
                  </View>
                )}
                {proj.description && (
                  <Text style={styles.projectDescription}>
                    {proj.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Skills ──────────────────────────────────────── */}
        {hasSkills && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Skills</Text>
            {data.skills.map((skill, i) => (
              <View key={i} style={styles.skillItem}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <View style={styles.skillBarBg}>
                  <View
                    style={[
                      styles.skillBarFill,
                      { width: `${Math.min(100, Math.max(0, skill.level))}%` },
                    ]}
                  />
                </View>
                <Text style={styles.skillPercent}>{skill.level}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Technologies ────────────────────────────────── */}
        {hasTech && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Technologies</Text>
            <Text style={styles.techList}>
              {data.technologies.join("  ·  ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
