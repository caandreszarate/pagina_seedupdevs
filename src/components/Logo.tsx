'use client';

interface LogoProps {
  size?: number;
  animated?: boolean;
}

export default function Logo({ size = 64, animated = false }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'animate-float' : ''}
    >
      <defs>
        {/* Glow filter for chip */}
        <filter id="chipGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Strong glow */}
        <filter id="strongGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft glow */}
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Metallic gradient for outer shield */}
        <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C8D8E8" />
          <stop offset="30%" stopColor="#8FA8C0" />
          <stop offset="60%" stopColor="#6080A0" />
          <stop offset="100%" stopColor="#3A5070" />
        </linearGradient>

        {/* Metallic gradient for broken pieces */}
        <linearGradient id="metalBroken" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#B0C8DC" />
          <stop offset="50%" stopColor="#D8E8F0" />
          <stop offset="100%" stopColor="#9AB0C4" />
        </linearGradient>

        {/* Inner dark gradient */}
        <radialGradient id="innerDark" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0A1828" />
          <stop offset="100%" stopColor="#050D18" />
        </radialGradient>

        {/* Chip core gradient */}
        <radialGradient id="chipCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#80F8FF" />
          <stop offset="40%" stopColor="#00E8FF" />
          <stop offset="100%" stopColor="#00A8D0" />
        </radialGradient>

        {/* Chip body gradient */}
        <linearGradient id="chipBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0A2840" />
          <stop offset="100%" stopColor="#061520" />
        </linearGradient>

        {/* Clip path for inner shield area */}
        <clipPath id="innerClip">
          <path d="M60 12 C60 12 100 35 100 70 C100 100 78 122 60 130 C42 122 20 100 20 70 C20 35 60 12 60 12 Z" />
        </clipPath>
      </defs>

      {/* ── OUTER SHIELD (diamond-oval shape) ── */}
      {/* Main shield body — pointed oval */}
      <path
        d="M60 4 C72 18 108 38 108 70 C108 104 82 126 60 136 C38 126 12 104 12 70 C12 38 48 18 60 4 Z"
        fill="url(#metalGrad)"
        stroke="#7090B0"
        strokeWidth="0.5"
      />

      {/* Inner shield — darker inset */}
      <path
        d="M60 12 C70 24 100 42 100 70 C100 100 78 120 60 128 C42 120 20 100 20 70 C20 42 50 24 60 12 Z"
        fill="url(#innerDark)"
      />

      {/* Metallic rim highlight top-left */}
      <path
        d="M60 4 C52 12 38 22 26 36 C20 44 14 56 12 70"
        fill="none"
        stroke="#D0E4F4"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />


      {/* ── CIRCUIT TRACES (radiating from center chip) ── */}
      {/* All traces are cyan with glow */}
      <g filter="url(#softGlow)" stroke="#00D8F0" strokeWidth="1" strokeLinecap="round">

        {/* Top traces */}
        <polyline points="60,52 60,44 54,38" fill="none" />
        <circle cx="54" cy="37" r="1.5" fill="#00D8F0" />

        <polyline points="60,52 60,44 66,38" fill="none" />
        <circle cx="66" cy="37" r="1.5" fill="#00D8F0" />

        <polyline points="60,52 60,42 60,34" fill="none" />
        <circle cx="60" cy="33" r="1.5" fill="#00D8F0" />

        {/* Bottom traces */}
        <polyline points="60,78 60,86 54,92" fill="none" />
        <circle cx="54" cy="93" r="1.5" fill="#00D8F0" />

        <polyline points="60,78 60,86 66,92" fill="none" />
        <circle cx="66" cy="93" r="1.5" fill="#00D8F0" />

        <polyline points="60,78 60,88 60,96" fill="none" />
        <circle cx="60" cy="97" r="1.5" fill="#00D8F0" />

        {/* Bottom-far traces */}
        <polyline points="60,78 56,90 48,100" fill="none" />
        <circle cx="47" cy="101" r="1.5" fill="#00D8F0" />

        <polyline points="60,78 64,90 72,100" fill="none" />
        <circle cx="73" cy="101" r="1.5" fill="#00D8F0" />

        {/* Left traces */}
        <polyline points="48,65 38,65 32,60" fill="none" />
        <circle cx="31" cy="60" r="1.5" fill="#00D8F0" />

        <polyline points="48,70 36,70 30,70" fill="none" />
        <circle cx="29" cy="70" r="1.5" fill="#00D8F0" />

        <polyline points="48,75 38,75 32,80" fill="none" />
        <circle cx="31" cy="80" r="1.5" fill="#00D8F0" />

        {/* Left-far traces */}
        <polyline points="48,65 40,58 34,52" fill="none" />
        <circle cx="33" cy="51" r="1.5" fill="#00D8F0" />

        <polyline points="48,75 40,82 34,88" fill="none" />
        <circle cx="33" cy="89" r="1.5" fill="#00D8F0" />

        {/* Right traces */}
        <polyline points="72,65 82,65 88,60" fill="none" />
        <circle cx="89" cy="60" r="1.5" fill="#00D8F0" />

        <polyline points="72,70 84,70 90,70" fill="none" />
        <circle cx="91" cy="70" r="1.5" fill="#00D8F0" />

        <polyline points="72,75 82,75 88,80" fill="none" />
        <circle cx="89" cy="80" r="1.5" fill="#00D8F0" />

        {/* Right-far traces */}
        <polyline points="72,65 80,58 86,52" fill="none" />
        <circle cx="87" cy="51" r="1.5" fill="#00D8F0" />

        <polyline points="72,75 80,82 86,88" fill="none" />
        <circle cx="87" cy="89" r="1.5" fill="#00D8F0" />

        {/* Top-left diagonal */}
        <polyline points="52,52 44,44 38,38" fill="none" />
        <circle cx="37" cy="37" r="1.5" fill="#00D8F0" />

        {/* Top-right diagonal */}
        <polyline points="68,52 76,44 82,38" fill="none" />
        <circle cx="83" cy="37" r="1.5" fill="#00D8F0" />
      </g>

      {/* ── CHIP PACKAGE ── */}
      {/* Chip outer border with glow */}
      <rect
        x="44" y="50" width="32" height="30" rx="3"
        fill="url(#chipBody)"
        stroke="#00D8F0"
        strokeWidth="1.5"
        filter="url(#chipGlow)"
      />

      {/* Chip pin rows — top */}
      <g stroke="#00D8F0" strokeWidth="1.2" filter="url(#softGlow)">
        <line x1="50" y1="50" x2="50" y2="46" />
        <line x1="55" y1="50" x2="55" y2="46" />
        <line x1="60" y1="50" x2="60" y2="46" />
        <line x1="65" y1="50" x2="65" y2="46" />
        <line x1="70" y1="50" x2="70" y2="46" />

        {/* Bottom pins */}
        <line x1="50" y1="80" x2="50" y2="84" />
        <line x1="55" y1="80" x2="55" y2="84" />
        <line x1="60" y1="80" x2="60" y2="84" />
        <line x1="65" y1="80" x2="65" y2="84" />
        <line x1="70" y1="80" x2="70" y2="84" />

        {/* Left pins */}
        <line x1="44" y1="56" x2="40" y2="56" />
        <line x1="44" y1="61" x2="40" y2="61" />
        <line x1="44" y1="66" x2="40" y2="66" />
        <line x1="44" y1="71" x2="40" y2="71" />
        <line x1="44" y1="76" x2="40" y2="76" />

        {/* Right pins */}
        <line x1="76" y1="56" x2="80" y2="56" />
        <line x1="76" y1="61" x2="80" y2="61" />
        <line x1="76" y1="66" x2="80" y2="66" />
        <line x1="76" y1="71" x2="80" y2="71" />
        <line x1="76" y1="76" x2="80" y2="76" />
      </g>

      {/* ── CHIP CORE (glowing center) ── */}
      {/* Outer chip face */}
      <rect
        x="47" y="53" width="26" height="24" rx="2"
        fill="#061828"
        stroke="#00B8D8"
        strokeWidth="0.8"
      />

      {/* Inner bright core */}
      <rect
        x="51" y="57" width="18" height="16" rx="2"
        fill="url(#chipCore)"
        filter="url(#strongGlow)"
      />

      {/* Core highlight */}
      <rect
        x="51" y="57" width="18" height="7" rx="2"
        fill="white"
        opacity="0.25"
      />

      {/* Core center line details */}
      <line x1="60" y1="58" x2="60" y2="72" stroke="#C0F8FF" strokeWidth="0.5" opacity="0.5" />
      <line x1="52" y1="65" x2="68" y2="65" stroke="#C0F8FF" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}
