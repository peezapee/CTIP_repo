import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Guide Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import TrainingScreen from './screens/TrainingScreen';
import CertificateScreen from './screens/CertificateScreen';
import ProfileScreen from './screens/ProfileScreen';
import MonitoringScreen from './screens/MonitoringScreen';

// Admin Screens
import AdminDashboard from './screens/admin/AdminDashboard';
import AdminModuleManager from './screens/admin/AdminModuleManager';
import AdminUsersManager from './screens/admin/AdminUsersManager';
import AdminProfileScreen from './screens/admin/AdminProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function GuideStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarLabel: route.name,
        headerShown: false,
        tabBarActiveTintColor: '#2d6a4f',
        tabBarInactiveTintColor: '#999',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: '🏠 Home' }}
      />
      <Tab.Screen 
        name="Training" 
        component={TrainingScreen}
        options={{ title: '📚 Training' }}
      />
      <Tab.Screen 
        name="Certificates" 
        component={CertificateScreen}
        options={{ title: '🎖️ Certs' }}
      />
      <Tab.Screen 
        name="Monitoring" 
        component={MonitoringScreen}
        options={{ title: '📷 Monitor' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: '👤 Profile' }}
      />
    </Tab.Navigator>
  );
}

function AdminStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarLabel: route.name,
        headerShown: false,
        tabBarActiveTintColor: '#1565c0',
        tabBarInactiveTintColor: '#999',
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboard}
        options={{ title: '📊 Dashboard' }}
      />
      <Tab.Screen 
        name="Modules" 
        component={AdminModuleManager}
        options={{ title: '📚 Modules' }}
      />
      <Tab.Screen 
        name="Users" 
        component={AdminUsersManager}
        options={{ title: '👥 Users' }}
      />
      <Tab.Screen 
        name="AdminProfile" 
        component={AdminProfileScreen}
        options={{ title: '⚙️ Admin' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'guide');
          } else {
            setUserRole('guide'); // Default role
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('guide');
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : userRole === 'admin' ? (
        <AdminStack />
      ) : (
        <GuideStack />
      )}
    </NavigationContainer>
  );
}

