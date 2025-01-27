import React from 'react';

interface TeamLogoProps {
  abbrev: string;
  size?: number;
}

export function TeamLogo({ abbrev, size = 24 }: TeamLogoProps) {
  // For now, we'll use a simple placeholder circle with the team abbreviation
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="#1a365d" />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="8"
        fontWeight="bold"
        fontFamily="system-ui"
      >
        {abbrev}
      </text>
    </svg>
  );
} 