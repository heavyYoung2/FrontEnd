import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import HoebiyoungLogo from '@/src/components/HoebiyoungLogo';
import { COLORS } from '@/src/design/colors';

const SPLASH_DELAY_MS = 1600;

export default function AppSplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth');
    }, SPLASH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.bg} />
      <View style={styles.logoBlock}>
        <HoebiyoungLogo />
      </View>
      <ActivityIndicator color={COLORS.primary} style={styles.spinner} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 96,
  },
  spinner: {
    position: 'absolute',
    bottom: 72,
  },
});
