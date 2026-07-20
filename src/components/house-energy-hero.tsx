import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

function Cloud({ left, top, scale = 1 }: { left: number; top: number; scale?: number }) {
  return (
    <View style={{ position: 'absolute', left, top, height: 28 * scale, width: 70 * scale }}>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 15 * scale,
          width: 70 * scale,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.82)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 3 * scale,
          left: 13 * scale,
          height: 25 * scale,
          width: 25 * scale,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.88)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 2 * scale,
          left: 34 * scale,
          height: 20 * scale,
          width: 20 * scale,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.84)',
        }}
      />
    </View>
  );
}

export function HouseEnergyHero() {
  const theme = useAppTheme();
  const isDark = theme.mode === 'dark';
  const houseColor = isDark ? '#edf3f9' : '#ffffff';
  const roofColor = isDark ? '#445d72' : '#536b80';

  return (
    <LinearGradient
      colors={isDark ? ['#153654', '#0e253c'] : ['#bfe4ff', '#eaf7ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        height: 150,
        overflow: 'hidden',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
      }}
    >
      <Cloud left={20} top={30} scale={0.8} />
      <Cloud left={230} top={54} scale={0.58} />

      <View
        style={{
          position: 'absolute',
          right: 18,
          top: 18,
          height: 48,
          width: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          backgroundColor: isDark ? 'rgba(255,191,55,0.12)' : 'rgba(255,255,255,0.48)',
        }}
      >
        <Ionicons name="sunny" size={31} color="#f7b92f" />
      </View>

      <View
        style={{
          position: 'absolute',
          left: -42,
          right: 110,
          bottom: -50,
          height: 112,
          borderRadius: 999,
          backgroundColor: isDark ? '#16404b' : '#b7e3d1',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 180,
          right: -70,
          bottom: -42,
          height: 105,
          borderRadius: 999,
          backgroundColor: isDark ? '#123b3a' : '#9fd7bb',
        }}
      />

      <View
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 8,
          height: 105,
          width: 220,
          marginLeft: -110,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 29,
            bottom: 0,
            height: 60,
            width: 162,
            borderRadius: 13,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.36)' : 'rgba(31,66,96,0.10)',
            backgroundColor: houseColor,
            boxShadow: isDark ? '0 10px 22px rgba(0,0,0,0.22)' : '0 10px 22px rgba(46,92,126,0.15)',
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 18,
            bottom: 52,
            width: 0,
            height: 0,
            borderLeftWidth: 92,
            borderRightWidth: 92,
            borderBottomWidth: 52,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: roofColor,
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 62,
            bottom: 69,
            height: 29,
            width: 88,
            flexDirection: 'row',
            gap: 3,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: '#88c6ff',
            backgroundColor: '#1768d7',
            padding: 3,
            transform: [{ rotate: '-8deg' }],
          }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={{ flex: 1, borderRadius: 2, backgroundColor: index % 2 === 0 ? '#2e80e7' : '#5aa2f2' }} />
          ))}
        </View>

        <View
          style={{
            position: 'absolute',
            left: 95,
            bottom: 0,
            height: 38,
            width: 27,
            borderTopLeftRadius: 7,
            borderTopRightRadius: 7,
            backgroundColor: '#d99c58',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 48,
            bottom: 22,
            height: 21,
            width: 25,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: houseColor,
            backgroundColor: '#9ad5ff',
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 46,
            bottom: 22,
            height: 21,
            width: 25,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: houseColor,
            backgroundColor: '#9ad5ff',
          }}
        />
      </View>
    </LinearGradient>
  );
}
