import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
    title: string;
    selectedTab: 'focus' | 'deadline' | 'friend' | 'record';
    children: React.ReactNode;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function PageTemplate({ title, selectedTab, children }: Props) {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';

    const scrollRef = useRef<ScrollView>(null);
    const tabRefs = useRef<{ [key: string]: TouchableOpacity | null }>({});

    const tabs = [
        { key: 'focus', label: '專注模式', path: '/focusMode' },
        { key: 'deadline', label: '任務清單', path: '/deadlineList' },
        { key: 'friend', label: '好友列表', path: '/friendList' },
        { key: 'record', label: '我的紀錄', path: '/myRecord' },
    ];

    useEffect(() => {
        const tab = tabRefs.current[selectedTab];
        if (!tab || !scrollRef.current) return;

        tab.measureLayout(
            scrollRef.current.getNativeScrollRef(),
            (x, y, width) => {
                const scrollToX = x + width / 2 - SCREEN_WIDTH / 2;

                scrollRef.current?.scrollTo({
                    x: scrollToX,
                    animated: true
                });
            },
            (err) => console.log('measureLayout error', err)
        );
    }, [selectedTab]);

    return (
      <ThemedView style={[styles.container, {width: SCREEN_WIDTH, height: SCREEN_HEIGHT}]}>
        {/* 頁面名稱 */}
        <View style={styles.header}>
            <ThemedText type="header">{title}</ThemedText>
        </View>

        {/* 上面那行Tabs */}
        <View style={styles.tabContainer}>
        <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
        >
            {tabs.map((tab) => {
                const isActive = tab.key === selectedTab;

                return (
                    <View
                        key={tab.key}
                        ref={(ref) => (tabRefs.current[tab.key] = ref)}
                    >
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                isActive && { backgroundColor: '#000' },
                            ]}
                            onPress={() => router.push(tab.path)}
                        >
                        <Text
                            style={[
                            styles.tabText,
                            isActive && { color: '#fff' },
                            ]}
                        >
                            {tab.label}
                        </Text>
                        </TouchableOpacity>
                    </View>
                );
            })}
        </ScrollView>
        </View>

        {/* 頁面內容 */}
        <View style={styles.contentBox}>
            {children}
        </View>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        backgroundColor: "#E0E1DD",
        paddingHorizontal: 10,
    },

    header: {
        alignItems: 'center',
        marginBottom: 20,
    },

    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        // paddingHorizontal: 10,
    },

    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginHorizontal: 5,
        borderRadius: 20,
        backgroundColor: '#f2f2f2',
    },

    tabText: {
        fontSize: 14,
        color: '#0D1B2A',
    },

    contentBox: {
        flex: 1,
        // backgroundColor: '#f7f7f7',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: "100%",
        height: "100%",
        marginBottom: 20,
        paddingHorizontal: 10,
    },

    contentScroll: {
        paddingBottom: 40, // 避免內容被底部邊界貼住
    }
});
