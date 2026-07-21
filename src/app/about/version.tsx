import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { AboutTextSection } from '@/components/about-ui';
import { IconSquare, ScreenHeader, ScreenScroll, SoftCard, wattGradients } from '@/components/watt-ui';
import { APP_NAME, APP_VERSION, SUPPORT_EMAIL } from '@/constants/about';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

export default function VersionScreen() {
  const theme = useAppTheme();

  return (
    <ScreenScroll gap={18}>
      <ScreenHeader title="App Info" leftIcon="chevron-back" leftLabel="Back" onLeftPress={() => router.push('/about' as never)} />

      <SoftCard style={{ alignItems: 'center', gap: 12 }}>
        <IconSquare icon="flash-outline" colors={wattGradients.amber} size={68} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text selectable style={{ color: theme.text, fontSize: 22, fontFamily: fontFamilies.displayMedium }}>
            {APP_NAME}
          </Text>
          <Text selectable style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.body }}>
            Version {APP_VERSION}
          </Text>
        </View>
      </SoftCard>

      <AboutTextSection title="Purpose">
        Watt Track is a local-first solar tracking app for manually recording energy readings, estimating savings, and monitoring payback.
      </AboutTextSection>
      <AboutTextSection title="Developer">Kei Projects. For support, contact {SUPPORT_EMAIL}.</AboutTextSection>
      <AboutTextSection title="Storage model">
        Core Watt Track data is stored locally on this device. Backup files leave the app only when you choose to export or share them.
      </AboutTextSection>
    </ScreenScroll>
  );
}
