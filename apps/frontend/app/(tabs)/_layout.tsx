import { Tabs } from 'expo-router';
import { createContext, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HapticTab } from '@/components/HapticTab';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/colors';
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
    <countContext.Provider value={{ count, setCount }} >
      <GestureHandlerRootView>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
              height: 80,
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
      </GestureHandlerRootView>
    </countContext.Provider>
  );
}
