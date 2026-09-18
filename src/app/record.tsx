import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import {
    router,
    useFocusEffect,
} from 'expo-router';

import BottomNav from './components/BottomNav';


// =====================================================
// TYPES
// =====================================================

interface PainAreaRecord {
    area: string;
    painLevel: number;
    symptom: string;
}

interface SafetyData {
    hasRedFlag: boolean;
    answers: Record<string, boolean>;
}

interface AssessmentData {
    painAreas: PainAreaRecord[];
    activity: string;
    safety: SafetyData;
    updatedAt: number;
}

interface ExerciseItem {
    id: string;
    name: string;
    description: string;
    time: number;
    area: string;
}


// =====================================================
// AREA LABELS
// =====================================================

const AREA_LABELS: Record<string, string> = {
    neck: 'คอ',
    shoulder: 'ไหล่',
    shoulder_left: 'ไหล่ซ้าย',
    shoulder_right: 'ไหล่ขวา',
    upper_back: 'หลังส่วนบน',
    lower_back: 'หลังส่วนล่าง',
    arm: 'แขน',
    arm_left: 'แขนซ้าย',
    arm_right: 'แขนขวา',
    wrist: 'ข้อมือ',
    wrist_left: 'ข้อมือซ้าย',
    wrist_right: 'ข้อมือขวา',
    waist: 'เอว',
    thigh: 'ต้นขา',
    thigh_left: 'ต้นขาซ้าย',
    thigh_right: 'ต้นขาขวา',
    calf: 'น่อง',
    calf_left: 'น่องซ้าย',
    calf_right: 'น่องขวา',
    other: 'อื่น ๆ',
};


// =====================================================
// BODY MAP POSITIONS
// ปรับตำแหน่งได้ภายหลังตามรูป back.png
// =====================================================

const BODY_POSITIONS: Record<
    string,
    {
        x: number;
        y: number;
        size: number;
    }
> = {

    // จุดกึ่งกลางลำตัว
    neck: { x: 50, y: 17, size: 30 },
    upper_back: { x: 50, y: 25, size: 30 },
    lower_back: { x: 50, y: 35, size: 30 },
    hip: { x: 50, y: 46, size: 30 },
    waist: { x: 50, y: 47, size: 30 },
    

    // ไหล่ซ้าย / ขวา
    shoulder_left: { x: 34, y: 20, size: 30 },
    shoulder_right: { x: 66, y: 20, size: 30 },

    // แขนซ้าย / ขวา
    arm_left: { x: 25, y: 31, size: 30 },
    arm_right: { x: 75, y: 31, size: 30 },

    // ข้อมือซ้าย / ขวา
    wrist_left: { x: 19, y: 50, size: 30 },
    wrist_right: { x: 81, y: 50, size: 30 },


    // ต้นขาซ้าย / ขวา
    thigh_left: { x: 40, y: 65, size: 30 },
    thigh_right: { x: 60, y: 65, size: 30 },

    // น่องซ้าย / ขวา
    calf_left: { x: 40, y: 80, size: 30 },
    calf_right: { x: 60, y: 80, size: 30 },

    // เก็บ key เดิมไว้ชั่วคราวเพื่อรองรับข้อมูลเก่า
    shoulder: { x: 50, y: 20, size: 30 },
    arm: { x: 50, y: 31, size: 30 },
    wrist: { x: 50, y: 50, size: 30 },
    thigh: { x: 50, y: 65, size: 30 },
    calf: { x: 50, y: 80, size: 30 },
};

const BODY_IMAGE = require('../../assets/images/back.png');

// =====================================================
// PAIN COLOR
// ยิ่งปวดมาก = สีเข้มขึ้น
// =====================================================

const PAIN_COLORS = [
    '#166534', // 0 - เขียวเข้ม
    '#238636', // 1
    '#3FA34D', // 2
    '#69B34C', // 3
    '#A4C639', // 4
    '#EAB308', // 5 - เหลือง
    '#F59E0B', // 6
    '#F97316', // 7 - ส้ม
    '#EF4444', // 8
    '#DC2626', // 9
    '#991B1B', // 10 - แดงเข้ม
];


const getPainColor = (
    level: number
) => {

    const safeLevel = Math.max(
        0,
        Math.min(
            10,
            Math.round(level)
        )
    );

    return PAIN_COLORS[safeLevel];
};


// =====================================================
// PAIN LABEL
// =====================================================

const getPainLabel = (
    level: number
) => {

    if (level === 0) {
        return 'ไม่ปวด';
    }

    if (level <= 2) {
        return 'ปวดเล็กน้อย';
    }

    if (level <= 4) {
        return 'ปวดค่อนข้างน้อย';
    }

    if (level <= 6) {
        return 'ปวดปานกลาง';
    }

    if (level <= 8) {
        return 'ปวดมาก';
    }

    return 'ปวดมากมาก';
};


// =====================================================
// EXERCISE AREA KEY
// ใช้ข้อมูลท่าเดิมร่วมกับบริเวณที่แยกซ้าย/ขวา
// =====================================================

const getExerciseAreaKey = (area: string) => {
    if (area.endsWith('_left') || area.endsWith('_right')) {
        return area.replace(/_(left|right)$/, '');
    }

    return area;
};


// =====================================================
// EXERCISE DATABASE
// =====================================================

const EXERCISE_DATABASE: Record<
    string,
    ExerciseItem[]
> = {

    // -------------------------------------------------
    // NECK
    // -------------------------------------------------

    neck: [
        {
            id: 'neck-side',
            name: 'ยืดกล้ามเนื้อคอด้านข้าง',
            description:
                'ค่อย ๆ เอียงศีรษะไปด้านข้างอย่างนุ่มนวล',
            time: 20,
            area: 'neck',
        },

        {
            id: 'neck-front',
            name: 'ยืดคอด้านหน้า',
            description:
                'ค่อย ๆ เงยหน้าเพื่อยืดกล้ามเนื้อบริเวณคอ',
            time: 15,
            area: 'neck',
        },

        {
            id: 'neck-turn',
            name: 'หมุนคอเบา ๆ',
            description:
                'หมุนศีรษะช้า ๆ โดยไม่ฝืน',
            time: 30,
            area: 'neck',
        },
    ],


    // -------------------------------------------------
    // SHOULDER
    // -------------------------------------------------

    shoulder: [
        {
            id: 'shoulder-cross',
            name: 'ยืดไหล่แบบพาดแขน',
            description:
                'ใช้แขนอีกข้างช่วยดึงแขนเข้าหาตัวเบา ๆ',
            time: 20,
            area: 'shoulder',
        },

        {
            id: 'shoulder-side',
            name: 'ยืดไหล่ด้านข้าง',
            description:
                'ยกแขนและค่อย ๆ ยืดออกด้านข้าง',
            time: 20,
            area: 'shoulder',
        },
    ],


    // -------------------------------------------------
    // UPPER BACK
    // -------------------------------------------------

    upper_back: [
        {
            id: 'upper-back',
            name: 'ยืดหลังส่วนบน',
            description:
                'ประสานมือแล้วดันแขนไปด้านหน้าอย่างช้า ๆ',
            time: 20,
            area: 'upper_back',
        },

        {
            id: 'upper-back-hug',
            name: 'ท่ายืดหลังแบบกอดตัวเอง',
            description:
                'กอดตัวเองเพื่อยืดบริเวณหลังส่วนบน',
            time: 20,
            area: 'upper_back',
        },
    ],


    // -------------------------------------------------
    // LOWER BACK
    // -------------------------------------------------

    lower_back: [
        {
            id: 'lower-back-knee',
            name: 'ยืดหลังส่วนล่าง',
            description:
                'ดึงเข่าเข้าหาลำตัวอย่างเบา ๆ',
            time: 20,
            area: 'lower_back',
        },

        {
            id: 'child-pose',
            name: "Child's Pose",
            description:
                'พับตัวไปด้านหน้าอย่างสบาย ๆ',
            time: 30,
            area: 'lower_back',
        },
    ],


    // -------------------------------------------------
    // ARM
    // -------------------------------------------------

    arm: [
        {
            id: 'arm-stretch',
            name: 'ยืดแขน',
            description:
                'เหยียดแขนไปด้านหน้าและดึงเบา ๆ',
            time: 20,
            area: 'arm',
        },
    ],


    // -------------------------------------------------
    // WRIST
    // -------------------------------------------------

    wrist: [
        {
            id: 'wrist-up',
            name: 'ยืดข้อมือ',
            description:
                'เหยียดข้อมือขึ้นและลงอย่างช้า ๆ',
            time: 20,
            area: 'wrist',
        },

        {
            id: 'wrist-flex',
            name: 'ยืดข้อมือด้านใน',
            description:
                'ใช้มืออีกข้างช่วยกดเบา ๆ',
            time: 20,
            area: 'wrist',
        },
    ],


    // -------------------------------------------------
    // HIP
    // -------------------------------------------------

    waist: [
        {
            id: 'waist-stretch',
            name: 'ยืดเอว',
            description:
                'ยืดกล้ามเนื้อบริเวณเอวอย่างนุ่มนวล',
            time: 20,
            area: 'waist',
        },
    ],


    // -------------------------------------------------
    // THIGH
    // -------------------------------------------------

    thigh: [
        {
            id: 'thigh-front',
            name: 'ยืดต้นขาด้านหน้า',
            description:
                'จับข้อเท้าและดึงเข้าหาตัวเบา ๆ',
            time: 20,
            area: 'thigh',
        },
    ],


    // -------------------------------------------------
    // CALF
    // -------------------------------------------------

    calf: [
        {
            id: 'calf-stretch',
            name: 'ยืดน่อง',
            description:
                'ดันกำแพงและเหยียดกล้ามเนื้อน่อง',
            time: 20,
            area: 'calf',
        },
    ],


    // -------------------------------------------------
    // OTHER
    // -------------------------------------------------

    other: [
        {
            id: 'basic-stretch',
            name: 'ยืดกล้ามเนื้อเบื้องต้น',
            description:
                'ยืดกล้ามเนื้ออย่างนุ่มนวล',
            time: 20,
            area: 'other',
        },
    ],

};


// =====================================================
// MAIN SCREEN
// =====================================================

export default function RecordScreen() {

    // =================================================
    // STATE
    // =================================================

    const [
        assessment,
        setAssessment,
    ] = useState<AssessmentData | null>(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        selectedExercise,
        setSelectedExercise,
    ] = useState<ExerciseItem | null>(null);


    const [bodyMapSize, setBodyMapSize] = useState({
        width: 0,
        height: 0,
    });

    const [bodyImageRatio, setBodyImageRatio] = useState<number | null>(null);

    // อ่านสัดส่วนจริงของ back.png จาก Expo Asset
    // ไม่พึ่ง Image.resolveAssetSource และไม่พึ่ง onLoad ของ Expo Web
    useEffect(() => {
        let mounted = true;

        try {
            const asset = Asset.fromModule(BODY_IMAGE);

            const updateRatio = () => {
                const width = Number(asset.width) || 0;
                const height = Number(asset.height) || 0;

                if (mounted && width > 0 && height > 0) {
                    setBodyImageRatio(width / height);
                }
            };

            updateRatio();

            asset.downloadAsync()
                .then(() => {
                    updateRatio();
                })
                .catch(() => {
                    // ใช้ค่าที่อ่านได้จาก Asset ถ้ามี
                });
        } catch {
            // ไม่ทำอะไร ป้องกันหน้าจอพัง
        }

        return () => {
            mounted = false;
        };
    }, []);

    // พื้นที่นี้คือ "พื้นที่ของรูปจริง" ที่ถูกแสดงแบบ contain
    // จุดทั้งหมดจะถูกวางอยู่ภายในพื้นที่เดียวกับรูป จึงไม่หลุดเมื่อจอเปลี่ยนขนาด
    const imageFrame = useMemo(() => {
        const containerWidth = bodyMapSize.width;
        const containerHeight = bodyMapSize.height;
        const ratio = bodyImageRatio;

        if (
            containerWidth <= 0 ||
            containerHeight <= 0 ||
            !ratio ||
            !Number.isFinite(ratio) ||
            ratio <= 0
        ) {
            return {
                left: 0,
                top: 0,
                width: 0,
                height: 0,
            };
        }

        const containerRatio = containerWidth / containerHeight;

        if (ratio > containerRatio) {
            const width = containerWidth;
            const height = width / ratio;

            return {
                left: 0,
                top: (containerHeight - height) / 2,
                width,
                height,
            };
        }

        const height = containerHeight;
        const width = height * ratio;

        return {
            left: (containerWidth - width) / 2,
            top: 0,
            width,
            height,
        };
    }, [
        bodyMapSize.width,
        bodyMapSize.height,
        bodyImageRatio,
    ]);

    // =================================================
    // LOAD ASSESSMENT
    // =================================================

    const loadAssessment = async () => {

        try {

            setLoading(true);


            const stored =
                await AsyncStorage.getItem(
                    'stretchmanPainAssessment'
                );


            if (!stored) {

                setAssessment(null);

                return;

            }


            const parsed =
                JSON.parse(stored);


            if (
                parsed &&
                Array.isArray(
                    parsed.painAreas
                )
            ) {

                // =================================================
                // MIGRATE OLD HIP DATA -> WAIST
                // =================================================
                // ก่อนหน้านี้ใช้ hip_left / hip_right และอาจมี
                // hip_lift จากข้อมูลเก่าใน AsyncStorage
                // หลังเปลี่ยนแบบสอบถามมาเป็น "เอว" เราต้องแปลง
                // key เก่าให้เป็น waist ก่อนนำไปแสดงผล
                // เพื่อไม่ให้ Record แสดงชื่อ key ดิบ เช่น hip_right
                // =================================================

                const migratedPainAreas =
                    parsed.painAreas.reduce(
                        (result: PainAreaRecord[], item: PainAreaRecord) => {

                            const isOldHipKey =
                                item.area === 'hip' ||
                                item.area === 'hip_left' ||
                                item.area === 'hip_right' ||
                                item.area === 'hip_lift';

                            const normalizedArea =
                                isOldHipKey
                                    ? 'waist'
                                    : item.area;

                            const existingIndex =
                                result.findIndex(
                                    existing =>
                                        existing.area === normalizedArea
                                );

                            if (existingIndex === -1) {
                                result.push({
                                    ...item,
                                    area: normalizedArea,
                                });
                            } else if (
                                item.painLevel >
                                result[existingIndex].painLevel
                            ) {
                                // ถ้ามีทั้งข้อมูลเก่าและใหม่ ให้เก็บข้อมูล
                                // ที่มีระดับความปวดสูงกว่าไว้
                                result[existingIndex] = {
                                    ...item,
                                    area: normalizedArea,
                                };
                            }

                            return result;
                        },
                        []
                    );

                const normalizedAssessment: AssessmentData = {
                    ...parsed,
                    painAreas: migratedPainAreas,
                };

                // บันทึกข้อมูลที่แก้ชื่อแล้วกลับไปด้วย
                await AsyncStorage.setItem(
                    'stretchmanPainAssessment',
                    JSON.stringify(normalizedAssessment)
                );

                setAssessment(
                    normalizedAssessment
                );

            } else {

                setAssessment(null);

            }

        } catch (error) {

            console.log(
                'Failed to load assessment:',
                error
            );

            setAssessment(null);

        } finally {

            setLoading(false);

        }

    };


    // =================================================
    // REFRESH WHEN OPEN
    // =================================================

    useFocusEffect(
        useCallback(() => {

            loadAssessment();

        }, [])
    );


    // =================================================
    // SORT PAIN AREAS
    // มาก → น้อย
    // =================================================

    const sortedAreas =
        useMemo(() => {

            if (!assessment) {
                return [];
            }


            return [
                ...assessment.painAreas,
            ].sort(
                (a, b) =>
                    b.painLevel -
                    a.painLevel
            );

        }, [assessment]);


    // =================================================
    // RECOMMENDED EXERCISES
    // =================================================

    const recommendedExercises =
        useMemo(() => {

            if (!assessment) {
                return [];
            }


            const result: ExerciseItem[] = [];


            /*
             * ใช้บริเวณที่ปวดมากที่สุดก่อน
             */

            sortedAreas.forEach(
                area => {

                    const exercises =
                        EXERCISE_DATABASE[
                            getExerciseAreaKey(area.area)
                        ] || [];


                    exercises.forEach(
                        exercise => {

                            const alreadyAdded =
                                result.some(
                                    item =>
                                        item.id ===
                                        exercise.id
                                );


                            if (!alreadyAdded) {

                                result.push(
                                    exercise
                                );

                            }

                        }
                    );

                }
            );


            /*
             * แสดงสูงสุด 6 ท่า
             */

            return result.slice(0, 6);

        }, [
            assessment,
            sortedAreas,
        ]);


    // =================================================
    // FORMAT DATE
    // =================================================

    const formatDate = (
        timestamp?: number
    ) => {

        if (!timestamp) {
            return '-';
        }


        const date =
            new Date(timestamp);


        const day =
            date
                .getDate()
                .toString()
                .padStart(2, '0');


        const month =
            (
                date.getMonth() + 1
            )
                .toString()
                .padStart(2, '0');


        const year =
            date.getFullYear();


        return `${day}/${month}/${year}`;

    };


    // =================================================
    // START EXERCISE
    // =================================================

    const handleStartExercise =
        async () => {

            if (!selectedExercise) {

                Alert.alert(
                    'ยังไม่ได้เลือกท่า',
                    'กรุณาเลือกท่ายืดที่ต้องการทำก่อน'
                );

                return;
            }


            /*
             * Safety check
             */

            if (
                assessment?.safety
                    ?.hasRedFlag
            ) {

                Alert.alert(
                    'ควรระวังอาการ',

                    'จากข้อมูลของคุณ ระบบยังไม่แนะนำให้เริ่มท่ายืดในตอนนี้ กรุณาบอกผู้ใหญ่ที่ไว้ใจได้และขอคำแนะนำจากบุคลากรทางการแพทย์ก่อน'
                );

                return;
            }


            try {

                /*
                 * เก็บท่าที่เลือก
                 * ให้ stretch.tsx ใช้ต่อได้
                 */

                await AsyncStorage.setItem(
                    'stretchmanSelectedExercise',
                    JSON.stringify(
                        selectedExercise
                    )
                );


                /*
                 * เก็บค่าแบบเก่าไว้ด้วย
                 * เผื่อ stretch.tsx รุ่นเก่าใช้
                 */

                await AsyncStorage.setItem(
                    'exerciseName',
                    selectedExercise.name
                );


                await AsyncStorage.setItem(
                    'exerciseTime',
                    String(
                        selectedExercise.time
                    )
                );


                /*
                 * ไปหน้า Stretch
                 */

                router.push({
                    pathname: '/stretch',

                    params: {
                        name:
                            selectedExercise.name,

                        time:
                            String(
                                selectedExercise.time
                            ),
                    },
                } as any);

            } catch (error) {

                console.log(
                    'Failed to save selected exercise:',
                    error
                );

                Alert.alert(
                    'เกิดข้อผิดพลาด',
                    'ไม่สามารถเริ่มท่ายืดได้'
                );

            }

        };


    // =================================================
    // EMPTY STATE
    // =================================================

    if (!loading && !assessment) {

        return (

            <View
                style={
                    styles.container
                }
            >

                <View
                    style={
                        styles.emptyHeader
                    }
                >

                    <View
                        style={
                            styles.headerTopRow
                        }
                    >

                        <TouchableOpacity
                            style={
                                styles.backButton
                            }
                            activeOpacity={0.8}
                            onPress={() =>
                                router.back()
                            }
                        >
                            <FontAwesome6
                                name="arrow-left"
                                size={17}
                                color="#237FFF"
                            />
                        </TouchableOpacity>

                        <View
                            style={
                                styles.headerTitleBlock
                            }
                        >
                            <Text
                                style={
                                    styles.headerTitle
                                }
                            >
                                Record
                            </Text>

                            <Text
                                style={
                                    styles.headerSubtitle
                                }
                            >
                                สรุปอาการปวดของคุณ
                            </Text>
                        </View>

                    </View>

                </View>


                <View
                    style={
                        styles.emptyContainer
                    }
                >

                    <View
                        style={
                            styles.emptyIcon
                        }
                    >

                        <FontAwesome6
                            name="clipboard-check"
                            size={32}
                            color="#237FFF"
                        />

                    </View>


                    <Text
                        style={
                            styles.emptyTitle
                        }
                    >
                        ยังไม่มีข้อมูลอาการ
                    </Text>


                    <Text
                        style={
                            styles.emptyText
                        }
                    >
                        เริ่มทำแบบสอบถามเพื่อให้
                        {'\n'}
                        Stretchman สรุปอาการของคุณ
                    </Text>


                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push(
                                '/pain-questionnaire' as any
                            )
                        }
                    >

                        <LinearGradient
                            colors={[
                                '#237FFF',
                                '#A8CCFF',
                            ]}
                            start={{
                                x: 0,
                                y: 0,
                            }}
                            end={{
                                x: 1,
                                y: 0,
                            }}
                            style={
                                styles.emptyButton
                            }
                        >

                            <Text
                                style={
                                    styles.emptyButtonText
                                }
                            >
                                เริ่มแบบสอบถาม
                            </Text>

                            <FontAwesome6
                                name="arrow-right"
                                size={15}
                                color="#ffffff"
                            />

                        </LinearGradient>

                    </TouchableOpacity>

                </View>

                <View style={styles.fixedBottomNav}>
                    <BottomNav activeTab="home" />
                </View>

            </View>

        );

    }


    // =================================================
    // LOADING
    // =================================================

    if (loading) {

        return (

            <View
                style={[
                    styles.container,
                    styles.loadingContainer,
                ]}
            >

                <View
                    style={
                        styles.loadingCircle
                    }
                >

                    <FontAwesome6
                        name="clipboard-check"
                        size={28}
                        color="#237FFF"
                    />

                </View>


                <Text
                    style={
                        styles.loadingText
                    }
                >
                    กำลังโหลดข้อมูล...
                </Text>

            </View>

        );

    }


    // =================================================
    // MAIN UI
    // =================================================

    return (

        <View
            style={
                styles.container
            }
        >

            <ScrollView
                style={styles.mainScroll}
                showsVerticalScrollIndicator={
                    false
                }

                contentContainerStyle={
                    styles.scrollContent
                }

            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <View
                    style={
                        styles.header
                    }
                >

                    <View
                        style={
                            styles.headerTopRow
                        }
                    >

                        <TouchableOpacity
                            style={
                                styles.backButton
                            }
                            activeOpacity={0.8}
                            onPress={() =>
                                router.back()
                            }
                        >
                            <FontAwesome6
                                name="arrow-left"
                                size={17}
                                color="#237FFF"
                            />
                        </TouchableOpacity>

                        <View
                            style={
                                styles.headerTitleBlock
                            }
                        >
                            <Text
                                style={
                                    styles.headerTitle
                                }
                            >
                                Record
                            </Text>

                            <Text
                                style={
                                    styles.headerSubtitle
                                }
                            >
                                สรุปอาการและท่ายืดที่แนะนำ
                            </Text>
                        </View>

                    </View>


                    <TouchableOpacity
                        style={
                            styles.refreshButton
                        }
                        activeOpacity={0.8}
                        onPress={
                            loadAssessment
                        }
                    >

                        <FontAwesome6
                            name="rotate"
                            size={15}
                            color="#237FFF"
                        />

                    </TouchableOpacity>

                </View>


                {/* =================================================
                    SUMMARY CARD
                ================================================= */}

                <View
                    style={
                        styles.summaryCard
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.summarySmallTitle
                            }
                        >
                            LAST ASSESSMENT
                        </Text>


                        <Text
                            style={
                                styles.summaryDate
                            }
                        >
                            {formatDate(
                                assessment?.updatedAt
                            )}
                        </Text>

                    </View>


                    <View
                        style={
                            styles.summaryCount
                        }
                    >

                        <Text
                            style={
                                styles.summaryCountNumber
                            }
                        >
                            {
                                assessment
                                    ?.painAreas
                                    .length || 0
                            }
                        </Text>

                        <Text
                            style={
                                styles.summaryCountText
                            }
                        >
                            จุดที่มีอาการ
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    SAFETY WARNING
                ================================================= */}

                {assessment?.safety?.hasRedFlag && (

                    <View
                        style={
                            styles.safetyWarning
                        }
                    >

                        <View
                            style={
                                styles.warningIcon
                            }
                        >

                            <FontAwesome6
                                name="triangle-exclamation"
                                size={18}
                                color="#ffffff"
                            />

                        </View>


                        <View
                            style={
                                styles.warningContent
                            }
                        >

                            <Text
                                style={
                                    styles.warningTitle
                                }
                            >
                                ควรระวังอาการ
                            </Text>


                            <Text
                                style={
                                    styles.warningText
                                }
                            >
                                คำตอบจากแบบสอบถามมีสัญญาณเตือน
                                เบื้องต้น ระบบจึงไม่แนะนำให้ฝืน
                                ยืดเหยียด และควรบอกผู้ใหญ่ที่ไว้ใจได้
                                เพื่อขอคำแนะนำจากบุคลากรทางการแพทย์
                            </Text>

                        </View>

                    </View>

                )}


                {/* =================================================
                    PAIN DETAILS / BODY MAP
                ================================================= */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            รายละเอียดอาการ
                        </Text>

                        <Text
                            style={
                                styles.sectionSubtitle
                            }
                        >
                            วงกลมแสดงระดับความปวดของแต่ละบริเวณ
                        </Text>

                    </View>

                </View>


                <View
                    style={
                        styles.bodyCard
                    }
                >

                    <View
                        style={styles.bodyMap}
                        onLayout={(event) => {
                            const { width, height } = event.nativeEvent.layout;
                            setBodyMapSize({ width, height });
                        }}
                    >

                        {imageFrame.width > 0 && imageFrame.height > 0 && (
                            <View
                                style={[
                                    styles.bodyImageLayer,
                                    {
                                        position: 'absolute',
                                        left: imageFrame.left,
                                        top: imageFrame.top,
                                        width: imageFrame.width,
                                        height: imageFrame.height,
                                    },
                                ]}
                            >
                                <Image
                                    source={BODY_IMAGE}
                                    style={styles.bodyImage}
                                    resizeMode="contain"
                                />

                                {sortedAreas.map((area) => {
                                    const position = BODY_POSITIONS[area.area];

                                    if (!position) {
                                        return null;
                                    }

                                    const color = getPainColor(area.painLevel);

                                    return (
                                        <View
                                            key={area.area}
                                            style={[
                                                styles.painPoint,
                                                {
                                                    left: `${position.x}%`,
                                                    top: `${position.y}%`,
                                                    width: position.size,
                                                    height: position.size,
                                                    borderRadius: position.size / 2,
                                                    backgroundColor: color,
                                                    marginLeft: -position.size / 2,
                                                    marginTop: -position.size / 2,
                                                },
                                            ]}
                                        >
                                            <Text style={styles.painPointText}>
                                                {area.painLevel}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                    </View>

                    {/* LEGEND */}

                    <View
                        style={
                            styles.legendRow
                        }
                    >

                        <Text
                            style={
                                styles.legendText
                            }
                        >
                            ปวดน้อย
                        </Text>


                        <View
                            style={
                                styles.legendGradient
                            }
                        >

                            {PAIN_COLORS.map(
                                color => (

                                    <View
                                        key={
                                            color
                                        }
                                        style={[
                                            styles.legendBlock,
                                            {
                                                backgroundColor:
                                                    color,
                                            },
                                        ]}
                                    />

                                )
                            )}

                        </View>


                        <Text
                            style={
                                styles.legendText
                            }
                        >
                            ปวดมาก
                        </Text>

                    </View>

                </View>


                <View
                    style={
                        styles.detailCard
                    }
                >

                    {sortedAreas.map(
                        (
                            area,
                            index
                        ) => (

                            <View
                                key={
                                    area.area
                                }
                                style={[
                                    styles.detailRow,

                                    index !==
                                        sortedAreas.length - 1 &&
                                    styles.detailRowBorder,
                                ]}
                            >

                                <View
                                    style={[
                                        styles.detailDot,

                                        {
                                            backgroundColor:
                                                getPainColor(
                                                    area.painLevel
                                                ),
                                        },
                                    ]}
                                />


                                <View
                                    style={
                                        styles.detailInfo
                                    }
                                >

                                    <Text
                                        style={
                                            styles.detailArea
                                        }
                                    >
                                        {
                                            AREA_LABELS[
                                                area.area
                                            ] ||
                                            area.area
                                        }
                                    </Text>


                                    <Text
                                        style={
                                            styles.detailSymptom
                                        }
                                    >
                                        {
                                            area.symptom ||
                                            'ไม่ระบุอาการ'
                                        }
                                    </Text>


                                    <View
                                        style={
                                            area.painLevel >= 8
                                                ? styles.detailPainAlert
                                                : styles.detailPainNormal
                                        }
                                    >
                                        <Text
                                            style={
                                                area.painLevel >= 8
                                                    ? styles.detailPainLabelAlert
                                                    : styles.detailPainLabel
                                            }
                                        >
                                            {
                                                getPainLabel(
                                                    area.painLevel
                                                )
                                            }
                                        </Text>
                                    </View>

                                </View>


                                <View
                                    style={
                                        styles.detailScoreBox
                                    }
                                >

                                    <Text
                                        style={
                                            styles.detailScore
                                        }
                                    >
                                        {
                                            area.painLevel
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.detailScoreMax
                                        }
                                    >
                                        /10
                                    </Text>

                                </View>

                            </View>

                        )
                    )}

                </View>


                {/* =================================================
                    ACTIVITY
                ================================================= */}

                <View
                    style={
                        styles.infoCard
                    }
                >

                    <View
                        style={
                            styles.infoIcon
                        }
                    >

                        <FontAwesome6
                            name="person-running"
                            size={16}
                            color="#237FFF"
                        />

                    </View>


                    <View
                        style={
                            styles.infoTextContainer
                        }
                    >

                        <Text
                            style={
                                styles.infoTitle
                            }
                        >
                            กิจกรรมก่อนมีอาการ
                        </Text>


                        <Text
                            style={
                                styles.infoValue
                            }
                        >
                            {
                                assessment?.activity ||
                                'ไม่ได้ระบุ'
                            }
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    RECOMMENDED EXERCISES
                ================================================= */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            ท่ายืดที่แนะนำ
                        </Text>


                        <Text
                            style={
                                styles.sectionSubtitle
                            }
                        >
                            Stretchman เลือกจากบริเวณที่มีอาการ
                        </Text>

                    </View>

                </View>


                {assessment?.safety?.hasRedFlag ? (

                    <View
                        style={
                            styles.blockedExerciseCard
                        }
                    >

                        <View
                            style={
                                styles.blockedExerciseIcon
                            }
                        >

                            <FontAwesome6
                                name="shield-halved"
                                size={25}
                                color="#237FFF"
                            />

                        </View>


                        <Text
                            style={
                                styles.blockedExerciseTitle
                            }
                        >
                            ยังไม่แนะนำท่ายืดตอนนี้
                        </Text>


                        <Text
                            style={
                                styles.blockedExerciseText
                            }
                        >
                            จากคำตอบของคุณพบสัญญาณเตือนเบื้องต้น
                            จึงควรขอคำแนะนำจากบุคลากรทางการแพทย์ก่อน
                        </Text>

                    </View>

                ) : (

                    <>

                        {recommendedExercises.length === 0 ? (

                            <View
                                style={
                                    styles.noExerciseCard
                                }
                            >

                                <FontAwesome6
                                    name="person-running"
                                    size={28}
                                    color="#A8CCFF"
                                />


                                <Text
                                    style={
                                        styles.noExerciseText
                                    }
                                >
                                    ยังไม่มีท่าที่เหมาะสม
                                </Text>

                            </View>

                        ) : (

                            <View
                                style={
                                    styles.exerciseSection
                                }
                            >

                                {recommendedExercises.map(
                                    (
                                        exercise,
                                        index
                                    ) => {

                                        const selected =
                                            selectedExercise?.id ===
                                            exercise.id;


                                        return (

                                            <TouchableOpacity

                                                key={
                                                    exercise.id
                                                }

                                                activeOpacity={
                                                    0.85
                                                }

                                                onPress={() =>
                                                    setSelectedExercise(
                                                        exercise
                                                    )
                                                }

                                                style={[
                                                    styles.exerciseCard,

                                                    selected &&
                                                    styles.exerciseCardSelected,
                                                ]}
                                            >

                                                {/* ICON */}

                                                <View
                                                    style={[
                                                        styles.exerciseIcon,

                                                        selected &&
                                                        styles.exerciseIconSelected,
                                                    ]}
                                                >

                                                    <FontAwesome6
                                                        name="person-running"
                                                        size={22}
                                                        color={
                                                            selected
                                                                ? '#ffffff'
                                                                : '#237FFF'
                                                        }
                                                    />

                                                </View>


                                                {/* CONTENT */}

                                                <View
                                                    style={
                                                        styles.exerciseContent
                                                    }
                                                >

                                                    <View
                                                        style={
                                                            styles.exerciseTitleRow
                                                        }
                                                    >

                                                        <Text
                                                            style={
                                                                styles.exerciseName
                                                            }
                                                        >
                                                            {
                                                                exercise.name
                                                            }
                                                        </Text>


                                                        {index === 0 && (

                                                            <View
                                                                style={
                                                                    styles.recommendBadge
                                                                }
                                                            >

                                                                <Text
                                                                    style={
                                                                        styles.recommendBadgeText
                                                                    }
                                                                >
                                                                    แนะนำ
                                                                </Text>

                                                            </View>

                                                        )}

                                                    </View>


                                                    <Text
                                                        style={
                                                            styles.exerciseDescription
                                                        }
                                                    >
                                                        {
                                                            exercise.description
                                                        }
                                                    </Text>


                                                    <View
                                                        style={
                                                            styles.exerciseTimeRow
                                                        }
                                                    >

                                                        <FontAwesome6
                                                            name="clock"
                                                            size={12}
                                                            color="#237FFF"
                                                        />


                                                        <Text
                                                            style={
                                                                styles.exerciseTime
                                                            }
                                                        >
                                                            {exercise.time}
                                                            {' '}
                                                            วินาที
                                                        </Text>

                                                    </View>

                                                </View>


                                                {/* CHECK */}

                                                <View
                                                    style={[
                                                        styles.exerciseCheck,

                                                        selected &&
                                                        styles.exerciseCheckSelected,
                                                    ]}
                                                >

                                                    {selected && (

                                                        <FontAwesome6
                                                            name="check"
                                                            size={11}
                                                            color="#ffffff"
                                                        />

                                                    )}

                                                </View>

                                            </TouchableOpacity>

                                        );

                                    }
                                )}

                            </View>

                        )}


                        {/* START */}

                        {recommendedExercises.length > 0 && (

                            <TouchableOpacity

                                activeOpacity={0.85}

                                disabled={
                                    !selectedExercise
                                }

                                onPress={
                                    handleStartExercise
                                }

                                style={[
                                    styles.startExerciseButton,

                                    !selectedExercise &&
                                    styles.startExerciseButtonDisabled,
                                ]}
                            >

                                <LinearGradient

                                    colors={
                                        selectedExercise
                                            ? [
                                                '#237FFF',
                                                '#A8CCFF',
                                            ]
                                            : [
                                                '#7B94C5',
                                                '#AAB9D5',
                                            ]
                                    }

                                    start={{
                                        x: 0,
                                        y: 0,
                                    }}

                                    end={{
                                        x: 1,
                                        y: 0,
                                    }}

                                    style={
                                        styles.startExerciseGradient
                                    }
                                >

                                    <FontAwesome6
                                        name="person-running"
                                        size={16}
                                        color="#ffffff"
                                    />


                                    <Text
                                        style={
                                            styles.startExerciseText
                                        }
                                    >
                                        {
                                            selectedExercise
                                                ? `เริ่ม ${selectedExercise.name}`
                                                : 'เลือกท่าที่ต้องการยืด'
                                        }
                                    </Text>


                                    <FontAwesome6
                                        name="arrow-right"
                                        size={15}
                                        color="#ffffff"
                                    />

                                </LinearGradient>

                            </TouchableOpacity>

                        )}

                    </>

                )}


                {/* =================================================
                    RETAKE QUESTIONNAIRE
                ================================================= */}

                <TouchableOpacity

                    activeOpacity={0.85}

                    onPress={() =>
                        router.push(
                            '/pain-questionnaire' as any
                        )
                    }

                    style={
                        styles.retakeButton
                    }
                >

                    <FontAwesome6
                        name="clipboard-question"
                        size={15}
                        color="#237FFF"
                    />


                    <Text
                        style={
                            styles.retakeButtonText
                        }
                    >
                        ทำแบบสอบถามใหม่
                    </Text>

                </TouchableOpacity>


                {/* =================================================
                    DISCLAIMER
                ================================================= */}

                <Text
                    style={
                        styles.disclaimer
                    }
                >
                    Stretchman ใช้ข้อมูลที่ผู้ใช้รายงาน
                    เพื่อสรุปอาการและให้คำแนะนำเบื้องต้น
                    ไม่ใช่การวินิจฉัยหรือการรักษา
                </Text>

                <View
                    style={
                        styles.bottomScrollSpacer
                    }
                />


            </ScrollView>

            <View style={styles.fixedBottomNav}>
                <BottomNav activeTab="home" />
            </View>

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
    },

    mainScroll: {
        flex: 1,
        minHeight: 0,
    },

    scrollContent: {
        paddingTop: 28,

        paddingBottom: 10,
    },

    bottomScrollSpacer: {
        height: 105,
    },


    // =================================================
    // HEADER
    // =================================================

    header: {
        flexDirection: 'row',

        alignItems: 'center',

        justifyContent:
            'space-between',

        marginBottom: 20,
    },

    emptyHeader: {
        marginTop: 28,

        marginBottom: 20,
    },

    headerTopRow: {
        flexDirection: 'row',

        alignItems: 'center',

        flex: 1,
    },

    headerTitleBlock: {
        marginLeft: 11,

        flex: 1,
    },

    backButton: {
        width: 40,

        height: 40,

        borderRadius: 20,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',

        elevation: 4,
    },

    headerTitle: {
        color: '#ffffff',

        fontSize: 31,

        fontWeight: '800',
    },

    headerSubtitle: {
        color:
            'rgba(255,255,255,0.78)',

        fontSize: 12,

        marginTop: 3,
    },

    refreshButton: {
        width: 40,

        height: 40,

        borderRadius: 20,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',
    },


    // =================================================
    // SUMMARY
    // =================================================

    summaryCard: {
        backgroundColor: '#ffffff',

        borderRadius: 22,

        padding: 18,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'space-between',

        marginBottom: 14,
    },

    summarySmallTitle: {
        color: '#94a3b8',

        fontSize: 9,

        fontWeight: '800',

        letterSpacing: 1.2,
    },

    summaryDate: {
        color: '#1638AE',

        fontSize: 17,

        fontWeight: '800',

        marginTop: 4,
    },

    summaryCount: {
        alignItems: 'center',

        justifyContent: 'center',

        minWidth: 65,

        height: 58,

        borderRadius: 17,

        backgroundColor: '#EEF5FF',
    },

    summaryCountNumber: {
        color: '#237FFF',

        fontSize: 22,

        fontWeight: '800',
    },

    summaryCountText: {
        color: '#64748b',

        fontSize: 9,

        fontWeight: '700',

        marginTop: 1,
    },


    // =================================================
    // SAFETY WARNING
    // =================================================

    safetyWarning: {
        backgroundColor: '#ffffff',

        borderRadius: 20,

        padding: 14,

        flexDirection: 'row',

        marginBottom: 14,
    },

    warningIcon: {
        width: 38,

        height: 38,

        borderRadius: 19,

        backgroundColor: '#237FFF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 10,
    },

    warningContent: {
        flex: 1,
    },

    warningTitle: {
        color: '#1638AE',

        fontSize: 14,

        fontWeight: '800',

        marginBottom: 4,
    },

    warningText: {
        color: '#64748b',

        fontSize: 11,

        lineHeight: 17,
    },


    // =================================================
    // SECTION
    // =================================================

    sectionHeader: {
        marginTop: 5,

        marginBottom: 10,
    },


    sectionTitle: {
        color: '#ffffff',

        fontSize: 19,

        fontWeight: '800',
    },

    sectionSubtitle: {
        color:
            'rgba(255,255,255,0.7)',

        fontSize: 10,

        marginTop: 2,
    },


    // =================================================
    // BODY MAP
    // =================================================

    bodyCard: {
        backgroundColor: '#ffffff',

        borderRadius: 25,

        padding: 15,

        marginBottom: 15,
    },

    bodyMap: {
        width: '100%',

        height: 430,

        position: 'relative',

        alignItems: 'center',

        justifyContent: 'center',
    },

    bodyImageLayer: {
        position: 'absolute',
        overflow: 'visible',
    },

    bodyImage: {
        width: '100%',
        height: '100%',
    },

    painPoint: {
        position: 'absolute',

        alignItems: 'center',

        justifyContent: 'center',

        borderWidth: 3,

        borderColor: '#ffffff',

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 2,
        },

        shadowOpacity: 0.18,

        shadowRadius: 4,

        elevation: 5,
    },

    painPointText: {
        color: '#ffffff',

        fontSize: 11,

        fontWeight: '800',
    },


    // =================================================
    // LEGEND
    // =================================================

    legendRow: {
        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        marginTop: 10,

        gap: 6,
    },

    legendText: {
        color: '#64748b',

        fontSize: 9,

        fontWeight: '700',
    },

    legendGradient: {
        height: 11,

        flexDirection: 'row',

        borderRadius: 7,

        overflow: 'hidden',

        width: 120,
    },

    legendBlock: {
        flex: 1,

        height: '100%',
    },




    // =================================================
    // DETAIL LIST
    // =================================================

    detailCard: {
        backgroundColor: '#ffffff',

        borderRadius: 23,

        paddingHorizontal: 16,

        marginBottom: 14,
    },

    detailRow: {
        minHeight: 78,

        flexDirection: 'row',

        alignItems: 'center',
    },

    detailRowBorder: {
        borderBottomWidth: 1,

        borderBottomColor: '#E9F1FC',
    },

    detailDot: {
        width: 15,

        height: 15,

        borderRadius: 8,

        marginRight: 12,
    },

    detailInfo: {
        flex: 1,
    },

    detailArea: {
        color: '#1638AE',

        fontSize: 14,

        fontWeight: '800',
    },

    detailSymptom: {
        color: '#64748b',

        fontSize: 10,

        marginTop: 3,
    },

    detailPainNormal: {
        alignSelf: 'flex-start',
    },

    detailPainAlert: {
        alignSelf: 'flex-start',

        borderWidth: 1.5,

        borderColor: '#EF4444',

        borderRadius: 8,

        paddingHorizontal: 8,

        paddingVertical: 3,

        marginTop: 3,

        backgroundColor: '#FFF1F2',
    },

    detailPainLabel: {
        color: '#237FFF',

        fontSize: 9,

        fontWeight: '700',
    },

    detailPainLabelAlert: {
        color: '#DC2626',

        fontSize: 9,

        fontWeight: '800',
    },

    detailScoreBox: {
        flexDirection: 'row',

        alignItems: 'baseline',
    },

    detailScore: {
        color: '#237FFF',

        fontSize: 22,

        fontWeight: '800',
    },

    detailScoreMax: {
        color: '#94a3b8',

        fontSize: 10,

        fontWeight: '700',

        marginLeft: 2,
    },


    // =================================================
    // ACTIVITY CARD
    // =================================================

    infoCard: {
        backgroundColor: '#ffffff',

        borderRadius: 20,

        minHeight: 68,

        padding: 14,

        flexDirection: 'row',

        alignItems: 'center',

        marginBottom: 18,
    },

    infoIcon: {
        width: 38,

        height: 38,

        borderRadius: 19,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 11,
    },

    infoTextContainer: {
        flex: 1,
    },

    infoTitle: {
        color: '#64748b',

        fontSize: 10,

        fontWeight: '700',
    },

    infoValue: {
        color: '#1638AE',

        fontSize: 14,

        fontWeight: '800',

        marginTop: 3,
    },


    // =================================================
    // EXERCISE SECTION
    // =================================================

    exerciseSection: {
        gap: 10,

        marginBottom: 12,
    },

    exerciseCard: {
        backgroundColor: '#ffffff',

        borderRadius: 20,

        padding: 13,

        minHeight: 91,

        flexDirection: 'row',

        alignItems: 'center',

        borderWidth: 1,

        borderColor: '#E4EEFB',

        shadowColor: '#1638AE',

        shadowOffset: {
            width: 0,
            height: 2,
        },

        shadowOpacity: 0.05,

        shadowRadius: 6,

        elevation: 2,
    },

    exerciseCardSelected: {
        borderColor: '#237FFF',

        backgroundColor: '#F4F8FF',
    },

    exerciseIcon: {
        width: 52,

        height: 52,

        borderRadius: 17,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 11,
    },

    exerciseIconSelected: {
        backgroundColor: '#237FFF',
    },

    exerciseContent: {
        flex: 1,

        paddingRight: 7,
    },

    exerciseTitleRow: {
        flexDirection: 'row',

        alignItems: 'center',

        flexWrap: 'wrap',

        gap: 6,
    },

    exerciseName: {
        color: '#1638AE',

        fontSize: 13,

        fontWeight: '800',

        flexShrink: 1,
    },

    exerciseDescription: {
        color: '#64748b',

        fontSize: 10,

        lineHeight: 15,

        marginTop: 4,
    },

    exerciseTimeRow: {
        flexDirection: 'row',

        alignItems: 'center',

        marginTop: 7,

        gap: 5,
    },

    exerciseTime: {
        color: '#4770A8',

        fontSize: 9,

        fontWeight: '700',
    },

    recommendBadge: {
        backgroundColor: '#237FFF',

        paddingHorizontal: 7,

        paddingVertical: 3,

        borderRadius: 8,
    },

    recommendBadgeText: {
        color: '#ffffff',

        fontSize: 8,

        fontWeight: '800',
    },

    exerciseCheck: {
        width: 23,

        height: 23,

        borderRadius: 12,

        borderWidth: 2,

        borderColor: '#A8CCFF',

        alignItems: 'center',

        justifyContent: 'center',
    },

    exerciseCheckSelected: {
        backgroundColor: '#237FFF',

        borderColor: '#237FFF',
    },


    // =================================================
    // START EXERCISE
    // =================================================

    startExerciseButton: {
        marginTop: 3,

        marginBottom: 10,
    },

    startExerciseButtonDisabled: {
        opacity: 0.85,
    },

    startExerciseGradient: {
        minHeight: 54,

        borderRadius: 27,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 8,

        paddingHorizontal: 18,

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 4,
        },

        shadowOpacity: 0.15,

        shadowRadius: 5,

        elevation: 4,
    },

    startExerciseText: {
        color: '#ffffff',

        fontSize: 13,

        fontWeight: '800',

        flex: 1,

        textAlign: 'center',
    },


    // =================================================
    // BLOCKED EXERCISE
    // =================================================

    blockedExerciseCard: {
        backgroundColor: '#ffffff',

        borderRadius: 22,

        padding: 20,

        alignItems: 'center',

        marginBottom: 12,
    },

    blockedExerciseIcon: {
        width: 58,

        height: 58,

        borderRadius: 20,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginBottom: 10,
    },

    blockedExerciseTitle: {
        color: '#1638AE',

        fontSize: 15,

        fontWeight: '800',

        textAlign: 'center',
    },

    blockedExerciseText: {
        color: '#64748b',

        fontSize: 10,

        lineHeight: 16,

        textAlign: 'center',

        marginTop: 6,
    },


    // =================================================
    // EMPTY EXERCISE
    // =================================================

    noExerciseCard: {
        backgroundColor: '#ffffff',

        borderRadius: 20,

        minHeight: 100,

        alignItems: 'center',

        justifyContent: 'center',

        padding: 20,

        marginBottom: 12,
    },

    noExerciseText: {
        color: '#64748b',

        fontSize: 11,

        fontWeight: '700',

        marginTop: 7,
    },


    // =================================================
    // RETAKE QUESTIONNAIRE
    // =================================================

    retakeButton: {
        height: 50,

        borderRadius: 25,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',

        flexDirection: 'row',

        gap: 8,

        marginBottom: 12,
    },

    retakeButtonText: {
        color: '#237FFF',

        fontSize: 13,

        fontWeight: '800',
    },


    // =================================================
    // DISCLAIMER
    // =================================================

    disclaimer: {
        color:
            'rgba(255,255,255,0.58)',

        fontSize: 9,

        lineHeight: 14,

        textAlign: 'center',

        marginTop: 5,

        paddingHorizontal: 12,

        marginBottom: 5,
    },


    // =================================================
    // BOTTOM NAV — FLOATING LIKE PAIN
    // =================================================

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


    // =================================================
    // EMPTY PAGE
    // =================================================

    emptyContainer: {
        flex: 1,

        alignItems: 'center',

        justifyContent: 'center',

        paddingTop: 110,

        paddingBottom: 100,
    },

    emptyIcon: {
        width: 75,

        height: 75,

        borderRadius: 38,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',

        marginBottom: 15,
    },

    emptyTitle: {
        color: '#ffffff',

        fontSize: 20,

        fontWeight: '800',
    },

    emptyText: {
        color:
            'rgba(255,255,255,0.75)',

        fontSize: 12,

        lineHeight: 19,

        textAlign: 'center',

        marginTop: 6,

        marginBottom: 20,
    },

    emptyButton: {
        height: 50,

        paddingHorizontal: 25,

        borderRadius: 25,

        alignItems: 'center',

        justifyContent: 'center',

        flexDirection: 'row',

        gap: 8,
    },

    emptyButtonText: {
        color: '#ffffff',

        fontSize: 13,

        fontWeight: '800',
    },


    // =================================================
    // LOADING
    // =================================================

    loadingContainer: {
        alignItems: 'center',

        justifyContent: 'center',
    },

    loadingCircle: {
        width: 66,

        height: 66,

        borderRadius: 33,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',

        marginBottom: 12,
    },

    loadingText: {
        color: '#ffffff',

        fontSize: 13,

        fontWeight: '700',
    },

});