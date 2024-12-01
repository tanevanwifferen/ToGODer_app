import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Login } from '../components/Login';
import { CreateAccount } from '../components/CreateAccount';

export type AuthStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateAccount" 
          component={CreateAccount}
          options={{ title: 'Create Account' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
