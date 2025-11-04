import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StyleSheet,
  Text,
  View,
  Switch,
} from 'react-native';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../../src/design/colors';
import { TYPO } from '../../../src/design/typography';

type NotificationKey = 'notice' | 'rental' | 'returnDue' | 'returnSoon';

const LABELS: Record<NotificationKey, string> = {
  notice: '공지사항',
  rental: '대여',
  returnDue: '반납',
  returnSoon: '반납 기한 임박',
};

export default function StudentNotificationSettings() {
  const [toggles, setToggles] = useState<Record<NotificationKey, boolean>>({
    notice: true,
    rental: true,
    returnDue: false,
    returnSoon: true,
  });

  const onToggle = (key: NotificationKey) => (value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
    // TODO: Persist to API
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="알림 설정" showBack />

      <View style={styles.card}>
        {Object.entries(LABELS).map(([key, label], index) => {
          const typedKey = key as NotificationKey;
          return (
            <View
              key={key}
              style={[
                styles.row,
                index < Object.keys(LABELS).length - 1 && styles.divider,
              ]}
            >
              <Text style={styles.label}>{label}</Text>
              <Switch
                value={toggles[typedKey]}
                onValueChange={onToggle(typedKey)}
                trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  card: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    ...TYPO.body,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
});
