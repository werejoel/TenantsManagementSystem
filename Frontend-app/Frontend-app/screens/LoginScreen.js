import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { login as loginApi, register, getDashboard } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { user, login: setAuthUser } = useContext(AuthContext);

  // Clear error message when inputs change
  useEffect(() => {
    if (errorMsg) {
      setErrorMsg('');
    }
  }, [username, password]);

  const handleLogin = async () => {
    // Validate inputs
    if (!username.trim()) {
      setErrorMsg('Please enter your username');
      return;
    }
    
    if (!password.trim()) {
      setErrorMsg('Please enter your password');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    
    try {
      const response = await loginApi(username.trim(), password);

      // Store tokens
      await AsyncStorage.setItem('access', response.data.access);
      await AsyncStorage.setItem('refresh', response.data.refresh);

      // Fetch dashboard to get the correct role
      let dashboardRole = 'tenant';
      try {
        const dashboardRes = await getDashboard(response.data.access);
        dashboardRole = dashboardRes.data?.role || 'tenant';
        setAuthUser({
          username: username.trim(),
          access: response.data.access,
          role: dashboardRole,
          ...response.data.user
        });
      } catch (err) {
        // fallback if dashboard fetch fails
        setAuthUser({
          username: username.trim(),
          access: response.data.access,
          role: dashboardRole,
          ...response.data.user
        });
      }

      // Navigate to dashboard based on role
      if (dashboardRole === 'admin' || dashboardRole === 'manager') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainDrawer' }],
        });
      } else if (dashboardRole === 'tenant') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'TenantDashboard' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainDrawer' }],
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Error logging in. Please try again.';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.non_field_errors) {
        errorMessage = error.response.data.non_field_errors[0];
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid username or password';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.illustrationIcon}>
          <MaterialCommunityIcons name="account-circle" size={90} color="#4f8cff" />
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#aaa"
          editable={!loading}
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { marginBottom: 0, flex: 1 }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            disabled={loading}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={loading ? '#ccc' : '#4f8cff'}
            />
          </TouchableOpacity>
        </View>
        
        {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={[styles.registerButtonText, loading && { color: '#ccc' }]}>
            Don't have an account? Register
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  illustrationIcon: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 14,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fafbfc',
    color: '#222',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorMsg: {
    color: '#e74c3c',
    fontSize: 15,
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#4f8cff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 48,
  },
  loginButtonDisabled: {
    backgroundColor: '#a0a0a0',
    shadowOpacity: 0.05,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  registerButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  registerButtonText: {
    color: '#4f8cff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LoginScreen;