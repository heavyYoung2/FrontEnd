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

const FEATURES = [
  '회원 인증: OAuth2 + JWT 기반 로그인',
  '회비 관리: 납부 내역 확인 및 QR 검증',
  '사물함 관리: 대여, 반납',
  '관리자 기능: 대여물품 관리, 회비납부 인증, 공지사항 관리',
];

const TECH_STACK = [
  'Language: Java 21',
  'Framework: Spring Boot 3.5.5',
  'Database: MySQL 8.0.43',
  'Infra: AWS, Docker, Nginx, GitHub Actions',
];

const DEPLOYMENT = [
  'CI/CD: GitHub Actions - Docker Hub - AWS EC2 (예정)',
  '운영 환경: Ubuntu 22.04, Nginx Reverse Proxy, HTTPS (예정)',
  '모니터링: CloudWatch, Prometheus, Grafana (예정)',
];

const TESTING = [
  './gradlew test 실행 시 단위 테스트/통합 테스트 자동화 (예정)',
  'Jacoco 리포트 제공 (코드 커버리지) (예정)',
];

export function GuideScreenTemplate({ badgeLabel }: { badgeLabel: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top'ㅌ₩, 'left', 'right']}>
      <CouncilHeader badgeLabel={badgeLabel} studentId="C246120" title="회비영 안내" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading1}>회비영</Text>
        
        <Section title="📌 프로젝트 개요">
          <Paragraph>
            홍익대학교 컴퓨터공학과 학생들을 위한 통합 관리 플랫폼입니다. 기존에는 학생회비 납부 확인과 각종 서비스를 모두 수기로 처리해 비효율적이고 불필요한 노동이 발생했습니다. 회비영은 디지털 전환을 통해 운영 과정을 투명하고 효율적으로 개선하고, 학생들이 납부한 회비를 보다 편리하고 활발하게 활용할 수 있도록 하는 것을 목표로 합니다.
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
          {TECH_STACK.map((line) => (
            <Bullet key={line} text={line} />
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
          <Pressable onPress={() => Linking.openURL('https://concrete-vise-062.notion.site/API-1df9715a4be680f0858ac72b73ee02d3?pvs=74')}>
            <Text style={styles.linkText}>노션 API 명세서 바로가기</Text>
          </Pressable>
        </Section>

        <Section title="🏗️ 아키텍처">
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>Client - BFF - Backend (Spring Boot)</Text>
            <Text style={styles.codeText}>Backend - DB (MySQL)</Text>
            <Text style={styles.codeText}>Backend - S3 (AWS S3)</Text>
          </View>
        </Section>

        <Section title="🧪 테스트">
          {TESTING.map((line) => (
            <Bullet key={line} text={line} />
          ))}
        </Section>

        <Section title="🤝 기여 가이드">
          <Paragraph>브랜치 전략: GitHub Flow (main + feature 브랜치)</Paragraph>
          <Pressable onPress={() => Linking.openURL('https://concrete-vise-062.notion.site/Git-Branch-2539715a4be68036af99d68ebaf90759?source=copy_link')}>
            <Text style={styles.linkText}>브랜치 전략 상세</Text>
          </Pressable>
          <Paragraph style={{ marginTop: 8 }}>코드 스타일</Paragraph>
          <Pressable onPress={() => Linking.openURL('https://concrete-vise-062.notion.site/2539715a4be680babbdde21692446613?source=copy_link')}>
            <Text style={styles.linkText}>코드 스타일 가이드</Text>
          </Pressable>
          <Paragraph style={{ marginTop: 8 }}>PR 규칙</Paragraph>
          <Pressable onPress={() => Linking.openURL('https://concrete-vise-062.notion.site/Issue-PR-Commit-2539715a4be68074bd71e123523cd16c?source=copy_link')}>
            <Text style={styles.linkText}>이슈 · PR · 커밋 가이드</Text>
          </Pressable>
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
    justifyContent: 'space-between',
    gap: 12,
  },
  memberCard: {
    flex: 1,
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
  codeBlock: {
    backgroundColor: '#1118270D',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  codeText: {
    fontFamily: 'Courier',
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },
});
