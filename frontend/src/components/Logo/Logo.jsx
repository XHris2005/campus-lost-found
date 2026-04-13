export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="#10b981"/>
      <path
        d="M22 12.5C20.5 10.6 18.4 9.5 16 9.5C11.9 9.5 8.5 12.9 8.5 17C8.5 21.1 11.9 24.5 16 24.5C19.3 24.5 22.1 22.4 23.1 19.5"
        stroke="white" strokeWidth="2.2" strokeLinecap="round"
      />
      <path
        d="M19.5 8.5L23.5 12L19.5 15"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}