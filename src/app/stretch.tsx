import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    Platform,
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

interface PosePoint {
    x: number;
    y: number;
    z?: number;
    visibility?: number;
}

// =====================================================
// DEFAULT
// =====================================================

const DEFAULT_EXERCISE_NAME =
    'ท่ายืดกล้ามเนื้อ';

const DEFAULT_EXERCISE_TIME = 30;

// =====================================================
// MEDIAPIPE
// =====================================================

const MEDIAPIPE_WASM_URL =
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';

const POSE_MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

// =====================================================
// SKELETON CONNECTIONS
// MediaPipe Pose landmark indices
// =====================================================

const SKELETON_CONNECTIONS: Array<
    [number, number]
> = [
    // ศีรษะ
    [0, 7],
    [0, 8],

    // หัว -> ไหล่
    [7, 11],
    [8, 12],

    // ไหล่
    [11, 12],

    // แขนซ้าย
    [11, 13],
    [13, 15],

    // แขนขวา
    [12, 14],
    [14, 16],

    // ลำตัว
    [11, 23],
    [12, 24],
    [23, 24],

    // ขาซ้าย
    [23, 25],
    [25, 27],

    // ขาขวา
    [24, 26],
    [26, 28],
];

// =====================================================
// MAIN
// =====================================================

export default function StretchMotionTracking() {
    const isWeb = Platform.OS === 'web';

    // =================================================
    // EXERCISE DATA
    // =================================================

    const [exercise, setExercise] =
        useState<SelectedExercise | null>(null);

    const [exerciseName, setExerciseName] =
        useState(DEFAULT_EXERCISE_NAME);

    const [exerciseTime, setExerciseTime] =
        useState(DEFAULT_EXERCISE_TIME);

    const [loadingExercise, setLoadingExercise] =
        useState(true);

    // =================================================
    // CAMERA
    // =================================================

    const [permission, requestPermission] =
        useCameraPermissions();

    const [cameraType, setCameraType] =
        useState<CameraType>('front');

    const [cameraRunning, setCameraRunning] =
        useState(false);

    // =================================================
    // AI TRACKING
    // =================================================

    const [aiReady, setAiReady] =
        useState(false);

    const [poseDetected, setPoseDetected] =
        useState(false);

    const [poseLandmarks, setPoseLandmarks] =
        useState<PosePoint[]>([]);

    const [cameraSize, setCameraSize] =
        useState({
            width: 0,
            height: 0,
        });

    const [trackingMessage, setTrackingMessage] =
        useState(
            isWeb
                ? 'กำลังเตรียม AI...'
                : 'กล้องพร้อมใช้งาน'
        );

    // =================================================
    // TIMER
    // =================================================

    const [remainingSeconds, setRemainingSeconds] =
        useState(DEFAULT_EXERCISE_TIME);

    const [timerRunning, setTimerRunning] =
        useState(false);

    // =================================================
    // REFS
    // =================================================

    const timerRef =
        useRef<ReturnType<typeof setInterval> | null>(
            null
        );

    const poseStartTimeoutRef =
        useRef<ReturnType<typeof setTimeout> | null>(
            null
        );

    const webVideoRef =
        useRef<HTMLVideoElement | null>(null);

    const webStreamRef =
        useRef<MediaStream | null>(null);

    const poseLandmarkerRef =
        useRef<any>(null);

    const detectionFrameRef =
        useRef<number | null>(null);

    const trackerBusyRef =
        useRef(false);

    const timerRunningRef =
        useRef(false);

    const cameraStartingRef =
        useRef(false);

    const poseInitPromiseRef =
        useRef<Promise<void> | null>(null);

    // =====================================================
    // KEEP TIMER REF IN SYNC
    // =====================================================

    useEffect(() => {
        timerRunningRef.current =
            timerRunning;
    }, [timerRunning]);

    // =====================================================
    // LOAD SELECTED EXERCISE
    // =====================================================

    useEffect(() => {
        const loadExercise =
            async () => {
                try {
                    setLoadingExercise(true);

                    const storedExercise =
                        await AsyncStorage.getItem(
                            'stretchmanSelectedExercise'
                        );

                    if (storedExercise) {
                        const parsed: SelectedExercise =
                            JSON.parse(
                                storedExercise
                            );

                        setExercise(parsed);

                        if (
                            parsed.name
                        ) {
                            setExerciseName(
                                parsed.name
                            );
                        }

                        if (
                            parsed.time
                        ) {
                            const parsedTime =
                                parseInt(
                                    parsed.time,
                                    10
                                );

                            if (
                                !Number.isNaN(
                                    parsedTime
                                ) &&
                                parsedTime >
                                    0
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
                        const storedName =
                            await AsyncStorage.getItem(
                                'exerciseName'
                            );

                        const storedTime =
                            await AsyncStorage.getItem(
                                'exerciseTime'
                            );

                        if (
                            storedName
                        ) {
                            setExerciseName(
                                storedName
                            );
                        }

                        if (
                            storedTime
                        ) {
                            const parsedTime =
                                parseInt(
                                    storedTime,
                                    10
                                );

                            if (
                                !Number.isNaN(
                                    parsedTime
                                ) &&
                                parsedTime >
                                    0
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

    // =====================================================
    // INIT MEDIAPIPE
    // =====================================================

    const initPoseTracker =
        async () => {
            if (
                !isWeb ||
                poseLandmarkerRef.current
            ) {
                return;
            }

            if (
                poseInitPromiseRef.current
            ) {
                return poseInitPromiseRef.current;
            }

            poseInitPromiseRef.current =
                (async () => {
                    try {
                        setTrackingMessage(
                            'กำลังโหลด AI Pose Tracking...'
                        );

                        const vision =
                            await import(
                                '@mediapipe/tasks-vision'
                            );

                        const filesetResolver =
                            await vision.FilesetResolver.forVisionTasks(
                                MEDIAPIPE_WASM_URL
                            );

                        const landmarker =
                            await vision.PoseLandmarker.createFromOptions(
                                filesetResolver,
                                {
                                    baseOptions: {
                                        modelAssetPath:
                                            POSE_MODEL_URL,
                                        delegate:
                                            'CPU',
                                    },

                                    runningMode:
                                        'VIDEO',

                                    numPoses: 1,

                                    minPoseDetectionConfidence:
                                        0.5,

                                    minPosePresenceConfidence:
                                        0.5,

                                    minTrackingConfidence:
                                        0.5,
                                }
                            );

                        poseLandmarkerRef.current =
                            landmarker;

                        setAiReady(
                            true
                        );

                        setTrackingMessage(
                            'AI พร้อมแล้ว กำลังตรวจจับท่าทาง...'
                        );
                    } catch (error) {
                        console.warn(
                            'MediaPipe initialization failed:',
                            error
                        );

                        setAiReady(
                            false
                        );

                        setTrackingMessage(
                            'กล้องพร้อมใช้งาน แต่ AI ยังไม่พร้อม'
                        );
                    } finally {
                        poseInitPromiseRef.current =
                            null;
                    }
                })();

            return poseInitPromiseRef.current;
        };

    // =====================================================
    // STOP POSE LOOP
    // =====================================================

    const stopPoseLoop =
        () => {
            if (
                detectionFrameRef.current !==
                null
            ) {
                cancelAnimationFrame(
                    detectionFrameRef.current
                );

                detectionFrameRef.current =
                    null;
            }
        };

    // =====================================================
    // POSE DETECTION
    // =====================================================

    const runPoseDetection =
        () => {
            if (!isWeb) {
                return;
            }

            const video =
                webVideoRef.current;

            const landmarker =
                poseLandmarkerRef.current;

            if (
                !video ||
                !landmarker
            ) {
                detectionFrameRef.current =
                    requestAnimationFrame(
                        runPoseDetection
                    );

                return;
            }

            if (
                video.readyState >=
                    2 &&
                video.videoWidth >
                    0 &&
                video.videoHeight >
                    0 &&
                !trackerBusyRef.current
            ) {
                trackerBusyRef.current =
                    true;

                try {
                    const result =
                        landmarker.detectForVideo(
                            video,
                            performance.now()
                        );

                    const landmarks =
                        result
                            ?.landmarks?.[0] ??
                        [];

                    // ไหล่ + สะโพก
                    const required =
                        [
                            11,
                            12,
                            23,
                            24,
                        ];

                    const valid =
                        required.every(
                            index => {
                                const point =
                                    landmarks[
                                        index
                                    ];

                                return (
                                    point &&
                                    (
                                        point.visibility ===
                                            undefined ||
                                        point.visibility >=
                                            0.45
                                    )
                                );
                            }
                        );

                    setPoseDetected(
                        valid
                    );

                    setPoseLandmarks(
                        landmarks
                    );

                    if (valid) {
                        setTrackingMessage(
                            '✓ ตรวจพบร่างกาย กำลังติดตามท่าทาง'
                        );

                        if (
                            !timerRunningRef.current &&
                            !poseStartTimeoutRef.current
                        ) {
                            poseStartTimeoutRef.current =
                                setTimeout(
                                    () => {
                                        poseStartTimeoutRef.current =
                                            null;

                                        if (
                                            timerRunningRef.current
                                        ) {
                                            return;
                                        }

                                        setTrackingMessage(
                                            '✓ ตรวจพบท่าพร้อมแล้ว กำลังยืด...'
                                        );

                                        setTimerRunning(
                                            true
                                        );
                                    },
                                    700
                                );
                        }
                    } else {
                        setTrackingMessage(
                            'ขยับให้เห็นช่วงศีรษะ ไหล่ และสะโพกชัดเจน'
                        );

                        if (
                            poseStartTimeoutRef.current
                        ) {
                            clearTimeout(
                                poseStartTimeoutRef.current
                            );

                            poseStartTimeoutRef.current =
                                null;
                        }
                    }
                } catch (error) {
                    console.warn(
                        'Pose detection error:',
                        error
                    );
                } finally {
                    trackerBusyRef.current =
                        false;
                }
            }

            detectionFrameRef.current =
                requestAnimationFrame(
                    runPoseDetection
                );
        };

    // =====================================================
    // START POSE LOOP
    // =====================================================

    useEffect(() => {
        if (
            !isWeb ||
            !cameraRunning ||
            !aiReady
        ) {
            return;
        }

        stopPoseLoop();

        detectionFrameRef.current =
            requestAnimationFrame(
                runPoseDetection
            );

        return () => {
            stopPoseLoop();
        };
    }, [
        aiReady,
        cameraRunning,
    ]);

    // =====================================================
    // START CAMERA
    // =====================================================

    const handleStartCamera =
        async () => {
            try {
                if (isWeb) {
                    if (
                        !navigator
                            .mediaDevices
                            ?.getUserMedia
                    ) {
                        Alert.alert(
                            'ไม่รองรับกล้อง',
                            'เบราว์เซอร์นี้ไม่สามารถเปิดกล้องสำหรับ AI Motion Tracking ได้'
                        );

                        return;
                    }

                    if (
                        webStreamRef.current
                    ) {
                        webStreamRef.current
                            .getTracks()
                            .forEach(
                                track =>
                                    track.stop()
                            );
                    }

                    if (
                        cameraStartingRef.current
                    ) {
                        return;
                    }

                    cameraStartingRef.current =
                        true;

                    try {
                        const stream =
                            await navigator.mediaDevices.getUserMedia(
                                {
                                    video: {
                                        facingMode:
                                            cameraType ===
                                            'front'
                                                ? 'user'
                                                : 'environment',

                                        width: {
                                            ideal: 1280,
                                        },

                                        height: {
                                            ideal: 720,
                                        },
                                    },

                                    audio: false,
                                }
                            );

                        webStreamRef.current =
                            stream;

                        const video =
                            webVideoRef.current;

                        if (!video) {
                            stream
                                .getTracks()
                                .forEach(
                                    track =>
                                        track.stop()
                                );

                            return;
                        }

                        video.srcObject =
                            stream;

                        video.muted =
                            true;

                        video.playsInline =
                            true;

                        await new Promise<void>(
                            resolve => {
                                if (
                                    video.readyState >=
                                    2
                                ) {
                                    resolve();

                                    return;
                                }

                                video.onloadedmetadata =
                                    () =>
                                        resolve();
                            }
                        );

                        await video.play();

                        setCameraRunning(
                            true
                        );

                        setPoseDetected(
                            false
                        );

                        setPoseLandmarks(
                            []
                        );

                        setTimerRunning(
                            false
                        );

                        setRemainingSeconds(
                            exerciseTime
                        );

                        setTrackingMessage(
                            'กล้องเปิดแล้ว กำลังเตรียม AI...'
                        );

                        await initPoseTracker();
                    } finally {
                        cameraStartingRef.current =
                            false;
                    }

                    stopPoseLoop();

                    if (
                        poseLandmarkerRef.current
                    ) {
                        detectionFrameRef.current =
                            requestAnimationFrame(
                                runPoseDetection
                            );
                    }

                    return;
                }

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
                    'กล้องพร้อมใช้งาน'
                );
            } catch (
                error: any
            ) {
                console.warn(
                    'Failed to start camera:',
                    error
                );

                const name =
                    error?.name ?? '';

                let message =
                    'ตรวจสอบสิทธิ์กล้อง แล้วลองใหม่อีกครั้ง';

                if (
                    name ===
                        'NotAllowedError' ||
                    name ===
                        'PermissionDeniedError'
                ) {
                    message =
                        'เบราว์เซอร์ยังไม่อนุญาตให้ใช้กล้อง ให้กดไอคอนกล้อง/การตั้งค่าไซต์ข้าง URL แล้วอนุญาต Camera จากนั้นลองใหม่';
                } else if (
                    name ===
                    'NotFoundError'
                ) {
                    message =
                        'ไม่พบกล้องในเครื่องนี้';
                } else if (
                    name ===
                    'NotReadableError'
                ) {
                    message =
                        'กล้องกำลังถูกใช้งานโดยโปรแกรมอื่น กรุณาปิดโปรแกรมนั้นก่อน';
                } else if (
                    name ===
                    'SecurityError'
                ) {
                    message =
                        'เบราว์เซอร์บล็อกการเข้าถึงกล้อง ตรวจสอบสิทธิ์ของ localhost';
                }

                setTrackingMessage(
                    `เปิดกล้องไม่สำเร็จ: ${
                        name ||
                        'UnknownError'
                    }`
                );

                Alert.alert(
                    'เปิดกล้องไม่สำเร็จ',
                    message
                );
            }
        };

    // =====================================================
    // STOP CAMERA
    // =====================================================

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
                poseStartTimeoutRef.current
            ) {
                clearTimeout(
                    poseStartTimeoutRef.current
                );

                poseStartTimeoutRef.current =
                    null;
            }

            stopPoseLoop();

            if (
                webStreamRef.current
            ) {
                webStreamRef.current
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );

                webStreamRef.current =
                    null;
            }

            if (
                webVideoRef.current
            ) {
                webVideoRef.current.pause();

                webVideoRef.current.srcObject =
                    null;
            }

            setCameraRunning(
                false
            );

            setTimerRunning(
                false
            );

            setPoseDetected(
                false
            );

            setPoseLandmarks(
                []
            );

            setTrackingMessage(
                'กดเปิดกล้องเพื่อเริ่ม'
            );
        };

    // =====================================================
    // TIMER
    // =====================================================

    useEffect(() => {
        if (!timerRunning) {
            return;
        }

        timerRef.current =
            setInterval(() => {
                setRemainingSeconds(
                    prev => {
                        if (
                            prev <=
                            1
                        ) {
                            if (
                                timerRef.current
                            ) {
                                clearInterval(
                                    timerRef.current
                                );

                                timerRef.current =
                                    null;
                            }

                            timerRunningRef.current =
                                false;

                            setTimerRunning(
                                false
                            );

                            handleStopCamera();

                            setTrackingMessage(
                                'ยืดครบเวลาแล้ว ✓'
                            );

                            router.replace(
                                '/complete' as any
                            );

                            return 0;
                        }

                        return (
                            prev - 1
                        );
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

    // =====================================================
    // RESET
    // =====================================================

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
                poseStartTimeoutRef.current
            ) {
                clearTimeout(
                    poseStartTimeoutRef.current
                );

                poseStartTimeoutRef.current =
                    null;
            }

            timerRunningRef.current =
                false;

            setTimerRunning(
                false
            );

            setRemainingSeconds(
                exerciseTime
            );

            setPoseDetected(
                false
            );

            setPoseLandmarks(
                []
            );

            if (
                cameraRunning &&
                isWeb
            ) {
                setTrackingMessage(
                    'กำลังค้นหาตำแหน่งร่างกาย...'
                );
            } else {
                setTrackingMessage(
                    'พร้อมเริ่ม'
                );
            }
        };

    // =====================================================
    // TOGGLE CAMERA
    // =====================================================

    const handleToggleCamera =
        () => {
            if (
                cameraRunning
            ) {
                handleStopCamera();
            } else {
                handleStartCamera();
            }
        };

    // =====================================================
    // FLIP CAMERA
    // =====================================================

    const handleFlipCamera =
        async () => {
            const nextType =
                cameraType ===
                'front'
                    ? 'back'
                    : 'front';

            setCameraType(
                nextType
            );

            if (
                isWeb &&
                cameraRunning
            ) {
                handleStopCamera();

                setTimeout(
                    () => {
                        handleStartCamera();
                    },
                    150
                );
            }
        };

    // =====================================================
    // BACK
    // =====================================================

    const cleanupAndBack =
        () => {
            handleStopCamera();
            router.back();
        };

    const handleBack =
        () => {
            handleStopCamera();
            router.replace(
                '/record' as any
            );
        };

    // =====================================================
    // AUTO START NATIVE CAMERA
    // =====================================================

    useEffect(() => {
        if (
            !isWeb &&
            !loadingExercise &&
            !cameraRunning &&
            permission?.granted
        ) {
            handleStartCamera();
        }
    }, [
        loadingExercise,
        permission?.granted,
    ]);

    // =====================================================
    // GLOBAL CLEANUP
    // =====================================================

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
                poseStartTimeoutRef.current
            ) {
                clearTimeout(
                    poseStartTimeoutRef.current
                );

                poseStartTimeoutRef.current =
                    null;
            }

            stopPoseLoop();

            if (
                webStreamRef.current
            ) {
                webStreamRef.current
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );

                webStreamRef.current =
                    null;
            }

            if (
                webVideoRef.current
            ) {
                webVideoRef.current.pause();

                webVideoRef.current.srcObject =
                    null;
            }

            poseLandmarkerRef.current?.close?.();

            poseLandmarkerRef.current =
                null;
        };
    }, []);

    // =====================================================
    // DISPLAY COORDINATES
    // สำคัญ:
    // ต้องอยู่ "ข้างใน Component"
    // เพราะใช้ webVideoRef + cameraSize
    // =====================================================

    const getDisplayCoords =
        (
            x: number,
            y: number
        ) => {
            const video =
                webVideoRef.current;

            // ---------------------------------------------
            // FALLBACK
            // ---------------------------------------------

            if (
                cameraSize.width <=
                    0 ||
                cameraSize.height <=
                    0
            ) {
                return {
                    x:
                        (1 - x) *
                        cameraSize.width,

                    y:
                        y *
                        cameraSize.height,
                };
            }

            if (
                !video ||
                !video.videoWidth ||
                !video.videoHeight
            ) {
                return {
                    x:
                        (1 - x) *
                        cameraSize.width,

                    y:
                        y *
                        cameraSize.height,
                };
            }

            // ---------------------------------------------
            // CONTAINER
            // ---------------------------------------------

            const containerW =
                cameraSize.width;

            const containerH =
                cameraSize.height;

            // ---------------------------------------------
            // ORIGINAL VIDEO
            // ---------------------------------------------

            const videoW =
                video.videoWidth;

            const videoH =
                video.videoHeight;

            const containerRatio =
                containerW /
                containerH;

            const videoRatio =
                videoW /
                videoH;

            let renderW =
                containerW;

            let renderH =
                containerH;

            let offsetX = 0;

            let offsetY = 0;

            // ---------------------------------------------
            // objectFit: cover
            // ---------------------------------------------

            if (
                containerRatio >
                videoRatio
            ) {
                // container กว้างกว่า video

                renderW =
                    containerW;

                renderH =
                    containerW /
                    videoRatio;

                offsetY =
                    (containerH -
                        renderH) /
                    2;
            } else {
                // container สูงกว่า video

                renderH =
                    containerH;

                renderW =
                    containerH *
                    videoRatio;

                offsetX =
                    (containerW -
                        renderW) /
                    2;
            }

            // ---------------------------------------------
            // Mirror x
            // ---------------------------------------------

            const displayX =
                (1 - x) *
                    renderW +
                offsetX;

            const displayY =
                y *
                    renderH +
                offsetY;

            return {
                x: displayX,
                y: displayY,
            };
        };

    // =====================================================
    // LOADING
    // =====================================================

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

    // =====================================================
    // NATIVE PERMISSION
    // =====================================================

    if (
        !isWeb &&
        !permission
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
                    กำลังตรวจสอบสิทธิ์กล้อง...
                </Text>
            </View>
        );
    }

    if (
        !isWeb &&
        !permission?.granted
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
                    Stretchman
                    ต้องใช้กล้องเพื่อช่วยตรวจสอบท่าทางขณะยืดกล้ามเนื้อ
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

    // =====================================================
    // WEB VIDEO
    // =====================================================

    const webVideo =
        isWeb
            ? React.createElement(
                  'video',
                  {
                      ref: (
                          node: HTMLVideoElement | null
                      ) => {
                          webVideoRef.current =
                              node;
                      },

                      autoPlay: true,

                      muted: true,

                      playsInline: true,

                      style: {
                          position:
                              'absolute',

                          top: 0,
                          left: 0,

                          width:
                              '100%',

                          height:
                              '100%',

                          objectFit:
                              'cover',

                          transform:
                              'scaleX(-1)',

                          backgroundColor:
                              '#0B237A',

                          opacity: 1,
                      } as any,
                  }
              )
            : null;

    // =====================================================
    // VISIBLE LANDMARKS
    // =====================================================

    const visibleLandmarks = [
        0,
        7,
        8,
        11,
        12,
        13,
        14,
        15,
        16,
        23,
        24,
        25,
        26,
        27,
        28,
    ];

    // =====================================================
    // MAIN
    // =====================================================

    return (
        <View
            style={
                styles.container
            }
        >
            {/* CAMERA AREA */}
            <View
                style={
                    styles.cameraArea
                }
                onLayout={event => {
                    const {
                        width,
                        height,
                    } =
                        event.nativeEvent.layout;

                    setCameraSize({
                        width,
                        height,
                    });
                }}
            >
                {isWeb ? (
                    <>
                        {webVideo}

                        {/* PLACEHOLDER */}
                        {!cameraRunning && (
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

                        {/* AI OVERLAY */}
                        {cameraRunning && (
                            <View
                                pointerEvents="none"
                                style={
                                    StyleSheet.absoluteFill
                                }
                            >
                                {/* =================================================
                                    AI SKELETON
                                ================================================= */}

                                {cameraSize.width >
                                    0 &&
                                    cameraSize.height >
                                        0 &&
                                    poseLandmarks.length >
                                        0 &&
                                    SKELETON_CONNECTIONS.map(
                                        ([
                                            startIndex,
                                            endIndex,
                                        ]) => {
                                            const start =
                                                poseLandmarks[
                                                    startIndex
                                                ];

                                            const end =
                                                poseLandmarks[
                                                    endIndex
                                                ];

                                            if (
                                                !start ||
                                                !end
                                            ) {
                                                return null;
                                            }

                                            const startVisibility =
                                                start.visibility ??
                                                1;

                                            const endVisibility =
                                                end.visibility ??
                                                1;

                                            if (
                                                startVisibility <
                                                    0.35 ||
                                                endVisibility <
                                                    0.35
                                            ) {
                                                return null;
                                            }

                                            // -----------------------------------------
                                            // DISPLAY COORDINATES
                                            // -----------------------------------------

                                            const p1 =
                                                getDisplayCoords(
                                                    start.x,
                                                    start.y
                                                );

                                            const p2 =
                                                getDisplayCoords(
                                                    end.x,
                                                    end.y
                                                );

                                            const x1 =
                                                p1.x;

                                            const y1 =
                                                p1.y;

                                            const x2 =
                                                p2.x;

                                            const y2 =
                                                p2.y;

                                            // -----------------------------------------
                                            // IMPORTANT
                                            // ต้องประกาศ dx / dy ก่อน
                                            // -----------------------------------------

                                            const dx =
                                                x2 -
                                                x1;

                                            const dy =
                                                y2 -
                                                y1;

                                            const length =
                                                Math.sqrt(
                                                    dx *
                                                        dx +
                                                    dy *
                                                        dy
                                                );

                                            if (
                                                length <
                                                2
                                            ) {
                                                return null;
                                            }

                                            const angle =
                                                (Math.atan2(
                                                    dy,
                                                    dx
                                                ) *
                                                    180) /
                                                Math.PI;

                                            const midX =
                                                (x1 +
                                                    x2) /
                                                2;

                                            const midY =
                                                (y1 +
                                                    y2) /
                                                2;

                                            return (
                                                <View
                                                    key={`bone-${startIndex}-${endIndex}`}
                                                    style={[
                                                        styles.aiBone,

                                                        {
                                                            left:
                                                                midX -
                                                                length /
                                                                    2,

                                                            top:
                                                                midY -
                                                                2.5,

                                                            width:
                                                                length,

                                                            opacity:
                                                                poseDetected
                                                                    ? 0.95
                                                                    : 0.5,

                                                            transform:
                                                                [
                                                                    {
                                                                        rotate:
                                                                            `${angle}deg`,
                                                                    },
                                                                ],
                                                        },
                                                    ]}
                                                />
                                            );
                                        }
                                    )}

                                {/* =================================================
                                    AI JOINTS
                                ================================================= */}

                                {poseLandmarks.length >
                                    0 &&
                                    visibleLandmarks.map(
                                        index => {
                                            const point =
                                                poseLandmarks[
                                                    index
                                                ];

                                            if (
                                                !point
                                            ) {
                                                return null;
                                            }

                                            const visibility =
                                                point.visibility ??
                                                1;

                                            if (
                                                visibility <
                                                0.35
                                            ) {
                                                return null;
                                            }

                                            // -----------------------------------------
                                            // ใช้ระบบพิกัดเดียวกับ Skeleton
                                            // -----------------------------------------

                                            const p =
                                                getDisplayCoords(
                                                    point.x,
                                                    point.y
                                                );

                                            return (
                                                <View
                                                    key={`joint-${index}`}
                                                    style={[
                                                        styles.aiJoint,

                                                        {
                                                            left:
                                                                p.x,

                                                            top:
                                                                p.y,

                                                            opacity:
                                                                poseDetected
                                                                    ? 1
                                                                    : 0.45,
                                                        },
                                                    ]}
                                                />
                                            );
                                        }
                                    )}
                            </View>
                        )}
                    </>
                ) : cameraRunning ? (
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

                            aiReady &&
                                styles.aiStatusReady,
                        ]}
                    >
                        <View
                            style={[
                                styles.statusDot,

                                aiReady &&
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
                    TRACKING STATUS
                ================================================= */}

                <View
                    pointerEvents="none"
                    style={
                        styles.trackingBadge
                    }
                >
                    <FontAwesome6
                        name={
                            poseDetected
                                ? 'person-circle-check'
                                : 'person'
                        }
                        size={15}
                        color="#ffffff"
                    />

                    <Text
                        style={
                            styles.trackingBadgeText
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
                    cleanupAndBack
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

const styles =
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor:
                '#1638AE',
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 15,
        },

        permissionContainer: {
            flex: 1,
            backgroundColor:
                '#1638AE',
            justifyContent:
                'center',
            alignItems:
                'center',
            paddingHorizontal: 30,
        },

        permissionIcon: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor:
                'rgba(255,255,255,0.12)',
            justifyContent:
                'center',
            alignItems:
                'center',
            marginBottom: 20,
        },

        permissionTitle: {
            color:
                '#ffffff',
            fontSize: 24,
            fontWeight:
                'bold',
            marginBottom: 10,
        },

        permissionDescription: {
            color:
                'rgba(255,255,255,0.75)',
            fontSize: 14,
            textAlign:
                'center',
            lineHeight: 22,
            marginBottom: 25,
        },

        permissionText: {
            color:
                '#ffffff',
            marginTop: 15,
            fontSize: 15,
        },

        permissionButton: {
            width: '100%',
            height: 52,
            borderRadius: 26,
            backgroundColor:
                '#237FFF',
            justifyContent:
                'center',
            alignItems:
                'center',
        },

        permissionButtonText: {
            color:
                '#ffffff',
            fontSize: 16,
            fontWeight:
                'bold',
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

        cameraArea: {
            flex: 1,
            borderRadius: 25,
            overflow:
                'hidden',
            backgroundColor:
                '#0B237A',
            position:
                'relative',
            marginBottom: 12,
        },

        cameraPlaceholder: {
            position:
                'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent:
                'center',
            alignItems:
                'center',
            backgroundColor:
                '#0B237A',
        },

        cameraPlaceholderText: {
            color:
                '#ffffff',
            fontSize: 18,
            fontWeight:
                'bold',
            marginTop: 15,
            textAlign:
                'center',
            paddingHorizontal: 20,
        },

        topBar: {
            position:
                'absolute',
            top: 15,
            left: 15,
            right: 15,
            flexDirection:
                'row',
            alignItems:
                'center',
            zIndex: 10,
            elevation: 10,
        },

        backButton: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor:
                '#ffffff',
            justifyContent:
                'center',
            alignItems:
                'center',
        },

        titleArea: {
            flex: 1,
            marginLeft: 12,
            marginRight: 10,
        },

        exerciseTitle: {
            color:
                '#ffffff',
            fontSize: 17,
            fontWeight:
                'bold',
        },

        exerciseSubtitle: {
            color:
                'rgba(255,255,255,0.7)',
            fontSize: 12,
            marginTop: 2,
        },

        aiStatus: {
            height: 32,
            paddingHorizontal: 11,
            borderRadius: 16,
            backgroundColor:
                'rgba(0,0,0,0.35)',
            flexDirection:
                'row',
            alignItems:
                'center',
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
            backgroundColor:
                '#999999',
        },

        statusDotReady: {
            backgroundColor:
                '#4ade80',
        },

        aiText: {
            color:
                '#ffffff',
            fontSize: 11,
            fontWeight:
                'bold',
        },

        exerciseInfoCard: {
            position:
                'absolute',
            top: 72,
            left: 15,
            right: 15,
            zIndex: 8,
            backgroundColor:
                'rgba(255,255,255,0.94)',
            borderRadius: 16,
            padding: 9,
            flexDirection:
                'row',
            alignItems:
                'center',
        },

        exerciseInfoIcon: {
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor:
                '#EEF5FF',
            alignItems:
                'center',
            justifyContent:
                'center',
            marginRight: 9,
        },

        exerciseInfoContent: {
            flex: 1,
        },

        exerciseInfoTitle: {
            color:
                '#64748b',
            fontSize: 9,
            fontWeight:
                '700',
        },

        exerciseInfoName: {
            color:
                '#1638AE',
            fontSize: 12,
            fontWeight:
                '800',
            marginTop: 2,
        },

        // ===================================================
        // SKELETON
        // ===================================================

        aiBone: {
            position:
                'absolute',
            height: 5,
            borderRadius: 3,
            backgroundColor:
                '#43a5ff',
            borderWidth: 1,
            borderColor:
                'rgba(255,255,255,0.9)',
            zIndex: 1,
        },

        aiJoint: {
            position:
                'absolute',
            width: 14,
            height: 14,
            marginLeft: -7,
            marginTop: -7,
            borderRadius: 7,
            backgroundColor:
                '#43a5ff',
            borderWidth: 2,
            borderColor:
                '#ffffff',
            zIndex: 2,
        },

        trackingBadge: {
            position:
                'absolute',
            bottom: 88,
            left: 20,
            right: 20,
            minHeight: 42,
            borderRadius: 21,
            backgroundColor:
                'rgba(0,0,0,0.55)',
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'center',
            gap: 8,
            paddingHorizontal: 15,
        },

        trackingBadgeText: {
            color:
                '#ffffff',
            fontSize: 13,
            fontWeight:
                '500',
            textAlign:
                'center',
        },

        timerBox: {
            position:
                'absolute',
            bottom: 15,
            alignSelf:
                'center',
            width: 90,
            height: 65,
            borderRadius: 18,
            backgroundColor:
                'rgba(0,0,0,0.55)',
            justifyContent:
                'center',
            alignItems:
                'center',
        },

        timerNumber: {
            color:
                '#ffffff',
            fontSize: 27,
            fontWeight:
                'bold',
            lineHeight: 30,
        },

        timerUnit: {
            color:
                'rgba(255,255,255,0.7)',
            fontSize: 10,
        },

        controls: {
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'center',
            gap: 15,
            marginBottom: 10,
        },

        controlButton: {
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor:
                'rgba(255,255,255,0.14)',
            justifyContent:
                'center',
            alignItems:
                'center',
            borderWidth: 1,
            borderColor:
                'rgba(255,255,255,0.15)',
        },

        startButton: {
            height: 52,
            minWidth: 145,
            borderRadius: 26,
            backgroundColor:
                '#237FFF',
            flexDirection:
                'row',
            justifyContent:
                'center',
            alignItems:
                'center',
            gap: 9,
        },

        startButtonText: {
            color:
                '#ffffff',
            fontSize: 15,
            fontWeight:
                'bold',
        },

        skipButton: {
            width: '100%',
            height: 48,
            borderRadius: 24,
            backgroundColor:
                'rgba(255,255,255,0.15)',
            flexDirection:
                'row',
            alignItems:
                'center',
            justifyContent:
                'center',
            gap: 8,
            borderWidth: 1,
            borderColor:
                'rgba(255,255,255,0.2)',
            marginBottom: 5,
        },

        skipText: {
            color:
                '#ffffff',
            fontSize: 15,
            fontWeight:
                'bold',
        },
    });