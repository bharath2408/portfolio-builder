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
      fontSize: 9.5,
      color: "#2d2d2d",
      backgroundColor: "#ffffff",
    },

    // ── Two-column layout ────────────────────────────────
    body: {
      flexDirection: "row",
      flex: 1,
    },

    // ── Left sidebar ─────────────────────────────────────
    sidebar: {
      width: 185,
      backgroundColor: accent,
      paddingTop: 45,
      paddingBottom: 40,
      paddingHorizontal: 22,
    },
    sidebarName: {
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
      marginBottom: 4,
      lineHeight: 1.2,
    },
    sidebarTitle: {
      fontSize: 10,
      color: "rgba(255,255,255,0.8)",
      marginBottom: 20,
      lineHeight: 1.4,
    },
    sidebarSectionHeader: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: "rgba(255,255,255,0.55)",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: 8,
      marginTop: 18,
    },
    sidebarDivider: {
      borderBottomWidth: 0.5,
      borderBottomColor: "rgba(255,255,255,0.2)",
      marginBottom: 4,
    },

    // Contact items in sidebar
    contactItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    contactLabel: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: "rgba(255,255,255,0.5)",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      width: 45,
      marginTop: 0.5,
    },
    contactValue: {
      fontSize: 9,
      color: "#ffffff",
      flex: 1,
      lineHeight: 1.3,
    },
    contactLink: {
      color: "#ffffff",
      textDecoration: "none",
    },

    // Skills in sidebar
    skillItem: {
      marginBottom: 7,
    },
    skillName: {
      fontSize: 9,
      color: "#ffffff",
      marginBottom: 3,
    },
    skillBarBg: {
      height: 4,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 2,
    },
    skillBarFill: {
      height: 4,
      backgroundColor: "#ffffff",
      borderRadius: 2,
    },

    // Technologies in sidebar
    techChip: {
      fontSize: 8,
      color: "#ffffff",
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 6,
      paddingVertical: 2.5,
      borderRadius: 3,
      marginRight: 4,
      marginBottom: 4,
    },
    techWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    // ── Main content ─────────────────────────────────────
    main: {
      flex: 1,
      paddingTop: 45,
      paddingBottom: 40,
      paddingLeft: 30,
      paddingRight: 35,
    },

    // Section headers in main
    sectionHeader: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: accent,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 3,
    },
    sectionLine: {
      borderBottomWidth: 1.5,
      borderBottomColor: accent,
      marginBottom: 12,
      width: 40,
    },
    section: {
      marginBottom: 18,
    },

    // Summary
    summaryText: {
      fontSize: 10,
      color: "#444444",
      lineHeight: 1.7,
    },

    // Experience
    experienceItem: {
      marginBottom: 12,
    },
    experienceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 3,
    },
    experienceTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#1a1a1a",
    },
    experienceCompany: {
      fontSize: 10,
      color: accent,
      marginBottom: 2,
    },
    experienceDate: {
      fontSize: 8.5,
      color: "#888888",
      backgroundColor: "#f5f5f5",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      flexShrink: 0,
    },
    experienceDescription: {
      fontSize: 9,
      color: "#555555",
      lineHeight: 1.6,
      marginTop: 2,
    },

    // Projects
    projectItem: {
      marginBottom: 12,
    },
    projectTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    projectTitle: {
      fontSize: 10.5,
      fontFamily: "Helvetica-Bold",
      color: "#1a1a1a",
    },
    projectUrl: {
      fontSize: 8,
      color: accent,
      marginLeft: 8,
      textDecoration: "none",
    },
    projectTechRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 3,
      marginBottom: 3,
    },
    projectTech: {
      fontSize: 7.5,
      color: accent,
      backgroundColor: accent + "12",
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 2,
    },
    projectDescription: {
      fontSize: 9,
      color: "#555555",
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

  const hasExperience = data.experience.length > 0;
  const hasProjects = data.projects.length > 0;
  const hasSkills = data.skills.length > 0;
  const hasTech = data.technologies.length > 0;

  // Contact entries
  const contacts: Array<{ label: string; value: string; href?: string }> = [];
  if (data.email) contacts.push({ label: "Email", value: data.email, href: `mailto:${data.email}` });
  if (data.phone) contacts.push({ label: "Phone", value: data.phone });
  if (data.location) contacts.push({ label: "Location", value: data.location });
  if (data.website) contacts.push({ label: "Web", value: data.website.replace(/^https?:\/\/(www\.)?/, ""), href: data.website.startsWith("http") ? data.website : `https://${data.website}` });
  if (data.linkedin) contacts.push({ label: "LinkedIn", value: data.linkedin.replace(/^https?:\/\/(www\.)?/, ""), href: data.linkedin.startsWith("http") ? data.linkedin : `https://${data.linkedin}` });
  if (data.github) contacts.push({ label: "GitHub", value: data.github.replace(/^https?:\/\/(www\.)?/, ""), href: data.github.startsWith("http") ? data.github : `https://${data.github}` });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>

          {/* ═══ LEFT SIDEBAR ═══ */}
          <View style={styles.sidebar}>
            <Text style={styles.sidebarName}>{data.name}</Text>
            {data.title ? <Text style={styles.sidebarTitle}>{data.title}</Text> : null}

            {/* Contact */}
            {contacts.length > 0 && (
              <>
                <Text style={styles.sidebarSectionHeader}>Contact</Text>
                <View style={styles.sidebarDivider} />
                {contacts.map((c, i) => (
                  <View key={i} style={styles.contactItem}>
                    <Text style={styles.contactLabel}>{c.label}</Text>
                    {c.href ? (
                      <Link src={c.href} style={styles.contactLink}>
                        <Text style={styles.contactValue}>{c.value}</Text>
                      </Link>
                    ) : (
                      <Text style={styles.contactValue}>{c.value}</Text>
                    )}
                  </View>
                ))}
              </>
            )}

            {/* Skills */}
            {hasSkills && (
              <>
                <Text style={styles.sidebarSectionHeader}>Skills</Text>
                <View style={styles.sidebarDivider} />
                {data.skills.slice(0, 8).map((skill, i) => (
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
                  </View>
                ))}
              </>
            )}

            {/* Technologies */}
            {hasTech && (
              <>
                <Text style={styles.sidebarSectionHeader}>Technologies</Text>
                <View style={styles.sidebarDivider} />
                <View style={styles.techWrap}>
                  {data.technologies.slice(0, 15).map((tech, i) => (
                    <Text key={i} style={styles.techChip}>{tech}</Text>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* ═══ MAIN CONTENT ═══ */}
          <View style={styles.main}>

            {/* Summary */}
            {data.summary && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>About</Text>
                <View style={styles.sectionLine} />
                <Text style={styles.summaryText}>{data.summary}</Text>
              </View>
            )}

            {/* Experience */}
            {hasExperience && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Experience</Text>
                <View style={styles.sectionLine} />
                {data.experience.map((exp, i) => (
                  <View key={i} style={styles.experienceItem}>
                    <View style={styles.experienceHeader}>
                      <View style={{ flexShrink: 1 }}>
                        <Text style={styles.experienceTitle}>{exp.title}</Text>
                        {exp.company && (
                          <Text style={styles.experienceCompany}>{exp.company}</Text>
                        )}
                      </View>
                      {exp.date && (
                        <Text style={styles.experienceDate}>{exp.date}</Text>
                      )}
                    </View>
                    {exp.description && (
                      <Text style={styles.experienceDescription}>{exp.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Projects */}
            {hasProjects && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Projects</Text>
                <View style={styles.sectionLine} />
                {data.projects.map((proj, i) => (
                  <View key={i} style={styles.projectItem}>
                    <View style={styles.projectTitleRow}>
                      <Text style={styles.projectTitle}>{proj.title}</Text>
                      {proj.url && (
                        <Link
                          src={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                          style={styles.projectUrl}
                        >
                          <Text>{proj.url.replace(/^https?:\/\/(www\.)?/, "")}</Text>
                        </Link>
                      )}
                    </View>
                    {proj.techStack.length > 0 && (
                      <View style={styles.projectTechRow}>
                        {proj.techStack.map((tech, j) => (
                          <Text key={j} style={styles.projectTech}>{tech}</Text>
                        ))}
                      </View>
                    )}
                    {proj.description && (
                      <Text style={styles.projectDescription}>{proj.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
