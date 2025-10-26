// src/screens/LockerScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LockerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Locker Screen</Text>
      <Text>사물함 현황/배정/연장 등 기능을 추가하세요.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
});
