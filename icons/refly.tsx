/**
 * REFLY brand icons — Lucide-compatible (24×24, stroke 2, round).
 * Бренд-геометрия: щит, галочка, траектория; без звёзд на 24px.
 */
import * as React from "react";

export type LucideLikeProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const base = (props: LucideLikeProps) => {
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

/** Brand base: shield outline (core container) */
export const ReflyShield = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
  </svg>
);

/** Shield + check + trajectory (main compliance icon) */
export const ReflyShieldCheck = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M8.2 13.2L20 6.8" />
    <path d="M7.2 12.7l2.1 2.2L12.8 11" />
  </svg>
);

/** Aircraft (simple, UI-friendly silhouette) */
export const ReflyAircraft = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 2v8" />
    <path d="M4 11l8 3l8-3" />
    <path d="M12 14v8" />
    <path d="M8 22l4-2l4 2" />
  </svg>
);

/** Helicopter (minimal outline) */
export const ReflyHelicopter = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M6 7h12" />
    <path d="M12 7v2" />
    <path d="M9 9h6" />
    <path d="M7 12c0-1.7 1.3-3 3-3h4c1.7 0 3 1.3 3 3v2H7v-2z" />
    <path d="M6 14h12" />
    <path d="M9 14v3h6v-3" />
    <path d="M8 17h8" />
  </svg>
);

/** UAV / drone (outline) */
export const ReflyUav = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M9 10h6" />
    <path d="M10 10v-2h4v2" />
    <rect x="9" y="10" width="6" height="5" rx="2" />
    <path d="M7 11H5" />
    <path d="M19 11h-2" />
    <path d="M6 9l-2-2" />
    <path d="M18 9l2-2" />
  </svg>
);

/** Specialist (person + badge) */
export const ReflySpecialist = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 12c2 0 3.5-1.6 3.5-3.5S14 5 12 5S8.5 6.6 8.5 8.5S10 12 12 12z" />
    <path d="M6.5 20c1.2-3 3.4-5 5.5-5s4.3 2 5.5 5" />
    <path d="M18 15l2 1v2c0 1.5-1 2.8-2 3c-1-.2-2-1.5-2-3v-2l2-1z" />
  </svg>
);

/** Document + shield (certificates) */
export const ReflyDocument = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M7 3h7l3 3v15H7V3z" />
    <path d="M14 3v4h4" />
    <path d="M9 10h6" />
    <path d="M9 13h6" />
    <path d="M18 12l2 1v2c0 1.5-1 2.8-2 3c-1-.2-2-1.5-2-3v-2l2-1z" />
  </svg>
);

/** Audit (shield + magnifier) */
export const ReflyAudit = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M10.5 3.5L12 2l7 4v6c0 5-3 9-7 10c-1.6-.4-3-1.4-4.2-2.8" />
    <circle cx="8" cy="14" r="3" />
    <path d="M10.2 16.2L12 18" />
  </svg>
);

/** Findings / non-conformities (shield + exclamation) */
export const ReflyFindings = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M12 9v4" />
    <path d="M12 16.5v.5" />
  </svg>
);

/** Directive / requirements (shield + list) */
export const ReflyDirective = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M8 11h8" />
    <path d="M8 14h6" />
    <path d="M8 17h5" />
  </svg>
);

/** Airworthiness (wing/trajectory + check) */
export const ReflyAirworthiness = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M4 14l4-4 4 2 6-6" />
    <path d="M6 18l2-2 2 1 4-4" />
    <path d="M14 10l3 3 4-4" />
  </svg>
);

/** Continued airworthiness (cycle + check) */
export const ReflyContinuedAirworthiness = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M7 7a7 7 0 0 1 12 3" />
    <path d="M19 10V7h-3" />
    <path d="M17 17a7 7 0 0 1-12-3" />
    <path d="M5 14v3h3" />
    <path d="M10 12.5l1.6 1.7L14.5 11" />
  </svg>
);

/** Status: Approved */
export const ReflyStatusApproved = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M8.5 12.5l2.5 2.5 5-5" />
  </svg>
);

/** Status: Conditional */
export const ReflyStatusConditional = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M12 8v4" />
    <path d="M12 16v.5" />
  </svg>
);

/** Status: Rejected */
export const ReflyStatusRejected = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 2l7 4v6c0 5-3 9-7 10c-4-1-7-5-7-10V6l7-4z" />
    <path d="M9 9l6 6" />
    <path d="M15 9l-6 6" />
  </svg>
);

/** Status: Expired */
export const ReflyStatusExpired = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v6l4 2" />
  </svg>
);

/** Checklist */
export const ReflyChecklist = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
    <path d="M9 4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" />
    <path d="M9 11l2 2 4-4" />
    <path d="M9 15h6" />
  </svg>
);

/** Signature */
export const ReflySignature = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M4 18c-1.5 1-3 1.5-4 1.5" />
    <path d="M6 14v-2" />
    <path d="M8 16v-1" />
    <path d="M14 10l2-2 4 4-6 6H8l-2-2" />
    <path d="M16 8l-2-2" />
  </svg>
);

/** Calibration (gauge / instrument) */
export const ReflyCalibration = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 6v2" />
    <path d="M12 16v2" />
    <path d="M6 12h2" />
    <path d="M16 12h2" />
    <path d="M8.3 8.3l1.4 1.4" />
    <path d="M14.3 14.3l1.4 1.4" />
    <path d="M12 10v4l3 2" />
  </svg>
);

/** Export */
export const ReflyExport = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 3v12" />
    <path d="M8 7l4-4 4 4" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

/** Import */
export const ReflyImport = (props: LucideLikeProps) => (
  <svg {...base(props)}>
    <path d="M12 21V9" />
    <path d="M8 13l4 4 4-4" />
    <path d="M4 5v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5" />
  </svg>
);

/*
  Usage in Next.js:
  import { ReflyShieldCheck, ReflyAudit, ReflyDocument } from "@/icons/refly";

  <a className="flex items-center gap-2">
    <ReflyShieldCheck className="h-5 w-5" />
    Compliance
  </a>
  <a className="flex items-center gap-2">
    <ReflyAudit className="h-5 w-5" />
    Audit
  </a>
*/
