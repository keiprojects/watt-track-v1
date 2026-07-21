import { router } from 'expo-router';
import { Linking } from 'react-native';

import { AboutTextSection } from '@/components/about-ui';
import { ScreenHeader, ScreenScroll } from '@/components/watt-ui';
import { SUPPORT_EMAIL, TERMS_OF_USE_SECTIONS } from '@/constants/about';

export default function TermsOfUseScreen() {
  return (
    <ScreenScroll gap={14}>
      <ScreenHeader
        title="Terms of Use"
        leftIcon="chevron-back"
        leftLabel="Back"
        onLeftPress={() => router.push('/about' as never)}
        rightIcon="mail-outline"
        rightLabel="Support"
        onRightPress={() => {
          void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Watt%20Track%20Terms`);
        }}
      />

      {TERMS_OF_USE_SECTIONS.map((section) => (
        <AboutTextSection key={section.title} title={section.title}>
          {section.body}
        </AboutTextSection>
      ))}
      <AboutTextSection title="Contact">For terms or support questions, contact {SUPPORT_EMAIL}.</AboutTextSection>
    </ScreenScroll>
  );
}
