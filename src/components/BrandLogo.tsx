import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface BrandLogoProps {
  size?: number;
  withGlow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 120, withGlow = false }) => {
  const height = size * 0.85;

  return (
    <View style={[styles.container, withGlow && styles.glow, { width: size, height }]}> 
      <Svg width={size} height={height} viewBox="0 0 200 170" fill="none">
        <Path
          d="M100 12 L136 84 L100 158 L64 84 Z"
          fill="#f5d800"
        />
        <Path
          d="M64 84 L20 96 L46 46 L86 76 Z"
          fill="#f5d800"
        />
        <Path
          d="M136 84 L180 96 L154 46 L114 76 Z"
          fill="#f5d800"
        />
        <Circle cx="90" cy="92" r="10" fill="#0f172a" />
        <Circle cx="118" cy="92" r="10" fill="#0f172a" />
        <Rect x="103" y="108" width="18" height="22" rx="5" fill="#e51515" />
        <Path d="M103 128 L112 150 L121 128 Z" fill="#d10f0f" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    backgroundColor: 'rgba(245, 216, 0, 0.12)',
    borderRadius: 24,
    padding: 8,
  },
});
