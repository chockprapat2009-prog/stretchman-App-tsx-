import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';


interface BottomNavProps {
    activeTab?:
        | 'home'
        | 'quest'
        | 'alarm'
        | 'shop'
        | 'user'
        | 'setting';
}


export default function BottomNav({
    activeTab = 'home',
}: BottomNavProps) {

    return (
        <View style={styles.bottomNav}>

            {/* ==================================================
                HOME
            ================================================== */}

            <TouchableOpacity
                style={styles.navItem}
                onPress={() =>
                    router.push(
                        '/HomeScreen' as any
                    )
                }
                activeOpacity={0.7}
            >

                <View
                    style={[
                        styles.navItemContent,
                        activeTab === 'home' &&
                            styles.navItemContentActive,
                    ]}
                >

                    <FontAwesome6
                        name="house"
                        size={16}
                        color={
                            activeTab === 'home'
                                ? '#2475ed'
                                : '#888'
                        }
                    />

                    <Text
                        style={
                            activeTab === 'home'
                                ? styles.navTextActive
                                : styles.navText
                        }
                    >
                        Home
                    </Text>

                </View>

            </TouchableOpacity>


            {/* ==================================================
                QUEST
            ================================================== */}

            <TouchableOpacity
                style={styles.navItem}
                onPress={() =>
                    router.push(
                        '/quest' as any
                    )
                }
                activeOpacity={0.7}
            >

                <View
                    style={[
                        styles.navItemContent,
                        activeTab === 'quest' &&
                            styles.navItemContentActive,
                    ]}
                >

                    <FontAwesome6
                        name="book-open"
                        size={16}
                        color={
                            activeTab === 'quest'
                                ? '#2475ed'
                                : '#888'
                        }
                    />

                    <Text
                        style={
                            activeTab === 'quest'
                                ? styles.navTextActive
                                : styles.navText
                        }
                    >
                        Quest
                    </Text>

                </View>

            </TouchableOpacity>


            {/* ==================================================
                ALARM
            ================================================== */}

            <TouchableOpacity
                style={styles.navItem}
                onPress={() =>
                    router.push(
                        '/alarm' as any
                    )
                }
                activeOpacity={0.7}
            >

                <View
                    style={[
                        styles.navItemContent,
                        activeTab === 'alarm' &&
                            styles.navItemContentActive,
                    ]}
                >

                    <FontAwesome6
                        name="bell"
                        size={16}
                        color={
                            activeTab === 'alarm'
                                ? '#2475ed'
                                : '#888'
                        }
                    />

                    <Text
                        style={
                            activeTab === 'alarm'
                                ? styles.navTextActive
                                : styles.navText
                        }
                    >
                        Alarm
                    </Text>

                </View>

            </TouchableOpacity>


            {/* ==================================================
                SHOP
            ================================================== */}

            <TouchableOpacity
                style={styles.navItem}
                onPress={() =>
                    router.push(
                        '/shop' as any
                    )
                }
                activeOpacity={0.7}
            >

                <View
                    style={[
                        styles.navItemContent,
                        activeTab === 'shop' &&
                            styles.navItemContentActive,
                    ]}
                >

                    <FontAwesome6
                        name="cart-shopping"
                        size={16}
                        color={
                            activeTab === 'shop'
                                ? '#2475ed'
                                : '#888'
                        }
                    />

                    <Text
                        style={
                            activeTab === 'shop'
                                ? styles.navTextActive
                                : styles.navText
                        }
                    >
                        Shop
                    </Text>

                </View>

            </TouchableOpacity>


            {/* ==================================================
                PROFILE
            ================================================== */}

            <TouchableOpacity
                style={styles.navItem}
                onPress={() =>
                    router.push(
                        '/Profile' as any
                    )
                }
                activeOpacity={0.7}
            >

                <View
                    style={[
                        styles.navItemContent,
                        (
                            activeTab === 'user' ||
                            activeTab === 'setting'
                        ) &&
                            styles.navItemContentActive,
                    ]}
                >

                    <FontAwesome6
                        name="user"
                        size={16}
                        color={
                            (
                                activeTab === 'user' ||
                                activeTab === 'setting'
                            )
                                ? '#2475ed'
                                : '#888'
                        }
                    />

                    <Text
                        style={
                            (
                                activeTab === 'user' ||
                                activeTab === 'setting'
                            )
                                ? styles.navTextActive
                                : styles.navText
                        }
                    >
                        Profile
                    </Text>

                </View>

            </TouchableOpacity>

        </View>
    );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

    // แถบหลัก
    bottomNav: {
        width: '100%',
        height: 64,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        backgroundColor: '#FFFFFF',

        paddingHorizontal: 6,

        borderRadius: 35,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,

        elevation: 5,
    },


    // ช่องของแต่ละเมนู
    // ทุกช่องมีขนาดเท่ากัน
    navItem: {
        width: '20%',

        height: 64,

        alignItems: 'center',
        justifyContent: 'center',
    },


    // เนื้อหาด้านใน
    navItemContent: {
        minWidth: 58,
        height: 44,

        paddingHorizontal: 10,

        borderRadius: 22,

        alignItems: 'center',
        justifyContent: 'center',
    },


    // Active
    // เปลี่ยนเฉพาะ View นี้
    // ไม่ไปเปลี่ยนขนาดของ navItem
    navItemContentActive: {
        backgroundColor: '#E3EEFF',
    },


    // Text ปกติ
    navText: {
        color: '#888888',
        fontSize: 10,
        marginTop: 3,
        fontWeight: '400',
    },


    // Text Active
    navTextActive: {
        color: '#2475ed',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 3,
    },

});