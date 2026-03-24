import type {
  Portfolio,
  Section,
  Block,
  Theme,
  Template,
  User,
  PortfolioStatus,
  ThemeMode,
} from "@prisma/client";

// ─── API Response ─────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ─── User ─────────────────────────────────────────────────────────

export type SafeUser = Omit<User, "password" | "emailVerified"> & {
  emailVerified: string | null;
};

// ═══════════════════════════════════════════════════════════════════
//  BLOCK SYSTEM — Figma-like element types
// ═══════════════════════════════════════════════════════════════════

export const BLOCK_TYPES = {
  HEADING: "heading",
  TEXT: "text",
  QUOTE: "quote",
  LIST: "list",
  CODE: "code",
  IMAGE: "image",
  AVATAR: "avatar",
  ICON: "icon",
  DIVIDER: "divider",
  SPACER: "spacer",
  BUTTON: "button",
  LINK: "link",
  SOCIAL_LINKS: "social_links",
  BADGE: "badge",
  BADGE_GROUP: "badge_group",
  SKILL_BAR: "skill_bar",
  SKILL_GRID: "skill_grid",
  PROGRESS_RING: "progress_ring",
  STAT: "stat",
  PROJECT_CARD: "project_card",
  EXPERIENCE_ITEM: "experience_item",
  TESTIMONIAL: "testimonial",
  CONTACT_INFO: "contact_info",
  CONTACT_FORM: "contact_form",
  COLUMNS: "columns",
  CARD: "card",
  EMBED: "embed",
  YOUTUBE: "youtube",
  SPOTIFY: "spotify",
  GOOGLE_MAP: "google_map",
  CALENDLY: "calendly",
  GITHUB_CONTRIB: "github_contrib",
  CUSTOM_HTML: "custom_html",
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
  LINE: "line",
} as const;

export type BlockType = (typeof BLOCK_TYPES)[keyof typeof BLOCK_TYPES];

// ─── Block Content Types ──────────────────────────────────────────

export interface HeadingContent { text: string; level: 1|2|3|4|5|6; highlight?: string; }
export interface TextContent { text: string; html?: string; }
export interface QuoteContent { text: string; author?: string; role?: string; }
export interface ListContent { items: string[]; ordered?: boolean; icon?: string; }
export interface CodeContent { code: string; language?: string; filename?: string; }
export interface ImageContent { src: string; alt: string; caption?: string; objectFit?: "cover"|"contain"|"fill"; aspectRatio?: string; }
export interface AvatarContent { src: string; alt: string; size?: "sm"|"md"|"lg"|"xl"|"2xl"; ring?: boolean; }
export interface IconContent { name: string; size?: number; color?: string; }
export interface DividerContent { style?: "solid"|"dashed"|"dotted"|"gradient"; thickness?: number; }
export interface SpacerContent { height: number; }
export interface ButtonContent { text: string; url: string; variant: "solid"|"outline"|"ghost"|"link"; icon?: string; iconPosition?: "left"|"right"; size?: "sm"|"md"|"lg"; newTab?: boolean; }
export interface LinkContent { text: string; url: string; newTab?: boolean; }
export interface SocialLinksContent { links: Array<{platform: string; url: string; icon: string}>; layout?: "row"|"column"; showLabels?: boolean; variant?: "ghost"|"outline"|"filled"; }
export interface BadgeContent { text: string; color?: string; variant?: "solid"|"outline"|"subtle"; }
export interface BadgeGroupContent { badges: Array<{text: string; color?: string}>; }
export interface SkillBarContent { name: string; level: number; icon?: string; showPercentage?: boolean; }
export interface SkillGridContent { skills: Array<{name: string; icon?: string; level?: number}>; columns?: 2|3|4|5|6; }
export interface ProgressRingContent { value: number; label: string; size?: number; }
export interface StatContent { value: string; label: string; prefix?: string; suffix?: string; }
export interface ProjectCardContent { title: string; description?: string; imageUrl?: string; techStack?: string[]; liveUrl?: string; repoUrl?: string; featured?: boolean; }
export interface ExperienceItemContent { company: string; role: string; location?: string; startDate: string; endDate?: string; current?: boolean; description?: string; highlights?: string[]; logo?: string; }
export interface TestimonialContent { quote: string; author: string; role?: string; avatar?: string; }
export interface ContactInfoContent { items: Array<{type: "email"|"phone"|"location"|"website"|"custom"; label: string; value: string; icon?: string}>; }
export interface ContactFormContent { fields: Array<{name: string; label: string; type: "text"|"email"|"textarea"; required?: boolean; placeholder?: string}>; submitText?: string; }
export interface ColumnsContent { columns: number; gap?: number; }
export interface CardContent { elevation?: "none"|"sm"|"md"|"lg"; border?: boolean; hover?: boolean; }
export interface EmbedContent { url: string; height?: number; }

export type BlockContentMap = {
  heading: HeadingContent;
  text: TextContent;
  quote: QuoteContent;
  list: ListContent;
  code: CodeContent;
  image: ImageContent;
  avatar: AvatarContent;
  icon: IconContent;
  divider: DividerContent;
  spacer: SpacerContent;
  button: ButtonContent;
  link: LinkContent;
  social_links: SocialLinksContent;
  badge: BadgeContent;
  badge_group: BadgeGroupContent;
  skill_bar: SkillBarContent;
  skill_grid: SkillGridContent;
  progress_ring: ProgressRingContent;
  stat: StatContent;
  project_card: ProjectCardContent;
  experience_item: ExperienceItemContent;
  testimonial: TestimonialContent;
  contact_info: ContactInfoContent;
  contact_form: ContactFormContent;
  columns: ColumnsContent;
  card: CardContent;
  embed: EmbedContent;
};

// ─── Block Styles (Figma design panel) ────────────────────────────

export interface BlockStyles {
  // ── Figma-like absolute position (on canvas) ────────
  x?: number;       // X position within section frame
  y?: number;       // Y position within section frame
  w?: number;       // Element width in px
  h?: number;       // Element height in px ("auto" = use content height)
  rotation?: number; // Degrees

  width?: string;
  maxWidth?: string;
  minHeight?: string;
  display?: "block"|"flex"|"grid"|"inline-flex";
  flexDirection?: "row"|"column";
  alignItems?: "start"|"center"|"end"|"stretch";
  justifyContent?: "start"|"center"|"end"|"between";
  gap?: number;
  flexWrap?: "wrap"|"nowrap";
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  fontSize?: number;
  fontWeight?: 300|400|500|600|700|800|900;
  fontFamily?: "heading"|"body"|"mono";
  textAlign?: "left"|"center"|"right";
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: "none"|"uppercase"|"lowercase"|"capitalize";
  color?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  borderStyle?: "solid"|"dashed"|"dotted"|"none";
  boxShadow?: "none"|"sm"|"md"|"lg"|"xl"|string;
  opacity?: number;
  overflow?: "visible"|"hidden"|"auto";
  animation?: "none"|"fade-up"|"fade-in"|"slide-left"|"slide-right"|"scale"|"blur-in"|"bounce-in"|"flip-x"|"flip-y"|"rotate-in"|"zoom-in"|"typewriter";
  animationDelay?: number;
  animationDuration?: number;
  animationEasing?: "ease"|"ease-in"|"ease-out"|"ease-in-out"|"spring"|"bounce";
  scrollTrigger?: "none"|"reveal"|"parallax";
  parallaxSpeed?: number;
  hoverEffect?: "none"|"lift"|"tilt-3d"|"glow"|"grow"|"shake";
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  hoverScale?: number;
  hoverOpacity?: number;
  hoverBackgroundColor?: string;
  cursor?: "default"|"pointer";
  customCss?: string;
}

// ─── Section Styles (Frame properties) ────────────────────────────

export interface SectionStyles {
  // ── Figma frame properties (position on canvas) ─────
  frameX?: number;      // Frame X on canvas
  frameY?: number;      // Frame Y on canvas
  frameWidth?: number;  // Frame width (default 1440)
  frameHeight?: number; // Frame height (auto-expand or fixed)

  layout?: "absolute"|"stack"|"flex-row"|"flex-col"|"grid"|"center";
  gap?: number;
  alignItems?: "start"|"center"|"end"|"stretch";
  justifyContent?: "start"|"center"|"end"|"between";
  columns?: number;
  minHeight?: string;
  maxWidth?: string;
  fullWidth?: boolean;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  backgroundOverlay?: string;
  borderTop?: boolean;
  borderBottom?: boolean;
  borderColor?: string;
  overflow?: "visible"|"hidden";
  staggerChildren?: boolean;
  staggerAnimation?: "fade-up"|"fade-in"|"slide-left"|"slide-right"|"scale"|"blur-in"|"bounce-in"|"flip-x"|"flip-y"|"rotate-in"|"zoom-in";
  staggerDelay?: number; // ms between each child animation (default 100)
  staggerFrom?: "start"|"center"|"end"|"random";
}

// ═══════════════════════════════════════════════════════════════════
//  RELATION TYPES
// ═══════════════════════════════════════════════════════════════════

export type BlockWithStyles = Block & {
  content: Record<string, unknown>;
  styles: BlockStyles;
  tabletStyles: Partial<BlockStyles>;
  mobileStyles: Partial<BlockStyles>;
};

export type SectionWithBlocks = Section & {
  blocks: BlockWithStyles[];
  styles: SectionStyles;
};

export type PortfolioWithRelations = Portfolio & {
  sections: SectionWithBlocks[];
  theme: Theme | null;
  template: Template | null;
  user: Pick<User, "id" | "name" | "username" | "image">;
};

export type PortfolioListItem = Pick<
  Portfolio,
  "id" | "title" | "slug" | "status" | "viewCount" | "updatedAt" | "isDefault"
> & {
  _count: { sections: number };
  template: Pick<Template, "name" | "thumbnail"> | null;
};

// ─── Mutations ────────────────────────────────────────────────────

export interface CreatePortfolioInput { title: string; slug: string; description?: string; templateId?: string; }
export interface UpdatePortfolioInput { title?: string; slug?: string; description?: string; status?: PortfolioStatus; templateId?: string; isDefault?: boolean; }
export interface CreateSectionInput { name: string; sortOrder?: number; styles?: SectionStyles; }
export interface UpdateSectionInput { name?: string; sortOrder?: number; isVisible?: boolean; isLocked?: boolean; styles?: SectionStyles; }
export interface CreateBlockInput { sectionId: string; type: BlockType; sortOrder?: number; content: Record<string, unknown>; styles?: BlockStyles; }
export interface UpdateBlockInput { content?: Record<string, unknown>; styles?: BlockStyles; sortOrder?: number; isVisible?: boolean; isLocked?: boolean; }
export interface ReorderInput { items: Array<{id: string; sortOrder: number}>; }

// ─── Theme Tokens ─────────────────────────────────────────────────

export interface ThemeTokens {
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  fontHeading: string;
  fontBody: string;
  fontMono: string;
  borderRadius: string;
  customCss?: string;
}

// ─── Builder Selection ────────────────────────────────────────────

export interface BuilderSelection {
  type: "section" | "block" | null;
  id: string | null;
  sectionId?: string | null;
}

// ─── Block Definition (registry metadata) ─────────────────────────

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  category: "typography"|"media"|"interactive"|"data"|"composite"|"layout"|"integrations"|"shapes";
  description: string;
  defaultContent: Record<string, unknown>;
  defaultStyles: BlockStyles;
}

// ─── Re-exports ───────────────────────────────────────────────────

export type { Portfolio, Section, Block, Theme, Template, User, PortfolioStatus, ThemeMode };
