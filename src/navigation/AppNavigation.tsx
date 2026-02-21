/**
 * App Navigation — Bottom tabs + Auth stack
 */
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { RetailExplorerScreen } from '../screens/RetailExplorerScreen';
import { DataExplorerScreen } from '../screens/DataExplorerScreen';
import { ConfigScreen } from '../screens/ConfigScreen';

// Type definitions
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Chat: undefined;
  Retail: undefined;
  Data: undefined;
  Config: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icon component
function TabIcon({ emoji, focused, color }: { emoji: string; focused: boolean; color: string }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <Text style={[styles.tabIconEmoji, { opacity: focused ? 1 : 0.6 }]}>{emoji}</Text>
    </View>
  );
}

// Main Tab Navigator
function MainTabs({ role }: { role: string | null }) {
  const theme = useTheme();
  const isAdmin = role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.headerBg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBg,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.colors.accentBlue,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Chat IA',
          headerTitle: 'Chat IA',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="🤖" focused={focused} color={color} />
          ),
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Panel',
            headerTitle: 'Invia Pipeline',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon emoji="📊" focused={focused} color={color} />
            ),
          }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Retail"
          component={RetailExplorerScreen}
          options={{
            title: 'Retail',
            headerTitle: 'Explorador Retail',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon emoji="🛒" focused={focused} color={color} />
            ),
          }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Data"
          component={DataExplorerScreen}
          options={{
            title: 'Data',
            headerTitle: 'Data Explorer',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon emoji="🗃️" focused={focused} color={color} />
            ),
          }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Config"
          component={ConfigScreen}
          options={{
            title: 'Ajustes',
            headerTitle: 'Configuración',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon emoji="⚙️" focused={focused} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Root navigator with auth flow
interface AppNavigationProps {
  isAuthenticated: boolean;
  role: string | null;
}

export function AppNavigation({ isAuthenticated, role }: AppNavigationProps) {
  const theme = useTheme();

  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.accentBlue,
      background: theme.colors.bgPrimary,
      card: theme.colors.bgCard,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main">
            {() => <MainTabs role={role} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animationTypeForReplace: 'pop' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 28,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabIconEmoji: {
    fontSize: 20,
  },
});
