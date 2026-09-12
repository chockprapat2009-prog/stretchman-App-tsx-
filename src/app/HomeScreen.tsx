import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import { FontAwesome6, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import BottomNav from './components/BottomNav'; // <-- 1. นำเข้า BottomNav ที่สร้างใหม่

export default function HomeScreen() {
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <View style={styles.container}>
            
            {/* ส่วนหัวรวม: Profile (บน) -> XP (กลาง) -> Stats (ล่าง) */}
            <View style={styles.homeHeader}>
                
                {/* 1. โปรไฟล์และต้อนรับผู้ใช้ */}
                <LinearGradient 
                    colors={['#237FFF', '#A8CCFF']} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 1 }} 
                    style={styles.welcomeCard}
                >
                    <View style={styles.welcomeTextContainer}>
                        <Text style={styles.welcomeTitle}>Hello Atiya!</Text>
                        <Text style={styles.welcomeSubtitle}>Are you experiencing any particular pain today?</Text>
                    </View>
                    
                    <View style={styles.profileContainer}>
                        <TouchableOpacity style={styles.notifBtn} onPress={() => alert('เปิดการแจ้งเตือน')}>
                            <FontAwesome6 name="bell" size={16} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.avatarWrap}>
                            <Image source={require('../../assets/images/avatar.png')} style={styles.avatar} />
                            <Text style={styles.uid}>UID00001</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* 2. แถบเลเวลและ XP */}
                <View style={styles.xpContainer}>
                    <View style={styles.xpHeader}>
                        <Text style={styles.xpLabelText}>Level <Text style={{fontWeight: 'bold'}}>1</Text></Text>
                        <Text style={styles.xpLabelText}>0 / 100 XP</Text>
                    </View>
                    <View style={styles.xpBackground}>
                        <View style={[styles.xpFill, { width: '0%' }]} />
                    </View>
                </View>

                {/* 3. Streak & Coins */}
                <View style={styles.statsRow}>
                    <View style={styles.statBadge}>
                        <FontAwesome6 name="fire" size={16} color="#FF6B00" />
                        <Text style={styles.statValue}>67</Text>
                    </View>
                    <View style={styles.statBadge}>
                        <Image source={require('../../assets/images/coin.png')} style={styles.coinImg} />
                        <Text style={styles.statValue}>6.7M</Text>
                    </View>
                </View>

            </View>

            {/* ส่วนภาพแผนผังร่างกาย */}
            <View style={styles.bodySection}>
                <Image source={require('../../assets/images/back.png')} style={styles.bodyImage} resizeMode="contain" />
            </View>

            {/* ส่วนปุ่ม Start และ เมนูด้านล่าง */}
            <View style={styles.bottomSection}>
                <TouchableOpacity onPress={() => router.push('/pain-questionnaire' as any)}>
                    <LinearGradient
                        colors={['#237FFF', '#A8CCFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.startButton}
                    >
                        <Text style={styles.startText}>Start!</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* 2. เรียกใช้ BottomNav กลางแทนที่โค้ดเมนูเดิม */}
                <BottomNav activeTab="home" />
            </View>

            {/* หน้าต่าง Popup เมนูโปรไฟล์สไตล์ YouTube */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuContainer}>
                        <View style={styles.menuHeader}>
                            <Image source={require('../../assets/images/avatar.png')} style={styles.menuAvatar} />
                            <View>
                                <Text style={styles.menuName}>Atiya</Text>
                                <Text style={styles.menuEmail}>@uid00001</Text>
                                <TouchableOpacity onPress={() => { setMenuVisible(false); alert('ไปหน้าโปรไฟล์'); }}>
                                    <Text style={styles.menuLink}>ดูโปรไฟล์ของคุณ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('จัดการบัญชี Google')}>
                            <FontAwesome name="google" size={18} color="#333" style={styles.menuIcon} />
                            <Text style={styles.menuText}>บัญชี Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => alert('สลับบัญชี')}>
                            <FontAwesome6 name="users" size={16} color="#333" style={styles.menuIcon} />
                            <Text style={styles.menuText}>สลับบัญชี</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.replace('/' as any); }}>
                            <FontAwesome6 name="right-from-bracket" size={16} color="#D9534F" style={styles.menuIcon} />
                            <Text style={[styles.menuText, { color: '#D9534F' }]}>ออกจากระบบ</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1638AE',
        paddingHorizontal: 20,
        paddingTop: 10,
        justifyContent: 'space-between',
    },
    homeHeader: {
        gap: 10,
        marginTop: 10,
    },
    welcomeCard: {
        borderRadius: 22,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcomeTextContainer: {
        flex: 1,
    },
    welcomeTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    welcomeSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 11,
        marginTop: 2,
        lineHeight: 14,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    notifBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarWrap: {
        alignItems: 'center',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
    },
    uid: {
        fontSize: 8,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 2,
    },
    xpContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 8,
        borderRadius: 15,
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    xpLabelText: {
        color: 'white',
        fontSize: 12,
    },
    xpBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    xpFill: {
        height: '100%',
        backgroundColor: '#FFD700',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    statBadge: {
        backgroundColor: 'white',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontWeight: '600',
        fontSize: 13,
        color: '#333',
    },
    coinImg: {
        width: 16,
        height: 16,
        resizeMode: 'contain',
    },
    bodySection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5,
    },
    bodyImage: {
        width: '100%',
        height: '100%',
    },
    bottomSection: {
        marginBottom: 15,
    },
    startButton: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    startText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    // สไตล์ของ bottomNav เดิมถูกย้ายไปไว้ในไฟล์ BottomNav.tsx แล้วเพื่อความสะอาด
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 80,
        paddingRight: 20,
    },
    menuContainer: {
        width: 280,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 12,
    },
    menuAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    menuName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    menuEmail: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    menuLink: {
        fontSize: 12,
        color: '#1a73e8',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        width: '100%',
        marginBottom: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        gap: 16,
    },
    menuIcon: {
        width: 20,
        textAlign: 'center',
    },
    menuText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
});