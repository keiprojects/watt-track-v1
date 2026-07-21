import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';

import { ScreenHeader, ScreenScroll, SectionHeader, SoftCard } from '@/components/watt-ui';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

const SUPPORT_EMAIL = 'support@keiprojects.com';

function BodyText({ children }: { children: string }) {
  const theme = useAppTheme();

  return (
    <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 20, fontFamily: fontFamilies.body }}>
      {children}
    </Text>
  );
}

function DisclosureRow({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View
        style={{
          height: 34,
          width: 34,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          backgroundColor: theme.accentSoft,
        }}
      >
        <Ionicons name={icon} size={17} color={theme.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>{title}</Text>
        <BodyText>{description}</BodyText>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surfaceRaised,
        paddingHorizontal: 14,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={theme.accent} />
      <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={theme.textSubtle} />
    </Pressable>
  );
}

export default function PrivacyScreen() {
  const theme = useAppTheme();

  return (
    <ScreenScroll gap={18}>
      <ScreenHeader title="Privacy & Support" leftIcon="chevron-back" leftLabel="Back" onLeftPress={() => router.push('/(tabs)/settings')} />

      <SoftCard style={{ gap: 8 }}>
        <Text style={{ color: theme.text, fontSize: 18, fontFamily: fontFamilies.bodyHeavy }}>Your data stays local by default</Text>
        <BodyText>
          Watt Track stores your profile, readings, costs, settings, reminders, and calculated estimates on this device. The app does not require an account and does not sync your energy data to a Watt Track server.
        </BodyText>
      </SoftCard>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Data Practices" />
        <SoftCard>
          <DisclosureRow
            icon="phone-portrait-outline"
            title="Device storage"
            description="Solar profile details, readings, costs, settings, notes, and calculation warnings are saved in device-local app storage."
          />
          <DisclosureRow
            icon="cloud-outline"
            title="Weather lookup"
            description="If weather is shown, Watt Track may send your saved location text, saved site coordinates, or a default location to Open-Meteo over HTTPS to retrieve current weather."
          />
          <DisclosureRow
            icon="archive-outline"
            title="Backups and CSV exports"
            description="Backup and export files are created only when you choose to create them. After that, the files are controlled by where you save or share them."
          />
          <DisclosureRow
            icon="notifications-outline"
            title="Reading reminders"
            description="Daily reminders are optional local notifications used only to remind you to enter a reading."
          />
        </SoftCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Your Controls" />
        <SoftCard>
          <DisclosureRow
            icon="trash-outline"
            title="Delete local data"
            description="Use Clear Local Data or Reset all data to remove Watt Track data and cancel the reminder schedule on this device."
          />
          <DisclosureRow
            icon="document-text-outline"
            title="Manage exported files"
            description="Exported CSV and JSON files are outside Watt Track after you save or share them. Delete those files from their saved locations if needed."
          />
        </SoftCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Support" />
        <SoftCard>
          <ActionRow
            icon="mail-outline"
            label={SUPPORT_EMAIL}
            onPress={() => {
              void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Watt%20Track%20Support`);
            }}
          />
          <BodyText>
            A public privacy policy and support URL are still required in the app store listings before submission.
          </BodyText>
        </SoftCard>
      </View>
    </ScreenScroll>
  );
}
