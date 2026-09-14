import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    Alert,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import BottomNav from './components/BottomNav';


// =====================================================
// TYPES
// =====================================================

interface PainArea {
    id: string;
    label: string;
    icon: string;
}

interface AssessmentData {
    painAreas: {
        area: string;
        painLevel: number;
        symptom: string;
    }[];

    activity: string;

    safety: {
        hasRedFlag: boolean;
        answers: Record<string, boolean>;
    };

    updatedAt: number;
}

interface PainSliderProps {
    value: number | undefined;
    onChange: (value: number) => void;
}

interface SafetyQuestionProps {
    question: string;
    value: boolean | undefined;
    onChange: (value: boolean) => void;
}


// =====================================================
// DATA
// =====================================================

const PAIN_AREAS: PainArea[] = [
    // กลางลำตัว
    {
        id: 'neck',
        label: 'คอ',
        icon: 'person',
    },
    {
        id: 'upper_back',
        label: 'หลังส่วนบน',
        icon: 'person',
    },
    {
        id: 'lower_back',
        label: 'หลังส่วนล่าง',
        icon: 'person',
    },

    // ซ้าย / ขวา
    {
        id: 'shoulder_left',
        label: 'ไหล่ซ้าย',
        icon: 'child-reaching',
    },
    {
        id: 'shoulder_right',
        label: 'ไหล่ขวา',
        icon: 'child-reaching',
    },
    {
        id: 'arm_left',
        label: 'แขนซ้าย',
        icon: 'hand',
    },
    {
        id: 'arm_right',
        label: 'แขนขวา',
        icon: 'hand',
    },
    {
        id: 'wrist_left',
        label: 'ข้อมือซ้าย',
        icon: 'hand',
    },
    {
        id: 'wrist_right',
        label: 'ข้อมือขวา',
        icon: 'hand',
    },
    {
        id: 'hip_left',
        label: 'สะโพกซ้าย',
        icon: 'person',
    },
    {
        id: 'hip_right',
        label: 'สะโพกขวา',
        icon: 'person',
    },
    {
        id: 'thigh_left',
        label: 'ต้นขาซ้าย',
        icon: 'person-running',
    },
    {
        id: 'thigh_right',
        label: 'ต้นขาขวา',
        icon: 'person-running',
    },
    {
        id: 'calf_left',
        label: 'น่องซ้าย',
        icon: 'person-running',
    },
    {
        id: 'calf_right',
        label: 'น่องขวา',
        icon: 'person-running',
    },

    // อื่น ๆ
    {
        id: 'other',
        label: 'อื่น ๆ',
        icon: 'ellipsis',
    },
];

const SYMPTOMS = [
    'ตึง',
    'เมื่อย',
    'ล้า',
    'เจ็บตอนขยับ',
];

const ACTIVITIES = [
    'นั่งนาน',
    'ออกกำลังกาย',
    'วิ่ง',
    'เล่นกีฬา',
    'ทำงาน / เรียน',
    'อื่น ๆ',
];

const SAFETY_KEYS = [
    'chest',
    'numbness',
    'injury',
    'swelling',
];


// =====================================================
// MAIN SCREEN
// =====================================================

export default function PainQuestionnaireScreen() {

    // =================================================
    // REFS
    // =================================================

    const scrollRef =
        useRef<ScrollView>(null);

    const sectionPositions =
        useRef<Record<string, number>>({});


    // =================================================
    // STATE
    // =================================================

    const [
        selectedAreas,
        setSelectedAreas,
    ] = useState<string[]>([]);

    const [
        painLevels,
        setPainLevels,
    ] = useState<Record<string, number>>({});

    const [
        symptoms,
        setSymptoms,
    ] = useState<Record<string, string>>({});

    const [
        activity,
        setActivity,
    ] = useState('');

    const [
        safetyAnswers,
        setSafetyAnswers,
    ] = useState<
        Record<string, boolean | undefined>
    >({});

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        errors,
        setErrors,
    ] = useState<Record<string, string>>({});


    // =================================================
    // TOGGLE AREA
    // =================================================

    const toggleArea = (
        areaId: string
    ) => {

        setSelectedAreas(prev => {

            if (prev.includes(areaId)) {

                const next =
                    prev.filter(
                        item =>
                            item !== areaId
                    );

                // ล้างข้อมูลของพื้นที่ที่ยกเลิก
                setPainLevels(current => {

                    const copy = {
                        ...current,
                    };

                    delete copy[areaId];

                    return copy;
                });

                setSymptoms(current => {

                    const copy = {
                        ...current,
                    };

                    delete copy[areaId];

                    return copy;
                });

                return next;
            }

            return [
                ...prev,
                areaId,
            ];

        });

        setErrors(prev => ({
            ...prev,
            q1: '',
        }));
    };


    // =================================================
    // PAIN LEVEL
    // =================================================

    const setAreaPainLevel = (
        areaId: string,
        level: number
    ) => {

        setPainLevels(prev => ({
            ...prev,
            [areaId]: level,
        }));

        setErrors(prev => ({
            ...prev,
            [`pain_${areaId}`]: '',
            q2: '',
        }));

    };


    // =================================================
    // SYMPTOM
    // =================================================

    const setAreaSymptom = (
        areaId: string,
        symptom: string
    ) => {

        setSymptoms(prev => ({
            ...prev,
            [areaId]: symptom,
        }));

        setErrors(prev => ({
            ...prev,
            [`symptom_${areaId}`]: '',
            q2: '',
        }));

    };


    // =================================================
    // ACTIVITY
    // =================================================

    const selectActivity = (
        value: string
    ) => {

        setActivity(value);

        setErrors(prev => ({
            ...prev,
            q3: '',
        }));

    };


    // =================================================
    // SAFETY
    // =================================================

    const setSafetyAnswer = (
        key: string,
        value: boolean
    ) => {

        setSafetyAnswers(prev => ({
            ...prev,
            [key]: value,
        }));

        setErrors(prev => ({
            ...prev,
            [`safety_${key}`]: '',
            q4: '',
        }));

    };


    // =================================================
    // SCROLL
    // =================================================

    const scrollToSection = (
        section: string
    ) => {

        const y =
            sectionPositions.current[
                section
            ];

        if (y === undefined) {
            return;
        }

        setTimeout(() => {

            scrollRef.current?.scrollTo({
                y: Math.max(
                    y - 15,
                    0
                ),
                animated: true,
            });

        }, 150);
    };


    // =================================================
    // SAVE
    // =================================================

    const saveAssessment =
        async () => {

            if (saving) {
                return;
            }

            setSaving(true);

            try {

                const hasRedFlag =
                    SAFETY_KEYS.some(
                        key =>
                            safetyAnswers[
                                key
                            ] === true
                    );


                const completeSafetyAnswers =
                    SAFETY_KEYS.reduce(
                        (
                            result,
                            key
                        ) => {

                            result[key] =
                                safetyAnswers[
                                    key
                                ] === true;

                            return result;

                        },
                        {} as Record<
                            string,
                            boolean
                        >
                    );


                const assessment:
                    AssessmentData = {

                    painAreas:
                        selectedAreas.map(
                            area => ({
                                area,

                                painLevel:
                                    painLevels[
                                        area
                                    ] ?? 0,

                                symptom:
                                    symptoms[
                                        area
                                    ] ?? '',
                            })
                        ),

                    activity,

                    safety: {
                        hasRedFlag,

                        answers:
                            completeSafetyAnswers,
                    },

                    updatedAt:
                        Date.now(),
                };


                await AsyncStorage.setItem(
                    'stretchmanPainAssessment',
                    JSON.stringify(
                        assessment
                    )
                );


                console.log(
                    'Assessment saved:',
                    assessment
                );


                // -----------------------------------------
                // RED FLAG
                // -----------------------------------------

                if (hasRedFlag) {

                    Alert.alert(
                        '⚠️ ควรหยุดก่อน',

                        'จากคำตอบของคุณ พบข้อมูลที่ระบบจัดเป็นสัญญาณเตือนเบื้องต้น จึงยังไม่แนะนำให้เริ่มท่ายืดจากแอปในตอนนี้',

                        [
                            {
                                text: 'ดูสรุปอาการ',

                                onPress: () => {

                                    router.replace(
                                        '/record' as any
                                    );

                                },
                            },
                        ]
                    );

                    return;
                }


                // -----------------------------------------
                // NORMAL
                // -----------------------------------------

                router.replace(
                    '/record' as any
                );

            } catch (error) {

                console.error(
                    'Failed to save assessment:',
                    error
                );

                Alert.alert(
                    'เกิดข้อผิดพลาด',
                    'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง'
                );

            } finally {

                setSaving(false);

            }

        };


    // =================================================
    // VALIDATE ALL
    // =================================================

    const validateAll =
        () => {

            const newErrors:
                Record<string, string> = {};


            // -----------------------------------------
            // QUESTION 1
            // -----------------------------------------

            if (
                selectedAreas.length === 0
            ) {

                newErrors.q1 =
                    'กรุณาเลือกบริเวณที่มีอาการอย่างน้อย 1 บริเวณ';

                setErrors(newErrors);

                scrollToSection('q1');

                return;

            }


            // -----------------------------------------
            // QUESTION 2
            // -----------------------------------------

            for (
                const areaId
                of selectedAreas
            ) {

                if (
                    painLevels[
                        areaId
                    ] === undefined
                ) {

                    newErrors.q2 =
                        'กรุณาระบุระดับความปวดให้ครบทุกบริเวณ';

                    newErrors[
                        `pain_${areaId}`
                    ] =
                        'กรุณาระบุระดับความปวด';

                    setErrors(newErrors);

                    scrollToSection(
                        'q2'
                    );

                    return;

                }


                if (
                    !symptoms[
                        areaId
                    ]
                ) {

                    newErrors.q2 =
                        'กรุณาเลือกลักษณะอาการให้ครบทุกบริเวณ';

                    newErrors[
                        `symptom_${areaId}`
                    ] =
                        'กรุณาเลือกลักษณะอาการ';

                    setErrors(newErrors);

                    scrollToSection(
                        'q2'
                    );

                    return;

                }

            }


            // -----------------------------------------
            // QUESTION 3
            // -----------------------------------------

            if (!activity) {

                newErrors.q3 =
                    'กรุณาเลือกกิจกรรมก่อนเริ่มมีอาการ';

                setErrors(newErrors);

                scrollToSection(
                    'q3'
                );

                return;

            }


            // -----------------------------------------
            // QUESTION 4
            // -----------------------------------------

            for (
                const key
                of SAFETY_KEYS
            ) {

                if (
                    safetyAnswers[
                        key
                    ] === undefined
                ) {

                    newErrors.q4 =
                        'กรุณาตอบคำถามความปลอดภัยให้ครบทุกข้อ';

                    newErrors[
                        `safety_${key}`
                    ] =
                        'กรุณาเลือกคำตอบ';

                    setErrors(newErrors);

                    scrollToSection(
                        'q4'
                    );

                    return;

                }

            }


            // -----------------------------------------
            // COMPLETE
            // -----------------------------------------

            setErrors({});

            saveAssessment();

        };


    // =================================================
    // HEADER COMPONENT
    // =================================================

    const QuestionHeader = ({
        number,
        title,
        subtitle,
        error,
    }: {
        number: string;
        title: string;
        subtitle: string;
        error?: string;
    }) => (

        <View
            style={[
                styles.questionHeaderCard,

                error &&
                styles.questionHeaderError,
            ]}
        >

            <View
                style={
                    styles.questionNumberRow
                }
            >

                <Text
                    style={[
                        styles.questionNumber,

                        error &&
                        styles.questionNumberError,
                    ]}
                >
                    {number}
                </Text>


                {error && (

                    <Text
                        style={
                            styles.requiredStar
                        }
                    >
                        *
                    </Text>

                )}

            </View>


            <Text
                style={[
                    styles.questionTitle,

                    error &&
                    styles.questionTitleError,
                ]}
            >
                {title}
            </Text>


            <Text
                style={[
                    styles.questionSubtitle,

                    error &&
                    styles.questionSubtitleError,
                ]}
            >
                {subtitle}
            </Text>


            {error && (

                <View
                    style={
                        styles.headerErrorBox
                    }
                >

                    <FontAwesome6
                        name="circle-exclamation"
                        size={13}
                        color="#D92D20"
                    />

                    <Text
                        style={
                            styles.headerErrorText
                        }
                    >
                        {error}
                    </Text>

                </View>

            )}

        </View>

    );


    // =================================================
    // QUESTION 1
    // =================================================

    const renderQuestion1 = () => (

        <View
            onLayout={event => {

                sectionPositions.current.q1 =
                    event.nativeEvent.layout.y;

            }}
        >

            <QuestionHeader
                number="01"
                title={
                    'คุณมีอาการปวด\nบริเวณไหน?'
                }
                subtitle={
                    'เลือกได้มากกว่า 1 บริเวณ และสามารถแยกซ้าย / ขวาได้'
                }
                error={
                    errors.q1
                }
            />


            <View
                style={
                    styles.areaGrid
                }
            >

                {PAIN_AREAS.map(
                    area => {

                        const selected =
                            selectedAreas.includes(
                                area.id
                            );


                        return (

                            <TouchableOpacity

                                key={
                                    area.id
                                }

                                activeOpacity={
                                    0.8
                                }

                                onPress={() =>
                                    toggleArea(
                                        area.id
                                    )
                                }

                                style={[
                                    styles.areaCard,

                                    selected &&
                                    styles.areaCardSelected,
                                ]}
                            >

                                <View
                                    style={[
                                        styles.areaIcon,

                                        selected &&
                                        styles.areaIconSelected,
                                    ]}
                                >

                                    <FontAwesome6
                                        name={
                                            area.icon as any
                                        }
                                        size={18}
                                        color={
                                            selected
                                                ? '#237FFF'
                                                : '#ffffff'
                                        }
                                    />

                                </View>


                                <Text
                                    style={[
                                        styles.areaText,

                                        selected &&
                                        styles.areaTextSelected,
                                    ]}
                                >
                                    {
                                        area.label
                                    }
                                </Text>


                                {selected && (

                                    <View
                                        style={
                                            styles.checkCircle
                                        }
                                    >

                                        <FontAwesome6
                                            name="check"
                                            size={10}
                                            color="#ffffff"
                                        />

                                    </View>

                                )}

                            </TouchableOpacity>

                        );

                    }
                )}

            </View>

        </View>

    );


    // =================================================
    // QUESTION 2
    // =================================================

    const renderQuestion2 = () => {

        const question2Locked =
            selectedAreas.length === 0;


        return (

            <View

                onLayout={event => {

                    sectionPositions.current.q2 =
                        event.nativeEvent.layout.y;

                }}

                style={
                    styles.questionSection
                }
            >

                <QuestionHeader
                    number="02"
                    title={
                        'อาการของคุณ\nอยู่ในระดับไหน?'
                    }
                    subtitle={
                        question2Locked
                            ? 'ข้อมูลระดับความปวดจะอ้างอิงจากบริเวณที่เลือกในข้อ 1'
                            : 'ระบุระดับความปวดและลักษณะอาการของแต่ละบริเวณ'
                    }
                    error={
                        errors.q2
                    }
                />


                {question2Locked ? (

                    <View
                        style={
                            styles.lockedQuestionCard
                        }
                    >

                        <View
                            style={
                                styles.lockedIcon
                            }
                        >

                            <FontAwesome6
                                name="lock"
                                size={20}
                                color="#237FFF"
                            />

                        </View>


                        <Text
                            style={
                                styles.lockedText
                            }
                        >
                            โปรดตอบคำถามข้อที่ 1 ก่อน
                        </Text>


                        <Text
                            style={
                                styles.lockedSubText
                            }
                        >
                            เมื่อเลือกบริเวณที่มีอาการแล้ว
                            รายละเอียดของคำถามข้อที่ 2
                            จะปรากฏขึ้นตรงนี้
                        </Text>

                    </View>

                ) : (

                    <View>

                        {selectedAreas.map(
                            areaId => {

                                const area =
                                    PAIN_AREAS.find(
                                        item =>
                                            item.id ===
                                            areaId
                                    );


                                if (!area) {
                                    return null;
                                }


                                const currentLevel =
                                    painLevels[
                                        areaId
                                    ];

                                const painError =
                                    errors[
                                        `pain_${areaId}`
                                    ];

                                const symptomError =
                                    errors[
                                        `symptom_${areaId}`
                                    ];


                                return (

                                    <View
                                        key={
                                            areaId
                                        }
                                        style={[
                                            styles.symptomCard,

                                            (painError ||
                                                symptomError) &&
                                            styles.symptomCardError,
                                        ]}
                                    >

                                        <View
                                            style={
                                                styles.symptomHeader
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.areaTitleRow
                                                }
                                            >

                                                <View
                                                    style={
                                                        styles.miniAreaIcon
                                                    }
                                                >

                                                    <FontAwesome6
                                                        name={
                                                            area.icon as any
                                                        }
                                                        size={14}
                                                        color="#237FFF"
                                                    />

                                                </View>


                                                <View>

                                                    <View
                                                        style={
                                                            styles.areaNameRow
                                                        }
                                                    >

                                                        <Text
                                                            style={
                                                                styles.symptomTitle
                                                            }
                                                        >
                                                            {
                                                                area.label
                                                            }
                                                        </Text>

                                                        {(painError ||
                                                            symptomError) && (

                                                            <Text
                                                                style={
                                                                    styles.requiredStarSmall
                                                                }
                                                            >
                                                                *
                                                            </Text>

                                                        )}

                                                    </View>


                                                    {painError ||
                                                        symptomError ? (

                                                        <Text
                                                            style={
                                                                styles.inlineError
                                                            }
                                                        >
                                                            {painError ||
                                                                symptomError}
                                                        </Text>

                                                    ) : null}

                                                </View>

                                            </View>



                                        </View>


                                        <Text
                                            style={
                                                styles.smallLabel
                                            }
                                        >
                                            ระดับความปวด
                                        </Text>


                                        <PainSlider
                                            value={
                                                currentLevel
                                            }
                                            onChange={
                                                level =>
                                                    setAreaPainLevel(
                                                        areaId,
                                                        level
                                                    )
                                            }
                                        />



                                        <Text
                                            style={[
                                                styles.smallLabel,
                                                {
                                                    marginTop: 18,
                                                },
                                            ]}
                                        >
                                            ลักษณะอาการ
                                        </Text>


                                        <View
                                            style={
                                                styles.chipWrap
                                            }
                                        >

                                            {SYMPTOMS.map(
                                                symptom => {

                                                    const active =
                                                        symptoms[
                                                            areaId
                                                        ] ===
                                                        symptom;


                                                    return (

                                                        <TouchableOpacity

                                                            key={
                                                                symptom
                                                            }

                                                            style={[
                                                                styles.chip,

                                                                active &&
                                                                styles.chipActive,
                                                            ]}

                                                            activeOpacity={
                                                                0.8
                                                            }

                                                            onPress={() =>
                                                                setAreaSymptom(
                                                                    areaId,
                                                                    symptom
                                                                )
                                                            }
                                                        >

                                                            {active && (

                                                                <FontAwesome6
                                                                    name="check"
                                                                    size={10}
                                                                    color="#ffffff"
                                                                    style={
                                                                        styles.chipCheck
                                                                    }
                                                                />

                                                            )}


                                                            <Text
                                                                style={[
                                                                    styles.chipText,

                                                                    active &&
                                                                    styles.chipTextActive,
                                                                ]}
                                                            >
                                                                {
                                                                    symptom
                                                                }
                                                            </Text>

                                                        </TouchableOpacity>

                                                    );

                                                }
                                            )}

                                        </View>


                                        {symptomError && (

                                            <View
                                                style={
                                                    styles.bottomError
                                                }
                                            >

                                                <FontAwesome6
                                                    name="circle-exclamation"
                                                    size={12}
                                                    color="#D92D20"
                                                />

                                                <Text
                                                    style={
                                                        styles.bottomErrorText
                                                    }
                                                >
                                                    {
                                                        symptomError
                                                    }
                                                </Text>

                                            </View>

                                        )}

                                    </View>

                                );

                            }
                        )}

                    </View>

                )}

            </View>

        );

    };


    // =================================================
    // QUESTION 3
    // =================================================

    const renderQuestion3 = () => (

        <View

            onLayout={event => {

                sectionPositions.current.q3 =
                    event.nativeEvent.layout.y;

            }}

            style={
                styles.questionSection
            }
        >

            <QuestionHeader
                number="03"
                title={
                    'ก่อนเริ่มมีอาการ\nคุณทำอะไร?'
                }
                subtitle={
                    'เลือกกิจกรรมที่ใกล้เคียงกับอาการของคุณมากที่สุด'
                }
                error={
                    errors.q3
                }
            />


            <View
                style={
                    styles.activityList
                }
            >

                {ACTIVITIES.map(
                    item => {

                        const active =
                            activity === item;


                        return (

                            <TouchableOpacity

                                key={
                                    item
                                }

                                activeOpacity={
                                    0.8
                                }

                                onPress={() =>
                                    selectActivity(
                                        item
                                    )
                                }

                                style={[
                                    styles.activityButton,

                                    active &&
                                    styles.activityButtonActive,
                                ]}
                            >

                                <View
                                    style={
                                        styles.activityLeft
                                    }
                                >

                                    <View
                                        style={[
                                            styles.activityIcon,

                                            active &&
                                            styles.activityIconActive,
                                        ]}
                                    >

                                        <FontAwesome6
                                            name="person-running"
                                            size={14}
                                            color={
                                                active
                                                    ? '#237FFF'
                                                    : '#A8CCFF'
                                            }
                                        />

                                    </View>


                                    <Text
                                        style={[
                                            styles.activityText,

                                            active &&
                                            styles.activityTextActive,
                                        ]}
                                    >
                                        {item}
                                    </Text>

                                </View>


                                <View
                                    style={[
                                        styles.radioCircle,

                                        active &&
                                        styles.radioCircleActive,
                                    ]}
                                >

                                    {active && (

                                        <View
                                            style={
                                                styles.radioDot
                                            }
                                        />

                                    )}

                                </View>

                            </TouchableOpacity>

                        );

                    }
                )}

            </View>

        </View>

    );


    // =================================================
    // QUESTION 4
    // =================================================

    const renderQuestion4 = () => (

        <View

            onLayout={event => {

                sectionPositions.current.q4 =
                    event.nativeEvent.layout.y;

            }}

            style={
                styles.questionSection
            }
        >

            <QuestionHeader
                number="04"
                title={
                    'ตรวจสอบความปลอดภัย'
                }
                subtitle={
                    'ตอบคำถามตามอาการที่คุณกำลังเป็นอยู่'
                }
                error={
                    errors.q4
                }
            />


            <View
                style={
                    styles.warningBox
                }
            >

                <View
                    style={
                        styles.warningIcon
                    }
                >

                    <FontAwesome6
                        name="triangle-exclamation"
                        size={17}
                        color="#ffffff"
                    />

                </View>


                <Text
                    style={
                        styles.warningText
                    }
                >
                    คำถามส่วนนี้ใช้เพื่อคัดกรอง
                    สัญญาณเตือนเบื้องต้น
                    ไม่ใช่การวินิจฉัยโรค
                </Text>

            </View>


            <SafetyQuestion
                question={
                    'มีอาการหายใจลำบากหรือเจ็บหน้าอกร่วมด้วยหรือไม่?'
                }
                value={
                    safetyAnswers.chest
                }
                error={
                    errors.safety_chest
                }
                onChange={value =>
                    setSafetyAnswer(
                        'chest',
                        value
                    )
                }
            />


            <SafetyQuestion
                question={
                    'มีอาการชา หรืออ่อนแรงผิดปกติหรือไม่?'
                }
                value={
                    safetyAnswers.numbness
                }
                error={
                    errors.safety_numbness
                }
                onChange={value =>
                    setSafetyAnswer(
                        'numbness',
                        value
                    )
                }
            />


            <SafetyQuestion
                question={
                    'อาการเกิดขึ้นหลังจากอุบัติเหตุหรือการบาดเจ็บรุนแรงหรือไม่?'
                }
                value={
                    safetyAnswers.injury
                }
                error={
                    errors.safety_injury
                }
                onChange={value =>
                    setSafetyAnswer(
                        'injury',
                        value
                    )
                }
            />


            <SafetyQuestion
                question={
                    'มีอาการบวม แดง หรืออาการผิดปกติอย่างชัดเจนบริเวณที่ปวดหรือไม่?'
                }
                value={
                    safetyAnswers.swelling
                }
                error={
                    errors.safety_swelling
                }
                onChange={value =>
                    setSafetyAnswer(
                        'swelling',
                        value
                    )
                }
            />

        </View>

    );


    // =================================================
    // MAIN UI
    // =================================================

    return (

        <View
            style={
                styles.container
            }
        >

            {/* HEADER */}

            <View
                style={
                    styles.header
                }
            >

                <TouchableOpacity
                    style={
                        styles.backButton
                    }
                    activeOpacity={
                        0.8
                    }
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


                <Text
                    style={
                        styles.headerTitle
                    }
                >
                    Body Check
                </Text>


                <View
                    style={
                        styles.headerBadge
                    }
                >

                    <Text
                        style={
                            styles.headerBadgeText
                        }
                    >
                        4 คำถาม
                    </Text>

                </View>

            </View>


            {/* MAIN SCROLL */}

            <View
                style={
                    styles.questionContent
                }
            >

                <ScrollView

                    ref={
                        scrollRef
                    }

                    showsVerticalScrollIndicator={
                        false
                    }

                    contentContainerStyle={
                        styles.content
                    }

                >

                    {/* INTRO */}

                    <View
                        style={
                            styles.introCard
                        }
                    >

                        <View
                            style={
                                styles.introIcon
                            }
                        >

                            <FontAwesome6
                                name="clipboard-question"
                                size={21}
                                color="#237FFF"
                            />

                        </View>


                        <View
                            style={
                                styles.introContent
                            }
                        >

                            <Text
                                style={
                                    styles.introTitle
                                }
                            >
                                แบบประเมินอาการ
                            </Text>


                            <Text
                                style={
                                    styles.introText
                                }
                            >
                                เลื่อนลงเพื่อตอบคำถามให้ครบทุกข้อ
                                ก่อนกดประเมินอาการ
                            </Text>

                        </View>

                    </View>


                    {/* QUESTION 1 */}

                    {renderQuestion1()}


                    {/* DIVIDER 1 */}

                    <View
                        style={
                            styles.sectionDivider
                        }
                    />


                    {/* QUESTION 2 */}

                    {renderQuestion2()}


                    {/* DIVIDER 2 */}

                    <View
                        style={
                            styles.sectionDivider
                        }
                    />


                    {/* QUESTION 3 */}

                    {renderQuestion3()}


                    {/* DIVIDER 3 */}

                    <View
                        style={
                            styles.sectionDivider
                        }
                    />


                    {/* QUESTION 4 */}

                    {renderQuestion4()}


                    {/* SUBMIT */}

                    <View
                        style={
                            styles.submitSection
                        }
                    >

                        {/* DISCLAIMER ABOVE BUTTON */}

                        <Text
                            style={
                                styles.disclaimer
                            }
                        >
                            แบบประเมินนี้ใช้เพื่อคัดกรอง
                            และสรุปข้อมูลเบื้องต้น
                            ไม่ใช่การวินิจฉัยโรค
                        </Text>


                        <Text
                            style={
                                styles.submitHint
                            }
                        >
                            กรุณาตรวจสอบคำตอบให้ครบทุกข้อ
                            ก่อนกดประเมินอาการ
                        </Text>


                        <TouchableOpacity

                            activeOpacity={
                                0.85
                            }

                            disabled={
                                saving
                            }

                            onPress={
                                validateAll
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

                                style={[
                                    styles.submitButton,

                                    saving &&
                                    styles.submitButtonDisabled,
                                ]}
                            >

                                <Text
                                    style={
                                        styles.submitButtonText
                                    }
                                >
                                    {saving
                                        ? 'กำลังบันทึก...'
                                        : 'ประเมินอาการ'}
                                </Text>


                                {!saving && (

                                    <FontAwesome6
                                        name="check"
                                        size={16}
                                        color="#ffffff"
                                    />

                                )}

                            </LinearGradient>

                        </TouchableOpacity>

                    </View>


                    {/* EXTRA SPACE FOR FIXED BOTTOM NAV */}

                    <View
                        style={
                            styles.bottomScrollSpacer
                        }
                    />

                </ScrollView>


                {/* =================================================
                    FIXED BOTTOM NAV
                ================================================= */}

                <View
                    style={
                        styles.fixedBottomNav
                    }
                >

                    <BottomNav
                        activeTab="home"
                    />

                </View>

            </View>

        </View>

    );

}


// =====================================================
// PAIN SLIDER
// =====================================================

function PainSlider({
    value,
    onChange,
}: PainSliderProps) {

    const sliderWidth = useRef(0);
    const safeValue = value ?? 0;
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // =================================================
    // PAIN COLORS 0 -> 10
    // =================================================

    const painColors: [
        string, string, string, string, string,
        string, string, string, string, string,
        string
    ] = [
        '#166534', // 0
        '#238636', // 1
        '#3FA34D', // 2
        '#69B34C', // 3
        '#A4C639', // 4
        '#EAB308', // 5
        '#F59E0B', // 6
        '#F97316', // 7
        '#EF4444', // 8
        '#DC2626', // 9
        '#991B1B', // 10
    ];

    const getPainColor = (level: number) => {
        const safeLevel = Math.max(
            0,
            Math.min(10, Math.round(level))
        );
        return painColors[safeLevel];
    };

    const painColor = getPainColor(safeValue);

    // =================================================
    // LEVEL FROM POSITION
    // =================================================

    const getLevelFromPosition = (locationX: number) => {
        if (sliderWidth.current <= 0) {
            return;
        }

        const ratio = Math.max(
            0,
            Math.min(1, locationX / sliderWidth.current)
        );

        const level = Math.round(ratio * 10);
        onChangeRef.current(level);
    };

    // =================================================
    // PAN RESPONDER
    // =================================================

    const responder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: event => {
                getLevelFromPosition(
                    event.nativeEvent.locationX
                );
            },

            onPanResponderMove: event => {
                getLevelFromPosition(
                    event.nativeEvent.locationX
                );
            },
        })
    ).current;

    return (
        <View style={styles.sliderWrapper}>

            {/* TOP */}
            <View style={styles.sliderTop}>
                <View
                    style={[
                        styles.sliderLevelBubble,
                        {
                            backgroundColor: painColor,
                        },
                    ]}
                >
                    <Text style={styles.sliderLevelBubbleText}>
                        {safeValue}
                    </Text>
                </View>
            </View>

            {/* SLIDER */}
            <View
                style={styles.sliderTouchArea}
                {...responder.panHandlers}
                onLayout={event => {
                    sliderWidth.current =
                        event.nativeEvent.layout.width;
                }}
            >
                {/* TRACK BACKGROUND */}
                <View style={styles.sliderTrackBackground}>
                    <View
                        style={[
                            styles.sliderTrackFillClip,
                            {
                                width: `${safeValue * 10}%`,
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={painColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.sliderTrackFillGradient}
                        />
                    </View>
                </View>

                {/* COLOR TICKS 0 - 10 */}
                <View style={styles.sliderTicks}>
                    {Array.from(
                        { length: 11 },
                        (_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.sliderTick,
                                    {
                                        backgroundColor:
                                            getPainColor(index),
                                    },
                                    index === safeValue &&
                                        styles.sliderTickSelected,
                                ]}
                            />
                        )
                    )}
                </View>

                {/* THUMB */}
                <View
                    pointerEvents="none"
                    style={[
                        styles.sliderThumb,
                        {
                            left: `${safeValue * 10}%`,
                            borderColor: painColor,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.sliderThumbInner,
                            {
                                backgroundColor: painColor,
                            },
                        ]}
                    />
                </View>
            </View>

            {/* SCALE LABELS */}
            <View style={styles.sliderLabels}>
                <View style={styles.sliderScaleItem}>
                    <Text
                        style={[
                            styles.sliderScaleNumber,
                            { color: getPainColor(0) },
                        ]}
                    >
                        0
                    </Text>
                    <Text style={styles.sliderScaleText}>
                        ไม่ปวด
                    </Text>
                </View>

                <View style={styles.sliderScaleItemCenter}>
                    <Text
                        style={[
                            styles.sliderScaleNumber,
                            { color: getPainColor(5) },
                        ]}
                    >
                        5
                    </Text>
                    <Text style={styles.sliderScaleText}>
                        ปานกลาง
                    </Text>
                </View>

                <View style={styles.sliderScaleItemRight}>
                    <Text
                        style={[
                            styles.sliderScaleNumber,
                            { color: getPainColor(10) },
                        ]}
                    >
                        10
                    </Text>
                    <Text style={styles.sliderScaleText}>
                        ปวดมาก
                    </Text>
                </View>
            </View>
        </View>
    );
}

// =====================================================
// SAFETY QUESTION
// =====================================================

function SafetyQuestion({
    question,
    value,
    error,
    onChange,
}: SafetyQuestionProps & {
    error?: string;
}) {

    return (

        <View
            style={[
                styles.safetyCard,

                error &&
                styles.safetyCardError,
            ]}
        >

            <View
                style={
                    styles.safetyQuestionTop
                }
            >

                <View
                    style={
                        styles.safetyQuestionNumber
                    }
                >

                    <FontAwesome6
                        name="shield-heart"
                        size={13}
                        color="#237FFF"
                    />

                </View>


                <View
                    style={
                        styles.safetyQuestionContent
                    }
                >

                    <View
                        style={
                            styles.safetyTitleRow
                        }
                    >

                        <Text
                            style={
                                styles.safetyQuestion
                            }
                        >
                            {question}
                        </Text>


                        {error && (

                            <Text
                                style={
                                    styles.requiredStarSmall
                                }
                            >
                                *
                            </Text>

                        )}

                    </View>


                    {error && (

                        <Text
                            style={
                                styles.inlineError
                            }
                        >
                            {error}
                        </Text>

                    )}

                </View>

            </View>


            {/* =================================================
                SAME COLOR FOR YES / NO
            ================================================= */}

            <View
                style={
                    styles.answerRow
                }
            >

                {/* NO */}

                <Pressable

                    style={[
                        styles.answerButton,

                        value === false &&
                        styles.answerButtonSelected,
                    ]}

                    onPress={() =>
                        onChange(false)
                    }

                >

                    <View
                        style={[
                            styles.answerRadio,

                            value !== undefined &&
                            styles.answerRadioActive,
                        ]}
                    >

                        {value === false && (

                            <View
                                style={
                                    styles.answerRadioDot
                                }
                            />

                        )}

                    </View>


                    <Text
                        style={[
                            styles.answerText,

                            value === false &&
                            styles.answerTextSelected,
                        ]}
                    >
                        ไม่ใช่
                    </Text>

                </Pressable>


                {/* YES */}

                <Pressable

                    style={[
                        styles.answerButton,

                        value === true &&
                        styles.answerButtonSelected,
                    ]}

                    onPress={() =>
                        onChange(true)
                    }

                >

                    <View
                        style={[
                            styles.answerRadio,

                            value !== undefined &&
                            styles.answerRadioActive,
                        ]}
                    >

                        {value === true && (

                            <View
                                style={
                                    styles.answerRadioDot
                                }
                            />

                        )}

                    </View>


                    <Text
                        style={[
                            styles.answerText,

                            value === true &&
                            styles.answerTextSelected,
                        ]}
                    >
                        ใช่
                    </Text>

                </Pressable>

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

    questionContent: {
        flex: 1,

        minHeight: 0,

        position: 'relative',
    },

    content: {
        paddingTop: 5,

        paddingBottom: 0,
    },

    bottomScrollSpacer: {
        height: 105,
    },


    // =================================================
    // HEADER
    // =================================================

    header: {
        height: 64,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent:
            'space-between',

        marginTop: 8,
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

        fontSize: 19,

        fontWeight: '800',
    },

    headerBadge: {
        paddingHorizontal: 10,

        height: 32,

        borderRadius: 16,

        backgroundColor:
            'rgba(255,255,255,0.18)',

        alignItems: 'center',

        justifyContent: 'center',
    },

    headerBadgeText: {
        color: '#ffffff',

        fontSize: 10,

        fontWeight: '700',
    },


    // =================================================
    // INTRO
    // =================================================

    introCard: {
        backgroundColor: '#ffffff',

        borderRadius: 20,

        padding: 14,

        flexDirection: 'row',

        alignItems: 'center',

        marginBottom: 14,
    },

    introIcon: {
        width: 43,

        height: 43,

        borderRadius: 14,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 11,
    },

    introContent: {
        flex: 1,
    },

    introTitle: {
        color: '#1638AE',

        fontSize: 14,

        fontWeight: '800',
    },

    introText: {
        color: '#64748b',

        fontSize: 10,

        lineHeight: 16,

        marginTop: 3,
    },


    // =================================================
    // QUESTION HEADER
    // =================================================

    questionSection: {
        marginTop: 5,
    },

    questionHeaderCard: {
        backgroundColor: '#ffffff',

        borderRadius: 24,

        paddingHorizontal: 18,

        paddingVertical: 18,

        marginBottom: 14,

        borderWidth: 1,

        borderColor: '#A8CCFF',

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 4,
        },

        shadowOpacity: 0.08,

        shadowRadius: 8,

        elevation: 3,
    },

    questionHeaderError: {
        borderColor: '#D92D20',

        borderWidth: 2,
    },

    questionNumberRow: {
        flexDirection: 'row',

        alignItems: 'center',

        marginBottom: 5,
    },

    questionNumber: {
        color: '#237FFF',

        fontSize: 12,

        fontWeight: '800',

        letterSpacing: 2,
    },

    questionNumberError: {
        color: '#D92D20',
    },

    requiredStar: {
        color: '#D92D20',

        fontSize: 18,

        fontWeight: '900',

        marginLeft: 4,
    },

    questionTitle: {
        color: '#1638AE',

        fontSize: 27,

        lineHeight: 34,

        fontWeight: '800',
    },

    questionTitleError: {
        color: '#1638AE',
    },

    questionSubtitle: {
        color: '#64748b',

        fontSize: 12,

        lineHeight: 18,

        marginTop: 7,
    },

    questionSubtitleError: {
        color: '#7A271A',
    },

    headerErrorBox: {
        flexDirection: 'row',

        alignItems: 'center',

        marginTop: 9,

        paddingTop: 8,

        borderTopWidth: 1,

        borderTopColor: '#FECACA',
    },

    headerErrorText: {
        color: '#D92D20',

        fontSize: 10,

        lineHeight: 15,

        fontWeight: '700',

        marginLeft: 6,

        flex: 1,
    },


    // =================================================
    // SECTION DIVIDER
    // =================================================

    sectionDivider: {
        height: 1,

        backgroundColor:
            'rgba(168,204,255,0.55)',

        marginVertical: 24,

        marginHorizontal: 4,
    },


    // =================================================
    // AREA
    // =================================================

    areaGrid: {
        flexDirection: 'row',

        flexWrap: 'wrap',

        justifyContent:
            'space-between',

        gap: 10,

        marginBottom: 4,
    },

    areaCard: {
        width: '48%',

        minHeight: 80,

        borderRadius: 18,

        backgroundColor:
            'rgba(255,255,255,0.14)',

        borderWidth: 1,

        borderColor:
            'rgba(255,255,255,0.15)',

        padding: 12,

        flexDirection: 'row',

        alignItems: 'center',

        position: 'relative',
    },

    areaCardSelected: {
        backgroundColor: '#ffffff',

        borderColor: '#A8CCFF',
    },

    areaIcon: {
        width: 38,

        height: 38,

        borderRadius: 19,

        backgroundColor:
            'rgba(168,204,255,0.35)',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 9,
    },

    areaIconSelected: {
        backgroundColor: '#A8CCFF',
    },

    areaText: {
        flex: 1,

        color: '#ffffff',

        fontSize: 13,

        fontWeight: '700',
    },

    areaTextSelected: {
        color: '#1638AE',
    },

    checkCircle: {
        position: 'absolute',

        top: 7,

        right: 7,

        width: 20,

        height: 20,

        borderRadius: 10,

        backgroundColor: '#237FFF',

        alignItems: 'center',

        justifyContent: 'center',
    },


    // =================================================
    // LOCKED QUESTION 2
    // =================================================

    lockedQuestionCard: {
        backgroundColor:
            'rgba(255,255,255,0.10)',

        borderRadius: 20,

        borderWidth: 1,

        borderColor:
            'rgba(255,255,255,0.15)',

        padding: 22,

        alignItems: 'center',

        justifyContent: 'center',

        marginBottom: 12,
    },

    lockedIcon: {
        width: 50,

        height: 50,

        borderRadius: 18,

        backgroundColor: '#ffffff',

        alignItems: 'center',

        justifyContent: 'center',

        marginBottom: 10,
    },

    lockedText: {
        color: '#ffffff',

        fontSize: 14,

        fontWeight: '800',

        textAlign: 'center',
    },

    lockedSubText: {
        color:
            'rgba(255,255,255,0.7)',

        fontSize: 10,

        lineHeight: 16,

        textAlign: 'center',

        marginTop: 6,
    },


    // =================================================
    // SYMPTOM
    // =================================================

    symptomCard: {
        backgroundColor: '#ffffff',

        borderRadius: 22,

        padding: 16,

        marginBottom: 14,

        borderWidth: 1,

        borderColor: '#E4EEFB',

        elevation: 2,
    },

    symptomCardError: {
        borderColor: '#D92D20',

        borderWidth: 1.5,
    },

    symptomHeader: {
        flexDirection: 'row',

        alignItems: 'center',

        justifyContent:
            'space-between',

        marginBottom: 14,
    },

    areaTitleRow: {
        flexDirection: 'row',

        alignItems: 'center',

        flex: 1,
    },

    areaNameRow: {
        flexDirection: 'row',

        alignItems: 'center',
    },

    miniAreaIcon: {
        width: 32,

        height: 32,

        borderRadius: 11,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 9,
    },

    symptomTitle: {
        color: '#1638AE',

        fontSize: 16,

        fontWeight: '800',
    },

    requiredStarSmall: {
        color: '#D92D20',

        fontSize: 16,

        fontWeight: '900',

        marginLeft: 4,
    },

    inlineError: {
        color: '#D92D20',

        fontSize: 9,

        fontWeight: '700',

        marginTop: 2,
    },


    smallLabel: {
        color: '#64748b',

        fontSize: 11,

        fontWeight: '700',

        marginBottom: 8,
    },


    // =================================================
    // SLIDER
    // =================================================

    sliderWrapper: {
        width: '100%',
    },

    sliderTop: {
        alignItems: 'flex-end',
        marginBottom: 6,
    },


    sliderLevelBubble: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },

    sliderLevelBubbleText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '900',
    },

    sliderTouchArea: {
        height: 46,
        justifyContent: 'center',
        position: 'relative',
    },

    sliderTrackBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 11,
        borderRadius: 6,
        backgroundColor: '#E7F0FC',
        overflow: 'hidden',
    },

    sliderTrackFillClip: {
        height: '100%',
        borderRadius: 6,
        overflow: 'hidden',
    },

    sliderTrackFillGradient: {
        width: '100%',
        height: '100%',
    },

    sliderTicks: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    sliderTick: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },

    sliderTickSelected: {
        width: 9,
        height: 9,
        borderRadius: 5,
    },

    sliderThumb: {
        position: 'absolute',
        top: 8,
        width: 30,
        height: 30,
        marginLeft: -15,
        borderRadius: 15,
        backgroundColor: '#ffffff',
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },

    sliderThumbInner: {
        width: 9,
        height: 9,
        borderRadius: 5,
    },

    sliderLabels: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingHorizontal: 2,
    },


    sliderScaleItem: {
        alignItems: 'flex-start',
        width: 70,
    },

    sliderScaleItemCenter: {
        alignItems: 'center',
        width: 80,
    },

    sliderScaleItemRight: {
        alignItems: 'flex-end',
        width: 70,
    },

    sliderScaleNumber: {
        fontSize: 11,
        fontWeight: '900',
    },

    sliderScaleText: {
        color: '#94a3b8',
        fontSize: 8,
        fontWeight: '600',
        marginTop: 1,
    },


    // =================================================
    // CHIPS
    // =================================================

    chipWrap: {
        flexDirection: 'row',

        flexWrap: 'wrap',

        gap: 8,
    },

    chip: {
        paddingHorizontal: 13,

        height: 37,

        borderRadius: 19,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        flexDirection: 'row',
    },

    chipActive: {
        backgroundColor: '#237FFF',
    },

    chipCheck: {
        marginRight: 5,
    },

    chipText: {
        color: '#4770A8',

        fontSize: 11,

        fontWeight: '700',
    },

    chipTextActive: {
        color: '#ffffff',
    },

    bottomError: {
        flexDirection: 'row',

        alignItems: 'center',

        marginTop: 10,

        paddingTop: 8,

        borderTopWidth: 1,

        borderTopColor: '#FECACA',
    },

    bottomErrorText: {
        color: '#D92D20',

        fontSize: 9,

        fontWeight: '700',

        marginLeft: 6,
    },


    // =================================================
    // ACTIVITY
    // =================================================

    activityList: {
        gap: 10,
    },

    activityButton: {
        minHeight: 62,

        borderRadius: 18,

        backgroundColor:
            'rgba(255,255,255,0.14)',

        borderWidth: 1,

        borderColor:
            'rgba(255,255,255,0.15)',

        paddingHorizontal: 14,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent:
            'space-between',
    },

    activityButtonActive: {
        backgroundColor: '#ffffff',

        borderColor: '#A8CCFF',
    },

    activityLeft: {
        flexDirection: 'row',

        alignItems: 'center',

        flex: 1,
    },

    activityIcon: {
        width: 36,

        height: 36,

        borderRadius: 12,

        backgroundColor:
            'rgba(168,204,255,0.25)',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 10,
    },

    activityIconActive: {
        backgroundColor: '#EEF5FF',
    },

    activityText: {
        color: '#ffffff',

        fontSize: 14,

        fontWeight: '700',
    },

    activityTextActive: {
        color: '#1638AE',
    },

    radioCircle: {
        width: 23,

        height: 23,

        borderRadius: 12,

        borderWidth: 2,

        borderColor: '#A8CCFF',

        alignItems: 'center',

        justifyContent: 'center',
    },

    radioCircleActive: {
        borderColor: '#237FFF',
    },

    radioDot: {
        width: 10,

        height: 10,

        borderRadius: 5,

        backgroundColor: '#237FFF',
    },


    // =================================================
    // WARNING
    // =================================================

    warningBox: {
        flexDirection: 'row',

        alignItems: 'center',

        backgroundColor:
            'rgba(255,255,255,0.14)',

        borderWidth: 1,

        borderColor:
            'rgba(255,255,255,0.15)',

        padding: 12,

        borderRadius: 18,

        marginBottom: 12,
    },

    warningIcon: {
        width: 37,

        height: 37,

        borderRadius: 13,

        backgroundColor: '#237FFF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 10,
    },

    warningText: {
        flex: 1,

        color: '#ffffff',

        fontSize: 10,

        lineHeight: 16,

        fontWeight: '600',
    },


    // =================================================
    // SAFETY
    // =================================================

    safetyCard: {
        backgroundColor: '#ffffff',

        borderRadius: 20,

        padding: 15,

        marginBottom: 11,

        borderWidth: 1,

        borderColor: '#E4EEFB',

        elevation: 2,
    },

    safetyCardError: {
        borderColor: '#D92D20',

        borderWidth: 1.5,
    },

    safetyQuestionTop: {
        flexDirection: 'row',

        alignItems: 'flex-start',

        marginBottom: 12,
    },

    safetyQuestionNumber: {
        width: 29,

        height: 29,

        borderRadius: 10,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        marginRight: 9,
    },

    safetyQuestionContent: {
        flex: 1,
    },

    safetyTitleRow: {
        flexDirection: 'row',

        alignItems: 'flex-start',
    },

    safetyQuestion: {
        flex: 1,

        color: '#1638AE',

        fontSize: 12,

        lineHeight: 18,

        fontWeight: '700',
    },

    answerRow: {
        flexDirection: 'row',

        gap: 9,
    },

    answerButton: {
        flex: 1,

        height: 43,

        borderRadius: 13,

        backgroundColor: '#EEF5FF',

        alignItems: 'center',

        justifyContent: 'center',

        flexDirection: 'row',

        gap: 7,
    },

    answerButtonSelected: {
        backgroundColor: '#237FFF',
    },

    answerRadio: {
        width: 17,

        height: 17,

        borderRadius: 9,

        borderWidth: 2,

        borderColor: '#A8CCFF',

        alignItems: 'center',

        justifyContent: 'center',
    },

    answerRadioActive: {
        borderColor: '#ffffff',
    },

    answerRadioDot: {
        width: 7,

        height: 7,

        borderRadius: 4,

        backgroundColor: '#ffffff',
    },

    answerText: {
        color: '#4770A8',

        fontSize: 12,

        fontWeight: '700',
    },

    answerTextSelected: {
        color: '#ffffff',
    },


    // =================================================
    // SUBMIT
    // =================================================

    submitSection: {
        marginTop: 20,

        marginBottom: 5,
    },

    disclaimer: {
        color:
            'rgba(255,255,255,0.60)',

        fontSize: 9,

        lineHeight: 14,

        textAlign: 'center',

        marginBottom: 7,

        paddingHorizontal: 15,
    },

    submitHint: {
        color:
            'rgba(255,255,255,0.72)',

        fontSize: 10,

        lineHeight: 16,

        textAlign: 'center',

        marginBottom: 10,
    },

    submitButton: {
        width: '100%',

        height: 56,

        borderRadius: 28,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 9,

        elevation: 5,
    },

    submitButtonDisabled: {
        opacity: 0.7,
    },

    submitButtonText: {
        color: '#ffffff',

        fontSize: 16,

        fontWeight: '800',
    },


    // =================================================
    // FIXED BOTTOM NAV
    // =================================================

    fixedBottomNav: {
        position: 'absolute',

        left: 0,

        right: 0,

        bottom: 0,

        zIndex: 100,

        elevation: 20,

        paddingHorizontal: 20,

        paddingBottom: 10,
    },

});