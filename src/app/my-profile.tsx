import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyProfileScreen() {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);

    const [fullName, setFullName] = useState('Bagja Alfatih');
    const [dob, setDob] = useState('7 July 2002');
    const [gender, setGender] = useState<'Male' | 'Female'>('Male');
    const [mobileNumber, setMobileNumber] = useState('+62 821 1234 1234');
    const [email, setEmail] = useState('bagjaalfatih17@gmail.com');
    const [weight, setWeight] = useState('64');
    const [height, setHeight] = useState('175,5');

    // โหลดข้อมูลชื่อจาก AsyncStorage เมื่อเปิดหน้า
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                const storedName = await AsyncStorage.getItem('stretchmanName');
                if (storedName) setFullName(storedName);
            } catch (error) {
                console.log('Failed to load name', error);
            }
        };
        loadProfileData();
    }, []);

    // บันทึกข้อมูลชื่อลง AsyncStorage
    const handleSave = async () => {
        try {
            if (fullName.trim()) {
                await AsyncStorage.setItem('stretchmanName', fullName.trim());
            }
            Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว');
            setIsEditing(false);
        } catch (error) {
            console.log('Failed to save name', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome6 name="arrow-left" size={18} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* AVATAR */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <FontAwesome6 name="user" size={36} color="#64748B" />
                        {isEditing && (
                            <TouchableOpacity style={styles.cameraBtn}>
                                <FontAwesome6 name="camera" size={10} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* BASIC DETAIL */}
                <Text style={styles.sectionTitle}>Basic Detail</Text>
                
                <Text style={styles.label}>Full name</Text>
                <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={fullName}
                    onChangeText={setFullName}
                    editable={isEditing}
                />

                <Text style={styles.label}>Date of birth</Text>
                <View style={[styles.inputWithIcon, !isEditing && styles.inputDisabled]}>
                    <TextInput
                        style={styles.inputFlex}
                        value={dob}
                        onChangeText={setDob}
                        editable={isEditing}
                    />
                    {isEditing && <FontAwesome6 name="caret-down" size={14} color="#94A3B8" />}
                </View>

                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderContainer}>
                    <TouchableOpacity
                        disabled={!isEditing}
                        style={[
                            styles.genderBtn, 
                            gender === 'Male' && styles.genderBtnActive,
                            !isEditing && styles.genderBtnDisabled
                        ]}
                        onPress={() => setGender('Male')}
                    >
                        <View style={[styles.radioCircle, gender === 'Male' && styles.radioCircleActive]} />
                        <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>Male</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        disabled={!isEditing}
                        style={[
                            styles.genderBtn, 
                            gender === 'Female' && styles.genderBtnActive,
                            !isEditing && styles.genderBtnDisabled
                        ]}
                        onPress={() => setGender('Female')}
                    >
                        <View style={[styles.radioCircle, gender === 'Female' && styles.radioCircleActive]} />
                        <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>Female</Text>
                    </TouchableOpacity>
                </View>

                {/* CONTACT DETAIL */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Contact Detail</Text>

                <Text style={styles.label}>Mobile number</Text>
                <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    editable={isEditing}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    editable={isEditing}
                />

                {/* PERSONAL DETAIL */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Personal Detail</Text>

                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    editable={isEditing}
                />

                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    editable={isEditing}
                />

                {/* BOTTOM BUTTON */}
                {isEditing ? (
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
                        <Text style={styles.editBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
    content: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 15,
    },
    avatarContainer: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#3B82F6',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
        marginBottom: 14,
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 14,
    },
    inputFlex: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
        padding: 0,
    },
    inputDisabled: {
        backgroundColor: '#F8FAFC',
        borderColor: '#F1F5F9',
        color: '#334155',
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    genderBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    genderBtnDisabled: {
        backgroundColor: '#F8FAFC',
        borderColor: '#F1F5F9',
    },
    genderBtnActive: {
        borderColor: '#3B82F6',
    },
    radioCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#94A3B8',
        marginRight: 10,
    },
    radioCircleActive: {
        backgroundColor: '#3B82F6',
    },
    genderText: {
        fontSize: 14,
        color: '#64748B',
    },
    genderTextActive: {
        color: '#0F172A',
        fontWeight: '500',
    },
    saveBtn: {
        backgroundColor: '#2563EB',
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    editBtn: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    editBtnText: {
        color: '#0F172A',
        fontSize: 15,
        fontWeight: '600',
    },
});