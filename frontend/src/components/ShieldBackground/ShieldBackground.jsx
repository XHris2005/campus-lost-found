import './ShieldBackground.css';

export default function ShieldBackground({ position = 'right' }) {
  return (
    <div className={`shield-bg shield-bg-${position}`} aria-hidden="true">
      <svg viewBox="0 0 440 440" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="shieldHatch1" x="0" y="0" width="10" height="10"
            patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="0.8"/>
          </pattern>
          <pattern id="shieldHatch2" x="0" y="0" width="10" height="10"
            patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="0.8"/>
          </pattern>
          <clipPath id="shieldClipMain">
            <path d="M220 10 L430 80 L430 240 Q430 380 220 430 Q10 380 10 240 L10 80 Z"/>
          </clipPath>
        </defs>
        <path
          d="M220 10 L430 80 L430 240 Q430 380 220 430 Q10 380 10 240 L10 80 Z"
          fill="none" stroke="currentColor" strokeWidth="1.5"
        />
        <g clipPath="url(#shieldClipMain)">
          <rect x="0" y="0" width="440" height="440" fill="url(#shieldHatch1)"/>
          <rect x="0" y="0" width="440" height="440" fill="url(#shieldHatch2)"/>
        </g>
      </svg>
    </div>
  );
}