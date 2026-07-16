import { Image, Text, View } from 'react-native';

import { fontFamilies } from '@/theme/typography';

const fullLogo = require('../../assets/branding/logo-full.png');

export function BootSplash() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#04111d',
        paddingHorizontal: 24,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '24%',
          height: 220,
          width: 220,
          borderRadius: 999,
          backgroundColor: 'rgba(201, 255, 69, 0.16)',
        }}
      />
      <Image source={fullLogo} resizeMode="contain" style={{ width: 220, height: 112 }} />
      <Text
        style={{
          marginTop: 28,
          color: '#c9ff45',
          fontSize: 12,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          fontFamily: fontFamilies.bodyStrong,
        }}
      >
        Local-first solar tracking
      </Text>
      <Text
        style={{
          marginTop: 10,
          color: '#f5f9ff',
          fontSize: 15,
          textAlign: 'center',
          fontFamily: fontFamilies.body,
        }}
      >
        Loading your saved setup and readings…
      </Text>
    </View>
  );
}
