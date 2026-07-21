import { router } from 'expo-router';
import { Linking } from 'react-native';

import { AboutTextSection } from '@/components/about-ui';
import { ScreenHeader, ScreenScroll } from '@/components/watt-ui';
import { PRIVACY_POLICY_SECTIONS, SUPPORT_EMAIL } from '@/constants/about';

export default function PrivacyPolicyScreen() {
  return (
    <ScreenScroll gap={14}>
      <ScreenHeader
        title="Privacy Policy"
        leftIcon="chevron-back"
        leftLabel="Back"
        onLeftPress={() => router.push('/about' as never)}
        rightIcon="mail-outline"
        rightLabel="Support"
        onRightPress={() => {
          void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Watt%20Track%20Privacy`);
        }}
      />

      {PRIVACY_POLICY_SECTIONS.map((section) => (
        <AboutTextSection key={section.title} title={section.title}>
          {section.body}
        </AboutTextSection>
      ))}
      <AboutTextSection title="Contact">For privacy questions, contact {SUPPORT_EMAIL}.</AboutTextSection>
    </ScreenScroll>
  );
}
