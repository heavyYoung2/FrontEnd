import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';

const MEMBERS = [
  {
    name: '박형진',
    role: 'BE',
    avatar: 'https://github.com/gud0217.png',
    link: 'https://github.com/gud0217',
  },
  {
    name: '안제웅',
    role: 'BE',
    avatar: 'https://github.com/ajwoong.png',
    link: 'https://github.com/ajwoong',
  },
  {
    name: '윤현일',
    role: 'BE',
    avatar: 'https://github.com/yhi9839.png',
    link: 'https://github.com/yhi9839',
  },
];

const TECH_STACK = [
  { label: 'Language', value: 'Java 21' },
  { label: 'Framework', value: 'Spring Boot 3.5.4' },
  { label: 'Database', value: 'MySQL 8.0.43' },
  { label: 'Infra', value: 'AWS, Nginx, GitHub Actions' },
];

const DEPLOYMENT = [
  'CI/CD: GitHub Actions → Docker Hub → AWS EC2',
  '운영 환경: Ubuntu 22.04, Nginx Reverse Proxy',
  '모니터링: CloudWatch, Prometheus, Grafana (예정)',
];

const FEATURES = ['QR', '물품', '공지', '사물함', '마이페이지'];

const CONVENTIONS = [
  {
    label: '브랜치 전략',
    url: 'https://concrete-vise-062.notion.site/Git-Branch-2539715a4be68036af99d68ebaf90759?source=copy_link',
  },
  {
    label: '코드 스타일',
    url: 'https://concrete-vise-062.notion.site/2539715a4be680babbdde21692446613?source=copy_link',
  },
  {
    label: 'PR 규칙',
    url: 'https://concrete-vise-062.notion.site/Issue-PR-Commit-2539715a4be68074bd71e123523cd16c?source=copy_link',
  },
];

const API_DOC_URL =
  'https://concrete-vise-062.notion.site/API-1df9715a4be680f0858ac72b73ee02d3?pvs=74';
const ERD_IMAGE =
  'https://github.com/user-attachments/assets/659618e5-d6d8-4cda-9871-4a206ac28e38';
const ARCH_IMAGE =
  'https://github.com/user-attachments/assets/edc17d6b-56e0-4072-8d78-f4ba44ca31e5';

export function GuideScreenTemplate({ badgeLabel }: { badgeLabel: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel={badgeLabel} studentId="C246120" title="회비영 안내" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading1}>회비영 (H-Fee Manager)</Text>
        <Paragraph style={styles.tagline}>
          홍익대학교 컴퓨터공학과 학생회비 투명성 확보 및 통합 관리 플랫폼
        </Paragraph>

        <Section title="📌 프로젝트 개요">
          <Paragraph>
            홍익대학교 컴퓨터공학과 학생들을 위한 통합 관리 플랫폼입니다. 기존에는 학생회비 납부 확인과 각종
            서비스를 모두 수기로 처리해 비효율적이고 불필요한 노동이 발생했습니다. 회비영은 디지털 전환을 통해
            운영 과정을 투명하고 효율적으로 개선하고, 학생들이 납부한 회비를 보다 편리하고 활발하게 활용할 수
            있도록 하는 것을 목표로 합니다.
          </Paragraph>
        </Section>

        <Section title="👥 멤버">
          <View style={styles.membersRow}>
            {MEMBERS.map((member) => (
              <View key={member.name} style={styles.memberCard}>
                <Image source={{ uri: member.avatar }} style={styles.avatar} />
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
                <Pressable onPress={() => Linking.openURL(member.link)}>
                  <Text style={styles.linkText}>GitHub</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </Section>

        <Section title="⚙️ 기술 스택">
          {TECH_STACK.map((item) => (
            <KeyValueRow key={item.label} label={item.label} value={item.value} />
          ))}
        </Section>

        <Section title="🚀 배포 & 운영">
          {DEPLOYMENT.map((line) => (
            <Bullet key={line} text={line} />
          ))}
        </Section>

        <Section title="🔑 주요 기능">
          {FEATURES.map((line) => (
            <Bullet key={line} text={line} />
          ))}
        </Section>

        <Section title="📡 API 문서">
          <Bullet text="Swagger: /swagger-ui/index.html" />
          <ExternalLink label="노션 API 명세서 바로가기" url={API_DOC_URL} />
        </Section>

        <Section title="🏗️ 아키텍처">
          <GuideImage uri={ARCH_IMAGE} />
        </Section>

        <Section title="🗺️ ERD">
          <GuideImage uri={ERD_IMAGE} />
        </Section>

        <Section title="🤝 팀 컨벤션">
          {CONVENTIONS.map((item) => (
            <ExternalLink key={item.label} label={item.label} url={item.url} />
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function GuideScreen() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const badgeLabel = role === 'student' ? '학생' : '학생회';
  return <GuideScreenTemplate badgeLabel={badgeLabel} />;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading2}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <Text style={[styles.paragraph, style]}>{children}</Text>;
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.keyValueRow}>
      <Text style={styles.keyValueLabel}>{label}</Text>
      <Text style={styles.keyValueValue}>{value}</Text>
    </View>
  );
}

function ExternalLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

function GuideImage({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={styles.guideImage}
      resizeMode="contain"
      accessible
      accessibilityLabel="회비영 소개 이미지"
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    padding: 20,
    paddingBottom: 32,
    gap: 24,
  },
  heading1: {
    ...TYPO.h1,
    color: COLORS.text,
  },
  tagline: {
    ...TYPO.body,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 22,
  },
  heading2: {
    ...TYPO.subtitle,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
    marginBottom: 12,
  },
  section: {
    gap: 8,
  },
  paragraph: {
    ...TYPO.body,
    lineHeight: 22,
    color: COLORS.text,
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 140,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  memberName: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  memberRole: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textMuted,
  },
  linkText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletDot: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
  bulletText: {
    ...TYPO.body,
    flex: 1,
    color: COLORS.text,
  },
  keyValueRow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  keyValueLabel: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
    fontSize: 14,
  },
  keyValueValue: {
    ...TYPO.body,
    color: COLORS.text,
    textAlign: 'right',
    flexShrink: 1,
  },
  guideImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});
