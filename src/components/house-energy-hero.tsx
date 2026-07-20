import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

export function HouseEnergyHero() {
  const theme = useAppTheme();
  const isDark = theme.mode === 'dark';
  const skyColor = isDark ? '#0d2237' : '#dff2ff';
  const hillColor = isDark ? '#173d39' : '#bfe9d5';
  const houseColor = isDark ? '#eaf0f5' : '#ffffff';
  const roofColor = isDark ? '#53687a' : '#566878';
  const cloudColor = isDark ? 'rgba(214, 230, 244, 0.72)' : 'rgba(255, 255, 255, 0.88)';

  return (
    <View
      style={{
        height: 178,
        overflow: 'hidden',
        borderRadius: 26,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(39,68,91,0.08)',
        backgroundColor: skyColor,
        boxShadow: isDark ? '0 16px 34px rgba(0,0,0,0.24)' : '0 16px 34px rgba(56,104,137,0.12)',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -38,
          right: -24,
          height: 140,
          width: 140,
          borderRadius: 999,
          backgroundColor: isDark ? 'rgba(95,145,255,0.10)' : 'rgba(255,255,255,0.42)',
        }}
      />

      <View
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          borderRadius: 999,
          backgroundColor: isDark ? 'rgba(5, 18, 32, 0.68)' : 'rgba(255, 255, 255, 0.88)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(39,68,91,0.06)',
          paddingHorizontal: 12,
          paddingVertical: 7,
          zIndex: 5,
        }}
      >
        <Ionicons name="home-outline" size={14} color={isDark ? theme.accent : '#1b6de2'} />
        <Text
          style={{
            color: isDark ? theme.textOnDark : theme.text,
            fontSize: 11,
            fontFamily: fontFamilies.bodyStrong,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Your solar home
        </Text>
      </View>

      <Ionicons
        name="sunny"
        size={38}
        color="#ffbf37"
        style={{ position: 'absolute', top: 18, right: 22, opacity: isDark ? 0.82 : 0.96 }}
      />

      <View style={{ position: 'absolute', top: 49, left: 34, flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={{ height: 18, width: 42, borderRadius: 999, backgroundColor: cloudColor }} />
        <View
          style={{
            height: 27,
            width: 27,
            marginLeft: -31,
            marginBottom: 5,
            borderRadius: 999,
            backgroundColor: cloudColor,
          }}
        />
        <View
          style={{
            height: 22,
            width: 22,
            marginLeft: -8,
            marginBottom: 3,
            borderRadius: 999,
            backgroundColor: cloudColor,
          }}
        />
      </View>

      <View style={{ position: 'absolute', top: 68, right: 72, flexDirection: 'row', alignItems: 'flex-end', opacity: 0.78 }}>
        <View style={{ height: 14, width: 34, borderRadius: 999, backgroundColor: cloudColor }} />
        <View
          style={{
            height: 21,
            width: 21,
            marginLeft: -25,
            marginBottom: 4,
            borderRadius: 999,
            backgroundColor: cloudColor,
          }}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          right: -30,
          bottom: -48,
          height: 132,
          width: 230,
          borderRadius: 999,
          backgroundColor: hillColor,
          opacity: 0.82,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -48,
          bottom: -62,
          height: 142,
          width: 260,
          borderRadius: 999,
          backgroundColor: isDark ? '#12334a' : '#caebf6',
        }}
      />

      <View
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 12,
          height: 122,
          width: 244,
          marginLeft: -122,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 31,
            bottom: 0,
            height: 68,
            width: 182,
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: houseColor,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.44)' : 'rgba(39,68,91,0.12)',
            boxShadow: isDark ? '0 14px 30px rgba(0,0,0,0.28)' : '0 14px 30px rgba(56,104,137,0.16)',
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 20,
            bottom: 59,
            width: 0,
            height: 0,
            borderLeftWidth: 102,
            borderRightWidth: 102,
            borderBottomWidth: 62,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: roofColor,
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 62,
            bottom: 80,
            height: 31,
            width: 84,
            flexDirection: 'row',
            gap: 3,
            borderRadius: 5,
            backgroundColor: '#1e62c9',
            borderWidth: 2,
            borderColor: '#8ec8ff',
            padding: 3,
            transform: [{ rotate: '-10deg' }],
            boxShadow: '0 5px 12px rgba(24,92,189,0.28)',
          }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={{ flex: 1, borderRadius: 2, backgroundColor: index % 2 === 0 ? '#337fe3' : '#4a94ec' }} />
          ))}
        </View>

        <View
          style={{
            position: 'absolute',
            left: 102,
            bottom: 0,
            height: 42,
            width: 28,
            borderTopLeftRadius: 7,
            borderTopRightRadius: 7,
            backgroundColor: '#d79a55',
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: 5,
              top: 21,
              height: 4,
              width: 4,
              borderRadius: 999,
              backgroundColor: '#77512f',
            }}
          />
        </View>

        <View
          style={{
            position: 'absolute',
            left: 51,
            bottom: 24,
            height: 24,
            width: 27,
            borderRadius: 6,
            backgroundColor: '#9fd7ff',
            borderWidth: 3,
            borderColor: houseColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 49,
            bottom: 24,
            height: 24,
            width: 27,
            borderRadius: 6,
            backgroundColor: '#9fd7ff',
            borderWidth: 3,
            borderColor: houseColor,
          }}
        />
      </View>
    </View>
  );
}
