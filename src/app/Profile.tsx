import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from './components/BottomNav';

export default function ProfileScreen() {
    const router = useRouter();
    const [name, setName] = useState('Bagja Alfatih');
    const [email, setEmail] = useState('bagjaalfatih17@gmail.com');

    const loadSettings = async () => {
        try {
            const storedName = await AsyncStorage.getItem('stretchmanName');
            if (storedName) setName(storedName);
        } catch (error) {
            console.log('Failed to load settings', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadSettings();
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            'ออกจากระบบ',
            'คุณต้องการออกจากระบบหรือไม่?',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ออกจากระบบ',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.clear();
                        Alert.alert('สำเร็จ', 'ออกจากระบบเรียบร้อยแล้ว');
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <FontAwesome6 name="arrow-left" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <Text style={styles.headerSubtitle}>
                        จัดการบัญชีและข้อมูลของคุณ
                    </Text>
                </View>

                <View style={styles.headerRightSpace} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.settingsPage}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileHeaderCard}>
                    <TouchableOpacity
                        style={styles.avatarWrapper}
                        onPress={() => router.push('/my-profile')}
                    >
                        <View style={styles.avatarContainer}>
                            <FontAwesome6 name="user" size={27} color="#2563EB" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.profileInfo}>
                        <TouchableOpacity
                            style={styles.nameRow}
                            onPress={() => router.push('/my-profile')}
                        >
                            <Text style={styles.profileNameText}>{name}</Text>
                            <FontAwesome6
                                name="angle-right"
                                size={14}
                                color="#BFD4FF"
                                style={{ marginLeft: 8 }}
                            />
                        </TouchableOpacity>
                        <Text style={styles.profileEmailText}>{email}</Text>
                    </View>
                </View>

                <View style={styles.menuCard}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/my-profile')}
                    >
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="user" size={16} color="#2563EB" />
                        </View>
                        <View style={styles.menuTextWrap}>
                            <Text style={styles.menuText}>My Profile</Text>
                            <Text style={styles.menuSubText}>ดูและแก้ไขข้อมูลส่วนตัว</Text>
                        </View>
                        <FontAwesome6 name="angle-right" size={14} color="#9BB5E8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/data-dashboard' as any)}
                    >
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="chart-line" size={16} color="#2563EB" />
                        </View>
                        <View style={styles.menuTextWrap}>
                            <Text style={styles.menuText}>Data Dashboard</Text>
                            <Text style={styles.menuSubText}>ดูสถิติการยืดและความก้าวหน้าของคุณ</Text>
                        </View>
                        <FontAwesome6 name="angle-right" size={14} color="#9BB5E8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/settings')}
                    >
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="gear" size={16} color="#2563EB" />
                        </View>
                        <View style={styles.menuTextWrap}>
                            <Text style={styles.menuText}>Settings</Text>
                            <Text style={styles.menuSubText}>ตั้งค่าการใช้งานแอป</Text>
                        </View>
                        <FontAwesome6 name="angle-right" size={14} color="#9BB5E8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="bell" size={16} color="#2563EB" />
                        </View>
                        <View style={styles.menuTextWrap}>
                            <Text style={styles.menuText}>Notifications</Text>
                            <Text style={styles.menuSubText}>จัดการการแจ้งเตือน</Text>
                        </View>
                        <FontAwesome6 name="angle-right" size={14} color="#9BB5E8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="receipt" size={16} color="#2563EB" />
                        </View>
                        <View style={styles.menuTextWrap}>
                            <Text style={styles.menuText}>Transaction History</Text>
                            <Text style={styles.menuSubText}>ดูประวัติการใช้เหรียญ</Text>
                        </View>
                        <FontAwesome6 name="angle-right" size={14} color="#9BB5E8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="circle-question" size={16} color="#2563EB" />
                        </View>
                        <View style={styles.menuTextWrap}>
                            <Text style={styles.menuText}>FAQ</Text>
                            <Text style={styles.menuSubText}>คำถามที่พบบ่อย</Text>
                        </View>
                        <FontAwesome6 name="angle-right" size={14} color="#9BB5E8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="circle-info" size={16} color="#2563EB" />
                        </View>
                        <View style={styles.menuTextWrap}>
                            <Text style={styles.menuText}>About App</Text>
                            <Text style={styles.menuSubText}>ข้อมูลเกี่ยวกับ Stretchman</Text>
                        </View>
                        <FontAwesome6 name="angle-right" size={14} color="#9BB5E8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.logoutItem]}
                        onPress={handleLogout}
                    >
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="right-from-bracket" size={16} color="#2563EB" />
                        </View>
                        <View style={styles.menuTextWrap}>
                            <Text style={styles.menuText}>Logout</Text>
                            <Text style={styles.menuSubText}>ออกจากบัญชีนี้</Text>
                        </View>
                        <FontAwesome6 name="angle-right" size={14} color="#9BB5E8" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>
                    Stretchman • Stay Active, Stay Healthy
                </Text>
            </ScrollView>

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
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 46,
        paddingBottom: 14,
        backgroundColor: '#1638AE',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 9,
        color: '#D9E6FF',
        marginTop: 2,
    },
    headerRightSpace: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    settingsPage: {
        width: '100%',
        maxWidth: 430,
        alignSelf: 'center',
        paddingHorizontal: 15,
        paddingTop: 4,
        paddingBottom: 115,
    },
    profileHeaderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2475ED',
        borderRadius: 22,
        paddingHorizontal: 15,
        paddingVertical: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 4,
    },
    avatarWrapper: {
        marginRight: 13,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileNameText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    profileEmailText: {
        fontSize: 12,
        color: '#DCE9FF',
        marginTop: 3,
    },
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 23,
        paddingVertical: 6,
        paddingHorizontal: 13,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
    },
    menuItem: {
        minHeight: 67,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF3FF',
    },
    logoutItem: {
        borderBottomWidth: 0,
    },
    menuIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 13,
        backgroundColor: '#EAF1FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuTextWrap: {
        flex: 1,
    },
    menuText: {
        fontSize: 14,
        color: '#173D91',
        fontWeight: '700',
    },
    menuSubText: {
        fontSize: 9,
        color: '#7A8BAE',
        marginTop: 3,
    },
    footerText: {
        textAlign: 'center',
        fontSize: 9,
        color: '#D6E2FF',
        marginTop: 12,
        marginBottom: 2,
    },
    fixedBottomNav: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 5,
        zIndex: 100,
        elevation: 20,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
});
