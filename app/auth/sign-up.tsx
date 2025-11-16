import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { COLORS } from '@/src/design/colors';
import { requestEmailCode, signUp, SignUpPayload, verifyEmailCode } from '@/src/api/auth';

type Step = 'agreements' | 'email' | 'profile';

const AGREEMENT_ITEMS = [
  { key: 'terms', label: '이용 약관에 동의하십니까?' },
  { key: 'privacy', label: '개인정보 수집 및 이용에 동의하십니까?' },
  { key: 'marketing', label: '개인정보 제3자 제공에 동의하십니까?' },
] as const;

type AgreementKey = (typeof AGREEMENT_ITEMS)[number]['key'];

const AGREEMENT_DETAILS: Record<
  AgreementKey,
  { title: string; body: string }
> = {
  terms: {
    title: '이용 약관',
    body: `제1조 (목적)
본 약관은 홍익대학교 학생회 서비스 회비영(이하 '서비스')의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. 이용자란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.
2. 회원이란 서비스에 개인정보를 제공하고 회원등록을 완료한 자를 말합니다.
3. 학생회비란 학교 내 학생자치활동을 위해 납부되는 금액을 의미합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스를 통해 공지함으로써 효력이 발생합니다.
2. 서비스 운영자는 관련 법령의 개정 등 사유로 약관을 변경할 수 있으며, 변경된 약관은 공지 즉시 효력이 발생합니다.

제4조 (서비스의 제공 및 변경)
1. 서비스는 다음과 같은 기능을 제공합니다.
- 학생회비 납부 및 확인
- QR 코드 발급을 통한 인증 서비스
- 사물함 및 물품 대여 관리
- 공지사항 및 학생회 소식 제공
2. 서비스 내용은 필요 시 변경될 수 있으며, 주요 변경 사항은 사전에 공지합니다.

제5조 (이용자의 의무)
1. 이용자는 서비스 이용 시 다음 행위를 해서는 안 됩니다.
- 타인의 정보를 도용하거나 허위 정보를 등록하는 행위
- 서비스의 안정적인 운영을 방해하는 행위
- 법령 또는 공공질서에 위반되는 행위

제6조 (면책조항)
1. 회사는 천재지변, 시스템 장애 등 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.
2. 이용자의 귀책 사유로 발생한 문제에 대해서는 회사가 책임지지 않습니다.

제7조 (준거법 및 관할)
본 약관은 대한민국 법률에 따라 해석되며, 분쟁이 발생할 경우 서울중앙지방법원을 관할 법원으로 합니다.`,
  },
  privacy: {
    title: '개인정보 수집 및 이용 동의',
    body: `1. 수집 항목
- 필수항목: 이름, 학번, 이메일, 소속 단과대학, 학과
- 선택항목: 전화번호, 프로필 이미지

2. 수집 및 이용 목적
- 학생회비 납부 및 확인 절차 수행
- 회원 식별 및 서비스 접근 권한 부여
- 공지사항 및 안내 사항 발송

3. 보유 및 이용 기간
- 회원 탈퇴 시 즉시 파기
- 단, 관계법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관함

4. 동의 거부 권리
이용자는 개인정보 수집에 대한 동의를 거부할 권리가 있으나, 이 경우 서비스 이용이 제한될 수 있습니다.`,
  },
  marketing: {
    title: '개인정보 제3자 제공 동의',
    body: `1. 제공받는 자
- 홍익대학교 총학생회 및 각 단과대학 학생회

2. 제공 항목
- 이름, 학번, 학과, 납부 여부, 사물함 및 물품 대여 내역

3. 제공 목적
- 학생회비 납부 확인 및 자치활동 관리
- 학생복지 서비스 운영 및 이용자 관리

4. 보유 및 이용 기간
- 제공 목적 달성 후 즉시 폐기

5. 동의 거부 권리 및 불이익
이용자는 개인정보 제3자 제공에 대한 동의를 거부할 수 있으나, 학생회 서비스 일부가 제한될 수 있습니다.`,
  },
};

const SCHOOL_EMAIL_REGEX = /^[\w.+-]+@g\.hongik\.ac\.kr$/i;

const initialAgreementState: Record<AgreementKey, boolean> =
  AGREEMENT_ITEMS.reduce((acc, item) => {
    acc[item.key] = false;
    return acc;
  }, {} as Record<AgreementKey, boolean>);

export default function SignUpScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('agreements');

  const [agreements, setAgreements] =
    useState<Record<AgreementKey, boolean>>(initialAgreementState);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [codeFeedback, setCodeFeedback] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number | null>(null);
  const [activeAgreementKey, setActiveAgreementKey] =
    useState<AgreementKey | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastAnim = useRef(new Animated.Value(0));

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allAgreed = useMemo(
    () => AGREEMENT_ITEMS.every((item) => agreements[item.key]),
    [agreements],
  );

  const profileFilled = useMemo(
    () =>
      Boolean(
        password &&
          passwordConfirm &&
          department.trim() &&
          studentId.trim() &&
          name.trim() &&
          phone.trim(),
      ),
    [password, passwordConfirm, department, studentId, name, phone],
  );

  const showToast = useCallback((message: string, tone: 'error' | 'info' = 'error') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastAnim.current.setValue(0);
    setToast({ message, tone });
    Animated.timing(toastAnim.current, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim.current, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setToast(null);
        }
      });
    }, 2400);
  }, []);

  const getErrorMessage = useCallback((error: unknown, fallback: string) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as any).response?.data?.message === 'string'
    ) {
      return (error as any).response.data.message as string;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }, []);

  const handleToggleAgreement = (key: AgreementKey) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAllAgree = () => {
    const nextValue = !allAgreed;
    const updated: Record<AgreementKey, boolean> = {} as Record<
      AgreementKey,
      boolean
    >;
    AGREEMENT_ITEMS.forEach((item) => {
      updated[item.key] = nextValue;
    });
    setAgreements(updated);
  };

  const handleSendCode = async () => {
    const normalized = email.trim();
    if (!SCHOOL_EMAIL_REGEX.test(normalized)) {
      setEmailFeedback(null);
      setCodeFeedback(null);
      setIsCodeSent(false);
      setIsEmailVerified(false);
      setResendCountdown(null);
      showToast('학교 이메일(@g.hongik.ac.kr)로 입력해주세요.', 'error');
      return;
    }

    try {
      await requestEmailCode({ email: normalized });
      setEmailFeedback('인증 번호가 해당 이메일로 전송되었습니다.');
      setCodeFeedback(null);
      setIsCodeSent(true);
      setCode('');
      setResendCountdown(300);
      setIsEmailVerified(false);
    } catch (error) {
      const message = getErrorMessage(error, '이메일 인증 번호 전송에 실패했습니다.');
      setEmailFeedback(null);
      setIsCodeSent(false);
      setIsEmailVerified(false);
      setResendCountdown(null);
      showToast(message, 'error');
    }
  };

  const handleVerifyCode = async () => {
    if (!isCodeSent) {
      setCodeFeedback(null);
      showToast('먼저 인증 번호를 전송해주세요.', 'error');
      return;
    }

    const normalizedEmail = email.trim();
    if (!SCHOOL_EMAIL_REGEX.test(normalizedEmail)) {
      setEmailFeedback(null);
      setIsEmailVerified(false);
      showToast('학교 이메일(@g.hongik.ac.kr)로 입력해주세요.', 'error');
      return;
    }

    try {
      await verifyEmailCode({ email: normalizedEmail, code: code.trim() });
      setCodeFeedback('인증 완료되었습니다.');
      setEmailFeedback(null);
      setIsEmailVerified(true);
      setResendCountdown(null);
    } catch (error) {
      const message = getErrorMessage(error, '인증 번호가 일치하지 않습니다.');
      setCodeFeedback(null);
      setIsEmailVerified(false);
      showToast(message, 'error');
    }
  };

  const submitSignUp = async (payload: SignUpPayload, displayName: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await signUp(payload);
      Alert.alert('가입이 완료되었습니다', `${displayName}님, 환영합니다!`, [
        {
          text: '확인',
          onPress: () => router.replace('/auth'),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmProfileSubmission = () => {
    if (!isEmailVerified) {
      showToast('학교 이메일 인증을 먼저 완료해주세요.', 'error');
      return;
    }

    if (password !== passwordConfirm) {
      showToast('비밀번호가 서로 일치하지 않습니다.', 'error');
      return;
    }

    const trimmedDepartment = department.trim();
    const trimmedStudentId = studentId.trim();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    const payload: SignUpPayload = {
      email: trimmedEmail,
      password,
      passwordConfirm,
      studentId: trimmedStudentId,
      studentName: trimmedName,
      phoneNumber: trimmedPhone,
    };

    Alert.alert(
      '가입 정보를 확인해주세요',
      `해당 정보로 가입을 진행할까요?\n\n학과: ${trimmedDepartment}\n학번: ${trimmedStudentId}\n이름: ${trimmedName}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => submitSignUp(payload, trimmedName),
        },
      ],
    );
  };

  const goNext = () => {
    if (step === 'agreements') {
      setStep('email');
      return;
    }

    if (step === 'email') {
      setStep('profile');
      return;
    }

    confirmProfileSubmission();
  };

  const goPrev = () => {
    if (step === 'email') {
      setStep('agreements');
    } else if (step === 'profile') {
      setStep('email');
      setIsEmailVerified(false);
      setIsCodeSent(false);
      setCode('');
      setCodeFeedback(null);
      setResendCountdown(null);
      setEmailFeedback(null);
    } else {
      router.back();
    }
  };

  const isNextEnabled = useMemo(() => {
    if (step === 'agreements') {
      return allAgreed;
    }
    if (step === 'email') {
      return isEmailVerified;
    }
    return profileFilled && !isSubmitting;
  }, [allAgreed, isEmailVerified, profileFilled, step, isSubmitting]);

  const nextLabel = step === 'profile' ? '가입하기' : '다음';

  useEffect(() => {
    if (resendCountdown === null || resendCountdown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev === null) {
          return prev;
        }
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (resendCountdown !== 0) {
      return;
    }

    setResendCountdown(null);
    setIsCodeSent(false);
    if (!isEmailVerified) {
      setEmailFeedback(null);
      setCode('');
      setCodeFeedback(null);
      showToast('인증 번호 입력 시간이 만료되었습니다. 다시 요청해주세요.', 'error');
    }
  }, [isEmailVerified, resendCountdown]);

  useEffect(() => {
    if (!isEmailVerified) {
      return;
    }
    setCodeFeedback('인증 완료되었습니다.');
  }, [isEmailVerified]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const formattedCountdown = useMemo(() => {
    if (resendCountdown === null || resendCountdown <= 0) {
      return null;
    }
    const minutes = Math.floor(resendCountdown / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (resendCountdown % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [resendCountdown]);

  const sendButtonLabel = isCodeSent ? '인증 번호 재발송' : '인증 번호 발송';
  const sendDisabled = step !== 'email' || isEmailVerified;
  const confirmDisabled = step !== 'email' || !code.trim() || isEmailVerified;
  const backDisabled = (step === 'email' && isEmailVerified) || isSubmitting;

  const activeAgreement = activeAgreementKey
    ? AGREEMENT_DETAILS[activeAgreementKey]
    : null;

  const openAgreementModal = (key: AgreementKey) => {
    setActiveAgreementKey(key);
  };

  const closeAgreementModal = () => {
    setActiveAgreementKey(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={goPrev}
            hitSlop={8}
            style={[
              styles.backButton,
              backDisabled && styles.backButtonDisabled,
            ]}
            disabled={backDisabled}
          >
            <Text
              style={[
                styles.backText,
                backDisabled && styles.backTextDisabled,
              ]}
            >
              뒤로
            </Text>
          </Pressable>
          <Text style={styles.headerTitle}>회원가입</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'agreements' && (
            <View style={styles.stepBlock}>
              <View style={[styles.section, styles.welcomeCard]}>
                <Text style={styles.introTitle}>회비영에 오신걸 환영합니다.</Text>
                <Text style={styles.introText}>
                  회비영은 학교 이메일로 회원 가입이 가능하며,{'\n'}학생회비 납부 여부 인증도 가능합니다!
                </Text>
              </View>

              <View style={[styles.section, styles.agreementCard]}>
                <View style={styles.agreementHeader}>
                  <Text style={[styles.sectionTitle, styles.agreementTitle]}>
                    서비스 이용을 위한 약관 동의
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.selectAllButton,
                    pressed && { opacity: 0.9 },
                  ]}
                  onPress={handleAllAgree}
                >
                  <Text style={styles.selectAllText}>
                    {allAgreed ? '모두 해제하기' : '모두 동의하기'}
                  </Text>
                </Pressable>
                <View style={styles.termsBlock}>
                  {AGREEMENT_ITEMS.map((item) => (
                    <View key={item.key} style={styles.agreementRow}>
                      <Pressable
                        onPress={() => handleToggleAgreement(item.key)}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.checkboxHit,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            agreements[item.key] && styles.checkboxChecked,
                          ]}
                        >
                          {agreements[item.key] && (
                            <View style={styles.checkboxInner} />
                          )}
                        </View>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.agreementDetail,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => openAgreementModal(item.key)}
                      >
                        <Text style={styles.checkboxLabel}>{item.label}</Text>
                        <Text style={styles.agreementDetailLink}>내용 보기</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {step === 'email' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>학교 이메일을 인증해주세요.</Text>

              <View style={styles.fieldColumn}>
                <TextInput
                  style={styles.input}
                  placeholder="이메일 입력(@g.hongik.ac.kr)"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  editable={!isEmailVerified}
                  onChangeText={(text) => {
                    setEmail(text);
                    setIsEmailVerified(false);
                  }}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryActionButton,
                    pressed && !sendDisabled && { opacity: 0.9 },
                    sendDisabled && styles.secondaryActionButtonDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={sendDisabled}
                >
                  <Text
                    style={[
                      styles.secondaryActionText,
                      sendDisabled && styles.secondaryActionTextDisabled,
                    ]}
                  >
                    {sendButtonLabel}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.fieldColumn}>
                <TextInput
                  style={styles.input}
                  placeholder="인증 번호 입력"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  value={code}
                  editable={!isEmailVerified}
                  onChangeText={(value) => {
                    setCode(value);
                    setIsEmailVerified(false);
                  }}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryActionButton,
                    pressed && !confirmDisabled && { opacity: 0.9 },
                    confirmDisabled && styles.secondaryActionButtonDisabled,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={confirmDisabled}
                >
                  <Text
                    style={[
                      styles.secondaryActionText,
                      confirmDisabled && styles.secondaryActionTextDisabled,
                    ]}
                  >
                    확인
                  </Text>
                </Pressable>
              </View>

              {formattedCountdown && (
                <View style={styles.countdownPill}>
                  <Text style={styles.countdownLabel}>남은 시간</Text>
                  <Text style={styles.countdownValue}>{formattedCountdown}</Text>
                </View>
              )}

              {(emailFeedback || codeFeedback) && (
                <View style={styles.feedbackBlock}>
                  {emailFeedback && (
                    <Text
                      style={[
                        styles.feedbackText,
                        emailFeedback.includes('전송') ? styles.feedbackPositive : styles.feedbackNegative,
                      ]}
                    >
                      {emailFeedback}
                    </Text>
                  )}
                  {codeFeedback && (
                    <Text
                      style={[
                        styles.feedbackText,
                        codeFeedback.includes('완료') ? styles.feedbackPositive : styles.feedbackNegative,
                      ]}
                    >
                      {codeFeedback}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {step === 'profile' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>비밀번호를 설정해주세요.</Text>
                <View style={styles.fieldColumn}>
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호 입력"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호 확인"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>회원 정보를 입력해주세요.</Text>
                <View style={styles.fieldColumn}>
                  <TextInput
                    style={styles.input}
                    placeholder="학과 입력"
                    placeholderTextColor={COLORS.textMuted}
                    value={department}
                    onChangeText={setDepartment}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="학번 입력"
                    placeholderTextColor={COLORS.textMuted}
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="이름 입력"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="전화번호 입력"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
                <Text style={styles.noticeText}>
                  경고: 타인의 학번을 도용할 경우, 관련 법률(정보통신망법, 개인정보보호법 등)에 따라 형사처벌 및 민사상 손해배상 책임이 발생할 수 있습니다. 의도적인 도용 행위는 엄중한 법적 책임이 따르며, 적발 시 즉시 관련 기관에 신고 조치됩니다.
                </Text>
              </View>
            </>
          )}

          <View style={styles.actionArea}>
            <Pressable
              disabled={!isNextEnabled}
              onPress={goNext}
              style={({ pressed }) => [
                styles.primaryButton,
                !isNextEnabled && styles.primaryButtonDisabled,
                pressed && isNextEnabled && { opacity: 0.92 },
              ]}
            >
              {step === 'profile' && isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    !isNextEnabled && styles.primaryButtonTextDisabled,
                  ]}
                >
                  {nextLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>

        <Modal
          visible={Boolean(activeAgreement)}
          animationType="slide"
          transparent
          onRequestClose={closeAgreementModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {activeAgreement && (
                <>
                  <Text style={styles.modalTitle}>{activeAgreement.title}</Text>
                  <ScrollView style={styles.modalScroll}>
                    {activeAgreement.body.split('\n').map((paragraph, index) => (
                      <Text key={index} style={styles.modalParagraph}>
                        {paragraph || '\u00A0'}
                      </Text>
                    ))}
                  </ScrollView>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalCloseButton,
                      pressed && { opacity: 0.9 },
                    ]}
                    onPress={closeAgreementModal}
                  >
                    <Text style={styles.modalCloseText}>확인</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>

        {toast && (
          <View style={styles.toastOverlay} pointerEvents="none">
            <Animated.View
              style={[
                styles.toastCard,
                toast.tone === 'error' ? styles.toastError : styles.toastInfo,
                {
                  opacity: toastAnim.current,
                  transform: [
                    {
                      translateY: toastAnim.current.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.toastText}>{toast.message}</Text>
            </Animated.View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: 'Pretendard-SemiBold',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 64,
    gap: 16,
  },
  section: {
    gap: 20,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#141B2D',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  termsBlock: {
    gap: 12,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  checkboxHit: {
    padding: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  agreementDetail: {
    flex: 1,
    gap: 4,
  },
  agreementDetailLink: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.primary,
  },
  selectAllButton: {
    alignSelf: 'center',
    marginTop: -2,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.blue100,
  },
  selectAllText: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  fieldGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldColumn: {
    gap: 14,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  feedbackBlock: {
    marginTop: 8,
    gap: 6,
  },
  feedbackText: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
  },
  feedbackPositive: {
    color: COLORS.success,
  },
  feedbackNegative: {
    color: COLORS.danger,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.danger,
    fontFamily: 'Pretendard-Medium',
  },
  actionArea: {
    marginTop: 8,
  },
  countdownPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.blue100,
  },
  countdownLabel: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.primaryNavy,
  },
  countdownValue: {
    fontSize: 12,
    fontFamily: 'Pretendard-Bold',
    color: COLORS.primary,
  },
  backButtonDisabled: {
    opacity: 0.5,
  },
  backTextDisabled: {
    color: COLORS.textMuted,
  },
  stepBlock: {
    gap: 16,
  },
  welcomeCard: {
    gap: 12,
  },
  introTitle: {
    fontSize: 19,
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    color: COLORS.primaryNavy,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  agreementCard: {
    gap: 16,
  },
  agreementHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  agreementTitle: {
    textAlign: 'center',
  },
  secondaryActionButton: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d2bb8',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  secondaryActionButtonDisabled: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryActionText: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.primary,
  },
  secondaryActionTextDisabled: {
    color: COLORS.textMuted,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d2bb8',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.bg,
  },
  primaryButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: '#101828',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    gap: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: COLORS.text,
  },
  modalScroll: {
    flex: 1,
  },
  modalParagraph: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
    fontFamily: 'Pretendard-Medium',
    marginBottom: 10,
  },
  modalCloseButton: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  modalCloseText: {
    color: COLORS.bg,
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
  },
  toastOverlay: {
    position: 'absolute',
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  toastCard: {
    minWidth: '70%',
    maxWidth: 380,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(46, 70, 240, 0.22)',
  },
  toastError: {
    backgroundColor: COLORS.blue100,
  },
  toastInfo: {
    backgroundColor: COLORS.blue100,
  },
  toastText: {
    color: COLORS.primaryNavy,
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
  },
});
