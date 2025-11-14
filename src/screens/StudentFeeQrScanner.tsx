import React, { useCallback } from 'react';
import CouncilQrScanner, {
  CouncilQrScannerResult,
} from '@/src/components/CouncilQrScanner';
import { verifyStudentFeeByQrToken } from '@/src/api/studentFeeAdmin';

export default function StudentFeeQrScanner() {
  const handleProcess = useCallback(async (token: string): Promise<CouncilQrScannerResult> => {
    try {
      const approved = await verifyStudentFeeByQrToken(token);
      if (approved) {
        return {
          status: 'success',
          message: '승인 완료',
          actionLabel: '승인',
          speech: '확인되었습니다',
        };
      }
      return {
        status: 'denied',
        message: '사유: 학생회비 미납 대상',
        actionLabel: '미승인',
        speech: '학생회비 미납',
      };
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : '학생회비 정보를 확인할 수 없어요.';
      return {
        status: 'invalid',
        message,
        actionLabel: '미승인',
      };
    }
  }, []);

  return (
    <CouncilQrScanner
      headerProps={{ title: 'QR코드 스캔' }}
      instruction="학생 앱에서 발급한 QR 코드를 스캔해주세요."
      processingText="인식 중..."
      successChipText="승인 완료"
      inlineResetLabel="다시 스캔"
      successActionLabel="승인"
      deniedActionLabel="미승인"
      invalidActionLabel="미승인"
      successSpeech="확인되었습니다"
      deniedSpeech="학생회비 미납"
      showHeaderRefresh
      allowCameraToggle
      onProcess={handleProcess}
    />
  );
}
