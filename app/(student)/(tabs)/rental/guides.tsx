import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';
import { GuidelineSection, useRentalGuidelines } from './hooks';

export default function StudentRentalGuideScreen() {
  const router = useRouter();
  const { sections, penalties, launchNotice } = useRentalGuidelines();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="대여 물품 안내 사항" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noticeCard}>
          <Ionicons name="megaphone-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeLabel}>알려드려요</Text>
            <Text style={styles.noticeText}>{launchNotice}</Text>
          </View>
        </View>

        <View style={styles.sectionList}>
          {sections.map((section) => (
            <GuideSectionCard key={section.id} section={section} />
          ))}
        </View>

        <View style={styles.penaltyCard}>
          <View style={styles.penaltyHeader}>
            <Ionicons name="alert-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.penaltyTitle}>연체 기간에 대한 페널티</Text>
          </View>
          {penalties.map((line) => (
            <View key={line} style={styles.penaltyRow}>
              <View style={styles.penaltyBullet} />
              <Text style={styles.penaltyText}>{line}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={() => router.back()}
          hitSlop={6}
        >
          <Ionicons name="arrow-back" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>뒤로가기</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function GuideSectionCard({ section }: { section: GuidelineSection }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={section.icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionLineList}>
          {section.lines.map((line) => (
            <Text key={line} style={styles.sectionLineText}>{line}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 18,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  noticeLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 4,
  },
  noticeText: {
    ...TYPO.bodySm,
    color: COLORS.text,
  },
  sectionList: {
    gap: 12,
  },
  sectionCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  sectionTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionLineList: {
    gap: 6,
  },
  sectionLineText: {
    ...TYPO.bodySm,
    color: COLORS.text,
  },
  penaltyCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  penaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  penaltyTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  penaltyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  penaltyBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: '#FFFFFF',
  },
  penaltyText: {
    ...TYPO.bodySm,
    color: '#FFFFFF',
    flex: 1,
  },
  backBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  backBtnPressed: {
    opacity: 0.85,
  },
  backBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
});

