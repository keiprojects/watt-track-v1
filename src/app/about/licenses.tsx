import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenHeader, ScreenScroll, SectionHeader, SoftCard } from '@/components/watt-ui';
import { OPEN_SOURCE_LICENSES } from '@/constants/about';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

export default function LicensesScreen() {
  const theme = useAppTheme();

  return (
    <ScreenScroll gap={14}>
      <ScreenHeader title="Licenses" leftIcon="chevron-back" leftLabel="Back" onLeftPress={() => router.push('/about' as never)} />

      <SectionHeader title="Open Source" />
      <SoftCard>
        {OPEN_SOURCE_LICENSES.map((item) => (
          <View key={item.name} style={{ gap: 4, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text selectable style={{ flex: 1, color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>
                {item.name}
              </Text>
              <Text selectable style={{ color: theme.accent, fontSize: 12, fontFamily: fontFamilies.bodyHeavy }}>
                {item.license}
              </Text>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body }}>{item.purpose}</Text>
          </View>
        ))}
      </SoftCard>
    </ScreenScroll>
  );
}
