import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Switch,
    TextInput,
    Platform,
    Animated,
    PanResponder,
    Alert,
} from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
    useRouter,
    useLocalSearchParams,
} from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

// ======================================================
// CONSTANTS
// ======================================================

const ITEM_HEIGHT = 50;
const CONTAINER_HEIGHT = 180;
const PADDING_VERTICAL = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

// ======================================================
// INTERFACE
// ======================================================

interface DayItem {
    id: string;
    label: string;
}

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

// ======================================================
// DAYS
// ======================================================

const DAYS: DayItem[] = [
    { id: 'sun', label: 'อา' },
    { id: 'mon', label: 'จ' },
    { id: 'tue', label: 'อ' },
    { id: 'wed', label: 'พ' },
    { id: 'thu', label: 'พฤ' },
    { id: 'fri', label: 'ศ' },
    { id: 'sat', label: 'ส' },
];

// ======================================================
// CUSTOM INFINITE WHEEL PICKER
// ======================================================

interface WheelPickerProps {
    items: string[];
    value: string;
    onChange: (value: string) => void;
}

function WheelPicker({
    items,
    value,
    onChange,
}: WheelPickerProps) {
    const actualLength = items.length;
    const MULTIPLIER = 11; // ทวีคูณเพื่อให้เลื่อนได้เรื่อยๆ (Infinite Loop Illusion)
    const MIDDLE_BLOCK = Math.floor(MULTIPLIER / 2);

    const extendedItems = React.useMemo(() => {
        return Array(MULTIPLIER).fill(items).flat();
    }, [items]);

    const getInitialIndex = () => {
        const foundIndex = items.indexOf(value);
        return foundIndex >= 0
            ? MIDDLE_BLOCK * actualLength + foundIndex
            : MIDDLE_BLOCK * actualLength;
    };

    const initialIndex = getInitialIndex();

    const translateY = useRef(new Animated.Value(-initialIndex * ITEM_HEIGHT)).current;
    const currentY = useRef(-initialIndex * ITEM_HEIGHT);
    const dragStartY = useRef(-initialIndex * ITEM_HEIGHT);
    const lastValue = useRef(value);

    const [selectedIndex, setSelectedIndex] = useState(initialIndex);

    const minY = -((extendedItems.length - 1) * ITEM_HEIGHT);
    const maxY = 0;

    const clampY = (y: number) => {
        return Math.max(minY, Math.min(maxY, y));
    };

    // ==================================================
    // SNAP & RESET (INFINITE LOOP CORE)
    // ==================================================

    const snapToNearest = (y: number, animate: boolean) => {
        let index = Math.round(-y / ITEM_HEIGHT);
        index = Math.max(0, Math.min(index, extendedItems.length - 1));

        const targetY = -index * ITEM_HEIGHT;
        const actualItem = extendedItems[index];

        const finishSnap = (finalIndex: number) => {
            // แอบดึงกลับมาที่บล็อกตรงกลางเพื่อไม่ให้เลื่อนจนสุดขอบ
            const modIndex = finalIndex % actualLength;
            const resetIndex = MIDDLE_BLOCK * actualLength + modIndex;
            const resetY = -resetIndex * ITEM_HEIGHT;

            translateY.setValue(resetY);
            currentY.current = resetY;
            dragStartY.current = resetY;
            setSelectedIndex(resetIndex);
            lastValue.current = actualItem;
        };

        setSelectedIndex(index);
        onChange(actualItem);

        translateY.stopAnimation();

        if (animate) {
            Animated.spring(translateY, {
                toValue: targetY,
                useNativeDriver: false,
                tension: 110,
                friction: 12,
                overshootClamping: true,
            }).start(({ finished }) => {
                if (finished) finishSnap(index);
            });
        } else {
            translateY.setValue(targetY);
            finishSnap(index);
        }
    };

    // ==================================================
    // PAN RESPONDER
    // ==================================================

    const panResponder = React.useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (_, gestureState) =>
                    Math.abs(gestureState.dy) > 2,

                onPanResponderGrant: () => {
                    translateY.stopAnimation();
                    dragStartY.current = currentY.current;
                },

                onPanResponderMove: (_, gestureState) => {
                    const nextY = clampY(dragStartY.current + gestureState.dy);
                    currentY.current = nextY;
                    translateY.setValue(nextY);

                    const liveIndex = Math.max(
                        0,
                        Math.min(
                            Math.round(-nextY / ITEM_HEIGHT),
                            extendedItems.length - 1
                        )
                    );
                    setSelectedIndex(liveIndex);
                },

                onPanResponderRelease: (_, gestureState) => {
                    const releasedY = clampY(dragStartY.current + gestureState.dy);
                    const projectedY = clampY(
                        releasedY + gestureState.vy * ITEM_HEIGHT * 0.22
                    );
                    snapToNearest(projectedY, true);
                },

                onPanResponderTerminate: () => {
                    snapToNearest(currentY.current, true);
                },
            }),
        [extendedItems, translateY, onChange]
    );

    return (
        <View style={styles.wheelViewport} {...panResponder.panHandlers}>
            <Animated.View
                style={[
                    styles.wheelList,
                    { transform: [{ translateY }] },
                ]}
            >
                {extendedItems.map((item, index) => (
                    <View key={`${index}-${item}`} style={styles.wheelItemContainer}>
                        <Text
                            style={[
                                styles.wheelItem,
                                selectedIndex === index && styles.wheelItemActive,
                            ]}
                        >
                            {item}
                        </Text>
                    </View>
                ))}
            </Animated.View>
        </View>
    );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function AddAlarmScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEditMode = typeof id === 'string' && id.length > 0;

    const hoursList = Array.from({ length: 24 }, (_, i) =>
        String(i).padStart(2, '0')
    );
    const minutesList = Array.from({ length: 60 }, (_, i) =>
        String(i).padStart(2, '0')
    );

    const [selectedHour, setSelectedHour] = useState('06');
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [alarmName, setAlarmName] = useState('');
    const [selectedDays, setSelectedDays] = useState<string[]>([
        'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat',
    ]);
    const [soundOn, setSoundOn] = useState(true);
    const [vibrateOn, setVibrateOn] = useState(true);
    const [snoozeOn, setSnoozeOn] = useState(true);

    useEffect(() => {
        if (!isEditMode) return;

        const loadAlarmForEdit = async () => {
            try {
                const stored = await AsyncStorage.getItem('stretchmanAlarms');
                if (!stored) return;

                const alarms: AlarmItem[] = JSON.parse(stored);
                const alarm = alarms.find((item) => item.id === id);

                if (!alarm) return;

                const [hour, minute] = alarm.time.split(':');
                setSelectedHour(hour || '06');
                setSelectedMinute(minute || '00');
                setAlarmName(alarm.exercise || '');
                setSelectedDays(alarm.days || []);
                setSoundOn(alarm.soundEnabled ?? true);
                setVibrateOn(alarm.vibrationEnabled ?? true);
                setSnoozeOn(alarm.snoozeEnabled ?? true);
            } catch (error) {
                console.log('Failed to load alarm for editing:', error);
            }
        };

        loadAlarmForEdit();
    }, [id, isEditMode]);

    const toggleDaySelection = (dayId: string) => {
        setSelectedDays((current) => {
            if (current.includes(dayId)) {
                return current.filter((day) => day !== dayId);
            }
            return [...current, dayId];
        });
    };

    const handleSaveAlarm = async () => {
        try {
            const stored = await AsyncStorage.getItem('stretchmanAlarms');
            const currentAlarms: AlarmItem[] = stored ? JSON.parse(stored) : [];

            const alarmData = {
                time: `${selectedHour}:${selectedMinute}`,
                period: Number(selectedHour) >= 12 ? 'PM' : 'AM',
                exercise: alarmName.trim() || 'ยืดเหยียดร่างกาย',
                days: selectedDays,
                soundEnabled: soundOn,
                vibrationEnabled: vibrateOn,
                snoozeEnabled: snoozeOn,
            };

            if (isEditMode) {
                const updatedAlarms = currentAlarms.map((alarm) =>
                    alarm.id === id ? { ...alarm, ...alarmData, id } : alarm
                );
                await AsyncStorage.setItem('stretchmanAlarms', JSON.stringify(updatedAlarms));
                router.back();
                return;
            }

            const newAlarmItem: AlarmItem = {
                id: Date.now().toString(),
                ...alarmData,
                enabled: true,
            };

            const updatedAlarms = [...currentAlarms, newAlarmItem];
            await AsyncStorage.setItem('stretchmanAlarms', JSON.stringify(updatedAlarms));
            router.back();
        } catch (error) {
            console.log('Failed to save alarm:', error);
        }
    };

    const handleDeleteAlarm = async () => {
        if (!id) return;

        const executeDelete = async () => {
            try {
                const stored = await AsyncStorage.getItem('stretchmanAlarms');
                if (stored) {
                    const currentAlarms: AlarmItem[] = JSON.parse(stored);
                    const updatedAlarms = currentAlarms.filter((item) => item.id !== id);
                    await AsyncStorage.setItem('stretchmanAlarms', JSON.stringify(updatedAlarms));
                }
                router.back();
            } catch (error) {
                console.log('Failed to delete alarm:', error);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('คุณต้องการลบการแจ้งเตือนนี้ใช่หรือไม่?')) {
                await executeDelete();
            }
        } else {
            Alert.alert(
                'ยืนยันการลบ',
                'คุณต้องการลบการแจ้งเตือนนี้ใช่หรือไม่?',
                [
                    { text: 'ยกเลิก', style: 'cancel' },
                    { text: 'ลบ', style: 'destructive', onPress: executeDelete },
                ]
            );
        }
    };

    const getSelectedDaysText = () => {
        if (selectedDays.length === 7) return 'ทุกวัน';
        if (selectedDays.length === 0) return 'ไม่เลือกวัน';
        return DAYS.filter((day) => selectedDays.includes(day.id))
            .map((day) => day.label)
            .join(' · ');
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <FontAwesome6 name="arrow-left" size={18} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleArea}>
                        <Text style={styles.headerTitle}>
                            {isEditMode ? 'แก้ไขการเตือน' : 'ตั้งปลุก'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {isEditMode ? 'แก้ไขรายละเอียดการแจ้งเตือน' : 'ตั้งเวลาเตือนการยืดกล้ามเนื้อ'}
                        </Text>
                    </View>
                </View>

                {/* TIME PREVIEW */}
                <View style={styles.timePreview}>
                    <Text style={styles.timePreviewText}>
                        {selectedHour}:{selectedMinute}
                    </Text>
                    <Text style={styles.timePreviewSub}>เวลาที่ตั้งไว้</Text>
                </View>

                {/* TIME PICKER */}
                <View style={styles.wheelContainer}>
                    <View style={styles.selectedHighlightBar} pointerEvents="none" />
                    <View style={styles.wheelColumn}>
                        <WheelPicker
                            items={hoursList}
                            value={selectedHour}
                            onChange={setSelectedHour}
                        />
                    </View>
                    <Text style={styles.wheelColon}>:</Text>
                    <View style={styles.wheelColumn}>
                        <WheelPicker
                            items={minutesList}
                            value={selectedMinute}
                            onChange={setSelectedMinute}
                        />
                    </View>
                </View>

                {/* SETTINGS CARD */}
                <View style={styles.cardContainer}>
                    {/* DAYS */}
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>วัน</Text>
                            <Text style={styles.sectionSubtitle}>{getSelectedDaysText()}</Text>
                        </View>
                        <FontAwesome6 name="calendar" size={18} color="#888888" />
                    </View>

                    <View style={styles.daysRow}>
                        {DAYS.map((day) => {
                            const selected = selectedDays.includes(day.id);
                            return (
                                <TouchableOpacity
                                    key={day.id}
                                    activeOpacity={0.7}
                                    onPress={() => toggleDaySelection(day.id)}
                                    style={[styles.dayBadge, selected && styles.dayBadgeActive]}
                                >
                                    <Text style={[styles.dayText, selected && styles.dayTextActive]}>
                                        {day.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* ALARM NAME */}
                    <View style={styles.inputGroup}>
                        <FontAwesome6 name="pen" size={15} color="#888888" />
                        <TextInput
                            style={styles.inputText}
                            value={alarmName}
                            onChangeText={setAlarmName}
                            placeholder="ชื่อการเตือน"
                            placeholderTextColor="#888888"
                            returnKeyType="done"
                        />
                    </View>

                    {/* SOUND */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.settingIcon}>
                                <FontAwesome6 name="volume-high" size={14} color="#ffffff" />
                            </View>
                            <Text style={styles.settingLabel}>เสียง</Text>
                        </View>
                        <Switch
                            value={soundOn}
                            onValueChange={setSoundOn}
                            trackColor={{ false: '#333333', true: '#ffffff' }}
                            thumbColor={soundOn ? '#000000' : '#ffffff'}
                        />
                    </View>

                    {/* VIBRATION */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.settingIcon}>
                                <FontAwesome6 name="vibrate" size={14} color="#ffffff" />
                            </View>
                            <Text style={styles.settingLabel}>สั่น</Text>
                        </View>
                        <Switch
                            value={vibrateOn}
                            onValueChange={setVibrateOn}
                            trackColor={{ false: '#333333', true: '#ffffff' }}
                            thumbColor={vibrateOn ? '#000000' : '#ffffff'}
                        />
                    </View>

                    {/* SNOOZE */}
                    <View style={[styles.settingRow, isEditMode ? undefined : { borderBottomWidth: 0 }]}>
                        <View style={styles.settingLeft}>
                            <View style={styles.settingIcon}>
                                <FontAwesome6 name="clock-rotate-left" size={14} color="#ffffff" />
                            </View>
                            <Text style={styles.settingLabel}>เลื่อนการปลุก</Text>
                        </View>
                        <Switch
                            value={snoozeOn}
                            onValueChange={setSnoozeOn}
                            trackColor={{ false: '#333333', true: '#ffffff' }}
                            thumbColor={snoozeOn ? '#000000' : '#ffffff'}
                        />
                    </View>

                    {/* DELETE ALARM (Moved inside settings card) */}
                    {isEditMode && (
                        <TouchableOpacity
                            style={styles.deleteActionRow}
                            activeOpacity={0.7}
                            onPress={handleDeleteAlarm}
                        >
                            <FontAwesome6 name="trash-can" size={15} color="#ffffff" />
                            <Text style={styles.deleteActionText}>ลบการแจ้งเตือน</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* FIXED SAVE BUTTON */}
            <View style={styles.fixedBottomContainer}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSaveAlarm}
                    style={styles.saveButtonWrapper}
                >
                    <LinearGradient
                        colors={['#237FFF', '#A8CCFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButtonGradient}
                    >
                        <Text style={styles.saveButtonText}>
                            {isEditMode ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึก'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1638AE', // Deep Blue Background
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },

    // HEADER
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    headerTitleArea: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#A8CCFF',
        marginTop: 2,
    },

    // PREVIEW
    timePreview: {
        alignItems: 'center',
        marginBottom: 20,
    },
    timePreviewText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    timePreviewSub: {
        fontSize: 12,
        color: '#A8CCFF',
        marginTop: 4,
    },

    // WHEEL PICKER
    wheelContainer: {
        height: CONTAINER_HEIGHT,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        paddingVertical: PADDING_VERTICAL,
        marginBottom: 24,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    selectedHighlightBar: {
        position: 'absolute',
        top: PADDING_VERTICAL,
        left: 16,
        right: 16,
        height: ITEM_HEIGHT,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    wheelColumn: {
        width: 80,
        height: ITEM_HEIGHT,
        overflow: 'visible',
    },
    wheelViewport: {
        height: ITEM_HEIGHT,
        overflow: 'visible',
    },
    wheelList: {
        alignItems: 'center',
    },
    wheelItemContainer: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelItem: {
        fontSize: 24,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '500',
    },
    wheelItemActive: {
        fontSize: 28,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    wheelColon: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginHorizontal: 12,
    },

    // CARD & SETTINGS
    cardContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#A8CCFF',
        marginTop: 2,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dayBadge: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayBadgeActive: {
        backgroundColor: '#ffffff',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A8CCFF',
    },
    dayTextActive: {
        color: '#1638AE',
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    inputText: {
        flex: 1,
        color: '#ffffff',
        fontSize: 15,
        marginLeft: 10,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 15,
        color: '#ffffff',
        fontWeight: '500',
    },

    // DELETE ACTION ROW (Red Color)
    deleteActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        marginTop: 8,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.15)',
    },
    deleteActionText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ffffff', // Red Text
    },

    // FIXED BOTTOM AREA
    fixedBottomContainer: {
        backgroundColor: '#1638AE',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.15)',
    },
    saveButtonWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});