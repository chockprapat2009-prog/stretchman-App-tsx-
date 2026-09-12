import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const router = useRouter();

    // STATES สำหรับสวิตช์การตั้งค่า
    const [pushNotifications, setPushNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome6 name="arrow-left" size={18} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* SECTION 1: NOTIFICATIONS & SOUNDS */}
                <Text style={styles.sectionHeader}>การแจ้งเตือนและเสียง</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconBox}>
                                <FontAwesome6 name="bell" size={16} color="#2563EB" />
                            </View>
                            <Text style={styles.settingText}>แจ้งเตือนระบบ</Text>
                        </View>
                        <Switch
                            value={pushNotifications}
                            onValueChange={setPushNotifications}
                            trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconBox}>
                                <FontAwesome6 name="volume-high" size={16} color="#2563EB" />
                            </View>
                            <Text style={styles.settingText}>เสียงแจ้งเตือน</Text>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={setSoundEnabled}
                            trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconBox}>
                                <FontAwesome6 name="vibrate" size={16} color="#2563EB" />
                            </View>
                            <Text style={styles.settingText}>สั่นแจ้งเตือน</Text>
                        </View>
                        <Switch
                            value={vibrationEnabled}
                            onValueChange={setVibrationEnabled}
                            trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* SECTION 2: APP PREFERENCES */}
                <Text style={styles.sectionHeader}>การแสดงผลและระบบ</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconBox}>
                                <FontAwesome6 name="moon" size={16} color="#2563EB" />
                            </View>
                            <Text style={styles.settingText}>โหมดมืด (Dark Mode)</Text>
                        </View>
                        <Switch
                            value={darkMode}
                            onValueChange={setDarkMode}
                            trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconBox}>
                                <FontAwesome6 name="globe" size={16} color="#2563EB" />
                            </View>
                            <Text style={styles.settingText}>ภาษา (Language)</Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={styles.valueText}>ไทย</Text>
                            <FontAwesome6 name="chevron-right" size={14} color="#94A3B8" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* SECTION 3: SECURITY & PRIVACY */}
                <Text style={styles.sectionHeader}>ความเป็นส่วนตัวและความปลอดภัย</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconBox}>
                                <FontAwesome6 name="lock" size={16} color="#2563EB" />
                            </View>
                            <Text style={styles.settingText}>เปลี่ยนรหัสผ่าน</Text>
                        </View>
                        <FontAwesome6 name="chevron-right" size={14} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconBox}>
                                <FontAwesome6 name="shield-halved" size={16} color="#2563EB" />
                            </View>
                            <Text style={styles.settingText}>นโยบายความเป็นส่วนตัว</Text>
                        </View>
                        <FontAwesome6 name="chevron-right" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingText: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    valueText: {
        fontSize: 14,
        color: '#64748B',
    },
});