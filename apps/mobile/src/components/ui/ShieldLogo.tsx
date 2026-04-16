import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export default function ShieldLogo({ primary }: { primary: string }) {
  return (
    <Svg width={88} height={100} viewBox="0 0 80 92" fill="none">
      <Path
        fillRule="evenodd"
        d="M40 0L80 18V52C80 72 60 88 40 92C20 88 0 72 0 52V18L40 0Z M29 34H51Q55 34 55 39V57Q55 62 51 62H29Q25 62 25 57V39Q25 34 29 34Z M30 34Q30 25 40 25Q50 25 50 34Z M33 34Q33 29 40 29Q47 29 47 34Z"
        fill={primary}
      />
      <Circle cx="40" cy="46" r="4" fill={primary} />
      <Rect x="39" y="50" width="2" height="7" rx="1" fill={primary} />
    </Svg>
  );
}
