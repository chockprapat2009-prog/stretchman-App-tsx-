// src/context/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// กำหนด Type
interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

// สร้าง Context
const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemColorScheme = useColorScheme(); // ดึงค่าเริ่มต้นจากเครื่อง (iOS/Android)
    const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');

    // โหลดค่าตอนเปิดแอป
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('app_theme');
                if (savedTheme !== null) {
                    setIsDarkMode(savedTheme === 'dark');
                }
            } catch (error) {
                console.error("Error loading theme:", error);
            }
        };
        loadTheme();
    }, []);

    // ฟังก์ชันสลับโหมด
    const toggleTheme = async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        try {
            await AsyncStorage.setItem('app_theme', newMode ? 'dark' : 'light');
        } catch (error) {
            console.error("Error saving theme:", error);
        }
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom Hook สำหรับเรียกใช้ในหน้าอื่นๆ
export const useTheme = () => useContext(ThemeContext);
