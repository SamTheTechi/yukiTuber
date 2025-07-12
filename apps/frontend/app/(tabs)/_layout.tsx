import { Tabs } from 'expo-router';
import React from 'react';
import { createContext, useState } from 'react';
import { HapticTab } from '@/components/HapticTab';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';


export interface countInterface {
  count: number,
  setCount: React.Dispatch<React.SetStateAction<number>>;
}

export const countContext = createContext<countInterface | undefined>(undefined);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [count, setCount] = useState<number>(0);

  return (
    <>
      <countContext.Provider value={{ count, setCount }} >
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
              height: 90,
              paddingTop: 15,
              paddingBottom: 20,
              bottom: 5,
            },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: '',
              headerShown: false,
              tabBarIcon: ({ color }) => <MaterialIcons size={36} color={color} name='download' />,
            }}
          />
          <Tabs.Screen
            name="download"
            options={{
              title: '',
              headerShown: false,
              tabBarIcon: ({ color }) => <MaterialIcons size={36} color={color} name='folder' />,
            }}
          />
        </Tabs>
      </countContext.Provider>
    </>
  );
}
