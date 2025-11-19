import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

export default function SwitchRoleScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: '#111827' }}>
          역할 전환 페이지가 준비 중입니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}
