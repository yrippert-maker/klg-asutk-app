/**
 * REFLY: кастомные иконки бренда + маппинги Lucide для Sidebar, статусов и общих действий.
 * Иконки в стиле Lucide: 24×24, stroke 2, round.
 */
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Plane,
  ClipboardList,
  CheckSquare,
  SearchCheck,
  AlertTriangle,
  Users,
  Calendar,
  Wrench,
  Bug,
  GitBranch,
  FileText,
  Inbox,
  BookOpen,
  Activity,
  History,
  Code2,
  BarChart2,
  User,
  HelpCircle,
  Settings,
  Landmark,
  Shield,
  File,
  Send,
  Search,
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
  Clock,
  BadgeCheck,
  CircleDot,
  LoaderCircle,
  Check,
  Ban,
  MinusCircle,
  AlertOctagon,
  AlertCircle,
  FilePlus,
  Printer,
  Download,
  Bell,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

/** Lucide-like props (compatible with lucide usage) */
export type ReflyIconProps = React.SVGProps<SVGSVGElement> & { size?: number | string };

const base = (props: ReflyIconProps) => {
  const { size = 24, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
};

/* -----------------------
   REFLY brand primitives
----------------------- */

/** Shield container (brand geometry) */
export const ReflyShield = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
  </svg>
);

/** Main compliance icon: shield + check + trajectory */
export const ReflyShieldCheck = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M8.2 13.2L20 6.8" />
    <path d="M7.2 12.7l2.1 2.2L12.8 11" />
  </svg>
);

/** Non-compliance: shield + X */
export const ReflyShieldX = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M9.5 10.5l5 5" />
    <path d="M14.5 10.5l-5 5" />
  </svg>
);

/** Airworthiness: shield + trajectory + check */
export const ReflyAirworthiness = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M6.8 14.2c3.2-2.4 6.6-4.8 10.4-7.4" />
    <path d="M7.6 12.8l2 2.1l3.2-3.1" />
  </svg>
);

/** Continued airworthiness: cycle + check */
export const ReflyContinuedAirworthiness = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M7 7a7 7 0 0 1 12 3" />
    <path d="M19 10V7h-3" />
    <path d="M17 17a7 7 0 0 1-12-3" />
    <path d="M5 14v3h3" />
    <path d="M10 12.5l1.6 1.7L14.5 11" />
  </svg>
);

/** Specialist: person + small badge */
export const ReflySpecialist = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 12c2 0 3.5-1.6 3.5-3.5S14 5 12 5S8.5 6.6 8.5 8.5S10 12 12 12z" />
    <path d="M6.5 20c1.2-3 3.4-5 5.5-5s4.3 2 5.5 5" />
    <path d="M18 15l2 1v2c0 1.5-1 2.8-2 3c-1-.2-2-1.5-2-3v-2l2-1z" />
  </svg>
);

/** Regulator: shield + star/marker (орган надзора) */
export const ReflyRegulator = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M12 7.2l.7 1.6l1.7.2l-1.3 1.1l.4 1.7L12 11l-1.5.8l.4-1.7L9.6 9l1.7-.2l.7-1.6z" />
  </svg>
);

/** Aircraft (ВС) */
export const ReflyAircraft = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 3v10" />
    <path d="M4.5 11.5L12 14l7.5-2.5" />
    <path d="M12 13.5v7.5" />
    <path d="M9 22l3-1.6L15 22" />
    <path d="M6 8.2c2.2-1.3 4.5-2.5 7.2-3.7" />
  </svg>
);

/** Audits: shield + magnifier */
export const ReflyAudits = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <circle cx="10" cy="13.5" r="2.5" />
    <path d="M11.8 15.3L13.8 17.3" />
  </svg>
);

/** Documents */
export const ReflyDocuments = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M7 3h7l3 3v15H7V3z" />
    <path d="M14 3v4h4" />
    <path d="M9 11h6" />
    <path d="M9 14h6" />
    <path d="M18 12l2 1v2c0 1.5-1 2.8-2 3c-1-.2-2-1.5-2-3v-2l2-1z" />
  </svg>
);

/** Defects */
export const ReflyDefects = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M12 10.5c1.7 0 3 1.3 3 3v1c0 1.7-1.3 3-3 3s-3-1.3-3-3v-1c0-1.7 1.3-3 3-3z" />
    <path d="M10 10l-1-1" />
    <path d="M14 10l1-1" />
    <path d="M9.5 13H8" />
    <path d="M16 13h-1.5" />
  </svg>
);

/** Risks */
export const ReflyRisks = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M12 9v5" />
    <path d="M12 17h.01" />
  </svg>
);

/** Maintenance */
export const ReflyMaintenance = (props: ReflyIconProps) => (
  <svg {...base(props)}>
    <path d="M14.5 6.5a3 3 0 0 0-4 3.5l-4.8 4.8a1.5 1.5 0 0 0 2.1 2.1l4.8-4.8a3 3 0 0 0 3.5-4l-2 2l-2-2l2-2z" />
    <path d="M19 13l2 1v2c0 1.5-1 2.8-2 3c-1-.2-2-1.5-2-3v-2l2-1z" />
  </svg>
);

/* -----------------------
   ICON MAPS
----------------------- */

export type SidebarKey =
  | "dashboard"
  | "organizations"
  | "aircraft"
  | "applications"
  | "checklists"
  | "audits"
  | "risks"
  | "users"
  | "airworthiness"
  | "calendar"
  | "airworthiness-core"
  | "maintenance"
  | "defects"
  | "modifications"
  | "documents"
  | "inbox"
  | "regulations"
  | "monitoring"
  | "audit-history"
  | "api-docs"
  | "analytics"
  | "personnel-plg"
  | "profile"
  | "help"
  | "settings"
  | "fgis-revs"
  | "regulator";

export const sidebarIcons: Record<SidebarKey, LucideIcon | React.FC<ReflyIconProps>> = {
  dashboard: LayoutDashboard,
  organizations: Building2,
  aircraft: ReflyAircraft,
  applications: ClipboardList,
  checklists: CheckSquare,
  audits: ReflyAudits,
  risks: ReflyRisks,
  users: Users,
  airworthiness: ReflyAirworthiness,
  calendar: Calendar,
  "airworthiness-core": ReflyContinuedAirworthiness,
  maintenance: ReflyMaintenance,
  defects: ReflyDefects,
  modifications: GitBranch,
  documents: ReflyDocuments,
  inbox: Inbox,
  regulations: BookOpen,
  monitoring: Activity,
  "audit-history": History,
  "api-docs": Code2,
  analytics: BarChart2,
  "personnel-plg": ReflySpecialist,
  profile: User,
  help: HelpCircle,
  settings: Settings,
  "fgis-revs": Landmark,
  regulator: ReflyRegulator,
};

export type StatusKey =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "remarks"
  | "expired"
  | "active"
  | "grounded"
  | "maintenance"
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "compliant"
  | "non_compliant"
  | "not_applicable"
  | "critical"
  | "high"
  | "medium"
  | "low";

export const statusIcons: Record<StatusKey, LucideIcon | React.FC<ReflyIconProps>> = {
  draft: File,
  submitted: Send,
  under_review: Search,
  approved: CheckCircle2,
  rejected: XCircle,
  remarks: MessageSquareWarning,
  expired: Clock,
  active: BadgeCheck,
  grounded: Ban,
  maintenance: Wrench,
  open: CircleDot,
  in_progress: LoaderCircle,
  completed: Check,
  cancelled: Ban,
  compliant: ReflyShieldCheck,
  non_compliant: ReflyShieldX,
  not_applicable: MinusCircle,
  critical: AlertOctagon,
  high: AlertTriangle,
  medium: AlertCircle,
  low: Shield,
};

export const commonIcons = {
  templates: FilePlus,
  print: Printer,
  export: Download,
  notifications: Bell,
  logout: LogOut,
  themeDark: Moon,
  themeLight: Sun,
  search: Search,
} satisfies Record<string, LucideIcon>;
