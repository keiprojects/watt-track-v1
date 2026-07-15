import { View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type SparkBarsProps = {
  values: number[];
  highlightIndex?: number;
  height?: number;
};

export function SparkBars({ values, highlightIndex = values.length - 1, height = 92 }: SparkBarsProps) {
  const theme = useAppTheme();
  const maxValue = Math.max(1, ...values);

  return (
    <View
      style={{
        height,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
      }}
    >
      {values.map((value, index) => (
        <View
          key={`${index}-${value}`}
          style={{
            flex: 1,
            minHeight: 10,
            height: Math.max((value / maxValue) * height, 10),
            borderRadius: 999,
            backgroundColor: index === highlightIndex ? theme.accent : theme.surfaceRaised,
          }}
        />
      ))}
    </View>
  );
}
