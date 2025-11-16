import React, { useCallback } from 'react';
import CouncilQrScanner, { CouncilQrScannerResult } from '@/src/components/CouncilQrScanner';
import { returnItemByQrToken, RentalQrScanError, RENTAL_SCAN_ERROR_MESSAGES } from '@/src/api/rentalAdmin';

type ReturnQrScannerProps = {
  title?: string;
  showBack?: boolean;
  backFallbackHref?: string;
  showHeaderRefresh?: boolean;
  instruction?: string;
};

const DEFAULT_TITLE = '반납 QR 스캔';
const DEFAULT_INSTRUCTION = '학생 QR을 스캔하면 반납이 즉시 처리됩니다.';

export default function ReturnQrScanner({
  title = DEFAULT_TITLE,
  showBack = true,
  backFallbackHref,
  showHeaderRefresh = false,
  instruction = DEFAULT_INSTRUCTION,
}: ReturnQrScannerProps) {
  const handleProcess = useCallback(async (token: string): Promise<CouncilQrScannerResult> => {
    try {
      await returnItemByQrToken(token);
      return {
        status: 'success',
        message: '반납 완료',
        actionLabel: '반납 완료',
        speech: '반납되었습니다',
      };
    } catch (err) {
      if (err instanceof RentalQrScanError) {
        const friendly =
          (err.code && RENTAL_SCAN_ERROR_MESSAGES[err.code]) ||
          (err.message && err.message.trim().length > 0 ? err.message : null);
        if (err.code && err.code !== 'ALREADY_RETURN') {
          return {
            status: 'denied',
            message: friendly ?? '반납이 불가합니다.',
            actionLabel: '확인',
            speech: '반납이 불가합니다',
          };
        }
        if (err.code === 'ALREADY_RETURN') {
          return {
            status: 'invalid',
            message: friendly ?? '이미 반납된 물품입니다.',
            actionLabel: '확인',
          };
        }
        return {
          status: 'invalid',
          message: friendly ?? '반납 정보를 확인할 수 없어요.',
          actionLabel: '다시 시도',
        };
      }
      const message =
        err instanceof Error && err.message ? err.message : '반납 정보를 확인할 수 없어요.';
      return {
        status: 'invalid',
        message,
        actionLabel: '다시 시도',
      };
    }
  }, []);

  return (
    <CouncilQrScanner
      headerProps={{
        title,
        showBack,
        backFallbackHref,
      }}
      instruction={instruction}
      processingText="인식 중..."
      successChipText="반납 완료"
      inlineResetLabel="다시 스캔"
      successActionLabel="반납 완료"
      deniedActionLabel="확인"
      invalidActionLabel="다시 시도"
      successSpeech="반납되었습니다"
      deniedSpeech="반납이 불가합니다"
      allowCameraToggle
      showHeaderRefresh={showHeaderRefresh}
      onProcess={handleProcess}
    />
  );
}
