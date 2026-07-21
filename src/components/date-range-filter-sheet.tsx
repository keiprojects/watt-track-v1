import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateTimePickerField } from '@/components/date-time-picker-field';
import { IconButton } from '@/components/watt-ui';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import { formatShortDate, getTodayDateInputValue, isValidDateInputValue } from '@/utils/date';

type DateRangeFilterSheetProps = {
  visible: boolean;
  title?: string;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
};

function ActionButton({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: primary ? theme.accent : theme.border,
        backgroundColor: primary ? theme.accent : theme.surfaceRaised,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <Text style={{ color: primary ? '#ffffff' : theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function DateRangeFilterSheet({
  visible,
  title = 'Date range',
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
  onClose,
}: DateRangeFilterSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const today = getTodayDateInputValue();
  const hasInvalidStart = Boolean(startDate) && !isValidDateInputValue(startDate);
  const hasInvalidEnd = Boolean(endDate) && !isValidDateInputValue(endDate);
  const hasReversedRange = Boolean(startDate && endDate) && !hasInvalidStart && !hasInvalidEnd && startDate > endDate;
  const helperText =
    startDate || endDate
      ? `${startDate ? formatShortDate(startDate) : 'Any start'} - ${endDate ? formatShortDate(endDate) : 'Any end'}`
      : 'Show readings from any date.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: theme.scrim, padding: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close date filter" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
        <View
          style={{
            gap: 18,
            borderRadius: 24,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surfaceOverlay,
            padding: 18,
            paddingBottom: Math.max(insets.bottom + 14, 22),
            boxShadow: theme.shadow,
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 5, borderRadius: 999, backgroundColor: theme.border }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: theme.text, fontSize: 20, fontFamily: fontFamilies.displayMedium }}>{title}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.body }}>{helperText}</Text>
            </View>
            <IconButton icon="close-outline" label="Close" onPress={onClose} />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>From</Text>
              <DateTimePickerField
                mode="date"
                value={startDate}
                displayValue={startDate ? formatShortDate(startDate) : ''}
                placeholder="Any start"
                onChange={onStartDateChange}
                maximumDate={new Date(`${today}T00:00:00`)}
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>To</Text>
              <DateTimePickerField
                mode="date"
                value={endDate}
                displayValue={endDate ? formatShortDate(endDate) : ''}
                placeholder="Any end"
                onChange={onEndDateChange}
                maximumDate={new Date(`${today}T00:00:00`)}
              />
            </View>
          </View>

          {hasInvalidStart || hasInvalidEnd || hasReversedRange ? (
            <Text style={{ color: theme.dangerText, fontSize: 13, fontFamily: fontFamilies.body }}>
              {hasReversedRange ? 'End date must be on or after the start date.' : 'Choose real calendar dates.'}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ActionButton label="Reset" onPress={onReset} />
            <ActionButton label="Apply" primary onPress={onApply} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
