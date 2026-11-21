export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg
      className="mark"
      width={size}
      height={(size * 18) / 28}
      viewBox="0 0 28 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="18" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
