import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G } from 'react-native-svg';
import type { Chain } from '@iron-vault/wallet';

export function EthIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path fill="#627eea" d="M8 16c4.4183 0 8-3.5817 8-8 0-4.41828-3.5817-8-8-8C3.58172 0 0 3.58172 0 8c0 4.4183 3.58172 8 8 8Z" />
      <Path fill="#ffffff" fillOpacity="0.602" d="M8.249 2v4.435l3.7485 1.675L8.249 2Z" />
      <Path fill="#ffffff" d="M8.249 2 4.5 8.11l3.749-1.675V2Z" />
      <Path fill="#ffffff" fillOpacity="0.602" d="M8.249 10.984v3.0135L12 8.808l-3.751 2.176Z" />
      <Path fill="#ffffff" d="M8.249 13.9975v-3.014L4.5 8.808l3.749 5.1895Z" />
      <Path fill="#ffffff" fillOpacity="0.2" d="m8.249 10.28645 3.7485-2.1765-3.7485-1.674v3.8505Z" />
      <Path fill="#ffffff" fillOpacity="0.602" d="m4.5 8.10995 3.749 2.1765v-3.8505L4.5 8.10995Z" />
    </Svg>
  );
}

export function SolIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 397.7 311.7" fill="none">
      <Defs>
        <LinearGradient id="solGrad1" gradientUnits="userSpaceOnUse" x1="360.8791" y1="351.4553" x2="141.213" y2="-69.2936" gradientTransform="matrix(1 0 0 -1 0 314)">
          <Stop offset="0" stopColor="#00FFA3" />
          <Stop offset="1" stopColor="#DC1FFF" />
        </LinearGradient>
        <LinearGradient id="solGrad2" gradientUnits="userSpaceOnUse" x1="264.8291" y1="401.6014" x2="45.163" y2="-19.1475" gradientTransform="matrix(1 0 0 -1 0 314)">
          <Stop offset="0" stopColor="#00FFA3" />
          <Stop offset="1" stopColor="#DC1FFF" />
        </LinearGradient>
        <LinearGradient id="solGrad3" gradientUnits="userSpaceOnUse" x1="312.5484" y1="376.688" x2="92.8822" y2="-44.061" gradientTransform="matrix(1 0 0 -1 0 314)">
          <Stop offset="0" stopColor="#00FFA3" />
          <Stop offset="1" stopColor="#DC1FFF" />
        </LinearGradient>
      </Defs>
      <G transform="translate(59.66, 46.76) scale(0.70)">
        <Path fill="url(#solGrad1)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z" />
        <Path fill="url(#solGrad2)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z" />
        <Path fill="url(#solGrad3)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z" />
      </G>
    </Svg>
  );
}

export function BtcIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0.004 0 64 64" fill="none">
      <Path d="M63.04 39.741c-4.274 17.143-21.638 27.575-38.783 23.301C7.12 58.768-3.313 41.404.962 24.262 5.234 7.117 22.597-3.317 39.737.957c17.144 4.274 27.576 21.64 23.302 38.784z" fill="#f7931a" />
      <Path d="M46.11 27.441c.636-4.258-2.606-6.547-7.039-8.074l1.438-5.768-3.512-.875-1.4 5.616c-.922-.23-1.87-.447-2.812-.662l1.41-5.653-3.509-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.68 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117l-.37-.092-2.297 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.02 4.57 1.139c.85.213 1.683.436 2.502.646l-1.453 5.835 3.507.875 1.44-5.772c.957.26 1.887.5 2.797.726L27.504 50.8l3.511.875 1.453-5.823c5.987 1.133 10.49.676 12.383-4.738 1.527-4.36-.075-6.875-3.225-8.516 2.294-.531 4.022-2.04 4.483-5.157zM38.087 38.69c-1.086 4.36-8.426 2.004-10.807 1.412l1.928-7.729c2.38.594 10.011 1.77 8.88 6.317zm1.085-11.312c-.99 3.966-7.1 1.951-9.083 1.457l1.748-7.01c1.983.494 8.367 1.416 7.335 5.553z" fill="#ffffff" />
    </Svg>
  );
}

export function TronIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path fill="#ef0027" d="M8 16c4.4183 0 8-3.5817 8-8 0-4.41828-3.5817-8-8-8C3.58172 0 0 3.58172 0 8c0 4.4183 3.58172 8 8 8Z" />
      <Path fill="#ffffff" d="M10.966 4.95654 3.75 3.62854l3.7975 9.55601 5.2915-6.447-1.873-1.78101ZM10.85 5.54155l1.104 1.0495-3.019 0.5465 1.915-1.596Zm-2.571 1.4865-3.182-2.63901 5.201 0.95701-2.019 1.682Zm-0.2265 0.467-0.519 4.29L4.736 4.74354l3.3165 2.75151Zm0.48 0.2275 3.3435-0.605-3.835 4.6715 0.4915-4.0665Z" />
    </Svg>
  );
}

export function SuiIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
      <Circle cx="128" cy="128" r="128" fill="#6FBCF0" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M66.6,194.6c12.8,22.2,35.8,35.5,61.4,35.5c25.6,0,48.6-13.3,61.4-35.5c12.8-22.2,12.8-48.7,0-70.9l-54-93.6c-3.3-5.7-11.5-5.7-14.8,0l-54,93.6C53.7,145.9,53.7,172.4,66.6,194.6L66.6,194.6z M112.8,74.6l11.5-20c1.6-2.8,5.8-2.8,7.4,0l44.3,76.8c8.1,14.1,9.7,30.4,4.6,45.4c-0.5-2.4-1.3-4.9-2.3-7.4c-6.1-15.5-20-27.4-41.2-35.4c-14.6-5.5-23.9-13.7-27.6-24.2C104.7,96.2,109.8,81.4,112.8,74.6L112.8,74.6z M93.1,108.6L80,131.4c-10,17.4-10,38.1,0,55.5c10,17.4,28,27.7,48,27.7c13.3,0,25.7-4.6,35.5-12.7c1.3-3.2,5.2-14.9,0.3-27c-4.5-11.2-15.3-20.1-32.2-26.5c-19-7.2-31.4-18.5-36.8-33.5C94.1,112.8,93.6,110.7,93.1,108.6z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

const ICONS: Record<Chain, (props: { size?: number }) => React.ReactElement> = {
  eth: EthIcon, sol: SolIcon, btc: BtcIcon, tron: TronIcon, sui: SuiIcon,
};

export default function ChainIcon({ chain, size = 22 }: { chain: Chain; size?: number }) {
  const IconComponent = ICONS[chain];
  return <IconComponent size={size} />;
}
