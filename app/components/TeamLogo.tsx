import React from 'react';
import Image from 'next/image';

interface TeamLogoProps {
  abbrev: string;
  size?: number;
}

export function TeamLogo({ abbrev, size = 24 }: TeamLogoProps) {
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