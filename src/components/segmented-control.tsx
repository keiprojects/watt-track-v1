import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';
import type { AppIconName } from '@/components/app-ui';

type SegmentedControlOption<T extends string> = {
  label: string;
  value: T;
  icon?: AppIconName;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              minWidth: 84,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: selected ? theme.accent : theme.border,
              backgroundColor: selected ? theme.accent : theme.surfaceRaised,
              paddingHorizontal: 14,
              paddingVertical: 11,
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {option.icon ? (
                <Ionicons
                  name={option.icon}
                  size={14}
                  color={selected ? '#0a101b' : theme.textMuted}
                />
              ) : null}
              <Text style={{ color: selected ? '#0a101b' : theme.textMuted, fontSize: 13, fontWeight: '800' }}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
