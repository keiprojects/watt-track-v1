import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-ui';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type NativeDateTimePickerComponent = typeof import('@react-native-community/datetimepicker').default;

type DateTimePickerFieldProps = {
  mode: 'date' | 'time';
  value: string;
  displayValue: string;
  placeholder: string;
  onChange: (nextValue: string) => void;
  allowClear?: boolean;
  maximumDate?: Date;
};

const NativeDateTimePicker: NativeDateTimePickerComponent | null =
  Platform.OS === 'web' ? null : (require('@react-native-community/datetimepicker').default as NativeDateTimePickerComponent);

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDateValue(value: string): Date {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function parseTimeValue(value: string): Date {
  const currentDate = new Date();

  if (!value) {
    return currentDate;
  }

  const [hours, minutes] = value.split(':').map(Number);
  currentDate.setHours(hours, minutes, 0, 0);
  return currentDate;
}

function formatDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimeValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function ClearPickerButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 52,
        width: 52,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surfaceRaised,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <Ionicons name="close-outline" size={20} color={theme.textMuted} />
    </Pressable>
  );
}

export function DateTimePickerField({
  mode,
  value,
  displayValue,
  placeholder,
  onChange,
  allowClear = false,
  maximumDate,
}: DateTimePickerFieldProps) {
  const theme = useAppTheme();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerValue = useMemo(() => (mode === 'date' ? parseDateValue(value) : parseTimeValue(value)), [mode, value]);
  const maxDateValue = useMemo(
    () => (maximumDate && mode === 'date' ? formatDateValue(maximumDate) : undefined),
    [maximumDate, mode],
  );

  const fieldStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    borderRadius: 18,
    borderCurve: 'continuous' as const,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceRaised,
    padding: 14,
  };

  const closeAndroidPicker = () => {
    if (Platform.OS === 'android') {
      setIsPickerOpen(false);
    }
  };

  const handleNativeValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    closeAndroidPicker();
    onChange(mode === 'date' ? formatDateValue(selectedDate) : formatTimeValue(selectedDate));
  };

  if (Platform.OS === 'web') {
    const webInputStyle: CSSProperties = {
      width: '100%',
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      color: theme.text,
      fontSize: 15,
      fontFamily: fontFamilies.body,
    };

    return (
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={fieldStyle}>
            <input
              aria-label={mode === 'date' ? 'Pick a date' : 'Pick a time'}
              type={mode}
              value={value}
              max={maxDateValue}
              onChange={(event) => onChange(event.currentTarget.value)}
              style={webInputStyle}
            />
          </View>
          {allowClear && value ? (
            <ClearPickerButton label="Clear time" onPress={() => onChange('')} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={() => setIsPickerOpen((open) => !open)}
          style={({ pressed }) => [
            fieldStyle,
            {
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text
            style={{
              flex: 1,
              minWidth: 0,
              color: value ? theme.text : theme.textSubtle,
              fontSize: 15,
              fontFamily: fontFamilies.body,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {displayValue || placeholder}
          </Text>
          <Ionicons
            name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
            size={18}
            color={theme.textSubtle}
          />
        </Pressable>

        {allowClear && value ? (
          <ClearPickerButton label="Clear time" onPress={() => onChange('')} />
        ) : null}
      </View>

      {isPickerOpen && NativeDateTimePicker ? (
        <View
          style={{
            borderRadius: 20,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            padding: 10,
          }}
        >
          <NativeDateTimePicker
            value={pickerValue}
            mode={mode}
            display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
            onValueChange={handleNativeValueChange}
            onDismiss={closeAndroidPicker}
            onNeutralButtonPress={closeAndroidPicker}
            maximumDate={maximumDate}
          />

          {Platform.OS === 'ios' ? (
            <View style={{ alignItems: 'flex-end', paddingTop: 6 }}>
              <AppButton
                label="Done"
                icon="checkmark-outline"
                tone="secondary"
                fullWidth={false}
                onPress={() => setIsPickerOpen(false)}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
