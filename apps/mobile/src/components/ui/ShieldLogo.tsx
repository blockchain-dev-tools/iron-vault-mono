import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export default function ShieldLogo({ primary }: { primary: string }) {
  return (
    <Svg width={88} height={100} viewBox="0 0 80 92" fill="none">
      <Path
        fillRule="evenodd"
        d="M40 0L80 18V52C80 72 60 88 40 92C20 88 0 72 0 52V18L40 0Z M32 32H48Q52 32 52 36V58Q52 62 48 62H32Q28 62 28 58V36Q28 32 32 32Z M33 32Q33 24 40 24Q47 24 47 32Z M36 32Q36 27 40 27Q44 27 44 32Z"
        fill={primary}
      />
      <Circle cx="40" cy="47" r="3" fill={primary} />
      <Rect x="39" y="49" width="2" height="6" rx="1" fill={primary} />
    </Svg>
  );
}
