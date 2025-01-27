import React from 'react';
import Image from 'next/image';

interface TeamLogoProps {
  abbrev?: string;
  size: number;
}

export function TeamLogo({ abbrev, size }: TeamLogoProps) {
  if (!abbrev) {
    // Return a placeholder or empty div if no abbreviation is provided
    return <div style={{ width: size, height: size }} />;
  }

  return (
    <div style={{ width: size, height: size }}>
      <Image
        src={`/assets/${abbrev.toLowerCase()}.png`}
        alt={`${abbrev} logo`}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
} 