import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { register } from '../services/authService'; 

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tenant'); // or 'manager'

  const { login: setAuthUser } = React.useContext(require('../context/AuthContext').AuthContext);
  const handleRegister = async () => {
    try {
      await register(name, email, password, role);
      // Auto-login after registration
      const response = await require('../services/authService').login(name, password);
      // Extract role from response
      const userRole = response.data?.data?.role || response.data?.user?.role || role;
      // Store tokens in AsyncStorage
      if (response.data?.access) {
        await require('@react-native-async-storage/async-storage').default.setItem('access', response.data.access);
      }
      if (response.data?.refresh) {
        await require('@react-native-async-storage/async-storage').default.setItem('refresh', response.data.refresh);
      }
      setAuthUser({
        username: name,
        access: response.data.access,
        refresh: response.data.refresh,
        role: userRole,
        ...response.data.user
      });
      // Normalize role to lowercase for safety
      const normalizedRole = (userRole || '').toLowerCase();
      // Redirect to dashboard based on role
      if (normalizedRole === 'admin' || normalizedRole === 'manager') {
        navigation.reset({ index: 0, routes: [{ name: 'MainDrawer' }] });
      } else if (normalizedRole === 'tenant') {
        navigation.reset({ index: 0, routes: [{ name: 'TenantDashboard' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainDrawer' }] });
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.detail || 'Error while registering');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.illustrationIcon}>
          <MaterialCommunityIcons name="account-plus" size={80} color="#4f8cff" />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#aaa"
        />
        {/* Role selection (optional, can be replaced with a picker) */}
        <View style={{ width: '100%', marginBottom: 16 }}>
          <Text style={{ color: '#888', marginBottom: 4, fontSize: 15 }}>Register as:</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'tenant' && styles.roleButtonActive]}
              onPress={() => setRole('tenant')}
            >
              <MaterialCommunityIcons name="account" size={22} color={role === 'tenant' ? '#fff' : '#4f8cff'} />
              <Text style={[styles.roleButtonText, role === 'tenant' && { color: '#fff' }]}>Tenant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'manager' && styles.roleButtonActive]}
              onPress={() => setRole('manager')}
            >
              <MaterialCommunityIcons name="account-tie" size={22} color={role === 'manager' ? '#fff' : '#4f8cff'} />
              <Text style={[styles.roleButtonText, role === 'manager' && { color: '#fff' }]}>Manager</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
          <Text style={styles.loginButtonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.registerButtonText}>Back to Login</Text>
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
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4f8cff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    backgroundColor: '#4f8cff',
    borderColor: '#4f8cff',
  },
  roleButtonText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#4f8cff',
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#4f8cff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  registerButton: {
    marginTop: 8,
  },
  registerButtonText: {
    color: '#4f8cff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RegisterScreen;
