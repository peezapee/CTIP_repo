// App.js
// Entry point of the mobile app.
// Handles login state and switches between Login screen and the main app.

import React, { useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from './src/screens/LoginScreen'
import MainApp from './src/screens/MainApp'

const Stack = createNativeStackNavigator()

export default function App() {
  // currentUser = null means nobody logged in
  const [currentUser, setCurrentUser] = useState(null)

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {currentUser == null ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={setCurrentUser} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main">
            {(props) => (
              <MainApp
                {...props}
                user={currentUser}
                onLogout={() => setCurrentUser(null)}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
