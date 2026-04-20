import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Rect, G } from 'react-native-svg';
import type { Chain } from '@iron-vault/wallet';

export function EthIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="ethGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A78BFA" />
          <Stop offset="1" stopColor="#3B82F6" />
        </LinearGradient>
      </Defs>
      <Path d="M12 2L4.5 14L12 18V2Z" fill="url(#ethGrad)" />
      <Path d="M12 2L19.5 14L12 18V2Z" fill="url(#ethGrad)" opacity="0.6" />
      <Path d="M12 19.5V22L4.5 15.5L12 19.5Z" fill="url(#ethGrad)" />
      <Path d="M12 19.5V22L19.5 15.5L12 19.5Z" fill="url(#ethGrad)" opacity="0.6" />
    </Svg>
  );
}

export function SolIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 101 88" fill="none">
      <Defs>
        <LinearGradient id="solGrad" x1="8.52558" y1="90.0973" x2="88.9933" y2="-3.01622" gradientUnits="userSpaceOnUse">
          <Stop offset="0.08" stopColor="#9945FF" />
          <Stop offset="0.3" stopColor="#8752F3" />
          <Stop offset="0.5" stopColor="#5497D5" />
          <Stop offset="0.6" stopColor="#43B4CA" />
          <Stop offset="0.72" stopColor="#28E0B9" />
          <Stop offset="0.97" stopColor="#19FB9B" />
        </LinearGradient>
      </Defs>
      <Path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z" fill="url(#solGrad)" />
    </Svg>
  );
}

export function BtcIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="btcGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F7931A" />
          <Stop offset="1" stopColor="#E8650A" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="10" fill="url(#btcGrad)" />
      <Path d="M14.5 10.5C14.5 9.4 13.7 8.7 12.5 8.5V7H11.5V8.4C11.2 8.4 10.8 8.4 10.5 8.5V7H9.5V8.5C9.2 8.5 8.9 8.5 8.7 8.6L8.7 9.7C8.9 9.6 9.2 9.6 9.5 9.6V14.4C9.2 14.4 8.9 14.4 8.7 14.3L8.7 15.4C8.9 15.5 9.2 15.5 9.5 15.5V17H10.5V15.6C10.8 15.6 11.1 15.6 11.5 15.5V17H12.5V15.5C13.8 15.3 14.7 14.5 14.7 13.3C14.7 12.4 14.2 11.8 13.4 11.5C14.1 11.2 14.5 10.9 14.5 10.5ZM10.5 9.6H11.8C12.5 9.6 13 9.9 13 10.6C13 11.3 12.5 11.6 11.8 11.6H10.5V9.6ZM12 14.4H10.5V12.6H12C12.8 12.6 13.2 13 13.2 13.5C13.2 14 12.8 14.4 12 14.4Z" fill="white" />
    </Svg>
  );
}

export function TronIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="tronGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FF4136" />
          <Stop offset="1" stopColor="#C0160E" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="10" fill="url(#tronGrad)" />
      <Path d="M17 9.5L7.5 7L10 17L13.5 13L17 9.5Z" fill="white" opacity="0.9" />
      <Path d="M10 17L13.5 13L10.8 12.2L10 17Z" fill="white" opacity="0.5" />
    </Svg>
  );
}

export function SuiIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="suiGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#6FBCF0" />
          <Stop offset="1" stopColor="#007DC3" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="10" fill="url(#suiGrad)" />
      <Path d="M12 6C10.3 6 9 7.1 9 8.5C9 9.5 9.6 10.3 10.5 10.8L12 11.8L13.5 10.8C14.4 10.3 15 9.5 15 8.5C15 7.1 13.7 6 12 6Z" fill="white" />
      <Path d="M9.5 12.5C8.6 13 8 13.9 8 15C8 16.7 9.8 18 12 18C14.2 18 16 16.7 16 15C16 13.9 15.4 13 14.5 12.5L12 14L9.5 12.5Z" fill="white" opacity="0.8" />
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
