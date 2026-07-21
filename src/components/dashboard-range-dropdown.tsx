import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type DashboardRangeOption<T extends string> = {
  label: string;
  value: T;
};

type DashboardRangeDropdownProps<T extends string> = {
  options: DashboardRangeOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

type DropdownAnchor = {
  top: number;
  right: number;
};

export function DashboardRangeDropdown<T extends string>({ options, value, onChange }: DashboardRangeDropdownProps<T>) {
  const theme = useAppTheme();
  const triggerRef = useRef<View>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<DropdownAnchor>({ top: 132, right: 20 });
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      setAnchor({ top: y + measuredHeight + 8, right: Math.max(16, windowWidth - x - measuredWidth) });
      setVisible(true);
    });
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={`Dashboard range: ${selectedOption?.label ?? value}`}
        accessibilityHint="Opens the dashboard date range options"
        onPress={openMenu}
        style={({ pressed }) => ({
          height: 42,
          minWidth: 98,
          flexShrink: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 999,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.accentGlow,
          backgroundColor: theme.accentSoft,
          paddingHorizontal: 14,
          paddingVertical: 0,
          opacity: pressed ? 0.78 : 1,
          boxShadow: theme.shadow,
        })}
      >
        <Ionicons name="calendar-outline" size={15} color={theme.accent} />
        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 13, lineHeight: 16, fontFamily: fontFamilies.bodyStrong }}>
          {selectedOption?.label ?? value}
        </Text>
        <Ionicons name="chevron-down" size={14} color={theme.accent} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close dashboard range menu" onPress={() => setVisible(false)} style={{ flex: 1, backgroundColor: theme.scrim }}>
          <View
            style={{
              position: 'absolute',
              top: anchor.top,
              right: anchor.right,
              width: 190,
              overflow: 'hidden',
              borderRadius: 24,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surfaceOverlay,
              padding: 7,
              boxShadow: theme.shadow,
            }}
          >
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onChange(option.value);
                    setVisible(false);
                  }}
                  style={({ pressed }) => ({
                    minHeight: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    borderRadius: 999,
                    borderCurve: 'continuous',
                    backgroundColor: selected ? theme.accent : pressed ? theme.surfaceRaised : 'transparent',
                    paddingHorizontal: 13,
                    paddingVertical: 10,
                  })}
                >
                  <Text style={{ color: selected ? theme.accentText : theme.text, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>
                    {option.label}
                  </Text>
                  {selected ? <Ionicons name="checkmark-circle" size={19} color={theme.accentText} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
