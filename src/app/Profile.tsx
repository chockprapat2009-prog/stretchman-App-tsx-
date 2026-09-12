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

    // ดึงข้อมูลชื่อล่าสุดจาก AsyncStorage เมื่อหน้านี้ถูกโฟกัส
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
            {/* HEADER */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome6 name="arrow-left" size={18} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.settingsPage}
                showsVerticalScrollIndicator={false}
            >
                {/* USER PROFILE HEADER */}
                <View style={styles.profileHeaderCard}>
                    <TouchableOpacity 
                        style={styles.avatarWrapper}
                        onPress={() => router.push('/my-profile')}
                    >
                        <View style={styles.avatarContainer}>
                            <FontAwesome6 name="user" size={28} color="#64748B" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.profileInfo}>
                        <TouchableOpacity 
                            style={styles.nameRow}
                            onPress={() => router.push('/my-profile')}
                        >
                            <Text style={styles.profileNameText}>{name}</Text>
                            <FontAwesome6 name="angle-right" size={14} color="#94A3B8" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                        <Text style={styles.profileEmailText}>{email}</Text>
                    </View>
                </View>

                {/* MENU LIST */}
                <View style={styles.menuCard}>
                    {/* My Profile */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-profile')}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="user" size={16} color="#475569" />
                        </View>
                        <Text style={styles.menuText}>My Profile</Text>
                    </TouchableOpacity>

                    {/* Settings */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="gear" size={16} color="#475569" />
                        </View>
                        <Text style={styles.menuText}>Settings</Text>
                    </TouchableOpacity>

                    {/* Notifications */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="bell" size={16} color="#475569" />
                        </View>
                        <Text style={styles.menuText}>Notifications</Text>
                    </TouchableOpacity>

                    {/* Transaction History */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="receipt" size={16} color="#475569" />
                        </View>
                        <Text style={styles.menuText}>Transaction History</Text>
                    </TouchableOpacity>

                    {/* FAQ */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="circle-question" size={16} color="#475569" />
                        </View>
                        <Text style={styles.menuText}>FAQ</Text>
                    </TouchableOpacity>

                    {/* About App */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="circle-info" size={16} color="#475569" />
                        </View>
                        <Text style={styles.menuText}>About App</Text>
                    </TouchableOpacity>

                    {/* Logout */}
                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome6 name="right-from-bracket" size={16} color="#475569" />
                        </View>
                        <Text style={styles.menuText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* BOTTOM NAV */}
            <View style={styles.bottomNavContainer}>
                <BottomNav activeTab="setting" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fbfbfb',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
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
    settingsPage: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },

    /* PROFILE HEADER CARD */
    profileHeaderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
        paddingHorizontal: 8,
    },
    avatarWrapper: {
        marginRight: 16,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileNameText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    profileEmailText: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },

    /* MENU CARD */
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    menuIconContainer: {
        width: 24,
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
    },

    bottomNavContainer: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#F8FAFC',
    },
});