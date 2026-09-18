import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from './components/BottomNav';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  coins: number;
  streak: number;
}

const defaultLeaderboardUsers: LeaderboardUser[] = [
  { id: 'user-atiya', name: 'Atiya', avatar: '👩🏻', xp: 0, coins: 0, streak: 0 },
  { id: 'user-palao', name: 'Mr.Palao', avatar: '👨🏻', xp: 540, coins: 100, streak: 12 },
  { id: 'user-mupup', name: 'Mupup', avatar: '👨🏽', xp: 420, coins: 80, streak: 8 },
  { id: 'user-tonnam', name: 'Tonnam', avatar: '👨', xp: 390, coins: 70, streak: 7 },
  { id: 'user-fai', name: 'Fai', avatar: '👩', xp: 350, coins: 60, streak: 6 },
  { id: 'user-beam', name: 'Beam', avatar: '👨', xp: 310, coins: 50, streak: 5 },
  { id: 'user-mint', name: 'Mint', avatar: '👩🏻', xp: 280, coins: 40, streak: 4 },
  { id: 'user-nam', name: 'Nam', avatar: '👩', xp: 250, coins: 30, streak: 3 },
  { id: 'user-bank', name: 'Bank', avatar: '👨🏻', xp: 220, coins: 20, streak: 2 },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<LeaderboardUser[]>(defaultLeaderboardUsers);
  const [currentUser, setCurrentUser] = useState(defaultLeaderboardUsers[0]);
  const [bestStreak, setBestStreak] = useState(0);

  const loadData = async () => {
    try {
      const savedUsers = await AsyncStorage.getItem('stretchmanLeaderboardUsers');
      let parsedUsers: LeaderboardUser[] = savedUsers
        ? JSON.parse(savedUsers)
        : [...defaultLeaderboardUsers];

      const userDataStr = await AsyncStorage.getItem('stretchmanUserData');
      let currentName = 'Atiya';
      let currentAvatar = '👩🏻';
      let currentXp = 0;
      let currentCoins = 0;
      let currentStreak = 0;

      if (userDataStr) {
        const parsedUser = JSON.parse(userDataStr);
        currentName = parsedUser.name || 'Atiya';
        currentAvatar = parsedUser.avatar || '👩🏻';
        currentXp = Number(parsedUser.xp) || Number(parsedUser.experience) || 0;
        currentCoins = Number(parsedUser.coins) || Number(parsedUser.coin) || 0;
        currentStreak = Number(parsedUser.streak) || 0;
      } else {
        const nameStr = await AsyncStorage.getItem('stretchmanName');
        if (nameStr) currentName = nameStr;
      }

      const updatedCurrent: LeaderboardUser = {
        id: 'user-atiya',
        name: currentName,
        avatar: currentAvatar,
        xp: currentXp,
        coins: currentCoins,
        streak: currentStreak,
      };

      setCurrentUser(updatedCurrent);

      const index = parsedUsers.findIndex((u) => u.id === updatedCurrent.id);
      if (index === -1) parsedUsers.push(updatedCurrent);
      else parsedUsers[index] = { ...parsedUsers[index], ...updatedCurrent };

      await AsyncStorage.setItem(
        'stretchmanLeaderboardUsers',
        JSON.stringify(parsedUsers)
      );
      setUsers(parsedUsers);

      const savedBest = Number(
        (await AsyncStorage.getItem('stretchmanBestStreak')) || 0
      );
      const best = Math.max(savedBest, currentStreak);
      await AsyncStorage.setItem('stretchmanBestStreak', best.toString());
      setBestStreak(best);
    } catch (error) {
      console.log('Error loading leaderboard data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const sortedUsers = [...users].sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    return b.streak - a.streak;
  });

  const topThree = sortedUsers.slice(0, 3);
  const otherUsers = sortedUsers.slice(3);
  const currentUserIndex = sortedUsers.findIndex((u) => u.id === currentUser.id);
  const currentRank = currentUserIndex !== -1 ? currentUserIndex + 1 : 1;
  const currentLevel = Math.floor(currentUser.xp / 100) + 1;
  const todayIndex = new Date().getDay();
  const mondayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const daysOfWeek = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.leaderboardPage}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.leaderboardHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={22} color="#9bbaff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <Text style={styles.headerSubtitle}>แข่งขันกับเพื่อนของคุณ</Text>
          </View>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/streak-history' as any)}
          >
            <FontAwesome6 name="clock-rotate-left" size={22} color="#9bbaff" />
          </TouchableOpacity>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakTop}>
            <View style={styles.streakIcon}><Text style={{ fontSize: 27 }}>🔥</Text></View>
            <View>
              <Text style={styles.streakTopSpan}>Current Streak</Text>
              <Text style={styles.streakTopStrong}>{currentUser.streak} วัน</Text>
            </View>
            <View style={styles.streakBest}>
              <Text style={styles.streakBestSmall}>Best</Text>
              <Text style={styles.streakBestB}>{bestStreak}</Text>
            </View>
          </View>
          <View style={styles.streakDays}>
            {daysOfWeek.map((dayName, index) => {
              const isToday = index === mondayIndex;
              const isCompleted =
                currentUser.streak > 0 &&
                index <= mondayIndex &&
                index >= mondayIndex - currentUser.streak + 1;
              return (
                <View key={index} style={styles.dayItem}>
                  <Text style={styles.daySpan}>{dayName}</Text>
                  <View
                    style={[
                      styles.dayIndicator,
                      isCompleted && styles.dayCompleted,
                      isToday && styles.dayToday,
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.playerCard}>
          <View style={styles.playerAvatar}><Text style={{ fontSize: 24 }}>{currentUser.avatar}</Text></View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerInfoStrong}>{currentUser.name}</Text>
            <Text style={styles.playerInfoSpan}>Level {currentLevel}</Text>
          </View>
          <View style={styles.playerCoins}>
            <Text style={styles.playerCoinsStrong}>{currentUser.coins}</Text>
            <Text style={styles.playerCoinsSpan}>Coins</Text>
          </View>
          <View style={styles.playerXp}>
            <Text style={styles.playerXpStrong}>{currentUser.xp}</Text>
            <Text style={styles.playerXpSpan}>XP</Text>
          </View>
        </View>

        <View style={styles.leaderboardSection}>
          <View style={styles.sectionTitleContainer}>
            <View>
              <Text style={styles.sectionTitleText}>Weekly Leaderboard</Text>
              <Text style={styles.sectionSubtitleText}>อันดับประจำสัปดาห์</Text>
            </View>
            <Text style={styles.trophy}>🏆</Text>
          </View>

          <View style={styles.podium}>
            {[topThree[1], topThree[0], topThree[2]].map((user, idx) => {
              if (!user) return null;
              const isFirst = idx === 1;
              const isThird = idx === 2;
              const rankNum = isFirst ? 1 : isThird ? 3 : 2;
              return (
                <View key={user.id} style={styles.podiumPlayer}>
                  {isFirst && <Text style={styles.crown}>👑</Text>}
                  <View style={[styles.rankAvatar, isFirst && styles.firstRankAvatar]}>
                    <Text style={{ fontSize: isFirst ? 28 : 25 }}>{user.avatar}</Text>
                  </View>
                  <View
                    style={[
                      styles.rankBadge,
                      isFirst
                        ? styles.firstBadge
                        : isThird
                        ? styles.thirdBadge
                        : styles.secondBadge,
                    ]}
                  >
                    <Text style={styles.rankBadgeText}>{rankNum}</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{user.name}</Text>
                  <Text style={styles.podiumXp}>{user.xp} XP</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.rankingList}>
            {otherUsers.map((user, index) => {
              const rank = index + 4;
              const isMe = user.id === currentUser.id;
              return (
                <View key={user.id} style={[styles.rankingItem, isMe && styles.currentUserItem]}>
                  <Text style={styles.rankingNumber}>{rank}</Text>
                  <View style={styles.miniAvatar}><Text style={{ fontSize: 15 }}>{user.avatar}</Text></View>
                  <Text style={styles.rankingName} numberOfLines={1}>{user.name}</Text>
                  <Text style={styles.rankingXp}>{user.xp} XP</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.myRankingBanner}>
            <View style={styles.myRankingLeft}>
              <Text style={styles.myRankingLeftSpan}>อันดับของคุณ</Text>
              <Text style={styles.myRankingLeftStrong}>#{currentRank}</Text>
            </View>
            <View style={styles.myRankingUser}>
              <View style={styles.miniAvatar}><Text style={{ fontSize: 15 }}>{currentUser.avatar}</Text></View>
              <View>
                <Text style={styles.myRankingUserName}>{currentUser.name}</Text>
                <Text style={styles.myRankingUserStreak}>{currentUser.streak} 🔥 Streak</Text>
              </View>
            </View>
            <Text style={styles.myRankingXp}>{currentUser.xp} XP</Text>
          </View>
        </View>
      </ScrollView>

      {/* ลอยเหมือนหน้า Pain / Record และไม่เลื่อนไปพร้อม ScrollView */}
      <View style={styles.fixedBottomNav}>
        <BottomNav activeTab="leaderboard" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#123b91' },
  leaderboardPage: {
    width: '100%', maxWidth: 430, alignSelf: 'center', minHeight: '100%',
    paddingHorizontal: 15, paddingTop: 15, paddingBottom: 110, gap: 12,
  },
  leaderboardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 5, paddingVertical: 3 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  historyButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#fff' },
  headerSubtitle: { fontSize: 9, opacity: 0.7, color: '#fff' },
  streakCard: {
    backgroundColor: '#2475ed', borderRadius: 22, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 4,
  },
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  streakTopSpan: { fontSize: 9, opacity: 0.85, color: '#fff' },
  streakTopStrong: { fontSize: 20, lineHeight: 22, color: '#fff', fontWeight: 'bold' },
  streakBest: { marginLeft: 'auto', alignItems: 'flex-end' },
  streakBestSmall: { fontSize: 8, opacity: 0.8, color: '#fff' },
  streakBestB: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  streakDays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)' },
  dayItem: { alignItems: 'center', gap: 5 },
  daySpan: { fontSize: 8, opacity: 0.8, color: '#fff' },
  dayIndicator: { width: 19, height: 19, borderRadius: 9.5, backgroundColor: 'rgba(255,255,255,0.3)' },
  dayCompleted: { backgroundColor: '#ffb21c', shadowColor: '#ffb21c', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8, elevation: 2 },
  dayToday: { borderWidth: 2, borderColor: '#fff' },
  playerCard: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerAvatar: { width: 43, height: 43, borderRadius: 21.5, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center' },
  playerInfo: { flex: 1 },
  playerInfoStrong: { fontSize: 13, fontWeight: 'bold', color: '#173d91' },
  playerInfoSpan: { fontSize: 8, color: '#777' },
  playerCoins: { marginRight: 12, alignItems: 'flex-end' },
  playerCoinsStrong: { fontSize: 16, color: '#f59e0b', fontWeight: 'bold' },
  playerCoinsSpan: { fontSize: 7, color: '#777' },
  playerXp: { alignItems: 'flex-end' },
  playerXpStrong: { fontSize: 16, color: '#2563eb', fontWeight: 'bold' },
  playerXpSpan: { fontSize: 7, color: '#777' },
  leaderboardSection: { backgroundColor: '#fff', borderRadius: 23, paddingVertical: 14, paddingHorizontal: 12 },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleText: { fontSize: 15, fontWeight: 'bold', color: '#173d91' },
  sectionSubtitleText: { fontSize: 7, color: '#888', marginTop: 1 },
  trophy: { fontSize: 25 },
  podium: { height: 145, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8, marginTop: 5 },
  podiumPlayer: { width: '31%', alignItems: 'center', position: 'relative' },
  crown: { position: 'absolute', top: -22, fontSize: 20 },
  rankAvatar: { width: 47, height: 47, borderRadius: 23.5, backgroundColor: '#e9f0ff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#d1e0ff' },
  firstRankAvatar: { width: 58, height: 58, borderRadius: 29, borderColor: '#ffc928', backgroundColor: '#fff5c9' },
  rankBadge: { marginTop: -4, width: 21, height: 21, borderRadius: 10.5, backgroundColor: '#5689f8', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  firstBadge: { backgroundColor: '#ffc928' },
  secondBadge: { backgroundColor: '#5689f8' },
  thirdBadge: { backgroundColor: '#cd8a50' },
  rankBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  podiumName: { fontSize: 8, fontWeight: 'bold', color: '#173d91', marginTop: 3 },
  podiumXp: { fontSize: 7, color: '#777' },
  rankingList: { gap: 6, marginTop: 8 },
  rankingItem: { minHeight: 38, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#f2f6ff', flexDirection: 'row', alignItems: 'center', gap: 8 },
  currentUserItem: { borderWidth: 2, borderColor: '#3f7cff', backgroundColor: '#eef4ff' },
  rankingNumber: { width: 18, textAlign: 'center', fontSize: 9, fontWeight: '600', color: '#7893cc' },
  miniAvatar: { width: 27, height: 27, borderRadius: 13.5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  rankingName: { flex: 1, fontSize: 9, fontWeight: '500', color: '#173d91' },
  rankingXp: { fontSize: 9, fontWeight: 'bold', color: '#173d91' },
  myRankingBanner: { marginTop: 15, padding: 15, borderRadius: 18, backgroundColor: '#3f7cff', flexDirection: 'row', alignItems: 'center', gap: 12 },
  myRankingLeft: { alignItems: 'center', minWidth: 55 },
  myRankingLeftSpan: { fontSize: 10, opacity: 0.8, color: '#fff' },
  myRankingLeftStrong: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  myRankingUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  myRankingUserName: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  myRankingUserStreak: { fontSize: 10, opacity: 0.8, color: '#fff' },
  myRankingXp: { fontSize: 14, fontWeight: 'bold', color: '#fff' },

  // BottomNav ลอยเหมือนหน้า Pain / Record
  fixedBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});
