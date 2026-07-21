import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { AppIconName } from '@/components/app-ui';
import { useSettingsStore } from '@/stores/settings.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { AppTheme } from '@/types/settings';

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

function isThemeValue(value: string): value is AppTheme {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const theme = useAppTheme();

  const handleChange = (nextValue: T) => {
    onChange(nextValue);

    if (isThemeValue(nextValue) && options.every((option) => isThemeValue(option.value))) {
      void useSettingsStore.getState().updateSettings({ theme: nextValue });
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => handleChange(option.value)}
            style={({ pressed }) => ({
              minWidth: 70,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: selected ? theme.accent : theme.border,
              backgroundColor: selected ? theme.accent : theme.surfaceRaised,
              paddingHorizontal: 14,
              paddingVertical: 10,
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {option.icon ? <Ionicons name={option.icon} size={14} color={selected ? theme.accentText : theme.textMuted} /> : null}
              <Text style={{ color: selected ? theme.accentText : theme.textMuted, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
