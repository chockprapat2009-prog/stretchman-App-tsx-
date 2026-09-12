import React, { useState, useCallback } from 'react';

import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BottomNav from './components/BottomNav';


// =====================================================
// TYPE
// =====================================================

interface AlarmItem {
    id: string;
    time: string;
    period: string;
    exercise: string;
    days: string[];
    enabled: boolean;

    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    snoozeEnabled?: boolean;
}


// =====================================================
// DAY DATA
// =====================================================

const DAY_LABELS: Record<string, string> = {
    sun: 'อา.',
    mon: 'จ.',
    tue: 'อ.',
    wed: 'พ.',
    thu: 'พฤ.',
    fri: 'ศ.',
    sat: 'ส.',
};


// =====================================================
// MAIN
// =====================================================

export default function AlarmScreen() {

    const router = useRouter();


    // =================================================
    // STATE
    // =================================================

    const [darkMode, setDarkMode] =
        useState(false);

    const [alarms, setAlarms] =
        useState<AlarmItem[]>([]);


    // =================================================
    // LOAD DATA
    // =================================================

    const loadData = async () => {

        try {

            // -----------------------------------------
            // Dark mode
            // -----------------------------------------

            const dark =
                await AsyncStorage.getItem(
                    'stretchmanDarkMode'
                );

            if (dark !== null) {
                setDarkMode(
                    dark === 'true'
                );
            }


            // -----------------------------------------
            // Alarms
            // -----------------------------------------

            const storedAlarms =
                await AsyncStorage.getItem(
                    'stretchmanAlarms'
                );


            if (storedAlarms) {

                const parsed =
                    JSON.parse(
                        storedAlarms
                    );

                if (Array.isArray(parsed)) {

                    setAlarms(parsed);

                } else {

                    setAlarms([]);

                }

            } else {

                setAlarms([]);

            }

        } catch (error) {

            console.log(
                'Failed to load alarm data',
                error
            );

        }

    };


    // =================================================
    // REFRESH WHEN SCREEN FOCUS
    // =================================================

    useFocusEffect(
        useCallback(() => {

            loadData();

        }, [])
    );


    // =================================================
    // TOGGLE ALARM
    // =================================================

    const handleToggleAlarm = async (
        id: string,
        value: boolean
    ) => {

        try {

            const updated =
                alarms.map(
                    alarm =>
                        alarm.id === id
                            ? {
                                ...alarm,
                                enabled: value,
                            }
                            : alarm
                );


            setAlarms(updated);


            await AsyncStorage.setItem(

                'stretchmanAlarms',

                JSON.stringify(updated)

            );

        } catch (error) {

            console.log(
                'Failed to toggle alarm:',
                error
            );

        }

    };


    // =================================================
    // OPEN EDIT ALARM
    // =================================================

    const handleOpenAlarm = (
        id: string
    ) => {

        router.push({

            pathname: '/add-alarm',

            params: {
                id: id,
            },

        } as any);

    };


    // =================================================
    // FORMAT DAYS
    // =================================================

    const formatDays = (
        days: string[]
    ) => {

        if (
            !Array.isArray(days) ||
            days.length === 0
        ) {

            return 'ไม่ได้เลือกวัน';

        }


        // เรียงตามลำดับ อา. → ส.
        const order = [
            'sun',
            'mon',
            'tue',
            'wed',
            'thu',
            'fri',
            'sat',
        ];


        const sortedDays =
            [...days].sort(
                (a, b) =>
                    order.indexOf(a) -
                    order.indexOf(b)
            );


        return sortedDays
            .map(
                day =>
                    DAY_LABELS[day] || day
            )
            .join(', ');

    };


    // =================================================
    // CHECK EVERY DAY
    // =================================================

    const isEveryDay = (
        days: string[]
    ) => {

        if (!Array.isArray(days)) {
            return false;
        }

        return [
            'sun',
            'mon',
            'tue',
            'wed',
            'thu',
            'fri',
            'sat',
        ].every(
            day =>
                days.includes(day)
        );

    };


    // =================================================
    // RENDER
    // =================================================

    return (

        <View
            style={[
                styles.container,

                darkMode &&
                styles.darkContainer,
            ]}
        >


            {/* =================================================
                BLUE TOP BACKGROUND
            ================================================= */}

            <View
                style={styles.blueBackground}
            />


            {/* =================================================
                FIXED ADD BUTTON
            ================================================= */}

            <TouchableOpacity
                style={styles.addAlarmButton}

                activeOpacity={0.85}

                onPress={() =>
                    router.push(
                        '/add-alarm' as any
                    )
                }
            >

                <View
                    style={styles.addButtonGlow}
                />

                <FontAwesome6
                    name="plus"
                    size={19}
                    color="#ffffff"
                />

            </TouchableOpacity>


            {/* =================================================
                CONTENT
            ================================================= */}

            <ScrollView

                style={styles.scrollView}

                contentContainerStyle={
                    styles.alarmPage
                }

                showsVerticalScrollIndicator={
                    false
                }
            >


                {/* =================================================
                    HEADER
                ================================================= */}

                <View
                    style={styles.alarmHeader}
                >

                    <View
                        style={
                            styles.headerTitleRow
                        }
                    >

                        <View>

                            <Text
                                style={[
                                    styles.headerTitle,

                                    darkMode &&
                                    styles.darkText,
                                ]}
                            >
                                Alarm
                            </Text>


                            <Text
                                style={
                                    styles.headerSubtitle
                                }
                            >
                                ปลุกร่างกายให้สดชื่น
                                {'\n'}
                                ด้วยการยืดกล้ามเนื้อ
                            </Text>

                        </View>


                        <TouchableOpacity

                            style={
                                styles.helpButton
                            }

                            onPress={() =>
                                Alert.alert(

                                    'คำแนะนำ',

                                    'ตั้งเวลาแจ้งเตือนเพื่อให้ร่างกายได้ยืดเหยียดตามเวลาที่กำหนด'

                                )
                            }
                        >

                            <FontAwesome6
                                name="circle-question"
                                size={18}
                                color="#237FFF"
                            />

                        </TouchableOpacity>

                    </View>

                </View>


                {/* =================================================
                    EMPTY
                ================================================= */}

                {alarms.length === 0 ? (

                    <View
                        style={
                            styles.emptyContainer
                        }
                    >

                        <View
                            style={
                                styles.emptyIcon
                            }
                        >

                            <FontAwesome6
                                name="clock"
                                size={34}
                                color="#237FFF"
                            />

                        </View>


                        <Text
                            style={[
                                styles.emptyText,

                                darkMode &&
                                styles.darkText,
                            ]}
                        >
                            ยังไม่มีการตั้งเวลาปลุก
                        </Text>


                        <Text
                            style={
                                styles.emptySubText
                            }
                        >
                            กดปุ่ม + ด้านบน
                            {'\n'}
                            เพื่อเพิ่มเวลาแจ้งเตือนใหม่
                        </Text>

                    </View>

                ) : (

                    /* =================================================
                       ALARM LIST
                    ================================================= */

                    alarms.map(
                        (item) => (

                            <View
                                key={item.id}

                                style={[
                                    styles.alarmCard,

                                    darkMode &&
                                    styles.darkCard,

                                    !item.enabled &&
                                    styles.disabledCard,
                                ]}
                            >


                                {/* =========================================
                                    TOP ROW
                                ========================================= */}

                                <View
                                    style={
                                        styles.cardTopRow
                                    }
                                >

                                    <View
                                        style={
                                            styles.alarmIcon
                                        }
                                    >

                                        <FontAwesome6
                                            name="clock"
                                            size={17}
                                            color="#ffffff"
                                        />

                                    </View>


                                    <Text
                                        style={
                                            styles.repeatText
                                        }
                                    >
                                        {isEveryDay(
                                            item.days
                                        )
                                            ? 'ทุกวัน'
                                            : formatDays(
                                                item.days
                                            )}
                                    </Text>


                                    <Switch

                                        value={
                                            item.enabled
                                        }

                                        onValueChange={(
                                            val
                                        ) =>
                                            handleToggleAlarm(
                                                item.id,
                                                val
                                            )
                                        }

                                        trackColor={{
                                            false:
                                                '#A8CCFF',

                                            true:
                                                '#ffffff',
                                        }}

                                        thumbColor={
                                            item.enabled
                                                ? '#237FFF'
                                                : '#ffffff'
                                        }

                                    />

                                </View>


                                {/* =========================================
                                    MAIN ALARM
                                ========================================= */}

                                <TouchableOpacity

                                    style={
                                        styles.alarmInfoTouchable
                                    }

                                    activeOpacity={
                                        0.8
                                    }

                                    onPress={() =>
                                        handleOpenAlarm(
                                            item.id
                                        )
                                    }
                                >


                                    {/* TIME */}

                                    <View
                                        style={
                                            styles.timeRow
                                        }
                                    >

                                        <Text
                                            style={[
                                                styles.alarmTimeText,

                                                !item.enabled &&
                                                styles.disabledText,
                                            ]}
                                        >
                                            {item.time}
                                        </Text>


                                        <Text
                                            style={[
                                                styles.alarmPeriodText,

                                                !item.enabled &&
                                                styles.disabledText,
                                            ]}
                                        >
                                            {item.period}
                                        </Text>


                                        <View
                                            style={
                                                styles.editIcon
                                            }
                                        >

                                            <FontAwesome6
                                                name="pen-to-square"
                                                size={13}
                                                color="#ffffff"
                                            />

                                        </View>

                                    </View>


                                    {/* EXERCISE */}

                                    <Text
                                        style={[
                                            styles.alarmExerciseText,

                                            !item.enabled &&
                                            styles.disabledText,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.exercise ||
                                            'ยืดเหยียดร่างกาย'}
                                    </Text>


                                    {/* DAYS */}

                                    <View
                                        style={
                                            styles.selectedDaysRow
                                        }
                                    >

                                        {(item.days || [])
                                            .map(
                                                (
                                                    day
                                                ) => (

                                                    <View
                                                        key={
                                                            day
                                                        }
                                                        style={
                                                            styles.selectedDayChip
                                                        }
                                                    >

                                                        <Text
                                                            style={
                                                                styles.selectedDayText
                                                            }
                                                        >
                                                            {
                                                                DAY_LABELS[
                                                                day
                                                                ] ||
                                                                day
                                                            }
                                                        </Text>

                                                    </View>

                                                )
                                            )}

                                    </View>


                                    {/* EDIT HINT */}

                                    <Text
                                        style={
                                            styles.editHint
                                        }
                                    >
                                        แตะเพื่อแก้ไข
                                    </Text>

                                </TouchableOpacity>


                            </View>

                        )
                    )

                )}

            </ScrollView>


            {/* =================================================
                BOTTOM NAV
            ================================================= */}

            <View
                style={
                    styles.bottomNavContainer
                }
            >

                <BottomNav
                    activeTab="alarm"
                />

            </View>

        </View>

    );

}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

    // ===================================================
    // CONTAINER
    // ===================================================

    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },

    darkContainer: {
        backgroundColor: '#121212',
    },


    // ===================================================
    // BLUE BACKGROUND
    // ===================================================

    blueBackground: {
        position: 'absolute',

        top: 0,
        left: 0,
        right: 0,

        height: 285,

        backgroundColor: '#1638AE',

        borderBottomLeftRadius: 38,
        borderBottomRightRadius: 38,
    },


    // ===================================================
    // SCROLL
    // ===================================================

    scrollView: {
        flex: 1,
        width: '100%',
    },

    alarmPage: {
        paddingHorizontal: 20,

        paddingTop: 48,

        // เผื่อพื้นที่ BottomNav
        paddingBottom: 125,
    },


    // ===================================================
    // HEADER
    // ===================================================

    alarmHeader: {
        marginBottom: 25,
    },

    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.3,
    },

    headerSubtitle: {
        fontSize: 13,
        color: '#DDEAFF',
        marginTop: 5,
        lineHeight: 20,
    },

    helpButton: {
        width: 40,
        height: 40,

        borderRadius: 20,

        backgroundColor: '#ffffff',

        alignItems: 'center',
        justifyContent: 'center',

        marginTop: 3,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.12,
        shadowRadius: 8,

        elevation: 4,
    },

    darkText: {
        color: '#ffffff',
    },


    // ===================================================
    // ADD BUTTON
    // ===================================================

    addAlarmButton: {
        position: 'absolute',

        top: 48,
        right: 20,

        zIndex: 20,

        width: 50,
        height: 50,

        borderRadius: 25,

        backgroundColor: '#237FFF',

        justifyContent: 'center',
        alignItems: 'center',

        borderWidth: 2,
        borderColor: '#A8CCFF',

        shadowColor: '#237FFF',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.35,
        shadowRadius: 12,

        elevation: 8,
    },

    addButtonGlow: {
        position: 'absolute',

        width: 40,
        height: 40,

        borderRadius: 20,

        backgroundColor: '#A8CCFF',

        opacity: 0.18,
    },


    // ===================================================
    // EMPTY
    // ===================================================

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',

        backgroundColor: '#ffffff',

        borderRadius: 25,

        paddingVertical: 55,

        marginTop: 5,

        shadowColor: '#1638AE',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.08,
        shadowRadius: 15,

        elevation: 3,
    },

    emptyIcon: {
        width: 70,
        height: 70,

        borderRadius: 35,

        backgroundColor: '#A8CCFF',

        alignItems: 'center',
        justifyContent: 'center',

        marginBottom: 14,
    },

    emptyText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1638AE',
    },

    emptySubText: {
        fontSize: 12,
        color: '#64748b',

        marginTop: 7,

        textAlign: 'center',

        lineHeight: 18,
    },


    // ===================================================
    // ALARM CARD
    // ===================================================

    alarmCard: {

        width: '100%',

        backgroundColor: '#237FFF',

        borderRadius: 28,

        marginBottom: 17,

        padding: 17,

        overflow: 'hidden',

        borderWidth: 1,

        borderColor: '#A8CCFF',

        shadowColor: '#1638AE',

        shadowOffset: {
            width: 0,
            height: 8,
        },

        shadowOpacity: 0.20,

        shadowRadius: 15,

        elevation: 6,
    },

    darkCard: {
        backgroundColor: '#1e1e1e',
        borderColor: '#334155',
    },

    disabledCard: {
        opacity: 0.72,
    },


    // ===================================================
    // CARD TOP
    // ===================================================

    cardTopRow: {
        flexDirection: 'row',

        alignItems: 'center',

        marginBottom: 10,
    },

    alarmIcon: {
        width: 34,
        height: 34,

        borderRadius: 17,

        backgroundColor: '#A8CCFF',

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 9,
    },

    repeatText: {
        flex: 1,

        color: '#ffffff',

        fontSize: 13,

        fontWeight: '700',
    },


    // ===================================================
    // ALARM INFO
    // ===================================================

    alarmInfoTouchable: {
        width: '100%',
    },


    // ===================================================
    // TIME
    // ===================================================

    timeRow: {
        flexDirection: 'row',

        alignItems: 'baseline',

        marginTop: 1,
    },

    alarmTimeText: {
        fontSize: 48,

        lineHeight: 55,

        fontWeight: '800',

        color: '#ffffff',

        letterSpacing: 1,
    },

    alarmPeriodText: {
        fontSize: 13,

        fontWeight: '700',

        color: '#DDEAFF',

        marginLeft: 7,
    },

    editIcon: {
        width: 27,
        height: 27,

        borderRadius: 14,

        backgroundColor:
            'rgba(168,204,255,0.35)',

        alignItems: 'center',
        justifyContent: 'center',

        marginLeft: 9,
    },


    // ===================================================
    // EXERCISE
    // ===================================================

    alarmExerciseText: {
        fontSize: 14,

        fontWeight: '600',

        color: '#ffffff',

        marginTop: 2,
    },


    // ===================================================
    // SELECTED DAYS
    // ===================================================

    selectedDaysRow: {
        flexDirection: 'row',

        flexWrap: 'wrap',

        marginTop: 12,

        gap: 6,
    },

    selectedDayChip: {
        minWidth: 31,
        height: 29,

        paddingHorizontal: 7,

        borderRadius: 15,

        backgroundColor: '#A8CCFF',

        alignItems: 'center',
        justifyContent: 'center',
    },

    selectedDayText: {
        color: '#1638AE',

        fontSize: 11,

        fontWeight: '800',
    },


    // ===================================================
    // EDIT HINT
    // ===================================================

    editHint: {
        fontSize: 10,

        color: '#DDEAFF',

        marginTop: 9,
    },


    // ===================================================
    // DISABLED
    // ===================================================

    disabledText: {
        color: '#A8CCFF',
    },


    // ===================================================
    // BOTTOM NAV
    // ===================================================

    bottomNavContainer: {
        paddingHorizontal: 20,

        marginBottom: 15,
    },

});