import { router } from 'expo-router';
import { Linking } from 'react-native';

import { AboutTextSection } from '@/components/about-ui';
import { ScreenHeader, ScreenScroll } from '@/components/watt-ui';
import { SUPPORT_EMAIL } from '@/constants/about';

export default function HelpTranslateScreen() {
  return (
    <ScreenScroll gap={14}>
      <ScreenHeader
        title="Help Translate"
        leftIcon="chevron-back"
        leftLabel="Back"
        onLeftPress={() => router.push('/about' as never)}
        rightIcon="mail-outline"
        rightLabel="Email"
        onRightPress={() => {
          void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Watt%20Track%20Translation`);
        }}
      />

      <AboutTextSection title="Translation status">
        Watt Track currently uses English interface text. Future translations can be added as the app grows.
      </AboutTextSection>
      <AboutTextSection title="How to help">
        Send corrections, preferred local terms, or a complete translation draft by email. Useful areas include settings labels, backup messages, validation warnings, and store listing text.
      </AboutTextSection>
      <AboutTextSection title="Priority languages">
        Filipino and Cebuano are the most useful first translation targets for the current Philippine solar tracking audience.
      </AboutTextSection>
    </ScreenScroll>
  );
}
