import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CompleteScreen() {
  const router = useRouter();

  const rewardData = {
    xp: 50,
    coins: 20,
    streak: 3,
    totalXP: 350,
    totalCoins: 120,
    level: 2,
    exerciseName: 'ท่ายืดกล้ามเนื้อขา',
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.successIcon}>
          <FontAwesome6 name="check" size={38} color="#fff" />
        </View>
        <Text style={styles.title}>เยี่ยมมาก! 🎉</Text>
        <Text style={styles.subtitle}>คุณทำท่ายืดเสร็จแล้ว</Text>
      </View>

      <View style={styles.exerciseCard}>
        <View style={styles.exerciseIcon}>
          <FontAwesome6 name="person-running" size={25} color="#43a5ff" />
        </View>
        <View>
          <Text style={styles.exerciseLabel}>ท่าที่ทำ</Text>
          <Text style={styles.exerciseNameText}>{rewardData.exerciseName}</Text>
        </View>
      </View>

      <View style={styles.rewardSection}>
        <Text style={styles.sectionTitle}>รางวัลที่ได้รับ</Text>
        <View style={styles.rewardGrid}>
          <View style={[styles.rewardCard, styles.xpCard]}>
            <View style={[styles.rewardIcon, styles.xpIcon]}>
              <FontAwesome6 name="star" size={20} color="#f0ae00" />
            </View>
            <Text style={styles.rewardCardLabel}>XP</Text>
            <Text style={[styles.rewardValue, styles.xpValue]}>+{rewardData.xp}</Text>
          </View>

          <View style={[styles.rewardCard, styles.coinCard]}>
            <View style={[styles.rewardIcon, styles.coinIcon]}>
              <FontAwesome6 name="coins" size={20} color="#d99a00" />
            </View>
            <Text style={styles.rewardCardLabel}>Coins</Text>
            <Text style={[styles.rewardValue, styles.coinValue]}>+{rewardData.coins}</Text>
          </View>

          <View style={[styles.rewardCard, styles.streakCard]}>
            <View style={[styles.rewardIcon, styles.streakIconCard]}>
              <FontAwesome6 name="fire" size={20} color="#f06445" />
            </View>
            <Text style={styles.rewardCardLabel}>Streak</Text>
            <Text style={[styles.rewardValue, styles.streakValueText]}>
              {rewardData.streak} <Text style={styles.streakUnit}>วัน</Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.totalSection}>
        <View style={styles.totalItem}>
          <Text style={styles.totalItemLabel}>XP ทั้งหมด</Text>
          <Text style={styles.totalItemValue}>{rewardData.totalXP} XP</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalItemLabel}>Coins ทั้งหมด</Text>
          <Text style={styles.totalItemValue}>{rewardData.totalCoins}</Text>
        </View>
        <View style={[styles.totalItem, { borderBottomWidth: 0 }]}>
          <Text style={styles.totalItemLabel}>Level</Text>
          <Text style={styles.totalItemValue}>Lv.{rewardData.level}</Text>
        </View>
      </View>

      <View style={styles.streakMessage}>
        <Text style={styles.streakMessageEmoji}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakMessageTitle}>🔥 Streak {rewardData.streak} วัน!</Text>
          <Text style={styles.streakMessageText}>คุณกำลังสร้างนิสัยที่ดี รักษาความต่อเนื่องต่อไป!</Text>
        </View>
      </View>

      <View style={styles.completeActions}>
        {/* แบบสอบถามอาการหลังยืด */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/post-stretch' as any)}
        >
          <FontAwesome6 name="clipboard-question" size={16} color="#fff" />
          <Text style={styles.primaryButtonText}>แบบสอบถามอาการหลังยืด</Text>
        </TouchableOpacity>

        {/* ยืดอีกครั้ง */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace('/stretch')}
        >
          <FontAwesome6 name="person-running" size={16} color="#43a5ff" />
          <Text style={styles.secondaryButtonText}>ยืดอีกครั้ง</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    paddingBottom: 50,
    backgroundColor: '#e9f8ff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#55c98a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#55c98a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#16324f',
  },
  subtitle: {
    marginTop: 6,
    color: '#718096',
    fontSize: 15,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    gap: 15,
  },
  exerciseIcon: {
    width: 55,
    height: 55,
    borderRadius: 15,
    backgroundColor: '#e8f5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseLabel: {
    fontSize: 12,
    color: '#8a96a3',
  },
  exerciseNameText: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: '600',
    color: '#26384a',
  },
  rewardSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#16324f',
    marginBottom: 15,
  },
  rewardGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  xpCard: {},
  coinCard: {},
  streakCard: {},
  rewardIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpIcon: { backgroundColor: '#fff4c7' },
  coinIcon: { backgroundColor: '#fff0bd' },
  streakIconCard: { backgroundColor: '#ffe4df' },
  rewardCardLabel: {
    fontSize: 12,
    color: '#7b8794',
  },
  rewardValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
  },
  xpValue: { color: '#e4a300' },
  coinValue: { color: '#d99a00' },
  streakValueText: { color: '#f06445', fontSize: 16 },
  streakUnit: { fontSize: 12, color: '#f06445', fontWeight: '400' },
  totalSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f5',
  },
  totalItemLabel: {
    color: '#718096',
    fontSize: 14,
  },
  totalItemValue: {
    color: '#16324f',
    fontSize: 16,
    fontWeight: '600',
  },
  streakMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e8',
    padding: 16,
    borderRadius: 18,
    marginBottom: 22,
    gap: 12,
  },
  streakMessageEmoji: { fontSize: 30 },
  streakMessageTitle: {
    color: '#d85b32',
    fontSize: 15,
    fontWeight: '700',
  },
  streakMessageText: {
    marginTop: 3,
    color: '#8b756c',
    fontSize: 12,
  },
  completeActions: { gap: 10 },
  primaryButton: {
    backgroundColor: '#43a5ff',
    minHeight: 52,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    shadowColor: '#43a5ff',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#d9eefe',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  secondaryButtonText: {
    color: '#43a5ff',
    fontSize: 15,
    fontWeight: '600',
  },
});
