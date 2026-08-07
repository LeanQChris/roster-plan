export default function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-lg bg-primary text-white ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 9.5h18" />
      </svg>
    </span>
  );
}