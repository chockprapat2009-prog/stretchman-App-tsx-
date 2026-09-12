import React, { useCallback, useMemo, useState } from 'react';

import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    time: string;
    areas: string[];
    icon: string;
}

interface RecommendedExercise
    extends ExerciseItem {
    matchArea: PainAreaRecord;
}


// =====================================================
// AREA LABEL
// =====================================================

const AREA_LABELS: Record<string, string> = {
    neck: 'คอ',
    shoulder: 'ไหล่',
    upper_back: 'หลังส่วนบน',
    lower_back: 'หลังส่วนล่าง',
    arm: 'แขน',
    wrist: 'ข้อมือ',
    hip: 'สะโพก',
    thigh: 'ต้นขา',
    calf: 'น่อง',
    other: 'อื่น ๆ',
};


// =====================================================
// EXERCISE DATABASE
// ระบบใหม่จะค้นหาจาก area id ของ Questionnaire
// =====================================================

const EXERCISE_DATABASE: ExerciseItem[] = [

    // =================================================
    // NECK
    // =================================================

    {
        id: 'neck-side',
        name: 'ยืดกล้ามเนื้อคอด้านข้าง',
        description: 'ยืดคออย่างนุ่มนวลโดยไม่ฝืนการเคลื่อนไหว',
        time: '20 วินาที',
        areas: ['neck'],
        icon: 'person',
    },

    {
        id: 'neck-forward',
        name: 'ยืดคอด้านหน้า',
        description: 'เคลื่อนไหวศีรษะอย่างช้า ๆ เพื่อผ่อนคลายบริเวณคอ',
        time: '15 วินาที',
        areas: ['neck'],
        icon: 'person',
    },

    {
        id: 'neck-rotation',
        name: 'หมุนคอเบา ๆ',
        description: 'หมุนศีรษะอย่างช้า ๆ ในช่วงการเคลื่อนไหวที่สบาย',
        time: '30 วินาที',
        areas: ['neck'],
        icon: 'arrows-rotate',
    },


    // =================================================
    // SHOULDER
    // =================================================

    {
        id: 'shoulder-cross',
        name: 'ยืดไหล่แบบพาดแขน',
        description: 'พาดแขนข้ามลำตัวและยืดอย่างนุ่มนวล',
        time: '20 วินาที',
        areas: ['shoulder'],
        icon: 'child-reaching',
    },

    {
        id: 'shoulder-side',
        name: 'ยืดไหล่ด้านข้าง',
        description: 'ยกแขนและยืดอย่างช้า ๆ ในระดับที่สบาย',
        time: '20 วินาที',
        areas: ['shoulder'],
        icon: 'child-reaching',
    },

    {
        id: 'shoulder-roll',
        name: 'หมุนไหล่เบา ๆ',
        description: 'หมุนหัวไหล่อย่างช้า ๆ เพื่อผ่อนคลายกล้ามเนื้อ',
        time: '30 วินาที',
        areas: ['shoulder'],
        icon: 'arrows-rotate',
    },


    // =================================================
    // UPPER BACK
    // =================================================

    {
        id: 'upper-back-reach',
        name: 'ยืดหลังส่วนบน',
        description: 'ประสานมือและยืดแขนไปด้านหน้าอย่างนุ่มนวล',
        time: '20 วินาที',
        areas: ['upper_back'],
        icon: 'person',
    },

    {
        id: 'upper-back-hug',
        name: 'ท่ายืดหลังแบบกอดตัวเอง',
        description: 'กอดตัวเองและผ่อนคลายช่วงหลังส่วนบน',
        time: '20 วินาที',
        areas: ['upper_back'],
        icon: 'people-arrows',
    },


    // =================================================
    // LOWER BACK
    // =================================================

    {
        id: 'lower-back-knee',
        name: 'ยืดหลังส่วนล่าง',
        description: 'ดึงเข่าเข้าหาลำตัวอย่างเบา ๆ ในช่วงที่สบาย',
        time: '20 วินาที',
        areas: ['lower_back'],
        icon: 'person',
    },

    {
        id: 'child-pose',
        name: "ท่า Child's Pose",
        description: 'ผ่อนคลายลำตัวและหลังอย่างนุ่มนวล',
        time: '30 วินาที',
        areas: ['lower_back'],
        icon: 'person',
    },


    // =================================================
    // ARM
    // =================================================

    {
        id: 'arm-cross',
        name: 'ยืดแขนพาดลำตัว',
        description: 'พาดแขนข้ามลำตัวและยืดอย่างนุ่มนวล',
        time: '20 วินาที',
        areas: ['arm'],
        icon: 'hand',
    },

    {
        id: 'arm-reach',
        name: 'ยืดแขนเหนือศีรษะ',
        description: 'ยกแขนขึ้นและยืดตัวอย่างสบาย',
        time: '20 วินาที',
        areas: ['arm'],
        icon: 'hand',
    },


    // =================================================
    // WRIST
    // =================================================

    {
        id: 'wrist-flex',
        name: 'ยืดข้อมือ',
        description: 'ยืดข้อมืออย่างช้า ๆ โดยไม่ฝืน',
        time: '15 วินาที',
        areas: ['wrist'],
        icon: 'hand',
    },

    {
        id: 'wrist-rotate',
        name: 'หมุนข้อมือเบา ๆ',
        description: 'หมุนข้อมือในช่วงการเคลื่อนไหวที่สบาย',
        time: '20 วินาที',
        areas: ['wrist'],
        icon: 'arrows-rotate',
    },


    // =================================================
    // HIP
    // =================================================

    {
        id: 'hip-stretch',
        name: 'ยืดสะโพก',
        description: 'ยืดกล้ามเนื้อบริเวณสะโพกอย่างช้า ๆ',
        time: '20 วินาที',
        areas: ['hip'],
        icon: 'person',
    },


    // =================================================
    // THIGH
    // =================================================

    {
        id: 'thigh-front',
        name: 'ยืดต้นขาด้านหน้า',
        description: 'ยืดกล้ามเนื้อต้นขาด้านหน้าอย่างนุ่มนวล',
        time: '20 วินาที',
        areas: ['thigh'],
        icon: 'person-running',
    },

    {
        id: 'thigh-back',
        name: 'ยืดต้นขาด้านหลัง',
        description: 'ยืดกล้ามเนื้อต้นขาด้านหลังในช่วงที่สบาย',
        time: '20 วินาที',
        areas: ['thigh'],
        icon: 'person-running',
    },


    // =================================================
    // CALF
    // =================================================

    {
        id: 'calf-wall',
        name: 'ยืดน่องกับกำแพง',
        description: 'ใช้กำแพงช่วยพยุงตัวและยืดน่องอย่างช้า ๆ',
        time: '20 วินาที',
        areas: ['calf'],
        icon: 'person-running',
    },

    {
        id: 'calf-stand',
        name: 'ยืดน่องในท่ายืน',
        description: 'ยืดน่องอย่างนุ่มนวลโดยควบคุมการเคลื่อนไหว',
        time: '20 วินาที',
        areas: ['calf'],
        icon: 'person-running',
    },


    // =================================================
    // OTHER
    // =================================================

    {
        id: 'full-body',
        name: 'ยืดร่างกายเบื้องต้น',
        description: 'ยืดร่างกายอย่างนุ่มนวล เหมาะสำหรับการเริ่มต้น',
        time: '20 วินาที',
        areas: ['other'],
        icon: 'person',
    },
];


// =====================================================
// MAIN SCREEN
// =====================================================

export default function ExerciseScreen() {

    const [
        assessment,
        setAssessment,
    ] = useState<AssessmentData | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        selectedExercise,
        setSelectedExercise,
    ] = useState<RecommendedExercise | null>(
        null
    );


    // =================================================
    // LOAD DATA
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

                setAssessment(parsed);

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
    // REFRESH SCREEN
    // =================================================

    useFocusEffect(
        useCallback(() => {

            loadAssessment();

        }, [])
    );


    // =================================================
    // RECOMMENDATION ENGINE
    // =================================================

    const recommendedExercises =
        useMemo<RecommendedExercise[]>(() => {

            if (
                !assessment ||
                !assessment.painAreas ||
                assessment.painAreas.length === 0
            ) {

                return [];

            }


            const results:
                RecommendedExercise[] = [];


            /*
             * เรียงพื้นที่จากระดับปวดมาก → น้อย
             */

            const sortedPainAreas =
                [...assessment.painAreas].sort(
                    (a, b) =>
                        b.painLevel -
                        a.painLevel
                );


            sortedPainAreas.forEach(
                painArea => {

                    const matchingExercises =
                        EXERCISE_DATABASE.filter(
                            exercise =>
                                exercise.areas.includes(
                                    painArea.area
                                )
                        );


                    matchingExercises.forEach(
                        exercise => {

                            /*
                             * ไม่ให้ท่าซ้ำ
                             */
                            const alreadyAdded =
                                results.some(
                                    item =>
                                        item.id ===
                                        exercise.id
                                );


                            if (
                                !alreadyAdded
                            ) {

                                results.push({
                                    ...exercise,
                                    matchArea:
                                        painArea,
                                });

                            }

                        }
                    );

                }
            );


            /*
             * ถ้าไม่มีท่าที่ตรงกับบริเวณ
             * ให้ใช้ full-body เป็น fallback
             */

            if (
                results.length === 0
            ) {

                const fallback =
                    EXERCISE_DATABASE.find(
                        exercise =>
                            exercise.id ===
                            'full-body'
                    );


                if (fallback) {

                    results.push({

                        ...fallback,

                        matchArea: {
                            area: 'other',
                            painLevel: 0,
                            symptom: '',
                        },

                    });

                }

            }


            /*
             * จำกัดจำนวนที่แสดง
             */

            return results.slice(
                0,
                8
            );

        }, [assessment]);


    // =================================================
    // AUTO SELECT TOP RECOMMENDATION
    // =================================================

    React.useEffect(() => {

        if (
            recommendedExercises.length > 0 &&
            !selectedExercise
        ) {

            setSelectedExercise(
                recommendedExercises[0]
            );

        }

    }, [
        recommendedExercises,
        selectedExercise,
    ]);


    // =================================================
    // HIGHEST PAIN
    // =================================================

    const highestPain =
        assessment?.painAreas?.length
            ? [...assessment.painAreas].sort(
                (a, b) =>
                    b.painLevel -
                    a.painLevel
            )[0]
            : null;


    // =================================================
    // START STRETCH
    // =================================================

    const handleStart = async () => {

        if (!selectedExercise) {

            Alert.alert(
                'ยังไม่มีท่าที่แนะนำ',
                'ระบบยังไม่สามารถเลือกท่าให้คุณได้'
            );

            return;
        }


        try {

            /*
             * เก็บข้อมูลไว้ให้ stretch.tsx
             * ใช้ต่อได้เหมือน flow เดิม
             */

            await AsyncStorage.setItem(
                'exerciseName',
                selectedExercise.name
            );


            await AsyncStorage.setItem(
                'exerciseTime',
                selectedExercise.time
            );


            await AsyncStorage.setItem(
                'exerciseImage',
                ''
            );


            await AsyncStorage.setItem(

                'stretchmanSelectedExercise',

                JSON.stringify({

                    id:
                        selectedExercise.id,

                    name:
                        selectedExercise.name,

                    description:
                        selectedExercise.description,

                    time:
                        selectedExercise.time,

                    area:
                        selectedExercise.matchArea.area,

                    painLevel:
                        selectedExercise.matchArea
                            .painLevel,

                    symptom:
                        selectedExercise.matchArea
                            .symptom,

                })

            );


            router.push(
                '/stretch' as any
            );

        } catch (error) {

            console.log(
                'Failed to prepare exercise:',
                error
            );


            Alert.alert(
                'เกิดข้อผิดพลาด',
                'ไม่สามารถเตรียมข้อมูลท่ายืดได้'
            );

        }

    };


    // =================================================
    // BACK
    // =================================================

    const handleBack = () => {

        if (router.canGoBack()) {

            router.back();

        } else {

            router.push(
                '/record' as any
            );

        }

    };


    // =================================================
    // NO ASSESSMENT
    // =================================================

    if (
        !loading &&
        !assessment
    ) {

        return (

            <View
                style={
                    styles.container
                }
            >

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
                            name="clipboard-question"
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
                        กรุณาทำแบบสอบถามก่อน
                        เพื่อให้ Stretchman
                        แนะนำท่ายืดที่เหมาะสม
                    </Text>


                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push(
                                '/pain-questionnaire'as any
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
                HEADER
            ================================================= */}

            <View
                style={
                    styles.header
                }
            >

                <TouchableOpacity

                    style={
                        styles.backButton
                    }

                    onPress={
                        handleBack
                    }

                    activeOpacity={
                        0.8
                    }
                >

                    <FontAwesome6
                        name="arrow-left"
                        size={18}
                        color="#237FFF"
                    />

                </TouchableOpacity>


                <View
                    style={
                        styles.headerText
                    }
                >

                    <Text
                        style={
                            styles.headerTitle
                        }
                    >
                        ท่ายืดที่แนะนำ
                    </Text>


                    <Text
                        style={
                            styles.headerSubtitle
                        }
                    >
                        Stretchman แนะนำให้คุณ
                    </Text>

                </View>


                <View
                    style={
                        styles.headerIcon
                    }
                >

                    <FontAwesome6
                        name="person-running"
                        size={18}
                        color="#ffffff"
                    />

                </View>

            </View>


            <ScrollView

                showsVerticalScrollIndicator={
                    false
                }

                contentContainerStyle={
                    styles.scrollContent
                }
            >


                {/* =================================================
                    MAIN RECOMMENDATION
                ================================================= */}

                {highestPain && (

                    <View
                        style={
                            styles.analysisCard
                        }
                    >

                        <View
                            style={
                                styles.analysisIcon
                            }
                        >

                            <FontAwesome6
                                name="wand-magic-sparkles"
                                size={18}
                                color="#ffffff"
                            />

                        </View>


                        <View
                            style={
                                styles.analysisContent
                            }
                        >

                            <Text
                                style={
                                    styles.analysisTitle
                                }
                            >
                                วิเคราะห์จากอาการของคุณ
                            </Text>


                            <Text
                                style={
                                    styles.analysisText
                                }
                            >
                                บริเวณที่มีระดับความปวดสูงสุดคือ
                                {' '}
                                <Text
                                    style={
                                        styles.analysisStrong
                                    }
                                >
                                    {
                                        AREA_LABELS[
                                        highestPain.area
                                        ] ||
                                        highestPain.area
                                    }
                                </Text>
                                {' '}
                                ระดับ
                                {' '}
                                <Text
                                    style={
                                        styles.analysisStrong
                                    }
                                >
                                    {highestPain.painLevel}/10
                                </Text>
                            </Text>

                        </View>

                    </View>

                )}


                {/* =================================================
                    SECTION TITLE
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
                            ท่าที่เหมาะกับคุณ
                        </Text>


                        <Text
                            style={
                                styles.sectionSubtitle
                            }
                        >
                            ระบบจัดลำดับจากข้อมูลอาการของคุณ
                        </Text>

                    </View>


                    <View
                        style={
                            styles.recommendBadge
                        }
                    >

                        <FontAwesome6
                            name="sparkles"
                            size={11}
                            color="#237FFF"
                        />


                        <Text
                            style={
                                styles.recommendBadgeText
                            }
                        >
                            Recommended
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    TOP RECOMMENDED
                ================================================= */}

                {selectedExercise && (

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
                            y: 1,
                        }}

                        style={
                            styles.heroCard
                        }
                    >

                        <View
                            style={
                                styles.heroTopRow
                            }
                        >

                            <View
                                style={
                                    styles.heroIcon
                                }
                            >

                                <FontAwesome6
                                    name={
                                        selectedExercise.icon as any
                                    }
                                    size={28}
                                    color="#237FFF"
                                />

                            </View>


                            <View
                                style={
                                    styles.heroRecommended
                                }
                            >

                                <FontAwesome6
                                    name="star"
                                    size={11}
                                    color="#ffffff"
                                />


                                <Text
                                    style={
                                        styles.heroRecommendedText
                                    }
                                >
                                    เหมาะที่สุดสำหรับคุณ
                                </Text>

                            </View>

                        </View>


                        <Text
                            style={
                                styles.heroTitle
                            }
                        >
                            {
                                selectedExercise.name
                            }
                        </Text>


                        <Text
                            style={
                                styles.heroDescription
                            }
                        >
                            {
                                selectedExercise.description
                            }
                        </Text>


                        <View
                            style={
                                styles.heroInfoRow
                            }
                        >

                            <View
                                style={
                                    styles.heroInfo
                                }
                            >

                                <FontAwesome6
                                    name="clock"
                                    size={13}
                                    color="#ffffff"
                                />

                                <Text
                                    style={
                                        styles.heroInfoText
                                    }
                                >
                                    {
                                        selectedExercise.time
                                    }
                                </Text>

                            </View>


                            <View
                                style={
                                    styles.heroInfo
                                }
                            >

                                <FontAwesome6
                                    name="location-dot"
                                    size={13}
                                    color="#ffffff"
                                />

                                <Text
                                    style={
                                        styles.heroInfoText
                                    }
                                >
                                    {
                                        AREA_LABELS[
                                        selectedExercise
                                            .matchArea
                                            .area
                                        ] ||
                                        selectedExercise
                                            .matchArea
                                            .area
                                    }
                                </Text>

                            </View>

                        </View>

                    </LinearGradient>

                )}


                {/* =================================================
                    OTHER RECOMMENDATIONS
                ================================================= */}

                <Text
                    style={
                        styles.otherTitle
                    }
                >
                    ท่าที่แนะนำเพิ่มเติม
                </Text>


                {recommendedExercises
                    .map(
                        (
                            exercise,
                            index
                        ) => {

                            const isActive =
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

                                        isActive &&
                                        styles.exerciseCardActive,
                                    ]}
                                >

                                    {/* NUMBER */}

                                    <View
                                        style={[
                                            styles.rankCircle,

                                            isActive &&
                                            styles.rankCircleActive,
                                        ]}
                                    >

                                        <Text
                                            style={[
                                                styles.rankText,

                                                isActive &&
                                                styles.rankTextActive,
                                            ]}
                                        >
                                            {index + 1}
                                        </Text>

                                    </View>


                                    {/* ICON */}

                                    <View
                                        style={[
                                            styles.exerciseIcon,

                                            isActive &&
                                            styles.exerciseIconActive,
                                        ]}
                                    >

                                        <FontAwesome6
                                            name={
                                                exercise.icon as any
                                            }
                                            size={20}
                                            color={
                                                isActive
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

                                        <Text
                                            style={
                                                styles.exerciseName
                                            }
                                        >
                                            {
                                                exercise.name
                                            }
                                        </Text>


                                        <Text
                                            style={
                                                styles.exerciseDescription
                                            }
                                            numberOfLines={
                                                2
                                            }
                                        >
                                            {
                                                exercise.description
                                            }
                                        


                                        </Text>


                                        <View
                                            style={
                                                styles.exerciseMeta
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.metaItem
                                                }
                                            >

                                                <FontAwesome6
                                                    name="clock"
                                                    size={10}
                                                    color="#64748b"
                                                />

                                                <Text
                                                    style={
                                                        styles.metaText
                                                    }
                                                >
                                                    {
                                                        exercise.time
                                                    }
                                                </Text>

                                            </View>


                                            <View
                                                style={
                                                    styles.metaItem
                                                }
                                            >

                                                <FontAwesome6
                                                    name="location-dot"
                                                    size={10}
                                                    color="#64748b"
                                                />

                                                <Text
                                                    style={
                                                        styles.metaText
                                                    }
                                                >
                                                    {
                                                        AREA_LABELS[
                                                        exercise
                                                            .matchArea
                                                            .area
                                                        ] ||
                                                        exercise
                                                            .matchArea
                                                            .area
                                                    }
                                                </Text>

                                            </View>

                                        </View>

                                    </View>


                                    {/* ARROW */}

                                    <View
                                        style={[
                                            styles.arrowCircle,

                                            isActive &&
                                            styles.arrowCircleActive,
                                        ]}
                                    >

                                        <FontAwesome6
                                            name={
                                                isActive
                                                    ? 'check'
                                                    : 'arrow-right'
                                            }
                                            size={12}
                                            color={
                                                isActive
                                                    ? '#ffffff'
                                                    : '#237FFF'
                                            }
                                        />

                                    </View>

                                </TouchableOpacity>

                            );

                        }
                    )}


                {/* =================================================
                    SAFETY
                ================================================= */}

                <View
                    style={
                        styles.safetyCard
                    }
                >

                    <View
                        style={
                            styles.safetyIcon
                        }
                    >

                        <FontAwesome6
                            name="circle-info"
                            size={16}
                            color="#237FFF"
                        />

                    </View>


                    <View
                        style={
                            styles.safetyContent
                        }
                    >

                        <Text
                            style={
                                styles.safetyTitle
                            }
                        >
                            ก่อนเริ่มยืด
                        </Text>


                        <Text
                            style={
                                styles.safetyText
                            }
                        >
                            เคลื่อนไหวอย่างนุ่มนวล
                            และไม่ฝืน หากรู้สึกเจ็บมากขึ้น
                            หรือมีอาการผิดปกติ ให้หยุดทันที
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    START
                ================================================= */}

                <TouchableOpacity

                    activeOpacity={
                        0.85
                    }

                    onPress={
                        handleStart
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
                            styles.startButton
                        }
                    >

                        <View>

                            <Text
                                style={
                                    styles.startSmall
                                }
                            >
                                พร้อมแล้วใช่ไหม?
                            </Text>


                            <Text
                                style={
                                    styles.startText
                                }
                            >
                                เตรียมยืด
                            </Text>

                        </View>


                        <View
                            style={
                                styles.startArrow
                            }
                        >

                            <FontAwesome6
                                name="arrow-right"
                                size={18}
                                color="#237FFF"
                            />

                        </View>

                    </LinearGradient>

                </TouchableOpacity>


                {/* =================================================
                    CHANGE ASSESSMENT
                ================================================= */}

                <TouchableOpacity

                    style={
                        styles.retakeButton
                    }

                    activeOpacity={
                        0.8
                    }

                    onPress={() =>
                        router.push(
                            '/pain-questionnaire'as any
                        )
                    }
                >

                    <FontAwesome6
                        name="clipboard-question"
                        size={14}
                        color="#237FFF"
                    />


                    <Text
                        style={
                            styles.retakeText
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
                    เพื่อให้คำแนะนำเบื้องต้น
                    ไม่ใช่การวินิจฉัยหรือการรักษา
                </Text>


                {/* =================================================
                    BOTTOM NAV
                ================================================= */}

                <View
                    style={
                        styles.bottomNav
                    }
                >

                    <BottomNav
                        activeTab="home"
                    />

                </View>


            </ScrollView>

        </View>

    );

}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

    // =================================================
    // CONTAINER
    // =================================================

    container: {
        flex: 1,

        backgroundColor: '#1638AE',

        paddingHorizontal: 20,
    },


    scrollContent: {
        paddingTop: 12,

        paddingBottom: 30,
    },


    // =================================================
    // HEADER
    // =================================================

    header: {
        height: 64,

        flexDirection: 'row',

        alignItems: 'center',

        marginTop: 5,

        marginBottom: 5,
    },

    backButton: {
        width: 40,
        height: 40,

        borderRadius: 20,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 11,
    },

    headerText: {
        flex: 1,
    },

    headerTitle: {
        color: '#ffffff',

        fontSize: 21,

        fontWeight: '800',
    },

    headerSubtitle: {
        color:
            'rgba(255,255,255,0.75)',

        fontSize: 11,

        marginTop: 2,
    },

    headerIcon: {
        width: 40,
        height: 40,

        borderRadius: 20,

        backgroundColor:
            'rgba(255,255,255,0.18)',

        alignItems: 'center',

        justifyContent: 'center',
    },


    // =================================================
    // ANALYSIS
    // =================================================

    analysisCard: {
        backgroundColor:
            'rgba(255,255,255,0.14)',

        borderWidth: 1,

        borderColor:
            'rgba(255,255,255,0.15)',

        borderRadius: 19,

        padding: 13,

        flexDirection: 'row',

        alignItems: 'center',

        marginBottom: 18,
    },

    analysisIcon: {
        width: 39,
        height: 39,

        borderRadius: 13,

        backgroundColor: '#237FFF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 10,
    },

    analysisContent: {
        flex: 1,
    },

    analysisTitle: {
        color: '#ffffff',

        fontSize: 12,

        fontWeight: '800',

        marginBottom: 3,
    },

    analysisText: {
        color:
            'rgba(255,255,255,0.8)',

        fontSize: 10,

        lineHeight: 16,
    },

    analysisStrong: {
        color: '#A8CCFF',

        fontWeight: '800',
    },


    // =================================================
    // SECTION
    // =================================================

    sectionHeader: {
        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'space-between',

        marginBottom: 10,
    },

    sectionTitle: {
        color: '#ffffff',

        fontSize: 20,

        fontWeight: '800',
    },

    sectionSubtitle: {
        color:
            'rgba(255,255,255,0.68)',

        fontSize: 10,

        marginTop: 2,
    },

    recommendBadge: {
        flexDirection: 'row',

        alignItems: 'center',

        gap: 5,

        backgroundColor: '#ffffff',

        borderRadius: 15,

        paddingHorizontal: 9,

        paddingVertical: 6,
    },

    recommendBadgeText: {
        color: '#237FFF',

        fontSize: 9,

        fontWeight: '800',
    },


    // =================================================
    // HERO
    // =================================================

    heroCard: {
        borderRadius: 24,

        padding: 18,

        marginBottom: 19,
    },

    heroTopRow: {
        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'space-between',

        marginBottom: 14,
    },

    heroIcon: {
        width: 55,
        height: 55,

        borderRadius: 17,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',
    },

    heroRecommended: {
        flexDirection: 'row',

        alignItems: 'center',

        gap: 5,

        paddingHorizontal: 10,

        paddingVertical: 6,

        borderRadius: 15,

        backgroundColor:
            'rgba(255,255,255,0.2)',
    },

    heroRecommendedText: {
        color: '#ffffff',

        fontSize: 9,

        fontWeight: '800',
    },

    heroTitle: {
        color: '#ffffff',

        fontSize: 23,

        fontWeight: '800',

        marginBottom: 5,
    },

    heroDescription: {
        color:
            'rgba(255,255,255,0.88)',

        fontSize: 11,

        lineHeight: 17,

        marginBottom: 13,
    },

    heroInfoRow: {
        flexDirection: 'row',

        gap: 8,
    },

    heroInfo: {
        flexDirection: 'row',

        alignItems: 'center',

        gap: 5,

        backgroundColor:
            'rgba(255,255,255,0.18)',

        borderRadius: 13,

        paddingHorizontal: 9,

        paddingVertical: 6,
    },

    heroInfoText: {
        color: '#ffffff',

        fontSize: 10,

        fontWeight: '700',
    },


    // =================================================
    // OTHER
    // =================================================

    otherTitle: {
        color: '#ffffff',

        fontSize: 14,

        fontWeight: '800',

        marginBottom: 9,
    },

    exerciseCard: {
        minHeight: 87,

        backgroundColor: '#ffffff',

        borderRadius: 19,

        padding: 10,

        marginBottom: 10,

        flexDirection: 'row',

        alignItems: 'center',

        borderWidth: 1,

        borderColor: '#ffffff',
    },

    exerciseCardActive: {
        borderColor: '#A8CCFF',

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 4,
        },

        shadowOpacity: 0.14,

        shadowRadius: 7,

        elevation: 4,
    },

    rankCircle: {
        width: 27,
        height: 27,

        borderRadius: 14,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 8,
    },

    rankCircleActive: {
        backgroundColor: '#237FFF',
    },

    rankText: {
        color: '#237FFF',

        fontSize: 10,

        fontWeight: '800',
    },

    rankTextActive: {
        color: '#ffffff',
    },

    exerciseIcon: {
        width: 48,
        height: 48,

        borderRadius: 15,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 10,
    },

    exerciseIconActive: {
        backgroundColor: '#237FFF',
    },

    exerciseContent: {
        flex: 1,
    },

    exerciseName: {
        color: '#1638AE',

        fontSize: 13,

        fontWeight: '800',

        marginBottom: 2,
    },

    exerciseDescription: {
        color: '#64748b',

        fontSize: 10,

        lineHeight: 15,

        marginBottom: 4,
    },

    exerciseMeta: {
        flexDirection: 'row',

        alignItems: 'center',

        gap: 10,
    },

    metaItem: {
        flexDirection: 'row',

        alignItems: 'center',

        gap: 4,
    },

    metaText: {
        color: '#64748b',

        fontSize: 9,

        fontWeight: '600',
    },

    arrowCircle: {
        width: 30,
        height: 30,

        borderRadius: 15,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginLeft: 7,
    },

    arrowCircleActive: {
        backgroundColor: '#237FFF',
    },


    // =================================================
    // SAFETY
    // =================================================

    safetyCard: {
        backgroundColor: '#ffffff',

        borderRadius: 20,

        padding: 14,

        flexDirection: 'row',

        alignItems: 'center',

        marginTop: 5,

        marginBottom: 12,
    },

    safetyIcon: {
        width: 38,
        height: 38,

        borderRadius: 19,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 10,
    },

    safetyContent: {
        flex: 1,
    },

    safetyTitle: {
        color: '#1638AE',

        fontSize: 12,

        fontWeight: '800',

        marginBottom: 2,
    },

    safetyText: {
        color: '#64748b',

        fontSize: 10,

        lineHeight: 15,
    },


    // =================================================
    // START
    // =================================================

    startButton: {
        minHeight: 72,

        borderRadius: 23,

        paddingHorizontal: 18,

        paddingVertical: 10,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'space-between',

        marginBottom: 10,
    },

    startSmall: {
        color:
            'rgba(255,255,255,0.75)',

        fontSize: 9,

        fontWeight: '700',
    },

    startText: {
        color: '#ffffff',

        fontSize: 24,

        fontWeight: '800',

        marginTop: 1,
    },

    startArrow: {
        width: 45,
        height: 45,

        borderRadius: 23,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',
    },


    // =================================================
    // RETAKE
    // =================================================

    retakeButton: {
        height: 45,

        borderRadius: 23,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',

        flexDirection: 'row',

        gap: 7,

        marginBottom: 12,
    },

    retakeText: {
        color: '#237FFF',

        fontSize: 12,

        fontWeight: '800',
    },


    // =================================================
    // DISCLAIMER
    // =================================================

    disclaimer: {
        color:
            'rgba(255,255,255,0.5)',

        fontSize: 9,

        lineHeight: 14,

        textAlign: 'center',

        paddingHorizontal: 15,

        marginBottom: 14,
    },


    // =================================================
    // BOTTOM NAV
    // =================================================

    bottomNav: {
        marginTop: 2,
    },


    // =================================================
    // EMPTY
    // =================================================

    emptyContainer: {
        flex: 1,

        alignItems: 'center',

        justifyContent: 'center',

        paddingHorizontal: 20,
    },

    emptyIcon: {
        width: 75,
        height: 75,

        borderRadius: 38,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',

        marginBottom: 16,
    },

    emptyTitle: {
        color: '#ffffff',

        fontSize: 21,

        fontWeight: '800',

        marginBottom: 6,
    },

    emptyText: {
        color:
            'rgba(255,255,255,0.75)',

        fontSize: 12,

        lineHeight: 19,

        textAlign: 'center',

        marginBottom: 20,
    },

    emptyButton: {
        height: 50,

        paddingHorizontal: 23,

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

});