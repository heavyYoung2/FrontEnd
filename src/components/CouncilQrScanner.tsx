import { Ionicons } from '@expo/vector-icons';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import React, { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '@/src/design/colors';
import { TYPO } from '@/src/design/typography';

const SCAN_RESET_DELAY = 1100;
const DEFAULT_AUTO_RESET_DELAY = 7000;

export type CouncilQrScannerResult =
  | { status: 'success'; message?: string; actionLabel?: string; speech?: string }
  | { status: 'denied'; message: string; actionLabel?: string; speech?: string }
  | { status: 'invalid'; message: string; actionLabel?: string };

type HeaderProps = Omit<ComponentProps<typeof CouncilHeader>, 'right'>;

type CouncilQrScannerProps = {
  headerProps?: HeaderProps;
  headerRight?: React.ReactNode;
  showHeaderRefresh?: boolean;
  instruction?: string;
  processingText?: string;
  successChipText?: string;
  inlineResetLabel?: string;
  successActionLabel?: string;
  deniedActionLabel?: string;
  invalidActionLabel?: string;
  successSpeech?: string;
  deniedSpeech?: string;
  showSoundToggle?: boolean;
  allowCameraToggle?: boolean;
  autoResetDelay?: number;
  cameraBackgroundColor?: string;
  onProcess: (token: string) => Promise<CouncilQrScannerResult>;
};

type ScanState =
  | { type: 'idle' }
  | { type: 'processing'; payload: { raw: string } }
  | { type: 'success'; payload: CouncilQrScannerResult & { status: 'success' } }
  | { type: 'denied'; payload: CouncilQrScannerResult & { status: 'denied' } }
  | { type: 'invalid'; payload: CouncilQrScannerResult & { status: 'invalid' } };

const CHIP_TONE = {
  primary: { background: COLORS.blue100, color: COLORS.primary },
  danger: { background: 'rgba(239, 68, 68, 0.16)', color: COLORS.danger },
};

export default function CouncilQrScanner({
  headerProps,
  headerRight,
  showHeaderRefresh,
  instruction = '카메라에 QR코드를 스캔해주세요.',
  processingText = '인식 중...',
  successChipText = '처리 완료',
  inlineResetLabel = '다시 스캔',
  successActionLabel = '확인',
  deniedActionLabel = '확인',
  invalidActionLabel = '확인',
  successSpeech,
  deniedSpeech,
  showSoundToggle = true,
  allowCameraToggle = false,
  autoResetDelay = DEFAULT_AUTO_RESET_DELAY,
  cameraBackgroundColor = '#0F172A',
  onProcess,
}: CouncilQrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>({ type: 'idle' });
  const [lastScanTs, setLastScanTs] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [koreanMaleVoiceId, setKoreanMaleVoiceId] = useState<string | null>(null);
  const processingRef = useRef(false);
  const lockedRef = useRef(false);

  const requirePermission = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Linking.openSettings();
      }
    }
  }, [permission?.granted, requestPermission]);

  const resetState = useCallback(() => {
    processingRef.current = false;
    lockedRef.current = false;
    setScanState({ type: 'idle' });
  }, []);

  const handleResult = useCallback(
    (result: CouncilQrScannerResult) => {
      if (result.status === 'success') {
        setScanState({ type: 'success', payload: { ...result, status: 'success' } });
      } else if (result.status === 'denied') {
        setScanState({ type: 'denied', payload: { ...result, status: 'denied' } });
      } else {
        setScanState({ type: 'invalid', payload: { ...result, status: 'invalid' } });
      }
    },
    [],
  );

  const evaluateResult = useCallback(
    async (data: string) => {
      const trimmed = data.trim();
      if (!trimmed) {
        handleResult({ status: 'invalid', message: '올바른 QR 코드가 아니에요.' });
        lockedRef.current = true;
        return;
      }

      try {
        const result = await onProcess(trimmed);
        lockedRef.current = true;
        handleResult(result);
      } catch (err) {
        lockedRef.current = true;
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'QR 정보를 확인할 수 없어요. 다시 시도해주세요.';
        handleResult({ status: 'invalid', message });
      }
    },
    [handleResult, onProcess],
  );

  const onBarCodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (processingRef.current || lockedRef.current) return;

      const now = Date.now();
      if (now - lastScanTs < SCAN_RESET_DELAY) return;
      setLastScanTs(now);

      const raw = result?.data ?? '';
      processingRef.current = true;
      setScanState({ type: 'processing', payload: { raw } });

      try {
        await evaluateResult(raw);
      } finally {
        processingRef.current = false;
      }
    },
    [evaluateResult, lastScanTs],
  );

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const koreanVoices = voices.filter((voice) => voice.language?.startsWith('ko'));
        const smoothMaleVoice =
          koreanVoices.find((voice) =>
            /male|남자|남성|ho|hun|hyun|joon|min/i.test(`${voice.name}${voice.identifier}`),
          ) ?? koreanVoices[0];
        if (smoothMaleVoice) {
          setKoreanMaleVoiceId(smoothMaleVoice.identifier);
        }
      } catch (err) {
        console.warn('[QR] Failed to load speech voices', err);
      }
    };

    loadVoices();
  }, []);

  useEffect(() => {
    if (!soundEnabled) {
      Speech.stop();
      return;
    }

    if (scanState.type === 'success') {
      const utterance = scanState.payload.speech ?? successSpeech;
      if (utterance) {
        Speech.stop();
        Speech.speak(utterance, {
          language: 'ko-KR',
          pitch: 0.92,
          rate: 0.92,
          voice: koreanMaleVoiceId ?? undefined,
        });
      }
    } else if (scanState.type === 'denied') {
      const utterance = scanState.payload.speech ?? deniedSpeech;
      if (utterance) {
        Speech.stop();
        Speech.speak(utterance, {
          language: 'ko-KR',
          pitch: 0.92,
          rate: 0.92,
          voice: koreanMaleVoiceId ?? undefined,
        });
      }
    }

    return () => {
      Speech.stop();
    };
  }, [deniedSpeech, koreanMaleVoiceId, scanState, soundEnabled, successSpeech]);

  useEffect(() => {
    if (
      scanState.type !== 'success' &&
      scanState.type !== 'denied' &&
      scanState.type !== 'invalid'
    ) {
      return;
    }
    const timer = setTimeout(() => {
      resetState();
    }, autoResetDelay);
    return () => clearTimeout(timer);
  }, [autoResetDelay, resetState, scanState]);

  const showInlineReset =
    scanState.type === 'success' || scanState.type === 'denied' || scanState.type === 'invalid';

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const hasPermission = permission?.granted;

  const frameColor = useMemo(() => {
    if (scanState.type === 'denied' || scanState.type === 'invalid') {
      return COLORS.danger;
    }
    return COLORS.primary;
  }, [scanState.type]);

  const tintColor = useMemo(() => {
    switch (scanState.type) {
      case 'processing':
        return rgba(frameColor, 0.12);
      case 'success':
        return rgba(frameColor, 0.16);
      case 'denied':
      case 'invalid':
        return rgba(COLORS.danger, 0.14);
      default:
        return rgba(COLORS.primary, 0.08);
    }
  }, [frameColor, scanState.type]);

  const overlayChip = useMemo(() => {
    if (scanState.type === 'processing') {
      return {
        text: processingText,
        tone: 'primary' as const,
        loading: true,
      };
    }
    if (scanState.type === 'success') {
      return {
        text: scanState.payload.message ?? successChipText,
        tone: 'primary' as const,
        icon: 'checkmark-circle' as const,
      };
    }
    if (scanState.type === 'denied') {
      return {
        text: scanState.payload.message,
        tone: 'danger' as const,
        icon: 'alert-circle-outline' as const,
      };
    }
    return null;
  }, [processingText, scanState, successChipText]);

  const primaryAction = useMemo(() => {
    if (scanState.type === 'success') {
      return {
        label: scanState.payload.actionLabel ?? successActionLabel,
        tone: 'primary' as const,
        icon: 'checkmark' as const,
      };
    }
    if (scanState.type === 'denied') {
      return {
        label: scanState.payload.actionLabel ?? deniedActionLabel,
        tone: 'danger' as const,
        icon: 'close' as const,
      };
    }
    if (scanState.type === 'invalid') {
      return {
        label: scanState.payload.actionLabel ?? invalidActionLabel,
        tone: 'danger' as const,
        icon: 'close' as const,
      };
    }
    return null;
  }, [deniedActionLabel, invalidActionLabel, scanState, successActionLabel]);

  let content: React.ReactNode;
  if (!permission) {
    content = (
      <View style={styles.permissionPanel}>
        <Text style={styles.permissionTitle}>카메라 접근 권한이 필요합니다.</Text>
        <Text style={styles.permissionDesc}>QR 인증을 위해 카메라 사용 권한을 허용해주세요.</Text>
        <Pressable style={styles.permissionButton} onPress={requirePermission}>
          <Text style={styles.permissionButtonText}>권한 요청</Text>
        </Pressable>
      </View>
    );
  } else if (!hasPermission) {
    content = (
      <View style={styles.permissionPanel}>
        <Text style={styles.permissionTitle}>카메라 권한이 거부되었습니다.</Text>
        <Text style={styles.permissionDesc}>설정에서 권한을 허용한 뒤 다시 시도해주세요.</Text>
        <Pressable style={styles.permissionButton} onPress={requirePermission}>
          <Text style={styles.permissionButtonText}>설정 열기</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <View style={styles.content}>
        <Text style={styles.instruction}>{instruction}</Text>

        {(showSoundToggle || allowCameraToggle) && (
          <View
            style={[
              styles.controlRow,
              {
                justifyContent:
                  allowCameraToggle && showSoundToggle
                    ? 'space-between'
                    : allowCameraToggle
                      ? 'flex-start'
                      : 'flex-end',
              },
            ]}
          >
            {allowCameraToggle && (
              <Pressable
                onPress={() => setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
                hitSlop={10}
                style={styles.cameraToggleButton}
              >
                <Ionicons name="camera-reverse-outline" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
                <Text style={styles.cameraToggleText}>방향 전환</Text>
              </Pressable>
            )}
            {showSoundToggle && (
              <Pressable
                onPress={toggleSound}
                hitSlop={10}
                style={[
                  styles.soundToggleButton,
                  soundEnabled && styles.soundToggleButtonActive,
                ]}
              >
                <Ionicons
                  name={soundEnabled ? 'volume-high' : 'volume-mute'}
                  size={16}
                  color={soundEnabled ? COLORS.primary : COLORS.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.soundToggleText,
                    soundEnabled && styles.soundToggleTextActive,
                  ]}
                >
                  {soundEnabled ? '소리 ON' : '소리 OFF'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.cameraSection}>
          <View style={styles.cameraContainer}>
            <View style={[styles.cameraBackdrop, { backgroundColor: cameraBackgroundColor }]} />
            <CameraView
              style={StyleSheet.absoluteFill}
              facing={cameraFacing}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={onBarCodeScanned}
            />
            <View style={[styles.cameraTint, { backgroundColor: tintColor }]} />

            <Corner position="tl" color={frameColor} />
            <Corner position="tr" color={frameColor} />
            <Corner position="bl" color={frameColor} />
            <Corner position="br" color={frameColor} />

            <View style={styles.crosshair}>
              <View
                style={[styles.crossLineVertical, { backgroundColor: frameColor }]}
              />
              <View
                style={[styles.crossLineHorizontal, { backgroundColor: frameColor }]}
              />
            </View>

            {(overlayChip || showInlineReset) && (
              <View style={styles.overlayStack}>
                {overlayChip && (
                  <View
                    style={[
                      styles.overlayChip,
                      { backgroundColor: CHIP_TONE[overlayChip.tone].background },
                    ]}
                  >
                    {overlayChip.loading ? (
                      <ActivityIndicator size="small" color={CHIP_TONE[overlayChip.tone].color} />
                    ) : overlayChip.icon ? (
                      <Ionicons
                        name={overlayChip.icon}
                        size={18}
                        color={CHIP_TONE[overlayChip.tone].color}
                        style={{ marginRight: 6 }}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.overlayChipText,
                        { color: CHIP_TONE[overlayChip.tone].color },
                      ]}
                    >
                      {overlayChip.text}
                    </Text>
                  </View>
                )}

                {showInlineReset && (
                  <Pressable onPress={resetState} style={styles.inlineResetButton} hitSlop={8}>
                    <Ionicons name="refresh" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.inlineResetText}>{inlineResetLabel}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>

        {scanState.type === 'invalid' && (
          <View style={styles.messageRow}>
            <Ionicons
              name="warning-outline"
              size={18}
              color={COLORS.danger}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.messageText, { color: COLORS.danger }]}>
              {scanState.payload.message}
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          {primaryAction ? (
            <>
              <Pressable
                onPress={resetState}
                style={[
                  styles.primaryButton,
                  { backgroundColor: primaryAction.tone === 'primary' ? COLORS.primary : COLORS.danger },
                ]}
              >
                <Ionicons
                  name={primaryAction.icon}
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>
                  {primaryAction.label}
                </Text>
              </Pressable>

              <Pressable onPress={resetState} hitSlop={10} style={styles.refreshCircle}>
                <Ionicons name="refresh" size={18} color={COLORS.text} />
              </Pressable>
            </>
          ) : (
            <Pressable onPress={resetState} style={styles.secondaryRefresh}>
              <Ionicons name="refresh" size={18} color={COLORS.textMuted} />
              <Text style={styles.secondaryRefreshText}>새로고침</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const headerRefresh = showHeaderRefresh ? (
    <Pressable onPress={resetState} hitSlop={10} style={styles.headerRefresh}>
      <Ionicons name="refresh" size={18} color={COLORS.text} />
    </Pressable>
  ) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <CouncilHeader
        {...headerProps}
        right={headerRight ?? headerRefresh}
      />

      <View style={styles.body}>{content}</View>
    </SafeAreaView>
  );
}

type CornerProps = { position: 'tl' | 'tr' | 'bl' | 'br'; color: string };

function Corner({ position, color }: CornerProps) {
  const base = [styles.cornerBase];
  let positionStyle: object = {};
  let colorStyle: object = {};

  if (position === 'tl') {
    positionStyle = styles.cornerTL;
    colorStyle = { borderTopColor: color, borderLeftColor: color };
  } else if (position === 'tr') {
    positionStyle = styles.cornerTR;
    colorStyle = { borderTopColor: color, borderRightColor: color };
  } else if (position === 'bl') {
    positionStyle = styles.cornerBL;
    colorStyle = { borderBottomColor: color, borderLeftColor: color };
  } else {
    positionStyle = styles.cornerBR;
    colorStyle = { borderBottomColor: color, borderRightColor: color };
  }

  return <View pointerEvents="none" style={[...base, positionStyle, colorStyle]} />;
}

function rgba(hexColor: string, alpha: number) {
  const hex = hexColor.replace('#', '');
  const value = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const num = parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 24,
  },
  instruction: {
    ...TYPO.body,
    textAlign: 'center',
    color: COLORS.text,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cameraToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  cameraToggleText: {
    ...TYPO.caption,
    color: COLORS.text,
    fontFamily: 'Pretendard-Medium',
  },
  cameraSection: {
    alignItems: 'center',
  },
  cameraContainer: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  crosshair: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossLineVertical: {
    width: 2,
    height: 44,
    borderRadius: 2,
    opacity: 0.75,
  },
  crossLineHorizontal: {
    position: 'absolute',
    width: 44,
    height: 2,
    borderRadius: 2,
    opacity: 0.75,
  },
  overlayStack: {
    position: 'absolute',
    bottom: 24,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  overlayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overlayChipText: {
    ...TYPO.bodySm,
    fontFamily: 'Pretendard-Medium',
  },
  inlineResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  inlineResetText: {
    ...TYPO.caption,
    color: COLORS.primary,
    fontFamily: 'Pretendard-SemiBold',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    ...TYPO.bodySm,
    fontFamily: 'Pretendard-Medium',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 208,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
  },
  primaryButtonText: {
    ...TYPO.button,
  },
  refreshCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  secondaryRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  secondaryRefreshText: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
  },
  headerRefresh: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  permissionTitle: {
    ...TYPO.subtitle,
    textAlign: 'center',
    color: COLORS.text,
  },
  permissionDesc: {
    ...TYPO.bodySm,
    textAlign: 'center',
    color: COLORS.textMuted,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  permissionButtonText: {
    ...TYPO.button,
    color: '#FFFFFF',
  },
  cornerBase: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderColor: 'transparent',
    borderRadius: 18,
  },
  cornerTL: {
    top: 24,
    left: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 24,
    right: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 24,
    left: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 24,
    right: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  soundToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  soundToggleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.blue100,
  },
  soundToggleText: {
    ...TYPO.caption,
    color: COLORS.textMuted,
    fontFamily: 'Pretendard-Medium',
  },
  soundToggleTextActive: {
    color: COLORS.primary,
  },
});
