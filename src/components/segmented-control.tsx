import { Pressable, Text, View } from 'react-native';

type SegmentedControlOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              minWidth: 88,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: selected ? '#0f766e' : '#cbd5e1',
              backgroundColor: selected ? '#ccfbf1' : '#ffffff',
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: selected ? '#115e59' : '#334155', fontSize: 14, fontWeight: '700' }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
