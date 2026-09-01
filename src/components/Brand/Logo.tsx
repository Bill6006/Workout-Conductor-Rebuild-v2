interface LogoProps {
  /** Rendered size in px. The mark is a square. */
  readonly size?: number;
  readonly className?: string;
}

/**
 * Original Workout Conductor mark: three ascending bars - a progression ramp
 * read as a conductor raising the tempo. No third-party branding.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Workout Conductor"
      className={className}
    >
      <rect width="32" height="32" rx="9" fill="#16181c" />
      <rect x="6.5" y="19" width="5" height="7" rx="2.5" fill="#545a65" />
      <rect x="13.5" y="13" width="5" height="13" rx="2.5" fill="#8fae4a" />
      <rect x="20.5" y="6" width="5" height="20" rx="2.5" fill="#c9f958" />
    </svg>
  );
}
