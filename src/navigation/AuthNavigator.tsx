import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EmailScreen } from '../screens/auth/EmailScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { TermsScreen } from '../screens/auth/TermsScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { BreedScreen } from '../screens/onboarding/BreedScreen';
import { CollarScreen } from '../screens/onboarding/CollarScreen';
import { FeaturesScreen } from '../screens/onboarding/FeaturesScreen';
import { OwnerScreen } from '../screens/onboarding/OwnerScreen';
import { PetSetupScreen } from '../screens/onboarding/PetSetupScreen';
import { SplashScreen } from '../screens/splash/SplashScreen';
import { useAppStore } from '../store/useAppStore';
import type { AuthStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const startRegistration = useAppStore((state) => state.startRegistration);
  const loginWithEmail = useAppStore((state) => state.loginWithEmail);
  const finishOnboarding = useAppStore((state) => state.finishOnboarding);

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash">
        {({ navigation }) => <SplashScreen onFinished={() => navigation.replace('Welcome')} />}
      </Stack.Screen>
      <Stack.Screen name="Welcome">
        {({ navigation }) => (
          <WelcomeScreen
            onStart={() => navigation.navigate('Email', { mode: 'register' })}
            onLogin={() => navigation.navigate('Email', { mode: 'login' })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Email">
        {({ navigation, route }) => (
          <EmailScreen
            mode={route.params.mode}
            onBack={() => navigation.goBack()}
            onSwitch={() =>
              navigation.setParams({
                mode: route.params.mode === 'register' ? 'login' : 'register',
              })
            }
            onSubmit={(email) => navigation.navigate('Otp', { email, mode: route.params.mode })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Otp">
        {({ navigation, route }) => (
          <OtpScreen
            email={route.params.email}
            onBack={() => navigation.goBack()}
            onNext={() => {
              if (route.params.mode === 'login') {
                loginWithEmail(route.params.email);
                return;
              }
              startRegistration(route.params.email);
              navigation.navigate('Terms');
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Terms">
        {({ navigation }) => (
          <TermsScreen onBack={() => navigation.goBack()} onNext={() => navigation.navigate('Features')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Features">
        {({ navigation }) => <FeaturesScreen onNext={() => navigation.navigate('Owner')} />}
      </Stack.Screen>
      <Stack.Screen name="Owner">
        {({ navigation }) => (
          <OwnerScreen
            onSkip={() => navigation.navigate('PetSetup')}
            onNext={() => navigation.navigate('PetSetup')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PetSetup">
        {({ navigation }) => (
          <PetSetupScreen
            onSkip={() => navigation.navigate('Collar')}
            onNext={() => navigation.navigate('Collar')}
            onPickBreed={() => navigation.navigate('Breed')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Breed">
        {({ navigation }) => (
          <BreedScreen onBack={() => navigation.goBack()} onSave={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Collar">
        {() => <CollarScreen onFinish={finishOnboarding} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
