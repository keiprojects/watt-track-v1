import { ScrollView, Text, View } from 'react-native';

import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { formatCurrency } from '@/utils/format';

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        gap: 10,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: '#ffffff',
        padding: 18,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
      }}
    >
      <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800' }}>{title}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const settings = useSettingsStore((state) => state.settings);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
    >
      <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800' }}>Settings</Text>

      <SettingsCard title="System profile">
        <Text style={{ color: '#334155', fontSize: 15 }}>System name: {systemProfile?.systemName ?? 'Not set'}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Timezone: {systemProfile?.timezone ?? 'Asia/Manila'}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Currency: PHP</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>
          Default import rate: PHP {(systemProfile?.defaultImportRate ?? 0).toFixed(2)} / kWh
        </Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Grid input mode: {systemProfile?.gridInputMode ?? 'cumulative'}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Solar input mode: {systemProfile?.solarInputMode ?? 'cumulative'}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Export mode: {systemProfile?.exportInputMode ?? 'disabled'}</Text>
      </SettingsCard>

      <SettingsCard title="Display">
        <Text style={{ color: '#334155', fontSize: 15 }}>Theme: {settings.theme}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Decimal places: {settings.decimalPlaces}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Default dashboard period: {settings.defaultDashboardPeriod}</Text>
      </SettingsCard>

      <SettingsCard title="Data safety">
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
          WattTrack stores information only on this device. Removing the app, clearing application data, or losing the device may permanently delete your records
          unless you create a backup.
        </Text>
      </SettingsCard>
    </ScrollView>
  );
}
