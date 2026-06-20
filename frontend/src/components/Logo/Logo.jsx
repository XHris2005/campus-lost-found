export default function Logo({ size = 32 }) {
  return (
    <img
      src="/unical-logo.png"
      alt="University of Calabar Logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  );
}