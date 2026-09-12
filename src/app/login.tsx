import React, { useState } from 'react';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import { router } from 'expo-router';

import {
  FontAwesome5,
  Ionicons,
} from '@expo/vector-icons';

import RegisterDatePicker from './components/RegisterDatePicker';


// ======================================================
// API
// ======================================================

const API_URL = 'http://localhost:5000/api';


// ======================================================
// REGISTER SCREEN
// ======================================================

export default function RegisterScreen() {

  // ====================================================
  // ACCOUNT DATA
  // ====================================================

  const [fullName, setFullName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');


  // ====================================================
  // BODY DATA
  // ====================================================

  const [mobileNumber, setMobileNumber] =
    useState('');

  const [weight, setWeight] =
    useState('');

  const [height, setHeight] =
    useState('');


  // ====================================================
  // DATE OF BIRTH
  // ====================================================

  const [dob, setDob] =
    useState('');

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [age, setAge] =
    useState('');


  // ====================================================
  // OTHER DATA
  // ====================================================

  const [gender, setGender] =
    useState<'ชาย' | 'หญิง' | 'ไม่ระบุ'>(
      'ไม่ระบุ'
    );

  const [agreeTerms, setAgreeTerms] =
    useState(false);


  // ====================================================
  // DATE CHANGE
  // ====================================================

  const handleDateChange = (
    date: Date
  ) => {

    // เก็บวันที่ที่เลือก
    setSelectedDate(date);


    // ================================================
    // FORMAT DD/MM/YYYY
    // ================================================

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const year =
      date.getFullYear();


    setDob(
      `${day}/${month}/${year}`
    );


    // ================================================
    // CALCULATE AGE
    // ================================================

    const today =
      new Date();

    let calculatedAge =
      today.getFullYear() -
      year;

    const monthDiff =
      today.getMonth() -
      date.getMonth();


    if (
      monthDiff < 0 ||
      (
        monthDiff === 0 &&
        today.getDate() <
        date.getDate()
      )
    ) {
      calculatedAge--;
    }


    setAge(
      calculatedAge >= 0
        ? calculatedAge.toString()
        : '0'
    );

    // สำคัญ:
    // ตรงนี้ไม่ปิด DatePicker
    //
    // เพราะเราต้องการให้ผู้ใช้เลือก
    // วัน / เดือน / ปี ได้ก่อน
    // แล้วค่อยกด "บันทึก"
  };


  // ====================================================
  // REGISTER
  // ====================================================

  const handleRegister =
    async () => {

      // ================================================
      // CHECK TERMS
      // ================================================

      if (!agreeTerms) {

        Alert.alert(
          'แจ้งเตือน',
          'กรุณายอมรับเงื่อนไขการให้บริการ'
        );

        return;
      }


      // ================================================
      // CHECK PASSWORD
      // ================================================

      if (
        password !==
        confirmPassword
      ) {

        Alert.alert(
          'แจ้งเตือน',
          'รหัสผ่านไม่ตรงกัน'
        );

        return;
      }


      // ================================================
      // SEND DATA
      // ================================================

      try {

        const response =
          await fetch(
            `${API_URL}/auth/register`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                fullName,
                email,
                password,
                mobileNumber,
                weight,
                height,
                dob,
                age,
                gender,
              }),
            }
          );


        const data =
          await response.json();


        // ============================================
        // SUCCESS
        // ============================================

        if (response.ok) {

          router.replace(
            '/stretch' as any
          );

        } else {

          Alert.alert(
            'สร้างบัญชีไม่สำเร็จ',
            data.message ||
              'เกิดข้อผิดพลาดบางอย่าง'
          );

        }

      } catch (error) {

        console.log(
          'Register error:',
          error
        );

        Alert.alert(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
        );

      }
    };


  // ====================================================
  // UI
  // ====================================================

  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={
            styles.headerContainer
          }
        >

          <View
            style={
              styles.logoIconContainer
            }
          >

            <Ionicons
              name="flash"
              size={24}
              color="#FFFFFF"
            />

          </View>


          <Text
            style={
              styles.logoText
            }
          >
            StretchMan
          </Text>


          <Text
            style={
              styles.subLogoText
            }
          >
            Initialize your high-performance profile.
          </Text>

        </View>


        {/* =================================================
            CARD
        ================================================= */}

        <View
          style={
            styles.cardContainer
          }
        >

          <Text
            style={
              styles.cardTitle
            }
          >
            Create Account
          </Text>


          {/* =================================================
              FULL NAME
          ================================================= */}

          <View
            style={
              styles.inputGroup
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Full Name
            </Text>


            <View
              style={
                styles.inputWrapper
              }
            >

              <FontAwesome5
                name="user"
                size={16}
                color="#6B7280"
                style={
                  styles.inputIcon
                }
              />


              <TextInput
                style={
                  styles.input
                }
                placeholder="Jane Doe"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={
                  setFullName
                }
              />

            </View>

          </View>


          {/* =================================================
              EMAIL
          ================================================= */}

          <View
            style={
              styles.inputGroup
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Email Address
            </Text>


            <View
              style={
                styles.inputWrapper
              }
            >

              <FontAwesome5
                name="envelope"
                size={16}
                color="#6B7280"
                style={
                  styles.inputIcon
                }
              />


              <TextInput
                style={
                  styles.input
                }
                placeholder="jane@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={
                  setEmail
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />

            </View>

          </View>


          {/* =================================================
              MOBILE
          ================================================= */}

          <View
            style={
              styles.inputGroup
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Mobile Number
            </Text>


            <View
              style={
                styles.inputWrapper
              }
            >

              <FontAwesome5
                name="phone"
                size={16}
                color="#6B7280"
                style={
                  styles.inputIcon
                }
              />


              <TextInput
                style={
                  styles.input
                }
                placeholder="0812345678"
                placeholderTextColor="#9CA3AF"
                value={
                  mobileNumber
                }
                onChangeText={
                  setMobileNumber
                }
                keyboardType="phone-pad"
              />

            </View>

          </View>


          {/* =================================================
              WEIGHT / HEIGHT
          ================================================= */}

          <View
            style={
              styles.rowGroup
            }
          >

            {/* WEIGHT */}

            <View
              style={[
                styles.inputGroup,
                {
                  flex: 1,
                  marginRight: 8,
                },
              ]}
            >

              <Text
                style={
                  styles.label
                }
              >
                Weight (kg)
              </Text>


              <View
                style={
                  styles.inputWrapper
                }
              >

                <FontAwesome5
                  name="weight"
                  size={16}
                  color="#6B7280"
                  style={
                    styles.inputIcon
                  }
                />


                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="60"
                  placeholderTextColor="#9CA3AF"
                  value={weight}
                  onChangeText={
                    setWeight
                  }
                  keyboardType="numeric"
                />

              </View>

            </View>


            {/* HEIGHT */}

            <View
              style={[
                styles.inputGroup,
                {
                  flex: 1,
                  marginLeft: 8,
                },
              ]}
            >

              <Text
                style={
                  styles.label
                }
              >
                Height (cm)
              </Text>


              <View
                style={
                  styles.inputWrapper
                }
              >

                <FontAwesome5
                  name="ruler-vertical"
                  size={16}
                  color="#6B7280"
                  style={
                    styles.inputIcon
                  }
                />


                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="170"
                  placeholderTextColor="#9CA3AF"
                  value={height}
                  onChangeText={
                    setHeight
                  }
                  keyboardType="numeric"
                />

              </View>

            </View>

          </View>


          {/* =================================================
              DATE OF BIRTH / AGE
          ================================================= */}

          <View
            style={
              styles.rowGroup
            }
          >

            {/* DATE OF BIRTH */}

            <View
              style={[
                styles.inputGroup,
                {
                  flex: 2,
                  marginRight: 8,
                },
              ]}
            >

              <Text
                style={
                  styles.label
                }
              >
                Date of Birth
              </Text>


              <TouchableOpacity
                style={
                  styles.inputWrapper
                }
                activeOpacity={0.7}
                onPress={() =>
                  setShowDatePicker(
                    true
                  )
                }
              >

                <FontAwesome5
                  name="calendar-alt"
                  size={16}
                  color="#6B7280"
                  style={
                    styles.inputIcon
                  }
                />


                <Text
                  style={[
                    styles.dateText,
                    !dob &&
                    styles.placeholderText,
                  ]}
                >
                  {
                    dob ||
                    'DD/MM/YYYY'
                  }
                </Text>

              </TouchableOpacity>

            </View>


            {/* AGE */}

            <View
              style={[
                styles.inputGroup,
                {
                  flex: 1,
                  marginLeft: 8,
                },
              ]}
            >

              <Text
                style={
                  styles.label
                }
              >
                Age
              </Text>


              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor:
                      '#F3F4F6',
                  },
                ]}
              >

                <FontAwesome5
                  name="birthday-cake"
                  size={16}
                  color="#6B7280"
                  style={
                    styles.inputIcon
                  }
                />


                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="20"
                  placeholderTextColor="#9CA3AF"
                  value={age}
                  editable={false}
                />

              </View>

            </View>

          </View>


          {/* =================================================
              DATE PICKER
          ================================================= */}

          {showDatePicker && (

            <RegisterDatePicker
              value={
                selectedDate
              }
              maximumDate={
                new Date()
              }
              onChange={
                handleDateChange
              }
              onDone={() =>
                setShowDatePicker(
                  false
                )
              }
            />

          )}


          {/* =================================================
              GENDER
          ================================================= */}

          <View
            style={
              styles.inputGroup
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Gender
            </Text>


            <View
              style={
                styles.genderContainer
              }
            >

              {(
                [
                  'ชาย',
                  'หญิง',
                  'ไม่ระบุ',
                ] as const
              ).map(
                (item) => (

                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.genderBtn,
                      gender === item &&
                      styles.genderBtnActive,
                    ]}
                    onPress={() =>
                      setGender(item)
                    }
                  >

                    <Text
                      style={[
                        styles.genderText,
                        gender === item &&
                        styles.genderTextActive,
                      ]}
                    >
                      {item}
                    </Text>

                  </TouchableOpacity>

                )
              )}

            </View>

          </View>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <View
            style={
              styles.inputGroup
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Password
            </Text>


            <View
              style={
                styles.inputWrapper
              }
            >

              <FontAwesome5
                name="lock"
                size={16}
                color="#6B7280"
                style={
                  styles.inputIcon
                }
              />


              <TextInput
                style={
                  styles.input
                }
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={
                  setPassword
                }
              />

            </View>

          </View>


          {/* =================================================
              CONFIRM PASSWORD
          ================================================= */}

          <View
            style={
              styles.inputGroup
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Confirm Password
            </Text>


            <View
              style={
                styles.inputWrapper
              }
            >

              <FontAwesome5
                name="undo"
                size={16}
                color="#6B7280"
                style={
                  styles.inputIcon
                }
              />


              <TextInput
                style={
                  styles.input
                }
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={
                  confirmPassword
                }
                onChangeText={
                  setConfirmPassword
                }
              />

            </View>

          </View>


          {/* =================================================
              TERMS
          ================================================= */}

          <TouchableOpacity
            style={
              styles.checkboxContainer
            }
            activeOpacity={0.8}
            onPress={() =>
              setAgreeTerms(
                !agreeTerms
              )
            }
          >

            <View
              style={[
                styles.checkbox,
                agreeTerms &&
                styles.checkboxActive,
              ]}
            >

              {agreeTerms && (

                <FontAwesome5
                  name="check"
                  size={10}
                  color="#111827"
                />

              )}

            </View>


            <Text
              style={
                styles.checkboxText
              }
            >
              I agree to the{' '}

              <Text
                style={
                  styles.linkText
                }
              >
                Terms of Service
              </Text>

              {' '}and{' '}

              <Text
                style={
                  styles.linkText
                }
              >
                Privacy Policy
              </Text>

              .
            </Text>

          </TouchableOpacity>


          {/* =================================================
              SUBMIT
          ================================================= */}

          <TouchableOpacity
            style={
              styles.submitButton
            }
            onPress={
              handleRegister
            }
          >

            <Text
              style={
                styles.submitButtonText
              }
            >
              CREATE ACCOUNT
            </Text>

          </TouchableOpacity>


          {/* =================================================
              DIVIDER
          ================================================= */}

          <View
            style={
              styles.dividerContainer
            }
          >

            <View
              style={
                styles.dividerLine
              }
            />

            <Text
              style={
                styles.dividerText
              }
            >
              OR CONTINUE WITH
            </Text>

            <View
              style={
                styles.dividerLine
              }
            />

          </View>


          {/* =================================================
              GOOGLE
          ================================================= */}

          <View
            style={
              styles.socialContainerCenter
            }
          >

            <TouchableOpacity
              style={
                styles.socialBtnCenter
              }
            >

              <FontAwesome5
                name="google"
                size={18}
                color="#DB4437"
              />

              <Text
                style={
                  styles.socialBtnText
                }
              >
                Google
              </Text>

            </TouchableOpacity>

          </View>

        </View>


        {/* =================================================
            FOOTER
        ================================================= */}

        <View
          style={
            styles.footerContainer
          }
        >

          <Text
            style={
              styles.footerText
            }
          >
            Already have an account?{' '}
          </Text>


          <TouchableOpacity
            onPress={() =>
              router.push(
                '/login' as any
              )
            }
          >

            <Text
              style={
                styles.signInText
              }
            >
              Sign In
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },

  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },

  logoIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  subLogoText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  cardContainer: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },

  inputGroup: {
    marginBottom: 16,
  },

  rowGroup: {
    flexDirection: 'row',
  },

  label: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },

  inputIcon: {
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },

  input: {
    flex: 1,
    height: '100%',
    color: '#1F2937',
    fontSize: 14,
  },

  dateText: {
    color: '#1F2937',
    fontSize: 14,
  },

  placeholderText: {
    color: '#9CA3AF',
  },

  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  genderBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },

  genderBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
  },

  genderText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },

  genderTextActive: {
    color: '#3B82F6',
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  checkboxActive: {
    backgroundColor: '#D1D5DB',
    borderColor: '#D1D5DB',
  },

  checkboxText: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 12,
  },

  linkText: {
    color: '#3B82F6',
  },

  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },

  dividerText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },

  socialContainerCenter: {
    alignItems: 'center',
  },

  socialBtnCenter: {
    width: '100%',
    flexDirection: 'row',
    height: 44,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },

  socialBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },

  footerContainer: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'center',
  },

  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  signInText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },

});