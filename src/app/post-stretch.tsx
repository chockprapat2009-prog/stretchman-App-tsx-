import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// =====================================================
// TYPES
// =====================================================

type PainItem = {
  area?: string;
  label?: string;
  painLevel?: number;
  symptom?: string;
};

type PainAssessment = {
  painAreas?: PainItem[];
  items?: PainItem[];
  painItems?: PainItem[];
  painLevel?: number;
  activity?: string;
  safety?: {
    hasRedFlag?: boolean;
    answers?: Record<string, boolean>;
  };
  updatedAt?: number;
};

type SelectedExercise = {
  id?: string;
  name?: string;
  exerciseName?: string;
  description?: string;
  time?: string;
  area?: string;
  painLevel?: number;
  symptom?: string;
};

// =====================================================
// CONSTANTS
// =====================================================

const PAIN_COLORS = [
  '#166534',
  '#238636',
  '#3FA34D',
  '#69B34C',
  '#A4C639',
  '#EAB308',
  '#F59E0B',
  '#F97316',
  '#EF4444',
  '#DC2626',
  '#991B1B',
] as const;

// =====================================================
// HELPERS
// =====================================================

const clampPain = (value: number) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(10, Math.round(numericValue))
  );
};

const getPainColor = (level: number) => {
  return PAIN_COLORS[clampPain(level)];
};

const getPainText = (level: number) => {
  const safeLevel = clampPain(level);

  if (safeLevel === 0) {
    return 'ไม่ปวด';
  }

  if (safeLevel <= 2) {
    return 'ปวดเล็กน้อย';
  }

  if (safeLevel <= 5) {
    return 'ปวดปานกลาง';
  }

  if (safeLevel <= 8) {
    return 'ปวดมาก';
  }

  return 'ปวดมากที่สุด';
};

const getAreaLabel = (area: string) => {
  const areaLabels: Record<string, string> = {
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

    hip: 'สะโพก',

    thigh: 'ต้นขา',
    thigh_left: 'ต้นขาซ้าย',
    thigh_right: 'ต้นขาขวา',

    calf: 'น่อง',
    calf_left: 'น่องซ้าย',
    calf_right: 'น่องขวา',

    waist: 'เอว',

    other: 'อื่น ๆ',
  };

  return (
    areaLabels[area] ||
    area ||
    'บริเวณที่เลือก'
  );
};

// =====================================================
// NORMALIZE AREA
// ใช้สำหรับเทียบบริเวณของ exercise กับ pain assessment
// =====================================================

const normalizeArea = (area?: string) => {
  if (!area) {
    return '';
  }

  return area
    .toLowerCase()
    .trim()
    .replace('-left', '_left')
    .replace('-right', '_right')
    .replace(' ', '_');
};

// =====================================================
// MAIN
// =====================================================

export default function PostStretchScreen() {
  const router = useRouter();

  // =====================================================
  // PAIN
  // =====================================================

  const [beforePain, setBeforePain] = useState(0);
  const [afterPain, setAfterPain] = useState(0);

  // =====================================================
  // DATA
  // =====================================================

  const [painArea, setPainArea] = useState(
    'บริเวณที่เลือก'
  );

  const [exerciseName, setExerciseName] =
    useState('การยืดเหยียด');

  const [exerciseArea, setExerciseArea] =
    useState('');

  // =====================================================
  // QUESTIONS
  // =====================================================

  const [improvement, setImprovement] =
    useState('');

  const [movement, setMovement] =
    useState('');

  const [feeling, setFeeling] =
    useState('');

  // =====================================================
  // STATUS
  // =====================================================

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    void loadData();
  }, []);

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        assessmentData,
        exerciseData,
        exerciseNameData,
      ] = await Promise.all([
        AsyncStorage.getItem(
          'stretchmanPainAssessment'
        ),

        AsyncStorage.getItem(
          'stretchmanSelectedExercise'
        ),

        AsyncStorage.getItem(
          'exerciseName'
        ),
      ]);

      // =================================================
      // EXERCISE
      // =================================================

      let loadedExerciseArea = '';
      let loadedExerciseName = '';

      if (exerciseData) {
        try {
          const parsedExercise:
            | SelectedExercise
            | string =
            JSON.parse(exerciseData);

          if (
            typeof parsedExercise ===
            'string'
          ) {
            loadedExerciseName =
              parsedExercise;
          } else if (
            parsedExercise &&
            typeof parsedExercise ===
              'object'
          ) {
            if (
              typeof parsedExercise.name ===
                'string' &&
              parsedExercise.name.trim()
            ) {
              loadedExerciseName =
                parsedExercise.name.trim();
            } else if (
              typeof parsedExercise.exerciseName ===
                'string' &&
              parsedExercise.exerciseName.trim()
            ) {
              loadedExerciseName =
                parsedExercise.exerciseName.trim();
            }

            if (
              typeof parsedExercise.area ===
                'string' &&
              parsedExercise.area.trim()
            ) {
              loadedExerciseArea =
                parsedExercise.area.trim();
            }
          }
        } catch {
          loadedExerciseName =
            exerciseData.trim();
        }
      }

      if (exerciseNameData?.trim()) {
        loadedExerciseName =
          exerciseNameData.trim();
      }

      if (loadedExerciseName) {
        setExerciseName(
          loadedExerciseName
        );
      }

      if (loadedExerciseArea) {
        setExerciseArea(
          loadedExerciseArea
        );
      }

      // =================================================
      // PAIN ASSESSMENT
      // =================================================

      if (assessmentData) {
        try {
          const assessment:
            | PainAssessment
            | PainItem[] =
            JSON.parse(
              assessmentData
            );

          let items: PainItem[] = [];

          // =============================================
          // CURRENT FORMAT
          // =============================================

          if (
            !Array.isArray(assessment) &&
            Array.isArray(
              assessment.painAreas
            )
          ) {
            items =
              assessment.painAreas;
          }

          // =============================================
          // OLD FORMAT
          // =============================================

          else if (
            !Array.isArray(assessment) &&
            Array.isArray(
              assessment.items
            )
          ) {
            items =
              assessment.items;
          }

          else if (
            !Array.isArray(assessment) &&
            Array.isArray(
              assessment.painItems
            )
          ) {
            items =
              assessment.painItems;
          }

          else if (
            Array.isArray(assessment)
          ) {
            items = assessment;
          }

          // =============================================
          // CLEAN DATA
          // =============================================

          const validItems =
            items
              .map(item => ({
                ...item,
                painLevel:
                  clampPain(
                    Number(
                      item.painLevel ?? 0
                    )
                  ),
              }))
              .filter(
                item =>
                  Number.isFinite(
                    item.painLevel
                  )
              );

          // =============================================
          // FIND MATCHING EXERCISE AREA FIRST
          // =============================================

          let selectedPainItem:
            | PainItem
            | undefined;

          if (
            loadedExerciseArea &&
            validItems.length > 0
          ) {
            const normalizedExerciseArea =
              normalizeArea(
                loadedExerciseArea
              );

            selectedPainItem =
              validItems.find(
                item =>
                  normalizeArea(
                    item.area
                  ) ===
                    normalizedExerciseArea
              );

            // รองรับ exercise area แบบกว้าง
            if (!selectedPainItem) {
              selectedPainItem =
                validItems.find(
                  item => {
                    const currentArea =
                      normalizeArea(
                        item.area
                      );

                    return (
                      currentArea.includes(
                        normalizedExerciseArea
                      ) ||
                      normalizedExerciseArea.includes(
                        currentArea
                      )
                    );
                  }
                );
            }
          }

          // =============================================
          // IF NO MATCH -> HIGHEST PAIN
          // =============================================

          if (
            !selectedPainItem &&
            validItems.length > 0
          ) {
            selectedPainItem =
              validItems.reduce(
                (highest, item) =>
                  clampPain(
                    item.painLevel ?? 0
                  ) >
                  clampPain(
                    highest.painLevel ?? 0
                  )
                    ? item
                    : highest
              );
          }

          // =============================================
          // SET BEFORE PAIN
          // =============================================

          if (selectedPainItem) {
            const pain =
              clampPain(
                selectedPainItem.painLevel ??
                  0
              );

            setBeforePain(
              pain
            );

            setPainArea(
              getAreaLabel(
                selectedPainItem.area ||
                  selectedPainItem.label ||
                  ''
              )
            );
          }

          // =============================================
          // FALLBACK: SINGLE PAIN LEVEL
          // =============================================

          else if (
            !Array.isArray(assessment) &&
            typeof assessment.painLevel ===
              'number'
          ) {
            setBeforePain(
              clampPain(
                assessment.painLevel
              )
            );
          }
        } catch (error) {
          console.log(
            'Invalid pain assessment:',
            error
          );
        }
      }
    } catch (error) {
      console.log(
        'Load post stretch data error:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถโหลดข้อมูลก่อนยืดได้'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PAIN CHANGE
  // =====================================================

  const painChange =
    beforePain - afterPain;

  // =====================================================
  // SAVE RESULT
  // =====================================================

  const saveResult = async () => {
    if (saving) {
      return;
    }

    // ===============================================
    // VALIDATE QUESTIONS
    // ===============================================

    if (
      !improvement ||
      !movement ||
      !feeling
    ) {
      Alert.alert(
        'กรุณาตอบให้ครบ',
        'กรุณาตอบคำถามที่ 2 - 4 ให้ครบก่อนบันทึกผล'
      );

      return;
    }

    try {
      setSaving(true);

      const now =
        new Date();

      const id =
        `${Date.now()}`;

      const result = {
        id,

        date:
          now.toLocaleDateString(
            'th-TH'
          ),

        timestamp:
          now.toISOString(),

        exerciseName,

        exerciseArea,

        painArea,

        beforePain:
          clampPain(
            beforePain
          ),

        afterPain:
          clampPain(
            afterPain
          ),

        painChange:
          clampPain(
            beforePain
          ) -
          clampPain(
            afterPain
          ),

        improvement,

        movement,

        feeling,
      };

      // =================================================
      // POST-STRETCH HISTORY
      // =================================================

      let postHistory:
        Record<string, unknown>[] =
        [];

      const oldPostHistory =
        await AsyncStorage.getItem(
          'stretchmanPostStretchHistory'
        );

      if (oldPostHistory) {
        try {
          const parsed =
            JSON.parse(
              oldPostHistory
            );

          if (
            Array.isArray(parsed)
          ) {
            postHistory =
              parsed;
          }
        } catch {
          postHistory = [];
        }
      }

      postHistory.push(
        result
      );

      await AsyncStorage.setItem(
        'stretchmanPostStretchHistory',
        JSON.stringify(
          postHistory
        )
      );

      // =================================================
      // PAIN HISTORY
      // =================================================

      let painHistory:
        Record<string, unknown>[] =
        [];

      const oldPainHistory =
        await AsyncStorage.getItem(
          'stretchmanPainHistory'
        );

      if (oldPainHistory) {
        try {
          const parsed =
            JSON.parse(
              oldPainHistory
            );

          if (
            Array.isArray(parsed)
          ) {
            painHistory =
              parsed;
          }
        } catch {
          painHistory = [];
        }
      }

      painHistory.push({
        id,

        date:
          result.date,

        timestamp:
          result.timestamp,

        exerciseName:
          result.exerciseName,

        exerciseArea:
          result.exerciseArea,

        area:
          result.painArea,

        beforePain:
          result.beforePain,

        afterPain:
          result.afterPain,

        painChange:
          result.painChange,

        improvement:
          result.improvement,

        movement:
          result.movement,

        feeling:
          result.feeling,
      });

      await AsyncStorage.setItem(
        'stretchmanPainHistory',
        JSON.stringify(
          painHistory
        )
      );

      // =================================================
      // VERIFY SAVE
      // =================================================

      const verifyPost =
        await AsyncStorage.getItem(
          'stretchmanPostStretchHistory'
        );

      const verifyPain =
        await AsyncStorage.getItem(
          'stretchmanPainHistory'
        );

      if (!verifyPost || !verifyPain) {
        throw new Error(
          'ตรวจสอบข้อมูลหลังบันทึกไม่สำเร็จ'
        );
      }

      console.log(
        '✅ POST STRETCH SAVED',
        result
      );

      // =================================================
      // SUCCESS ALERT
      // =================================================

      Alert.alert(
  'บันทึกผลเรียบร้อย 🎉',
  `ก่อนยืด ${result.beforePain}/10\nหลังยืด ${result.afterPain}/10\n\n${
    result.painChange > 0
      ? `ระดับความปวดลดลง ${result.painChange} คะแนน`
      : result.painChange < 0
        ? `ระดับความปวดเพิ่มขึ้น ${Math.abs(
            result.painChange
          )} คะแนน`
        : 'ระดับความปวดยังเท่าเดิม'
  }`,
  [
    {
      text: 'กลับหน้า Home',
      onPress: () => {
        router.replace('/' as any);
      },
    },
  ]
);
    } catch (error) {
      console.log(
        '❌ Save post stretch error:',
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

  // =====================================================
  // CHOICE
  // =====================================================

  const renderChoice = (
    value: string,
    currentValue: string,
    label: string,
    onPress: () => void
  ) => {
    const selected =
      value === currentValue;

    return (
      <TouchableOpacity
        style={[
          styles.choiceButton,
          selected &&
            styles.choiceButtonSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.radio,
            selected &&
              styles.radioSelected,
          ]}
        >
          {selected && (
            <View
              style={
                styles.radioDot
              }
            />
          )}
        </View>

        <Text
          style={[
            styles.choiceText,
            selected &&
              styles.choiceTextSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <FontAwesome6
          name="spinner"
          size={30}
          color="#43a5ff"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          กำลังโหลดข้อมูลก่อนยืด...
        </Text>
      </View>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.container
        }
      >
        {/* HEADER */}

        <View
          style={styles.header}
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
            activeOpacity={0.8}
          >
            <FontAwesome6
              name="arrow-left"
              size={18}
              color="#43a5ff"
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={styles.title}
            >
              แบบสอบถามหลังยืด
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              บันทึกความรู้สึกหลังจากยืดเหยียด
            </Text>
          </View>
        </View>

        {/* EXERCISE CARD */}

        <View
          style={
            styles.exerciseCard
          }
        >
          <View
            style={
              styles.exerciseIcon
            }
          >
            <FontAwesome6
              name="person-running"
              size={25}
              color="#43a5ff"
            />
          </View>

          <View
            style={
              styles.exerciseInfo
            }
          >
            <Text
              style={
                styles.exerciseLabel
              }
            >
              ท่าที่ทำ
            </Text>

            <Text
              style={
                styles.exerciseNameText
              }
            >
              {exerciseName}
            </Text>

            {painArea !==
              'บริเวณที่เลือก' && (
              <Text
                style={
                  styles.exerciseAreaText
                }
              >
                บริเวณ: {painArea}
              </Text>
            )}
          </View>
        </View>

        {/* =================================================
            QUESTION 1
        ================================================= */}

        <View
          style={styles.card}
        >
          <Text
            style={
              styles.questionNumber
            }
          >
            คำถามที่ 1
          </Text>

          <Text
            style={
              styles.question
            }
          >
            ตอนนี้คุณรู้สึกปวดบริเวณนี้ระดับไหน?
          </Text>

          <Text
            style={styles.areaText}
          >
            บริเวณ: {painArea}
          </Text>

          {/* AFTER PAIN */}

          <View
            style={
              styles.painValueContainer
            }
          >
            <Text
              style={[
                styles.painValue,
                {
                  color:
                    getPainColor(
                      afterPain
                    ),
                },
              ]}
            >
              {afterPain}
            </Text>

            <Text
              style={
                styles.painOutOf
              }
            >
              /10
            </Text>
          </View>

          <Text
            style={[
              styles.painDescription,
              {
                color:
                  getPainColor(
                    afterPain
                  ),
              },
            ]}
          >
            {getPainText(
              afterPain
            )}
          </Text>

          <PainSlider
            value={afterPain}
            onChange={
              setAfterPain
            }
          />
        </View>

        {/* =================================================
            BEFORE / AFTER
        ================================================= */}

        <View
          style={
            styles.compareCard
          }
        >
          <Text
            style={
              styles.compareTitle
            }
          >
            เปรียบเทียบก่อนและหลังยืด
          </Text>

          <View
            style={
              styles.compareRow
            }
          >
            {/* BEFORE */}

            <View
              style={
                styles.compareItem
              }
            >
              <Text
                style={
                  styles.compareLabel
                }
              >
                ก่อนยืด
              </Text>

              <Text
                style={[
                  styles.compareNumber,
                  {
                    color:
                      getPainColor(
                        beforePain
                      ),
                  },
                ]}
              >
                {beforePain}/10
              </Text>
            </View>

            <FontAwesome6
              name="arrow-right"
              size={20}
              color="#718096"
            />

            {/* AFTER */}

            <View
              style={
                styles.compareItem
              }
            >
              <Text
                style={
                  styles.compareLabel
                }
              >
                หลังยืด
              </Text>

              <Text
                style={[
                  styles.compareNumber,
                  {
                    color:
                      getPainColor(
                        afterPain
                      ),
                  },
                ]}
              >
                {afterPain}/10
              </Text>
            </View>
          </View>

          <View
            style={
              styles.changeBox
            }
          >
            <FontAwesome6
              name={
                painChange > 0
                  ? 'arrow-trend-down'
                  : painChange < 0
                    ? 'arrow-trend-up'
                    : 'equals'
              }
              size={17}
              color="#43a5ff"
            />

            <Text
              style={
                styles.changeText
              }
            >
              {painChange > 0
                ? `ระดับความปวดลดลง ${painChange} คะแนน`
                : painChange < 0
                  ? `ระดับความปวดเพิ่มขึ้น ${Math.abs(
                      painChange
                    )} คะแนน`
                  : 'ระดับความปวดยังเท่าเดิม'}
            </Text>
          </View>
        </View>

        {/* =================================================
            QUESTION 2
        ================================================= */}

        <View
          style={styles.card}
        >
          <Text
            style={
              styles.questionNumber
            }
          >
            คำถามที่ 2
          </Text>

          <Text
            style={
              styles.question
            }
          >
            หลังยืดแล้ว อาการโดยรวมเป็นอย่างไร?
          </Text>

          {renderChoice(
            'better',
            improvement,
            'ดีขึ้น',
            () =>
              setImprovement(
                'better'
              )
          )}

          {renderChoice(
            'same',
            improvement,
            'เท่าเดิม',
            () =>
              setImprovement(
                'same'
              )
          )}

          {renderChoice(
            'worse',
            improvement,
            'มากขึ้น',
            () =>
              setImprovement(
                'worse'
              )
          )}
        </View>

        {/* =================================================
            QUESTION 3
        ================================================= */}

        <View
          style={styles.card}
        >
          <Text
            style={
              styles.questionNumber
            }
          >
            คำถามที่ 3
          </Text>

          <Text
            style={
              styles.question
            }
          >
            หลังยืดแล้ว การเคลื่อนไหวรู้สึกอย่างไร?
          </Text>

          {renderChoice(
            'better',
            movement,
            'เคลื่อนไหวได้ดีขึ้น',
            () =>
              setMovement(
                'better'
              )
          )}

          {renderChoice(
            'same',
            movement,
            'รู้สึกเท่าเดิม',
            () =>
              setMovement(
                'same'
              )
          )}

          {renderChoice(
            'worse',
            movement,
            'เคลื่อนไหวได้น้อยลง',
            () =>
              setMovement(
                'worse'
              )
          )}
        </View>

        {/* =================================================
            QUESTION 4
        ================================================= */}

        <View
          style={styles.card}
        >
          <Text
            style={
              styles.questionNumber
            }
          >
            คำถามที่ 4
          </Text>

          <Text
            style={
              styles.question
            }
          >
            หลังยืดแล้ว ร่างกายรู้สึกอย่างไร?
          </Text>

          {renderChoice(
            'relaxed',
            feeling,
            'รู้สึกผ่อนคลาย',
            () =>
              setFeeling(
                'relaxed'
              )
          )}

          {renderChoice(
            'normal',
            feeling,
            'รู้สึกปกติ',
            () =>
              setFeeling(
                'normal'
              )
          )}

          {renderChoice(
            'uncomfortable',
            feeling,
            'รู้สึกไม่สบาย',
            () =>
              setFeeling(
                'uncomfortable'
              )
          )}
        </View>

        {/* NOTE */}

        <View
          style={
            styles.noteCard
          }
        >
          <FontAwesome6
            name="circle-info"
            size={17}
            color="#43a5ff"
          />

          <Text
            style={
              styles.noteText
            }
          >
            ข้อมูลนี้ใช้สำหรับติดตามความรู้สึกและความก้าวหน้าของคุณ
            ไม่ใช่การวินิจฉัยทางการแพทย์
          </Text>
        </View>

        {/* SAVE BUTTON */}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            saving &&
              styles.primaryButtonDisabled,
          ]}
          onPress={
            saveResult
          }
          disabled={saving}
          activeOpacity={0.85}
        >
          <FontAwesome6
            name={
              saving
                ? 'spinner'
                : 'floppy-disk'
            }
            size={17}
            color="#fff"
          />

          <Text
            style={
              styles.primaryButtonText
            }
          >
            {saving
              ? 'กำลังบันทึก...'
              : 'บันทึกผล'}
          </Text>
        </TouchableOpacity>

        <View
          style={{ height: 30 }}
        />
      </ScrollView>
    </View>
  );
}

// =====================================================
// PAIN SLIDER
// =====================================================

function PainSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const sliderWidth =
    useRef(0);

  const onChangeRef =
    useRef(onChange);

  useEffect(() => {
    onChangeRef.current =
      onChange;
  }, [onChange]);

  const safeValue =
    clampPain(value);

  const getLevelFromPosition =
    (locationX: number) => {
      if (
        sliderWidth.current <=
        0
      ) {
        return;
      }

      const ratio =
        Math.max(
          0,
          Math.min(
            1,
            locationX /
              sliderWidth.current
          )
        );

      const level =
        Math.round(
          ratio * 10
        );

      onChangeRef.current(
        level
      );
    };

  const panResponder =
    useRef(
      PanResponder.create({
        onStartShouldSetPanResponder:
          () => true,

        onMoveShouldSetPanResponder:
          () => true,

        onPanResponderGrant:
          event => {
            getLevelFromPosition(
              event.nativeEvent
                .locationX
            );
          },

        onPanResponderMove:
          event => {
            getLevelFromPosition(
              event.nativeEvent
                .locationX
            );
          },
      })
    ).current;

  return (
    <View
      style={
        styles.sliderWrapper
      }
    >
      {/* TOP */}

      <View
        style={
          styles.sliderTop
        }
      >
        <Text
          style={
            styles.sliderCaption
          }
        >
          เลื่อนเพื่อเลือกระดับความปวด
        </Text>

        <View
          style={[
            styles.sliderLevelBubble,
            {
              backgroundColor:
                getPainColor(
                  safeValue
                ),
            },
          ]}
        >
          <Text
            style={
              styles.sliderLevelBubbleText
            }
          >
            {safeValue}
          </Text>
        </View>
      </View>

      {/* TRACK */}

      <View
        style={
          styles.sliderTouchArea
        }
        {...panResponder.panHandlers}
        onLayout={event => {
          sliderWidth.current =
            event.nativeEvent.layout.width;
        }}
      >
        {/* TRACK BACKGROUND */}

        <View
          style={
            styles.sliderTrackBackground
          }
        >
          <View
            style={[
              styles.sliderTrackFillClip,
              {
                width: `${safeValue * 10}%`,
              },
            ]}
          >
            <LinearGradient
              colors={
                PAIN_COLORS
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
                styles.sliderTrackFillGradient
              }
            />
          </View>
        </View>

        {/* TICKS */}

        <View
          style={
            styles.sliderTicks
          }
          pointerEvents="none"
        >
          {Array.from(
            { length: 11 },
            (_, index) => {
              const selected =
                index ===
                safeValue;

              const size =
                selected
                  ? 11
                  : 9;

              return (
                <View
                  key={`tick-${index}`}
                  style={[
                    styles.sliderTick,
                    {
                      left: `${index * 10}%`,
                      width: size,
                      height: size,
                      marginLeft:
                        -size / 2,
                      marginTop:
                        -size / 2,
                      backgroundColor:
                        getPainColor(
                          index
                        ),
                      borderRadius:
                        size / 2,
                      borderWidth:
                        selected
                          ? 2
                          : 1.5,
                    },
                  ]}
                />
              );
            }
          )}
        </View>

        {/* THUMB */}

        <View
          pointerEvents="none"
          style={[
            styles.sliderThumb,
            {
              left: `${safeValue * 10}%`,
              borderColor:
                getPainColor(
                  safeValue
                ),
            },
          ]}
        >
          <View
            style={[
              styles.sliderThumbInner,
              {
                backgroundColor:
                  getPainColor(
                    safeValue
                  ),
              },
            ]}
          />
        </View>
      </View>

      {/* LABELS */}

      <View
        style={
          styles.sliderLabels
        }
      >
        <View
          style={
            styles.sliderScaleItem
          }
        >
          <Text
            style={[
              styles.sliderScaleNumber,
              {
                color:
                  getPainColor(
                    0
                  ),
              },
            ]}
          >
            0
          </Text>

          <Text
            style={
              styles.sliderScaleText
            }
          >
            ไม่ปวด
          </Text>

          <Text
            style={[
              styles.sliderScaleSubText,
              {
                color:
                  getPainColor(
                    0
                  ),
              },
            ]}
          >
            0 ไม่ปวด
          </Text>
        </View>

        <View
          style={
            styles.sliderScaleItemCenter
          }
        >
          <Text
            style={[
              styles.sliderScaleNumber,
              {
                color:
                  getPainColor(
                    5
                  ),
              },
            ]}
          >
            5
          </Text>

          <Text
            style={
              styles.sliderScaleText
            }
          >
            ปานกลาง
          </Text>

          <Text
            style={
              styles.sliderScaleCenterValue
            }
          >
            {safeValue}/10
          </Text>
        </View>

        <View
          style={
            styles.sliderScaleItemRight
          }
        >
          <Text
            style={[
              styles.sliderScaleNumber,
              {
                color:
                  getPainColor(
                    10
                  ),
              },
            ]}
          >
            10
          </Text>

          <Text
            style={
              styles.sliderScaleText
            }
          >
            ปวดมาก
          </Text>

          <Text
            style={[
              styles.sliderScaleSubTextRight,
              {
                color:
                  getPainColor(
                    10
                  ),
              },
            ]}
          >
            10 ปวดมาก
          </Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({
    loadingScreen: {
      flex: 1,
      backgroundColor:
        '#e9f8ff',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 14,
      color:
        '#16324f',
      fontSize: 15,
      fontWeight:
        '600',
    },

    screen: {
      flex: 1,
      backgroundColor:
        '#e9f8ff',
    },

    container: {
      flexGrow: 1,
      padding: 25,
      paddingBottom: 50,
    },

    header: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 25,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#fff',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 12,
      shadowColor:
        '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity:
        0.06,
      shadowRadius: 8,
      elevation: 2,
    },

    headerText: {
      flex: 1,
    },

    title: {
      fontSize: 27,
      fontWeight:
        '700',
      color:
        '#16324f',
    },

    subtitle: {
      marginTop: 5,
      color:
        '#718096',
      fontSize: 14,
    },

    exerciseCard: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        '#fff',
      padding: 16,
      borderRadius: 18,
      marginBottom: 25,
      shadowColor:
        '#000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity:
        0.06,
      shadowRadius: 20,
      elevation: 3,
    },

    exerciseIcon: {
      width: 55,
      height: 55,
      borderRadius: 15,
      backgroundColor:
        '#e8f5ff',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 15,
    },

    exerciseInfo: {
      flex: 1,
    },

    exerciseLabel: {
      fontSize: 12,
      color:
        '#8a96a3',
    },

    exerciseNameText: {
      marginTop: 3,
      fontSize: 17,
      fontWeight:
        '600',
      color:
        '#26384a',
    },

    exerciseAreaText: {
      marginTop: 4,
      fontSize: 12,
      color:
        '#8a96a3',
    },

    card: {
      backgroundColor:
        '#fff',
      borderRadius: 18,
      padding: 20,
      marginBottom: 20,
      shadowColor:
        '#000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity:
        0.06,
      shadowRadius: 20,
      elevation: 3,
    },

    questionNumber: {
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#43a5ff',
      marginBottom: 7,
    },

    question: {
      fontSize: 18,
      fontWeight:
        '600',
      color:
        '#16324f',
      lineHeight: 26,
    },

    areaText: {
      marginTop: 7,
      color:
        '#8a96a3',
      fontSize: 13,
    },

    painValueContainer: {
      flexDirection:
        'row',
      justifyContent:
        'center',
      alignItems:
        'baseline',
      marginTop: 16,
    },

    painValue: {
      fontSize: 52,
      fontWeight:
        '700',
    },

    painOutOf: {
      fontSize: 19,
      color:
        '#718096',
      marginLeft: 3,
    },

    painDescription: {
      textAlign:
        'center',
      fontSize: 14,
      fontWeight:
        '600',
      marginTop: -3,
      marginBottom: 20,
    },

    // ===================================================
    // SLIDER
    // ===================================================

    sliderWrapper: {
      width: '100%',
      marginTop: 2,
    },

    sliderTop: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom: 8,
    },

    sliderCaption: {
      color:
        '#718096',
      fontSize: 12,
    },

    sliderLevelBubble: {
      minWidth: 34,
      height: 30,
      paddingHorizontal: 9,
      borderRadius: 10,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    sliderLevelBubbleText: {
      color:
        '#fff',
      fontSize: 14,
      fontWeight:
        '700',
    },

    sliderTouchArea: {
      height: 34,
      justifyContent:
        'center',
      position:
        'relative',
    },

    sliderTrackBackground: {
      position:
        'absolute',
      left: 0,
      right: 0,
      height: 11,
      borderRadius: 6,
      backgroundColor:
        '#e6edf4',
      overflow:
        'hidden',
    },

    sliderTrackFillClip: {
      height: 11,
      overflow:
        'hidden',
      borderRadius: 6,
    },

    sliderTrackFillGradient: {
      width: '100%',
      height: 11,
    },

    sliderTicks: {
      position:
        'absolute',
      left: 0,
      right: 0,
      top: 17,
      height: 1,
    },

    sliderTick: {
      position:
        'absolute',
      top: 0,
      borderColor:
        '#fff',
    },

    sliderThumb: {
      position:
        'absolute',
      width: 25,
      height: 25,
      borderRadius: 13,
      marginLeft: -12.5,
      backgroundColor:
        '#fff',
      borderWidth: 3,
      shadowColor:
        '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity:
        0.15,
      shadowRadius: 4,
      elevation: 4,
    },

    sliderThumbInner: {
      position:
        'absolute',
      width: 11,
      height: 11,
      borderRadius: 6,
      left: 4,
      top: 4,
    },

    sliderLabels: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      marginTop: 5,
    },

    sliderScaleItem: {
      alignItems:
        'flex-start',
    },

    sliderScaleItemCenter: {
      alignItems:
        'center',
    },

    sliderScaleItemRight: {
      alignItems:
        'flex-end',
    },

    sliderScaleNumber: {
      fontSize: 12,
      fontWeight:
        '700',
    },

    sliderScaleText: {
      color:
        '#8a96a3',
      fontSize: 10,
      marginTop: 1,
    },

    sliderScaleSubText: {
      fontSize: 11,
      fontWeight:
        '600',
      marginTop: 2,
    },

    sliderScaleSubTextRight: {
      fontSize: 11,
      fontWeight:
        '600',
      marginTop: 2,
    },

    sliderScaleCenterValue: {
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#43a5ff',
      marginTop: 2,
    },

    // ===================================================
    // COMPARE
    // ===================================================

    compareCard: {
      backgroundColor:
        '#fff',
      borderRadius: 18,
      padding: 20,
      marginBottom: 20,
      shadowColor:
        '#000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity:
        0.06,
      shadowRadius: 20,
      elevation: 3,
    },

    compareTitle: {
      fontSize: 16,
      fontWeight:
        '600',
      color:
        '#16324f',
      textAlign:
        'center',
      marginBottom: 18,
    },

    compareRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-around',
    },

    compareItem: {
      alignItems:
        'center',
      minWidth: 90,
    },

    compareLabel: {
      color:
        '#718096',
      fontSize: 13,
      marginBottom: 4,
    },

    compareNumber: {
      fontSize: 25,
      fontWeight:
        '700',
    },

    changeBox: {
      marginTop: 18,
      backgroundColor:
        '#e8f5ff',
      borderRadius: 13,
      padding: 12,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    changeText: {
      color:
        '#43a5ff',
      fontSize: 13,
      fontWeight:
        '600',
      marginLeft: 8,
      textAlign:
        'center',
    },

    // ===================================================
    // CHOICES
    // ===================================================

    choiceButton: {
      minHeight: 53,
      borderWidth: 1,
      borderColor:
        '#d9eefe',
      borderRadius: 15,
      paddingHorizontal: 15,
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 10,
      backgroundColor:
        '#fff',
    },

    choiceButtonSelected: {
      backgroundColor:
        '#e8f5ff',
      borderColor:
        '#43a5ff',
    },

    radio: {
      width: 21,
      height: 21,
      borderRadius: 11,
      borderWidth: 2,
      borderColor:
        '#b8c3ce',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 12,
    },

    radioSelected: {
      borderColor:
        '#43a5ff',
    },

    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        '#43a5ff',
    },

    choiceText: {
      color:
        '#4a5a6a',
      fontSize: 15,
      fontWeight:
        '500',
    },

    choiceTextSelected: {
      color:
        '#43a5ff',
      fontWeight:
        '600',
    },

    // ===================================================
    // NOTE
    // ===================================================

    noteCard: {
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      backgroundColor:
        '#e8f5ff',
      padding: 15,
      borderRadius: 16,
      marginBottom: 20,
    },

    noteText: {
      flex: 1,
      color:
        '#718096',
      fontSize: 12,
      lineHeight: 18,
      marginLeft: 10,
    },

    // ===================================================
    // SAVE
    // ===================================================

    primaryButton: {
      backgroundColor:
        '#43a5ff',
      minHeight: 52,
      borderRadius: 15,
      flexDirection:
        'row',
      justifyContent:
        'center',
      alignItems:
        'center',
      shadowColor:
        '#43a5ff',
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity:
        0.25,
      shadowRadius: 18,
      elevation: 4,
    },

    primaryButtonDisabled: {
      opacity: 0.6,
    },

    primaryButtonText: {
      color:
        '#fff',
      fontSize: 15,
      fontWeight:
        '600',
      marginLeft: 9,
    },
  });