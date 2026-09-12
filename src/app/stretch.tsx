import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    CameraView,
    CameraType,
    useCameraPermissions,
} from 'expo-camera';

import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BottomNav from './components/BottomNav';


// =====================================================
// TYPES
// =====================================================

interface SelectedExercise {
    id?: string;
    name?: string;
    description?: string;
    time?: string;
    area?: string;
    painLevel?: number;
    symptom?: string;
}


// =====================================================
// DEFAULT
// =====================================================

const DEFAULT_EXERCISE_NAME =
    'ท่ายืดกล้ามเนื้อ';

const DEFAULT_EXERCISE_TIME =
    20;


// =====================================================
// MAIN
// =====================================================

export default function StretchMotionTracking() {

    // =================================================
    // EXERCISE DATA
    // =================================================

    const [
        exercise,
        setExercise,
    ] = useState<SelectedExercise | null>(
        null
    );

    const [
        exerciseName,
        setExerciseName,
    ] = useState(
        DEFAULT_EXERCISE_NAME
    );

    const [
        exerciseTime,
        setExerciseTime,
    ] = useState(
        DEFAULT_EXERCISE_TIME
    );

    const [
        loadingExercise,
        setLoadingExercise,
    ] = useState(true);


    // =================================================
    // CAMERA
    // =================================================

    const [
        permission,
        requestPermission,
    ] = useCameraPermissions();

    const [
        cameraType,
        setCameraType,
    ] = useState<CameraType>('front');

    const [
        cameraRunning,
        setCameraRunning,
    ] = useState(false);


    // =================================================
    // TIMER
    // =================================================

    const [
        remainingSeconds,
        setRemainingSeconds,
    ] = useState(
        DEFAULT_EXERCISE_TIME
    );

    const [
        timerRunning,
        setTimerRunning,
    ] = useState(false);


    // =================================================
    // TRACKING MESSAGE
    // =================================================

    const [
        trackingMessage,
        setTrackingMessage,
    ] = useState(
        'กำลังเตรียมท่า...'
    );


    // =================================================
    // REFS
    // =================================================

    const timerRef =
        useRef<ReturnType<
            typeof setInterval
        > | null>(null);

    const startTimeoutRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null);


    // =================================================
    // LOAD SELECTED EXERCISE
    // =================================================

    useEffect(() => {

        const loadExercise =
            async () => {

                try {

                    setLoadingExercise(true);


                    // ---------------------------------
                    // 1. โหลด Selected Exercise
                    // ---------------------------------

                    const storedExercise =
                        await AsyncStorage.getItem(
                            'stretchmanSelectedExercise'
                        );


                    if (storedExercise) {

                        const parsed:
                            SelectedExercise =
                            JSON.parse(
                                storedExercise
                            );


                        setExercise(
                            parsed
                        );


                        if (parsed.name) {

                            setExerciseName(
                                parsed.name
                            );

                        }


                        // -----------------------------
                        // ดึงตัวเลขจาก "20 วินาที"
                        // -----------------------------

                        if (parsed.time) {

                            const parsedTime =
                                parseInt(
                                    parsed.time,
                                    10
                                );


                            if (
                                !Number.isNaN(
                                    parsedTime
                                ) &&
                                parsedTime > 0
                            ) {

                                setExerciseTime(
                                    parsedTime
                                );

                                setRemainingSeconds(
                                    parsedTime
                                );

                            }

                        }

                    } else {

                        // ---------------------------------
                        // Fallback จาก exerciseName
                        // ---------------------------------

                        const storedName =
                            await AsyncStorage.getItem(
                                'exerciseName'
                            );

                        const storedTime =
                            await AsyncStorage.getItem(
                                'exerciseTime'
                            );


                        if (storedName) {

                            setExerciseName(
                                storedName
                            );

                        }


                        if (storedTime) {

                            const parsedTime =
                                parseInt(
                                    storedTime,
                                    10
                                );


                            if (
                                !Number.isNaN(
                                    parsedTime
                                ) &&
                                parsedTime > 0
                            ) {

                                setExerciseTime(
                                    parsedTime
                                );

                                setRemainingSeconds(
                                    parsedTime
                                );

                            }

                        }

                    }

                } catch (error) {

                    console.log(
                        'Failed to load selected exercise:',
                        error
                    );

                } finally {

                    setLoadingExercise(
                        false
                    );

                }

            };


        loadExercise();

    }, []);


    // =================================================
    // CLEANUP
    // =================================================

    useEffect(() => {

        return () => {

            if (
                timerRef.current
            ) {

                clearInterval(
                    timerRef.current
                );

                timerRef.current =
                    null;

            }


            if (
                startTimeoutRef.current
            ) {

                clearTimeout(
                    startTimeoutRef.current
                );

                startTimeoutRef.current =
                    null;

            }

        };

    }, []);


    // =================================================
    // AUTO START CAMERA
    // =================================================

    useEffect(() => {

        if (
            !loadingExercise &&
            permission?.granted &&
            !cameraRunning
        ) {

            handleStartCamera();

        }

    }, [
        loadingExercise,
        permission?.granted,
    ]);


    // =================================================
    // TIMER
    // =================================================

    useEffect(() => {

        if (!timerRunning) {
            return;
        }


        timerRef.current =
            setInterval(() => {

                setRemainingSeconds(
                    prev => {

                        if (prev <= 1) {

                            if (
                                timerRef.current
                            ) {

                                clearInterval(
                                    timerRef.current
                                );

                                timerRef.current =
                                    null;

                            }


                            setTimerRunning(
                                false
                            );

                            setCameraRunning(
                                false
                            );

                            setTrackingMessage(
                                'ยืดครบเวลาแล้ว ✓'
                            );


                            // -------------------------
                            // ไป Complete
                            // -------------------------

                            router.replace(
                                '/complete' as any
                            );


                            return 0;
                        }


                        return prev - 1;

                    }
                );

            }, 1000);


        return () => {

            if (
                timerRef.current
            ) {

                clearInterval(
                    timerRef.current
                );

                timerRef.current =
                    null;

            }

        };

    }, [timerRunning]);


    // =================================================
    // START CAMERA
    // =================================================

    const handleStartCamera =
        async () => {

            if (
                !permission?.granted
            ) {

                const result =
                    await requestPermission();


                if (
                    !result.granted
                ) {

                    Alert.alert(
                        'ไม่สามารถใช้กล้องได้',
                        'กรุณาอนุญาตให้ Stretchman ใช้กล้องในการตรวจท่าทาง'
                    );

                    return;

                }

            }


            // ---------------------------------
            // Reset previous timer
            // ---------------------------------

            if (
                timerRef.current
            ) {

                clearInterval(
                    timerRef.current
                );

                timerRef.current =
                    null;

            }


            if (
                startTimeoutRef.current
            ) {

                clearTimeout(
                    startTimeoutRef.current
                );

            }


            // ---------------------------------
            // Start Camera
            // ---------------------------------

            setCameraRunning(
                true
            );

            setTimerRunning(
                false
            );

            setRemainingSeconds(
                exerciseTime
            );

            setTrackingMessage(
                'กำลังค้นหาตำแหน่งร่างกาย...'
            );


            // ---------------------------------
            // จำลองการตรวจจับ
            // ---------------------------------

            startTimeoutRef.current =
                setTimeout(() => {

                    setTrackingMessage(
                        '✓ ตรวจพบท่าพร้อมแล้ว กำลังยืด...'
                    );

                    setTimerRunning(
                        true
                    );

                }, 1200);

        };


    // =================================================
    // STOP CAMERA
    // =================================================

    const handleStopCamera =
        () => {

            if (
                timerRef.current
            ) {

                clearInterval(
                    timerRef.current
                );

                timerRef.current =
                    null;

            }


            if (
                startTimeoutRef.current
            ) {

                clearTimeout(
                    startTimeoutRef.current
                );

                startTimeoutRef.current =
                    null;

            }


            setCameraRunning(
                false
            );

            setTimerRunning(
                false
            );

            setTrackingMessage(
                'กดเปิดกล้องเพื่อเริ่ม'
            );

        };


    // =================================================
    // TOGGLE CAMERA
    // =================================================

    const handleToggleCamera =
        () => {

            if (cameraRunning) {

                handleStopCamera();

            } else {

                handleStartCamera();

            }

        };


    // =================================================
    // RESET
    // =================================================

    const handleReset =
        () => {

            if (
                timerRef.current
            ) {

                clearInterval(
                    timerRef.current
                );

                timerRef.current =
                    null;

            }


            if (
                startTimeoutRef.current
            ) {

                clearTimeout(
                    startTimeoutRef.current
                );

                startTimeoutRef.current =
                    null;

            }


            setTimerRunning(
                false
            );

            setCameraRunning(
                false
            );

            setRemainingSeconds(
                exerciseTime
            );

            setTrackingMessage(
                'พร้อมเริ่ม'
            );

        };


    // =================================================
    // FLIP CAMERA
    // =================================================

    const handleFlipCamera =
        () => {

            setCameraType(
                current =>
                    current === 'front'
                        ? 'back'
                        : 'front'
            );

        };


    // =================================================
    // SKIP
    // =================================================

    const handleSkip =
        () => {

            if (
                timerRef.current
            ) {

                clearInterval(
                    timerRef.current
                );

                timerRef.current =
                    null;

            }


            if (
                startTimeoutRef.current
            ) {

                clearTimeout(
                    startTimeoutRef.current
                );

                startTimeoutRef.current =
                    null;

            }


            setTimerRunning(
                false
            );

            setCameraRunning(
                false
            );


            router.back();

        };


    // =================================================
    // BACK
    // =================================================

    const handleBack =
        () => {

            if (
                timerRef.current
            ) {

                clearInterval(
                    timerRef.current
                );

                timerRef.current =
                    null;

            }


            if (
                startTimeoutRef.current
            ) {

                clearTimeout(
                    startTimeoutRef.current
                );

                startTimeoutRef.current =
                    null;

            }


            setTimerRunning(
                false
            );

            setCameraRunning(
                false
            );


            router.replace(
                '/exercise' as any
            );

        };


    // =================================================
    // LOADING EXERCISE
    // =================================================

    if (
        loadingExercise
    ) {

        return (

            <View
                style={
                    styles.permissionContainer
                }
            >

                <ActivityIndicator
                    size="large"
                    color="#ffffff"
                />


                <Text
                    style={
                        styles.permissionText
                    }
                >
                    กำลังเตรียมท่ายืด...
                </Text>

            </View>

        );

    }


    // =================================================
    // CAMERA PERMISSION LOADING
    // =================================================

    if (!permission) {

        return (

            <View
                style={
                    styles.permissionContainer
                }
            >

                <ActivityIndicator
                    size="large"
                    color="#ffffff"
                />


                <Text
                    style={
                        styles.permissionText
                    }
                >
                    กำลังตรวจสอบสิทธิ์กล้อง...
                </Text>

            </View>

        );

    }


    // =================================================
    // CAMERA PERMISSION DENIED
    // =================================================

    if (
        !permission.granted
    ) {

        return (

            <View
                style={
                    styles.permissionContainer
                }
            >

                <View
                    style={
                        styles.permissionIcon
                    }
                >

                    <FontAwesome6
                        name="camera"
                        size={36}
                        color="#ffffff"
                    />

                </View>


                <Text
                    style={
                        styles.permissionTitle
                    }
                >
                    ต้องการใช้กล้อง
                </Text>


                <Text
                    style={
                        styles.permissionDescription
                    }
                >
                    Stretchman ต้องใช้กล้อง
                    เพื่อช่วยตรวจสอบท่าทาง
                    ขณะยืดกล้ามเนื้อ
                </Text>


                <TouchableOpacity
                    style={
                        styles.permissionButton
                    }
                    onPress={
                        requestPermission
                    }
                >

                    <Text
                        style={
                            styles.permissionButtonText
                        }
                    >
                        อนุญาตให้ใช้กล้อง
                    </Text>

                </TouchableOpacity>


                <TouchableOpacity
                    style={
                        styles.permissionBackButton
                    }
                    onPress={
                        handleBack
                    }
                >

                    <Text
                        style={
                            styles.permissionBackText
                        }
                    >
                        กลับ
                    </Text>

                </TouchableOpacity>

            </View>

        );

    }


    // =================================================
    // MAIN
    // =================================================

    return (

        <View
            style={
                styles.container
            }
        >


            {/* =================================================
                CAMERA
            ================================================= */}

            <View
                style={
                    styles.cameraArea
                }
            >

                {cameraRunning ? (

                    <CameraView
                        style={
                            StyleSheet.absoluteFill
                        }
                        facing={
                            cameraType
                        }
                    />

                ) : (

                    <View
                        style={
                            styles.cameraPlaceholder
                        }
                    >

                        <FontAwesome6
                            name="camera"
                            size={45}
                            color="rgba(255,255,255,0.7)"
                        />


                        <Text
                            style={
                                styles.cameraPlaceholderText
                            }
                        >
                            กดเปิดกล้องเพื่อเริ่ม
                        </Text>

                    </View>

                )}


                {/* =================================================
                    TOP BAR
                ================================================= */}

                <View
                    style={
                        styles.topBar
                    }
                >

                    <TouchableOpacity
                        style={
                            styles.backButton
                        }
                        onPress={
                            handleBack
                        }
                    >

                        <FontAwesome6
                            name="arrow-left"
                            size={18}
                            color="#2148C0"
                        />

                    </TouchableOpacity>


                    <View
                        style={
                            styles.titleArea
                        }
                    >

                        <Text
                            style={
                                styles.exerciseTitle
                            }
                            numberOfLines={
                                1
                            }
                        >
                            {exerciseName}
                        </Text>


                        <Text
                            style={
                                styles.exerciseSubtitle
                            }
                        >
                            Motion Tracking
                        </Text>

                    </View>


                    <View
                        style={[
                            styles.aiStatus,

                            cameraRunning &&
                            styles.aiStatusReady,
                        ]}
                    >

                        <View
                            style={[
                                styles.statusDot,

                                cameraRunning &&
                                styles.statusDotReady,
                            ]}
                        />


                        <Text
                            style={
                                styles.aiText
                            }
                        >
                            AI
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    EXERCISE INFO
                ================================================= */}

                <View
                    style={
                        styles.exerciseInfoCard
                    }
                >

                    <View
                        style={
                            styles.exerciseInfoIcon
                        }
                    >

                        <FontAwesome6
                            name="person-running"
                            size={17}
                            color="#237FFF"
                        />

                    </View>


                    <View
                        style={
                            styles.exerciseInfoContent
                        }
                    >

                        <Text
                            style={
                                styles.exerciseInfoTitle
                            }
                        >
                            ท่าที่กำลังทำ
                        </Text>


                        <Text
                            style={
                                styles.exerciseInfoName
                            }
                            numberOfLines={
                                1
                            }
                        >
                            {exerciseName}
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    SKELETON
                ================================================= */}

                <View
                    style={
                        styles.trackingArea
                    }
                >

                    {cameraRunning && (

                        <View
                            style={
                                styles.skeletonCircle
                            }
                        >

                            <FontAwesome6
                                name="person"
                                size={110}
                                color="rgba(255,255,255,0.18)"
                            />


                            <View
                                style={[
                                    styles.joint,
                                    styles.jointHead,
                                ]}
                            />


                            <View
                                style={[
                                    styles.joint,
                                    styles.jointLeftShoulder,
                                ]}
                            />


                            <View
                                style={[
                                    styles.joint,
                                    styles.jointRightShoulder,
                                ]}
                            />


                            <View
                                style={[
                                    styles.joint,
                                    styles.jointLeftHip,
                                ]}
                            />


                            <View
                                style={[
                                    styles.joint,
                                    styles.jointRightHip,
                                ]}
                            />

                        </View>

                    )}

                </View>


                {/* =================================================
                    TRACKING MESSAGE
                ================================================= */}

                <View
                    style={
                        styles.trackingMessage
                    }
                >

                    <FontAwesome6
                        name={
                            cameraRunning
                                ? 'person'
                                : 'circle-info'
                        }
                        size={15}
                        color="#ffffff"
                    />


                    <Text
                        style={
                            styles.trackingMessageText
                        }
                    >
                        {trackingMessage}
                    </Text>

                </View>


                {/* =================================================
                    TIMER
                ================================================= */}

                <View
                    style={
                        styles.timerBox
                    }
                >

                    <Text
                        style={
                            styles.timerNumber
                        }
                    >
                        {remainingSeconds}
                    </Text>


                    <Text
                        style={
                            styles.timerUnit
                        }
                    >
                        วินาที
                    </Text>

                </View>

            </View>


            {/* =================================================
                CONTROLS
            ================================================= */}

            <View
                style={
                    styles.controls
                }
            >

                {/* RESET */}

                <TouchableOpacity
                    style={
                        styles.controlButton
                    }
                    onPress={
                        handleReset
                    }
                >

                    <FontAwesome6
                        name="rotate-left"
                        size={19}
                        color="#ffffff"
                    />

                </TouchableOpacity>


                {/* START / STOP */}

                <TouchableOpacity
                    style={
                        styles.startButton
                    }
                    onPress={
                        handleToggleCamera
                    }
                >

                    <FontAwesome6
                        name={
                            cameraRunning
                                ? 'pause'
                                : 'camera'
                        }
                        size={18}
                        color="#ffffff"
                    />


                    <Text
                        style={
                            styles.startButtonText
                        }
                    >
                        {cameraRunning
                            ? 'หยุด'
                            : 'เปิดกล้อง'}
                    </Text>

                </TouchableOpacity>


                {/* FLIP */}

                <TouchableOpacity
                    style={
                        styles.controlButton
                    }
                    onPress={
                        handleFlipCamera
                    }
                >

                    <FontAwesome6
                        name="camera-rotate"
                        size={19}
                        color="#ffffff"
                    />

                </TouchableOpacity>

            </View>


            {/* =================================================
                SKIP
            ================================================= */}

            <TouchableOpacity
                style={
                    styles.skipButton
                }
                onPress={
                    handleSkip
                }
            >

                <Text
                    style={
                        styles.skipText
                    }
                >
                    ข้ามท่านี้
                </Text>


                <FontAwesome6
                    name="forward"
                    size={14}
                    color="#ffffff"
                />

            </TouchableOpacity>


            {/* =================================================
                BOTTOM NAV
            ================================================= */}

            <BottomNav
                activeTab="home"
            />

        </View>

    );

}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

    // =================================================
    // MAIN
    // =================================================

    container: {
        flex: 1,

        backgroundColor: '#1638AE',

        paddingHorizontal: 20,

        paddingTop: 10,

        paddingBottom: 15,
    },


    // =================================================
    // PERMISSION
    // =================================================

    permissionContainer: {
        flex: 1,

        backgroundColor: '#1638AE',

        justifyContent: 'center',

        alignItems: 'center',

        paddingHorizontal: 30,
    },

    permissionIcon: {
        width: 80,
        height: 80,

        borderRadius: 40,

        backgroundColor:
            'rgba(255,255,255,0.12)',

        justifyContent: 'center',

        alignItems: 'center',

        marginBottom: 20,
    },

    permissionTitle: {
        color: '#ffffff',

        fontSize: 24,

        fontWeight: 'bold',

        marginBottom: 10,
    },

    permissionDescription: {
        color:
            'rgba(255,255,255,0.75)',

        fontSize: 14,

        textAlign: 'center',

        lineHeight: 22,

        marginBottom: 25,
    },

    permissionText: {
        color: '#ffffff',

        marginTop: 15,

        fontSize: 15,
    },

    permissionButton: {
        width: '100%',

        height: 52,

        borderRadius: 26,

        backgroundColor: '#237FFF',

        justifyContent: 'center',

        alignItems: 'center',
    },

    permissionButtonText: {
        color: '#ffffff',

        fontSize: 16,

        fontWeight: 'bold',
    },

    permissionBackButton: {
        marginTop: 15,

        padding: 10,
    },

    permissionBackText: {
        color:
            'rgba(255,255,255,0.7)',

        fontSize: 14,
    },


    // =================================================
    // CAMERA
    // =================================================

    cameraArea: {
        flex: 1,

        borderRadius: 25,

        overflow: 'hidden',

        backgroundColor: '#0B237A',

        position: 'relative',

        marginBottom: 12,
    },

    cameraPlaceholder: {
        position: 'absolute',

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        justifyContent: 'center',

        alignItems: 'center',

        backgroundColor: '#0B237A',
    },

    cameraPlaceholderText: {
        color: '#ffffff',

        fontSize: 18,

        fontWeight: 'bold',

        marginTop: 15,
    },


    // =================================================
    // TOP BAR
    // =================================================

    topBar: {
        position: 'absolute',

        top: 15,

        left: 15,

        right: 15,

        flexDirection: 'row',

        alignItems: 'center',

        zIndex: 10,

        elevation: 10,
    },

    backButton: {
        width: 44,
        height: 44,

        borderRadius: 22,

        backgroundColor: '#ffffff',

        justifyContent: 'center',

        alignItems: 'center',
    },

    titleArea: {
        flex: 1,

        marginLeft: 12,

        marginRight: 10,
    },

    exerciseTitle: {
        color: '#ffffff',

        fontSize: 17,

        fontWeight: 'bold',
    },

    exerciseSubtitle: {
        color:
            'rgba(255,255,255,0.7)',

        fontSize: 12,

        marginTop: 2,
    },


    // =================================================
    // AI
    // =================================================

    aiStatus: {
        height: 32,

        paddingHorizontal: 11,

        borderRadius: 16,

        backgroundColor:
            'rgba(0,0,0,0.35)',

        flexDirection: 'row',

        alignItems: 'center',

        gap: 6,
    },

    aiStatusReady: {
        backgroundColor:
            'rgba(35,127,255,0.8)',
    },

    statusDot: {
        width: 7,

        height: 7,

        borderRadius: 4,

        backgroundColor: '#999999',
    },

    statusDotReady: {
        backgroundColor: '#4ade80',
    },

    aiText: {
        color: '#ffffff',

        fontSize: 11,

        fontWeight: 'bold',
    },


    // =================================================
    // EXERCISE INFO
    // =================================================

    exerciseInfoCard: {
        position: 'absolute',

        top: 72,

        left: 15,

        right: 15,

        zIndex: 8,

        backgroundColor:
            'rgba(255,255,255,0.94)',

        borderRadius: 16,

        padding: 9,

        flexDirection: 'row',

        alignItems: 'center',
    },

    exerciseInfoIcon: {
        width: 36,
        height: 36,

        borderRadius: 12,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 9,
    },

    exerciseInfoContent: {
        flex: 1,
    },

    exerciseInfoTitle: {
        color: '#64748b',

        fontSize: 9,

        fontWeight: '700',
    },

    exerciseInfoName: {
        color: '#1638AE',

        fontSize: 12,

        fontWeight: '800',

        marginTop: 2,
    },


    // =================================================
    // TRACKING
    // =================================================

    trackingArea: {
        flex: 1,

        justifyContent: 'center',

        alignItems: 'center',
    },

    skeletonCircle: {
        width: 220,
        height: 220,

        borderRadius: 110,

        borderWidth: 2,

        borderColor:
            'rgba(255,255,255,0.35)',

        justifyContent: 'center',

        alignItems: 'center',
    },

    joint: {
        position: 'absolute',

        width: 12,
        height: 12,

        borderRadius: 6,

        backgroundColor: '#43a5ff',

        borderWidth: 2,

        borderColor: '#ffffff',
    },

    jointHead: {
        top: 45,

        left: 104,
    },

    jointLeftShoulder: {
        top: 80,

        left: 60,
    },

    jointRightShoulder: {
        top: 80,

        right: 60,
    },

    jointLeftHip: {
        bottom: 55,

        left: 75,
    },

    jointRightHip: {
        bottom: 55,

        right: 75,
    },


    // =================================================
    // TRACKING MESSAGE
    // =================================================

    trackingMessage: {
        position: 'absolute',

        bottom: 75,

        left: 20,

        right: 20,

        minHeight: 42,

        borderRadius: 21,

        backgroundColor:
            'rgba(0,0,0,0.55)',

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 8,

        paddingHorizontal: 15,
    },

    trackingMessageText: {
        color: '#ffffff',

        fontSize: 13,

        fontWeight: '500',

        textAlign: 'center',
    },


    // =================================================
    // TIMER
    // =================================================

    timerBox: {
        position: 'absolute',

        bottom: 15,

        alignSelf: 'center',

        width: 90,

        height: 65,

        borderRadius: 18,

        backgroundColor:
            'rgba(0,0,0,0.55)',

        justifyContent: 'center',

        alignItems: 'center',
    },

    timerNumber: {
        color: '#ffffff',

        fontSize: 27,

        fontWeight: 'bold',

        lineHeight: 30,
    },

    timerUnit: {
        color:
            'rgba(255,255,255,0.7)',

        fontSize: 10,
    },


    // =================================================
    // CONTROLS
    // =================================================

    controls: {
        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 15,

        marginBottom: 10,
    },

    controlButton: {
        width: 52,
        height: 52,

        borderRadius: 26,

        backgroundColor:
            'rgba(255,255,255,0.14)',

        justifyContent: 'center',

        alignItems: 'center',

        borderWidth: 1,

        borderColor:
            'rgba(255,255,255,0.15)',
    },

    startButton: {
        height: 52,

        minWidth: 145,

        borderRadius: 26,

        backgroundColor: '#237FFF',

        flexDirection: 'row',

        justifyContent: 'center',

        alignItems: 'center',

        gap: 9,
    },

    startButtonText: {
        color: '#ffffff',

        fontSize: 15,

        fontWeight: 'bold',
    },


    // =================================================
    // SKIP
    // =================================================

    skipButton: {
        width: '100%',

        height: 48,

        borderRadius: 24,

        backgroundColor:
            'rgba(255,255,255,0.15)',

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 8,

        borderWidth: 1,

        borderColor:
            'rgba(255,255,255,0.2)',

        marginBottom: 5,
    },

    skipText: {
        color: '#ffffff',

        fontSize: 15,

        fontWeight: 'bold',
    },

});