export default function Logo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path
        d="M16 2L4 7v8c0 6.5 5.1 12.6 12 14 6.9-1.4 12-7.5 12-14V7L16 2z"
        fill="url(#shield-grad)"
      />
      {/* Location pin */}
      <circle cx="16" cy="13" r="3" fill="white" />
      <path
        d="M16 10c-2.8 0-5 2.2-5 5 0 3.5 5 9 5 9s5-5.5 5-9c0-2.8-2.2-5-5-5z"
        fill="white"
      />
      <circle cx="16" cy="15" r="1.8" fill="url(#shield-grad)" />
    </svg>
  );
}