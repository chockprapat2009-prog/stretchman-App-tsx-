import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LeaderboardUser {
    id: string;
    name: string;
    avatar: string;
    xp: number;
    coins: number;
    streak: number;
}

const DEFAULT_USERS: LeaderboardUser[] = [
    { id: "user-atiya", name: "Atiya", avatar: "👩🏻", xp: 0, coins: 0, streak: 0 },
    { id: "user-palao", name: "Mr.Palao", avatar: "👨🏻", xp: 540, coins: 100, streak: 12 },
    { id: "user-mupup", name: "Mupup", avatar: "👨🏽", xp: 420, coins: 80, streak: 8 },
    { id: "user-tonnam", name: "Tonnam", avatar: "👨", xp: 390, coins: 70, streak: 7 },
    { id: "user-fai", name: "Fai", avatar: "👩", xp: 350, coins: 60, streak: 6 },
    { id: "user-beam", name: "Beam", avatar: "👨", xp: 310, coins: 50, streak: 5 },
    { id: "user-mint", name: "Mint", avatar: "👩🏻", xp: 280, coins: 40, streak: 4 },
    { id: "user-nam", name: "Nam", avatar: "👩", xp: 250, coins: 30, streak: 3 },
    { id: "user-bank", name: "Bank", avatar: "👨🏻", xp: 220, coins: 20, streak: 2 }
];

export default function LeaderboardScreen() {
    const router = useRouter();

    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [currentUser, setCurrentUser] = useState<LeaderboardUser>({
        id: "user-atiya",
        name: "Atiya",
        avatar: "👩🏻",
        xp: 0,
        coins: 0,
        streak: 0,
    });
    const [bestStreak, setBestStreak] = useState<number>(0);

    const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1;

    const loadAndSyncData = async () => {
        try {
            const savedUserData = await AsyncStorage.getItem("stretchmanUser");
            const storedName = await AsyncStorage.getItem("stretchmanName");

            let activeUser: LeaderboardUser = {
                id: "user-atiya",
                name: storedName || "Atiya",
                avatar: "👩🏻",
                xp: 0,
                coins: 0,
                streak: 0,
            };

            if (savedUserData) {
                const parsed = JSON.parse(savedUserData);
                activeUser = {
                    id: "user-atiya",
                    name: storedName || parsed.name || "Atiya",
                    avatar: parsed.avatar || "👩🏻",
                    xp: Number(parsed.xp || parsed.experience || 0),
                    coins: Number(parsed.coins || parsed.coin || 0),
                    streak: Number(parsed.streak || 0),
                };
            }

            setCurrentUser(activeUser);

            const savedBest = Number(await AsyncStorage.getItem("stretchmanBestStreak") || 0);
            const currentBest = Math.max(savedBest, activeUser.streak);
            await AsyncStorage.setItem("stretchmanBestStreak", currentBest.toString());
            setBestStreak(currentBest);

            const savedUsersJSON = await AsyncStorage.getItem("stretchmanLeaderboardUsers");
            let userList: LeaderboardUser[] = savedUsersJSON
                ? JSON.parse(savedUsersJSON)
                : [...DEFAULT_USERS];

            const index = userList.findIndex((u) => u.id === activeUser.id);
            if (index === -1) {
                userList.push(activeUser);
            } else {
                userList[index] = { ...userList[index], ...activeUser };
            }

            userList.sort((a, b) => (b.xp !== a.xp ? b.xp - a.xp : b.streak - a.streak));

            setUsers(userList);
            await AsyncStorage.setItem("stretchmanLeaderboardUsers", JSON.stringify(userList));
        } catch (error) {
            console.error("Error loading leaderboard data:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadAndSyncData();
            const interval = setInterval(loadAndSyncData, 2000);
            return () => clearInterval(interval);
        }, [])
    );

    const today = new Date();
    const currentDay = today.getDay();
    const mondayIndex = currentDay === 0 ? 6 : currentDay - 1;
    const weekDays = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

    const podiumUsers = [users[1], users[0], users[2]];
    const otherUsers = users.slice(3);
    const myRankIndex = users.findIndex((u) => u.id === currentUser.id);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <FontAwesome6 name="arrow-left" size={20} color="#9BBAFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Leaderboard</Text>
                    <Text style={styles.headerSubtitle}>แข่งขันกับเพื่อนของคุณ</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/streak-history')} style={styles.iconButton}>
                    <FontAwesome6 name="clock-rotate-left" size={20} color="#9BBAFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* STREAK CARD */}
                <View style={styles.streakCard}>
                    <View style={styles.streakTop}>
                        <View style={styles.streakIconBox}>
                            <Text style={styles.streakIcon}>🔥</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.streakLabel}>Current Streak</Text>
                            <Text style={styles.streakValue}>{currentUser.streak} วัน</Text>
                        </View>
                        <View style={styles.streakBestBox}>
                            <Text style={styles.streakBestLabel}>Best</Text>
                            <Text style={styles.streakBestValue}>{bestStreak}</Text>
                        </View>
                    </View>

                    <View style={styles.streakDays}>
                        {weekDays.map((dayLabel, index) => {
                            const isToday = index === mondayIndex;
                            const isCompleted =
                                currentUser.streak > 0 &&
                                index <= mondayIndex &&
                                index >= mondayIndex - currentUser.streak + 1;

                            return (
                                <View key={index} style={styles.dayCol}>
                                    <Text style={styles.dayLabel}>{dayLabel}</Text>
                                    <View
                                        style={[
                                            styles.dayDot,
                                            isCompleted && styles.dayDotCompleted,
                                            isToday && styles.dayDotToday,
                                        ]}
                                    />
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* PLAYER STATUS */}
                <View style={styles.playerCard}>
                    <View style={styles.playerAvatar}>
                        <Text style={{ fontSize: 22 }}>{currentUser.avatar || '👤'}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{currentUser.name}</Text>
                        <Text style={styles.playerLevel}>
                            Level <Text style={{ fontWeight: 'bold' }}>{calculateLevel(currentUser.xp)}</Text>
                        </Text>
                    </View>
                    <View style={styles.playerCoins}>
                        <Text style={styles.coinValue}>{currentUser.coins}</Text>
                        <Text style={styles.coinLabel}>Coins</Text>
                    </View>
                    <View style={styles.playerXp}>
                        <Text style={styles.xpValue}>{currentUser.xp}</Text>
                        <Text style={styles.xpLabel}>XP</Text>
                    </View>
                </View>

                {/* LEADERBOARD SECTION */}
                <View style={styles.leaderboardSection}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
                            <Text style={styles.sectionSubtitle}>อันดับประจำสัปดาห์</Text>
                        </View>
                        <Text style={{ fontSize: 24 }}>🏆</Text>
                    </View>

                    {/* PODIUM (TOP 3) */}
                    <View style={styles.podium}>
                        {podiumUsers.map((user, idx) => {
                            if (!user) return <View key={idx} style={styles.podiumPlayer} />;

                            const isFirst = idx === 1;
                            const isSecond = idx === 0;
                            const rank = isFirst ? 1 : isSecond ? 2 : 3;

                            return (
                                <View key={user.id || idx} style={styles.podiumPlayer}>
                                    {isFirst && <Text style={styles.crown}>👑</Text>}
                                    <View style={[styles.rankAvatar, isFirst && styles.rankAvatarFirst]}>
                                        <Text style={{ fontSize: isFirst ? 28 : 22 }}>{user.avatar}</Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.rankBadge,
                                            isFirst && styles.rankBadgeFirst,
                                            !isFirst && !isSecond && styles.rankBadgeThird,
                                        ]}
                                    >
                                        <Text style={styles.rankBadgeText}>{rank}</Text>
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {user.name}
                                    </Text>
                                    <Text style={styles.podiumXp}>{user.xp} XP</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* OTHER PLAYERS LIST */}
                    <View style={styles.rankingList}>
                        {otherUsers.map((user, index) => {
                            const isMe = user.id === currentUser.id;
                            return (
                                <View
                                    key={user.id}
                                    style={[styles.rankingItem, isMe && styles.rankingItemMe]}
                                >
                                    <Text style={styles.rankingNumber}>{index + 4}</Text>
                                    <View style={styles.miniAvatar}>
                                        <Text style={{ fontSize: 14 }}>{user.avatar}</Text>
                                    </View>
                                    <Text style={styles.rankingName} numberOfLines={1}>
                                        {user.name}
                                    </Text>
                                    <Text style={styles.rankingXp}>{user.xp} XP</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* MY RANKING SUMMARY */}
                    {myRankIndex !== -1 && (
                        <View style={styles.myRankingCard}>
                            <View style={styles.myRankingLeft}>
                                <Text style={styles.myRankingLabel}>อันดับของคุณ</Text>
                                <Text style={styles.myRankingRank}>#{myRankIndex + 1}</Text>
                            </View>
                            <View style={styles.myRankingUser}>
                                <View style={styles.miniAvatar}>
                                    <Text style={{ fontSize: 14 }}>{currentUser.avatar}</Text>
                                </View>
                                <View>
                                    <Text style={styles.myRankingName}>{currentUser.name}</Text>
                                    <Text style={styles.myRankingStreak}>{currentUser.streak} 🔥 Streak</Text>
                                </View>
                            </View>
                            <Text style={styles.myRankingXp}>{currentUser.xp} XP</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#123B91',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 30,
        gap: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    streakCard: {
        backgroundColor: '#2475ED',
        borderRadius: 22,
        padding: 14,
    },
    streakTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    streakIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakIcon: {
        fontSize: 26,
    },
    streakLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    streakValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    streakBestBox: {
        alignItems: 'flex-end',
    },
    streakBestLabel: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    streakBestValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    streakDays: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.3)',
    },
    dayCol: {
        alignItems: 'center',
        gap: 6,
    },
    dayLabel: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    dayDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dayDotCompleted: {
        backgroundColor: '#FFB21C',
    },
    dayDotToday: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    playerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    playerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#E5EEFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#173D91',
    },
    playerLevel: {
        fontSize: 10,
        color: '#777777',
    },
    playerCoins: {
        alignItems: 'flex-end',
        marginRight: 8,
    },
    coinValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#F59E0B',
    },
    coinLabel: {
        fontSize: 8,
        color: '#777777',
    },
    playerXp: {
        alignItems: 'flex-end',
    },
    xpValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    xpLabel: {
        fontSize: 8,
        color: '#777777',
    },
    leaderboardSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 23,
        padding: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#173D91',
    },
    sectionSubtitle: {
        fontSize: 8,
        color: '#888888',
    },
    podium: {
        height: 140,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 8,
        marginVertical: 10,
    },
    podiumPlayer: {
        flex: 1,
        alignItems: 'center',
    },
    crown: {
        fontSize: 18,
        marginBottom: -4,
    },
    rankAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#E9F0FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#D1E0FF',
    },
    rankAvatarFirst: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderColor: '#FFC928',
        backgroundColor: '#FFF5C9',
    },
    rankBadge: {
        marginTop: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#5689F8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    rankBadgeFirst: {
        backgroundColor: '#FFC928',
    },
    rankBadgeThird: {
        backgroundColor: '#CD8A50',
    },
    rankBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    podiumName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#173D91',
        marginTop: 4,
    },
    podiumXp: {
        fontSize: 8,
        color: '#777777',
    },
    rankingList: {
        gap: 6,
        marginTop: 8,
    },
    rankingItem: {
        minHeight: 40,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#F2F6FF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rankingItemMe: {
        borderWidth: 2,
        borderColor: '#3F7CFF',
        backgroundColor: '#EEF4FF',
    },
    rankingNumber: {
        width: 18,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#7893CC',
    },
    miniAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankingName: {
        flex: 1,
        fontSize: 11,
        fontWeight: '500',
        color: '#173D91',
    },
    rankingXp: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#173D91',
    },
    myRankingCard: {
        marginTop: 14,
        padding: 12,
        borderRadius: 18,
        backgroundColor: '#3F7CFF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    myRankingLeft: {
        alignItems: 'center',
        minWidth: 50,
    },
    myRankingLabel: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    myRankingRank: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    myRankingUser: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    myRankingName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    myRankingStreak: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    myRankingXp: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});