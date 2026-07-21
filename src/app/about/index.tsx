import { router } from 'expo-router';
import { Share, Text, View } from 'react-native';

import { AboutListCard, AboutRow } from '@/components/about-ui';
import { IconSquare, ScreenHeader, ScreenScroll, wattGradients } from '@/components/watt-ui';
import { APP_NAME, APP_VERSION } from '@/constants/about';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

export default function AboutScreen() {
  const theme = useAppTheme();

  const shareApp = () => {
    void Share.share({
      title: APP_NAME,
      message: `${APP_NAME} helps you track solar readings, energy costs, savings, and payback locally on your device.`,
    });
  };

  return (
    <ScreenScroll gap={18}>
      <ScreenHeader
        title="About"
        leftIcon="chevron-back"
        leftLabel="Back"
        onLeftPress={() => router.push('/(tabs)/settings')}
        rightIcon="share-social-outline"
        rightLabel="Share"
        onRightPress={shareApp}
      />

      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 6 }}>
        <IconSquare icon="flash-outline" colors={wattGradients.amber} size={62} />
        <View style={{ alignItems: 'center', gap: 3 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontFamily: fontFamilies.displayMedium }}>{APP_NAME}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.body }}>Version {APP_VERSION}</Text>
        </View>
      </View>

      <AboutListCard>
        <AboutRow icon="information-circle-outline" title={`${APP_NAME} ${APP_VERSION}`} onPress={() => router.push('/about/version')} />
        <AboutRow icon="language-outline" title="Help us translate" onPress={() => router.push('/about/help-translate')} />
        <AboutRow icon="code-slash-outline" title="Open source licenses" onPress={() => router.push('/about/licenses')} />
        <AboutRow icon="shield-checkmark-outline" title="Privacy policy" onPress={() => router.push('/about/privacy-policy')} />
        <AboutRow icon="document-text-outline" title="Terms of use" onPress={() => router.push('/about/terms-of-use')} />
      </AboutListCard>
    </ScreenScroll>
  );
}
