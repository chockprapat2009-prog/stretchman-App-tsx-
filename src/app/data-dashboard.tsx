import React, { useCallback, useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from './components/BottomNav';

type PainItem = {
    area: string;
    painLevel: number;
    painType?: string;
};

type PainAssessment = {
    items?: PainItem[];
    areas?: PainItem[];
    selectedAreas?: PainItem[];
    updatedAt?: string;
};

type ExerciseHistoryItem = {
    exerciseName?: string;
    name?: string;
    exerciseTime?: number;
    time?: number;
    duration?: number;
    completed?: boolean;
    completedAt?: string;
    date?: string;
};

const AREA_LABELS: Record<string, string> = {
    neck: 'คอ',
    shoulder: 'ไหล่',
    shoulder_left: 'ไหล่ซ้าย',
    shoulder_right: 'ไหล่ขวา',
    upper_back: 'หลังส่วนบน',
    lower_back: 'หลังส่วนล่าง',
    arm: 'แขน',
    arm_left: 'แขนซ้าย',
    arm_right: 'แขนขวา',
    wrist: 'ข้อมือ',
    wrist_left: 'ข้อมือซ้าย',
    wrist_right: 'ข้อมือขวา',
    waist: 'เอว',
    thigh: 'ต้นขา',
    thigh_left: 'ต้นขาซ้าย',
    thigh_right: 'ต้นขาขวา',
    calf: 'น่อง',
    calf_left: 'น่องซ้าย',
    calf_right: 'น่องขวา',
    other: 'อื่น ๆ',
};

const PAIN_COLORS = [
    '#166534',
    '#238636',
    '#3FA34D',
    '#69B34C',
    '#A4C639',
    '#EAB308',
    '#F59E0B',
    '#F97316',
    '#EF4444',
    '#DC2626',
    '#991B1B',
];

const getPainColor = (level: number) => {
    const safe = Math.max(0, Math.min(10, Math.round(level)));
    return PAIN_COLORS[safe];
};

const getAreaLabel = (area: string) => {
    return AREA_LABELS[area] || area;
};

const normalizeNumber = (value: unknown) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const normalizePainItems = (raw: any): PainItem[] => {
    const source =
        Array.isArray(raw)
            ? raw
            : raw?.items ||
              raw?.areas ||
              raw?.selectedAreas ||
              raw?.painAreas ||
              [];

    if (!Array.isArray(source)) return [];

    return source
        .map((item: any) => ({
            area: String(item?.area ?? item?.id ?? ''),
            painLevel: normalizeNumber(
                item?.painLevel ??
                item?.level ??
                item?.pain ??
                item?.value
            ),
            painType: item?.painType ?? item?.type ?? '',
        }))
        .filter((item: PainItem) => !!item.area);
};

const normalizeHistory = (raw: any): ExerciseHistoryItem[] => {
    const source =
        Array.isArray(raw)
            ? raw
            : raw?.history ||
              raw?.items ||
              raw?.sessions ||
              raw?.records ||
              [];

    if (!Array.isArray(source)) return [];

    return source.map((item: any) => ({
        exerciseName: item?.exerciseName ?? item?.name,
        name: item?.name,
        exerciseTime: normalizeNumber(
            item?.exerciseTime ??
            item?.time ??
            item?.duration
        ),
        time: normalizeNumber(item?.time),
        duration: normalizeNumber(item?.duration),
        completed: item?.completed !== false,
        completedAt: item?.completedAt ?? item?.date,
        date: item?.date ?? item?.completedAt,
    }));
};

export default function DataDashboardScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [painItems, setPainItems] = useState<PainItem[]>([]);
    const [history, setHistory] = useState<ExerciseHistoryItem[]>([]);
    const [selectedExercise, setSelectedExercise] = useState('ยังไม่มีข้อมูล');
    const [exerciseTime, setExerciseTime] = useState(0);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const [
                painAssessmentStr,
                selectedExerciseStr,
                exerciseNameStr,
                exerciseTimeStr,
                historyStr,
                stretchHistoryStr,
                completedHistoryStr,
            ] = await Promise.all([
                AsyncStorage.getItem('stretchmanPainAssessment'),
                AsyncStorage.getItem('stretchmanSelectedExercise'),
                AsyncStorage.getItem('exerciseName'),
                AsyncStorage.getItem('exerciseTime'),
                AsyncStorage.getItem('stretchmanExerciseHistory'),
                AsyncStorage.getItem('stretchmanStretchHistory'),
                AsyncStorage.getItem('stretchmanCompletedExercises'),
            ]);

            if (painAssessmentStr) {
                try {
                    setPainItems(
                        normalizePainItems(JSON.parse(painAssessmentStr))
                    );
                } catch {
                    setPainItems([]);
                }
            } else {
                setPainItems([]);
            }

            let exerciseName = 'ยังไม่มีข้อมูล';

            if (selectedExerciseStr) {
                try {
                    const selected = JSON.parse(selectedExerciseStr);

                    if (typeof selected === 'string') {
                        exerciseName = selected;
                    } else {
                        exerciseName =
                            selected?.name ||
                            selected?.exerciseName ||
                            selected?.title ||
                            exerciseName;
                    }
                } catch {
                    exerciseName = selectedExerciseStr || exerciseName;
                }
            }

            if (exerciseNameStr) {
                exerciseName = exerciseNameStr;
            }

            setSelectedExercise(exerciseName);

            const time = normalizeNumber(exerciseTimeStr);
            setExerciseTime(time);

            const historySources = [
                historyStr,
                stretchHistoryStr,
                completedHistoryStr,
            ].filter(Boolean);

            let allHistory: ExerciseHistoryItem[] = [];

            for (const source of historySources) {
                try {
                    const parsed = JSON.parse(source as string);
                    allHistory = [...allHistory, ...normalizeHistory(parsed)];
                } catch {
                    // ข้ามข้อมูลที่ไม่ใช่ JSON เพื่อไม่ให้หน้า Dashboard ล่ม
                }
            }

            setHistory(allHistory);
        } catch (error) {
            console.log('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    const totalPainAreas = painItems.length;

    const averagePain = useMemo(() => {
        if (!painItems.length) return 0;
        const total = painItems.reduce(
            (sum, item) => sum + normalizeNumber(item.painLevel),
            0
        );
        return total / painItems.length;
    }, [painItems]);

    const highestPain = useMemo(() => {
        if (!painItems.length) return 0;
        return Math.max(
            ...painItems.map((item) => normalizeNumber(item.painLevel))
        );
    }, [painItems]);

    const highestPainArea = useMemo(() => {
        if (!painItems.length) return 'ยังไม่มีข้อมูล';

        const highest = [...painItems].sort(
            (a, b) => b.painLevel - a.painLevel
        )[0];

        return getAreaLabel(highest.area);
    }, [painItems]);

    const totalStretchSessions = useMemo(() => {
        return history.filter((item) => item.completed !== false).length;
    }, [history]);

    const totalStretchMinutes = useMemo(() => {
        return history.reduce((sum, item) => {
            const seconds =
                item.exerciseTime ||
                item.duration ||
                item.time ||
                0;

            return sum + seconds;
        }, 0) / 60;
    }, [history]);

    const lastSessions = useMemo(() => {
        return history
            .filter((item) => item.completed !== false)
            .slice(-5)
            .reverse();
    }, [history]);

    const painDescription = useMemo(() => {
        if (!painItems.length) {
            return 'ยังไม่มีการบันทึกระดับความปวด';
        }

        if (averagePain <= 2) {
            return 'ระดับความปวดโดยรวมค่อนข้างต่ำ';
        }

        if (averagePain <= 5) {
            return 'ระดับความปวดโดยรวมอยู่ในช่วงปานกลาง';
        }

        if (averagePain <= 7) {
            return 'ระดับความปวดโดยรวมค่อนข้างสูง';
        }

        return 'มีบริเวณที่รายงานระดับความปวดสูง';
    }, [averagePain]);

    const formatMinutes = (value: number) => {
        if (!value) return '0 นาที';

        if (value < 1) {
            return `${Math.round(value * 60)} วินาที`;
        }

        return `${Math.round(value)} นาที`;
    };

    const formatDate = (value?: string) => {
        if (!value) return '';

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return '';

        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
        });
    };

    // กราฟ Pain ตามบริเวณ ใช้ข้อมูลจริงจาก Body Check ล่าสุด
    const painChartData = useMemo(() => {
        return painItems
            .slice()
            .sort((a, b) => b.painLevel - a.painLevel)
            .slice(0, 6);
    }, [painItems]);

    // กราฟจำนวนครั้งที่ยืดใน 7 วันล่าสุด
    const weeklyStretchData = useMemo(() => {
        const today = new Date();
        const result: { label: string; count: number }[] = [];

        for (let offset = 6; offset >= 0; offset -= 1) {
            const date = new Date(today);
            date.setHours(0, 0, 0, 0);
            date.setDate(today.getDate() - offset);

            const count = history.filter((item) => {
                if (item.completed === false) return false;

                const rawDate = item.completedAt || item.date;
                if (!rawDate) return false;

                const itemDate = new Date(rawDate);
                if (Number.isNaN(itemDate.getTime())) return false;

                return (
                    itemDate.getFullYear() === date.getFullYear() &&
                    itemDate.getMonth() === date.getMonth() &&
                    itemDate.getDate() === date.getDate()
                );
            }).length;

            result.push({
                label: date.toLocaleDateString('th-TH', {
                    weekday: 'short',
                }),
                count,
            });
        }

        return result;
    }, [history]);

    const maxWeeklyStretch = Math.max(
        1,
        ...weeklyStretchData.map((item) => item.count)
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>
                    กำลังโหลดข้อมูลของคุณ...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.page}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <FontAwesome6
                            name="arrow-left"
                            size={18}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerTitle}>
                            Data Dashboard
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            สรุปข้อมูลการยืดและระดับความปวด
                        </Text>
                    </View>

                    <View style={styles.headerPlaceholder} />
                </View>

                {/* OVERVIEW */}
                <View style={styles.overviewCard}>
                    <View style={styles.overviewTitleRow}>
                        <View>
                            <Text style={styles.cardTitle}>
                                ภาพรวมของคุณ
                            </Text>

                            <Text style={styles.cardSubtitle}>
                                ข้อมูลจากแบบประเมินและการยืดที่บันทึกไว้
                            </Text>
                        </View>

                        <View style={styles.dashboardIcon}>
                            <FontAwesome6
                                name="chart-column"
                                size={18}
                                color="#2563EB"
                            />
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {totalStretchSessions}
                            </Text>

                            <Text style={styles.statLabel}>
                                ครั้งที่ยืด
                            </Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {formatMinutes(totalStretchMinutes)}
                            </Text>

                            <Text style={styles.statLabel}>
                                เวลารวม
                            </Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {totalPainAreas}
                            </Text>

                            <Text style={styles.statLabel}>
                                จุดที่ประเมิน
                            </Text>
                        </View>
                    </View>
                </View>

                {/* PAIN SUMMARY */}
                <View style={styles.whiteCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <FontAwesome6
                                name="heart-pulse"
                                size={17}
                                color="#2563EB"
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>
                                Pain Summary
                            </Text>

                            <Text style={styles.sectionSubtitle}>
                                สรุประดับความปวดล่าสุด
                            </Text>
                        </View>
                    </View>

                    <View style={styles.painOverview}>
                        <View style={styles.bigPainBox}>
                            <Text style={styles.bigPainNumber}>
                                {averagePain.toFixed(1)}
                            </Text>

                            <Text style={styles.bigPainLabel}>
                                ค่าเฉลี่ย / 10
                            </Text>

                            <View
                                style={[
                                    styles.painBadge,
                                    {
                                        backgroundColor:
                                            getPainColor(averagePain),
                                    },
                                ]}
                            >
                                <Text style={styles.painBadgeText}>
                                    {painDescription}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.painSideStats}>
                            <View style={styles.sideStat}>
                                <Text style={styles.sideStatValue}>
                                    {highestPain}
                                </Text>
                                <Text style={styles.sideStatLabel}>
                                    ปวดสูงสุด
                                </Text>
                            </View>

                            <View style={styles.sideStat}>
                                <Text
                                    style={[
                                        styles.sideStatValue,
                                        { fontSize: 14 },
                                    ]}
                                    numberOfLines={2}
                                >
                                    {highestPainArea}
                                </Text>

                                <Text style={styles.sideStatLabel}>
                                    บริเวณที่ปวดมากสุด
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* PAIN CHART */}
                <View style={styles.whiteCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <FontAwesome6
                                name="chart-bar"
                                size={17}
                                color="#2563EB"
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>
                                Pain Chart
                            </Text>

                            <Text style={styles.sectionSubtitle}>
                                เปรียบเทียบระดับความปวดแต่ละบริเวณ
                            </Text>
                        </View>
                    </View>

                    {painChartData.length === 0 ? (
                        <View style={styles.emptyState}>
                            <FontAwesome6
                                name="chart-simple"
                                size={28}
                                color="#A8BDEB"
                            />

                            <Text style={styles.emptyTitle}>
                                ยังไม่มีข้อมูลสำหรับกราฟ
                            </Text>

                            <Text style={styles.emptyText}>
                                ทำแบบประเมิน Body Check เพื่อสร้างกราฟ
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.chartArea}>
                            {painChartData.map((item, index) => {
                                const percent = Math.max(
                                    0,
                                    Math.min(100, (item.painLevel / 10) * 100)
                                );

                                return (
                                    <View
                                        key={`${item.area}-${index}`}
                                        style={styles.barRow}
                                    >
                                        <Text
                                            style={styles.barLabel}
                                            numberOfLines={1}
                                        >
                                            {getAreaLabel(item.area)}
                                        </Text>

                                        <View style={styles.barTrack}>
                                            <View
                                                style={[
                                                    styles.barFill,
                                                    {
                                                        width: `${percent}%`,
                                                        backgroundColor:
                                                            getPainColor(
                                                                item.painLevel
                                                            ),
                                                    },
                                                ]}
                                            />
                                        </View>

                                        <Text
                                            style={[
                                                styles.barValue,
                                                {
                                                    color: getPainColor(
                                                        item.painLevel
                                                    ),
                                                },
                                            ]}
                                        >
                                            {item.painLevel}
                                        </Text>
                                    </View>
                                );
                            })}

                            <View style={styles.chartScale}>
                                <Text style={styles.chartScaleText}>0</Text>
                                <Text style={styles.chartScaleText}>5</Text>
                                <Text style={styles.chartScaleText}>10</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* STRETCH ACTIVITY CHART */}
                <View style={styles.whiteCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <FontAwesome6
                                name="chart-column"
                                size={17}
                                color="#2563EB"
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>
                                Stretch Activity
                            </Text>

                            <Text style={styles.sectionSubtitle}>
                                จำนวนครั้งที่ยืดใน 7 วันล่าสุด
                            </Text>
                        </View>
                    </View>

                    <View style={styles.activityChart}>
                        {weeklyStretchData.map((item, index) => {
                            const height = Math.max(
                                item.count > 0 ? 12 : 4,
                                (item.count / maxWeeklyStretch) * 112
                            );

                            const isToday = index === weeklyStretchData.length - 1;

                            return (
                                <View
                                    key={`${item.label}-${index}`}
                                    style={styles.activityColumn}
                                >
                                    <Text style={styles.activityCount}>
                                        {item.count}
                                    </Text>

                                    <View style={styles.activityBarArea}>
                                        <View
                                            style={[
                                                styles.activityBar,
                                                {
                                                    height,
                                                    backgroundColor: isToday
                                                        ? '#2563EB'
                                                        : '#9CC2FF',
                                                },
                                            ]}
                                        />
                                    </View>

                                    <Text
                                        style={[
                                            styles.activityLabel,
                                            isToday && styles.activityLabelToday,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* PAIN AREA BREAKDOWN */}
                <View style={styles.whiteCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <FontAwesome6
                                name="location-dot"
                                size={17}
                                color="#2563EB"
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>
                                Pain Areas
                            </Text>

                            <Text style={styles.sectionSubtitle}>
                                ระดับความปวดแยกตามบริเวณ
                            </Text>
                        </View>
                    </View>

                    {painItems.length === 0 ? (
                        <View style={styles.emptyState}>
                            <FontAwesome6
                                name="clipboard-check"
                                size={28}
                                color="#A8BDEB"
                            />

                            <Text style={styles.emptyTitle}>
                                ยังไม่มีข้อมูลการปวด
                            </Text>

                            <Text style={styles.emptyText}>
                                ทำแบบประเมิน Body Check
                                เพื่อดูข้อมูลในส่วนนี้
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.areaList}>
                            {painItems
                                .slice()
                                .sort((a, b) => b.painLevel - a.painLevel)
                                .map((item, index) => {
                                    const percentage =
                                        Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                (item.painLevel / 10) * 100
                                            )
                                        );

                                    return (
                                        <View
                                            key={`${item.area}-${index}`}
                                            style={styles.areaRow}
                                        >
                                            <View style={styles.areaTopRow}>
                                                <Text
                                                    style={
                                                        styles.areaName
                                                    }
                                                >
                                                    {getAreaLabel(
                                                        item.area
                                                    )}
                                                </Text>

                                                <Text
                                                    style={[
                                                        styles.areaScore,
                                                        {
                                                            color:
                                                                getPainColor(
                                                                    item.painLevel
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    {item.painLevel}/10
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.progressTrack
                                                }
                                            >
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        {
                                                            width: `${percentage}%`,
                                                            backgroundColor:
                                                                getPainColor(
                                                                    item.painLevel
                                                                ),
                                                        },
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    );
                                })}
                        </View>
                    )}
                </View>

                {/* STRETCHING SUMMARY */}
                <View style={styles.whiteCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <FontAwesome6
                                name="person-running"
                                size={17}
                                color="#2563EB"
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>
                                Stretching Summary
                            </Text>

                            <Text style={styles.sectionSubtitle}>
                                สรุปการยืดเหยียดที่บันทึกไว้
                            </Text>
                        </View>
                    </View>

                    <View style={styles.exerciseCard}>
                        <View style={styles.exerciseIcon}>
                            <FontAwesome6
                                name="person-running"
                                size={19}
                                color="#2563EB"
                            />
                        </View>

                        <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseLabel}>
                                ท่าที่เลือก/ล่าสุด
                            </Text>

                            <Text
                                style={styles.exerciseName}
                                numberOfLines={1}
                            >
                                {selectedExercise}
                            </Text>

                            {exerciseTime > 0 && (
                                <Text style={styles.exerciseTime}>
                                    เวลาที่ตั้งไว้ {exerciseTime} วินาที
                                </Text>
                            )}
                        </View>
                    </View>

                    {lastSessions.length > 0 ? (
                        <View style={styles.historyList}>
                            <Text style={styles.historyTitle}>
                                การยืดล่าสุด
                            </Text>

                            {lastSessions.map((item, index) => (
                                <View
                                    key={`${item.exerciseName || item.name}-${index}`}
                                    style={styles.historyRow}
                                >
                                    <View style={styles.historyDot}>
                                        <FontAwesome6
                                            name="check"
                                            size={9}
                                            color="#FFFFFF"
                                        />
                                    </View>

                                    <Text
                                        style={styles.historyName}
                                        numberOfLines={1}
                                    >
                                        {item.exerciseName ||
                                            item.name ||
                                            'ท่ายืด'}
                                    </Text>

                                    <Text style={styles.historyDate}>
                                        {formatDate(
                                            item.completedAt ||
                                                item.date
                                        )}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.noHistoryBox}>
                            <FontAwesome6
                                name="clock-rotate-left"
                                size={16}
                                color="#8AA8E5"
                            />

                            <Text style={styles.noHistoryText}>
                                ยังไม่มีประวัติการยืดที่บันทึกไว้
                            </Text>
                        </View>
                    )}
                </View>

                {/* HOW TO READ */}
                <View style={styles.infoCard}>
                    <FontAwesome6
                        name="circle-info"
                        size={16}
                        color="#FFFFFF"
                    />

                    <Text style={styles.infoText}>
                        Dashboard นี้ใช้ข้อมูลจาก Body Check
                        และข้อมูลการยืดที่แอปบันทึกไว้
                        จึงเป็นข้อมูลสรุปเพื่อดูแนวโน้มการใช้งาน
                        ไม่ใช่การวินิจฉัยทางการแพทย์
                    </Text>
                </View>
            </ScrollView>

            {/* FLOATING BOTTOM NAV */}
            <View style={styles.fixedBottomNav}>
                <BottomNav activeTab="setting" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1638AE',
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: '#1638AE',
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 10,
    },

    page: {
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        paddingHorizontal: 15,
        paddingTop: 8,
        paddingBottom: 120,
        gap: 12,
    },

    /* HEADER */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTextWrap: {
        flex: 1,
        marginLeft: 12,
    },

    headerTitle: {
        fontSize: 21,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    headerSubtitle: {
        fontSize: 9,
        color: '#D8E6FF',
        marginTop: 2,
    },

    headerPlaceholder: {
        width: 40,
    },

    /* OVERVIEW */
    overviewCard: {
        backgroundColor: '#2475ED',
        borderRadius: 22,
        padding: 15,

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
    },

    overviewTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    cardTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    cardSubtitle: {
        color: '#DCE9FF',
        fontSize: 8,
        marginTop: 2,
    },

    dashboardIcon: {
        width: 38,
        height: 38,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 13,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.25)',
    },

    statBox: {
        flex: 1,
        alignItems: 'center',
    },

    statValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    statLabel: {
        color: '#DCE9FF',
        fontSize: 8,
        marginTop: 3,
    },

    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },

    /* WHITE CARDS */
    whiteCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 23,
        padding: 14,

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#EAF1FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    sectionTitle: {
        color: '#173D91',
        fontSize: 14,
        fontWeight: '700',
    },

    sectionSubtitle: {
        color: '#8797B6',
        fontSize: 8,
        marginTop: 2,
    },

    /* PAIN SUMMARY */
    painOverview: {
        flexDirection: 'row',
        gap: 10,
    },

    bigPainBox: {
        flex: 1.2,
        backgroundColor: '#F4F7FF',
        borderRadius: 17,
        padding: 13,
    },

    bigPainNumber: {
        color: '#173D91',
        fontSize: 31,
        lineHeight: 33,
        fontWeight: '800',
    },

    bigPainLabel: {
        color: '#7D8DAC',
        fontSize: 8,
        marginTop: 1,
    },

    painBadge: {
        alignSelf: 'flex-start',
        borderRadius: 9,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginTop: 10,
    },

    painBadgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '700',
    },

    painSideStats: {
        flex: 1,
        gap: 10,
    },

    sideStat: {
        flex: 1,
        backgroundColor: '#F4F7FF',
        borderRadius: 15,
        padding: 11,
        justifyContent: 'center',
    },

    sideStatValue: {
        color: '#173D91',
        fontSize: 20,
        fontWeight: '800',
    },

    sideStatLabel: {
        color: '#7D8DAC',
        fontSize: 7,
        marginTop: 2,
    },

    /* PAIN AREAS */
    areaList: {
        gap: 11,
    },

    areaRow: {
        gap: 5,
    },

    areaTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    areaName: {
        color: '#173D91',
        fontSize: 10,
        fontWeight: '600',
    },

    areaScore: {
        fontSize: 10,
        fontWeight: '800',
    },

    progressTrack: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EAF1FF',
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        borderRadius: 4,
    },

    /* CHARTS */
    chartArea: {
        marginTop: 2,
        gap: 10,
    },

    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    barLabel: {
        width: 62,
        color: '#40577F',
        fontSize: 8,
        fontWeight: '600',
    },

    barTrack: {
        flex: 1,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EAF1FF',
        overflow: 'hidden',
    },

    barFill: {
        height: '100%',
        borderRadius: 5,
    },

    barValue: {
        width: 20,
        textAlign: 'right',
        fontSize: 9,
        fontWeight: '800',
    },

    chartScale: {
        marginLeft: 69,
        marginRight: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -2,
    },

    chartScaleText: {
        color: '#A0AEC4',
        fontSize: 7,
    },

    activityChart: {
        height: 155,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E6EDFF',
    },

    activityColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
    },

    activityCount: {
        color: '#173D91',
        fontSize: 8,
        fontWeight: '700',
        height: 15,
    },

    activityBarArea: {
        height: 116,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },

    activityBar: {
        width: 18,
        borderRadius: 9,
        minHeight: 4,
    },

    activityLabel: {
        color: '#90A0BC',
        fontSize: 8,
        marginTop: 7,
    },

    activityLabelToday: {
        color: '#2563EB',
        fontWeight: '700',
    },

    /* EXERCISE */
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F7FF',
        borderRadius: 17,
        padding: 11,
    },

    exerciseIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },

    exerciseInfo: {
        flex: 1,
    },

    exerciseLabel: {
        color: '#7D8DAC',
        fontSize: 8,
    },

    exerciseName: {
        color: '#173D91',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 3,
    },

    exerciseTime: {
        color: '#8AA0C4',
        fontSize: 8,
        marginTop: 2,
    },

    historyList: {
        marginTop: 13,
        gap: 8,
    },

    historyTitle: {
        color: '#173D91',
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 1,
    },

    historyRow: {
        minHeight: 34,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFF',
        borderRadius: 10,
        paddingHorizontal: 8,
    },

    historyDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#3F7CFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },

    historyName: {
        flex: 1,
        color: '#40577F',
        fontSize: 9,
        fontWeight: '600',
    },

    historyDate: {
        color: '#91A1BC',
        fontSize: 8,
    },

    noHistoryBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F7FF',
        borderRadius: 13,
        padding: 10,
        marginTop: 11,
        gap: 8,
    },

    noHistoryText: {
        flex: 1,
        color: '#7085AA',
        fontSize: 9,
    },

    /* EMPTY */
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
    },

    emptyTitle: {
        color: '#40577F',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 8,
    },

    emptyText: {
        color: '#92A0B9',
        fontSize: 8,
        textAlign: 'center',
        marginTop: 3,
    },

    /* INFO */
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 9,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 17,
        padding: 12,
    },

    infoText: {
        flex: 1,
        color: '#DCE9FF',
        fontSize: 8,
        lineHeight: 14,
    },

    /* FLOATING BOTTOM NAV */
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
