import { Ionicons } from '@expo/vector-icons';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';

type ScanState =
  | { type: 'idle' }
  | { type: 'processing'; payload: { raw: string } }
  | { type: 'success'; payload: { raw: string } }
  | { type: 'invalid'; payload: { message: string; raw: string } }
  | { type: 'denied'; payload: { reason: string; raw: string } };

type OverlayChip = {
  text: string;
  tone: 'primary' | 'danger' | 'neutral';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
};

type StatusMessage = {
  text: string;
  tone: 'primary' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
};

type PrimaryAction = {
  label: string;
  tone: 'primary' | 'danger';
  icon: keyof typeof Ionicons.glyphMap;
};

type StateUi = {
  frameColor: string;
  tintColor: string;
  overlayChip: OverlayChip | null;
  message: StatusMessage | null;
  action: PrimaryAction | null;
};

const INSTRUCTION = '카메라에 QR코드를 스캔해주세요.';
const SCAN_RESET_DELAY = 1100;

const CHIP_TONE = {
  primary: { background: COLORS.blue100, color: COLORS.primary },
  danger: { background: 'rgba(239, 68, 68, 0.16)', color: COLORS.danger },
  neutral: { background: 'rgba(15, 23, 42, 0.16)', color: COLORS.text },
};

const BUTTON_TONE = {
  primary: { background: COLORS.primary, color: '#FFFFFF' },
  danger: { background: COLORS.danger, color: '#FFFFFF' },
};

const MESSAGE_TONE = {
  primary: COLORS.primary,
  danger: COLORS.danger,
};

export default function QrTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>({ type: 'idle' });
  const [lastScanTs, setLastScanTs] = useState<number>(0);
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

  const evaluateResult = useCallback(async (data: string) => {
    const trimmed = data.trim();

    // 데모 로직: 특정 키워드 포함 여부로 승인/거부 시뮬레이션
    // 실제 API 연동 시 이 부분을 서버 호출로 교체한다.
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!trimmed) {
      lockedRef.current = true;
      setScanState({ type: 'invalid', payload: { message: '올바르지 않은 형식입니다.', raw: trimmed } });
      return;
    }

    if (/approved|pass|allow/i.test(trimmed)) {
      lockedRef.current = true;
      setScanState({ type: 'success', payload: { raw: trimmed } });
      return;
    }

    if (/dues|미납|overdue/i.test(trimmed)) {
      lockedRef.current = true;
      setScanState({
        type: 'denied',
        payload: { reason: '사유: 학생회비 미납 대상', raw: trimmed },
      });
      return;
    }

    lockedRef.current = true;
    setScanState({ type: 'invalid', payload: { message: '올바르지 않은 형식입니다.', raw: trimmed } });
  }, []);

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

  const ui = useMemo<StateUi>(() => {
    switch (scanState.type) {
      case 'idle':
        return {
          frameColor: COLORS.primary,
          tintColor: rgba(COLORS.primary, 0.08),
          overlayChip: null,
          message: null,
          action: null,
        };
      case 'processing':
        return {
          frameColor: COLORS.primary,
          tintColor: rgba(COLORS.primary, 0.12),
          overlayChip: {
            text: '인식 중...',
            tone: 'primary',
            loading: true,
          },
          message: null,
          action: null,
        };
      case 'success':
        return {
          frameColor: COLORS.primary,
          tintColor: rgba(COLORS.primary, 0.16),
          overlayChip: {
            text: '승인 완료',
            tone: 'primary',
            icon: 'checkmark-circle',
          },
          message: null,
          action: {
            label: '승인',
            tone: 'primary',
            icon: 'checkmark',
          },
        };
      case 'denied':
        return {
          frameColor: COLORS.danger,
          tintColor: rgba(COLORS.danger, 0.14),
          overlayChip: {
            text: scanState.payload.reason,
            tone: 'danger',
            icon: 'alert-circle-outline',
          },
          message: null,
          action: {
            label: '미승인',
            tone: 'danger',
            icon: 'close',
          },
        };
      case 'invalid':
        return {
          frameColor: COLORS.danger,
          tintColor: rgba(COLORS.danger, 0.14),
          overlayChip: null,
          message: {
            text: scanState.payload.message,
            tone: 'danger',
            icon: 'warning-outline',
          },
          action: {
            label: '미승인',
            tone: 'danger',
            icon: 'close',
          },
        };
      default:
        return {
          frameColor: COLORS.primary,
          tintColor: rgba(COLORS.primary, 0.1),
          overlayChip: null,
          message: null,
          action: null,
        };
    }
  }, [scanState]);

  const handlePrimaryAction = useCallback(() => {
    if (scanState.type === 'success') {
      console.log('[QR] 승인 처리', scanState.payload.raw);
    } else if (scanState.type === 'denied' || scanState.type === 'invalid') {
      console.log('[QR] 미승인 처리', scanState.payload.raw);
    }
    resetState();
  }, [resetState, scanState]);

  const hasPermission = permission?.granted;

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
        <Text style={styles.instruction}>{INSTRUCTION}</Text>

        <View style={styles.cameraSection}>
          <View style={styles.cameraContainer}>
            <View style={styles.cameraBackdrop} />
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={onBarCodeScanned}
            />
            <View style={[styles.cameraTint, { backgroundColor: ui.tintColor }]} />

            <Corner position="tl" color={ui.frameColor} />
            <Corner position="tr" color={ui.frameColor} />
            <Corner position="bl" color={ui.frameColor} />
            <Corner position="br" color={ui.frameColor} />

            <View style={styles.crosshair}>
              <View style={[styles.crossLineVertical, { backgroundColor: ui.frameColor }]} />
              <View style={[styles.crossLineHorizontal, { backgroundColor: ui.frameColor }]} />
            </View>

            {ui.overlayChip && (
              <View
                style={[
                  styles.overlayChip,
                  { backgroundColor: CHIP_TONE[ui.overlayChip.tone].background },
                ]}
              >
                {ui.overlayChip.loading ? (
                  <ActivityIndicator size="small" color={CHIP_TONE[ui.overlayChip.tone].color} />
                ) : ui.overlayChip.icon ? (
                  <Ionicons
                    name={ui.overlayChip.icon}
                    size={18}
                    color={CHIP_TONE[ui.overlayChip.tone].color}
                    style={{ marginRight: 6 }}
                  />
                ) : null}
                <Text style={[styles.overlayChipText, { color: CHIP_TONE[ui.overlayChip.tone].color }]}>
                  {ui.overlayChip.text}
                </Text>
              </View>
            )}
          </View>
        </View>

        {ui.message && (
          <View style={styles.messageRow}>
            {ui.message.icon && (
              <Ionicons
                name={ui.message.icon}
                size={18}
                color={MESSAGE_TONE[ui.message.tone]}
                style={{ marginRight: 6 }}
              />
            )}
            <Text style={[styles.messageText, { color: MESSAGE_TONE[ui.message.tone] }]}>
              {ui.message.text}
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          {ui.action ? (
            <>
              <Pressable
                onPress={handlePrimaryAction}
                style={[
                  styles.primaryButton,
                  { backgroundColor: BUTTON_TONE[ui.action.tone].background },
                ]}
              >
                <Ionicons
                  name={ui.action.icon}
                  size={18}
                  color={BUTTON_TONE[ui.action.tone].color}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: BUTTON_TONE[ui.action.tone].color },
                  ]}
                >
                  {ui.action.label}
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <CouncilHeader
        studentId="C246120"
        title="QR코드 스캔"
        right={(
          <Pressable onPress={resetState} hitSlop={10} style={styles.headerRefresh}>
            <Ionicons name="refresh" size={18} color={COLORS.text} />
          </Pressable>
        )}
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
    backgroundColor: '#0F172A',
  },
  cameraBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  cameraTint: {
    ...StyleSheet.absoluteFillObject,
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
  overlayChip: {
    position: 'absolute',
    bottom: 24,
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
});
