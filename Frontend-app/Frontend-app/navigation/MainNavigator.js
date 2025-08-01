import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, useWindowDimensions, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import TenantsScreen from '../screens/TenantsScreen';
import AddTenantScreen from '../screens/AddTenantScreen';
import AddHouseScreen from '../screens/AddHouseScreen';
import AddPaymentScreen from '../screens/AddPaymentScreen';
import ChargesScreen from '../screens/ChargesScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LoginScreen from '../screens/LoginScreen';
import HousesScreen from '../screens/HousesScreen';
import HouseList from '../screens/HouseList';
import PaymentsScreen from '../screens/PaymentsScreen';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import RegisterScreen from '../screens/RegisterScreen';
import EditTenantScreen from '../screens/EditTenantScreen';
import AssignHouseScreen from '../screens/AssignHouseScreen';


const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();


function TenantsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TenantsMain" 
        component={TenantsScreen} 
        options={{ title: 'Tenants' }}
      />
      <Stack.Screen 
        name="AddTenant" 
        component={AddTenantScreen}
        options={{ title: 'Add Tenant' }}
      />
      <Stack.Screen 
        name="EditTenant" 
        component={EditTenantScreen}
        options={{ title: 'Edit Tenant' }}
      />
      <Stack.Screen 
        name="AssignHouse" 
        component={AssignHouseScreen}
        options={{ title: 'Assign House' }}
      />
    </Stack.Navigator>
  );
}

const HousesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="HouseList" 
      component={HouseList} 
      options={{ title: 'Houses' }}
    />
    {/* You can add more screens for house details if needed */}
  </Stack.Navigator>
);

const PaymentsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PaymentsMain" 
      component={PaymentsScreen} 
      options={{ title: 'Payments' }}
    />
    <Stack.Screen 
      name="AddPayment" 
      component={AddPaymentScreen}
      options={{ title: 'Add Payment' }}
    />
  </Stack.Navigator>
);


// Custom Drawer sidebar
const CustomDrawerContent = (props) => {
  const { user, logout } = useContext(AuthContext);
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, paddingTop: 0 }}>
      <View style={drawerStyles.profileSection}>
        <MaterialCommunityIcons name="account-circle" size={70} color="#4caf50" style={drawerStyles.avatar} />
        <Text style={drawerStyles.username}>{user?.username || 'User'}</Text>
        <Text style={drawerStyles.role}>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}</Text>
      </View>
      <DrawerItemList {...props} />
      <View style={drawerStyles.bottomSection}>
        <TouchableOpacity style={drawerStyles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color="#4caf50" />
          <Text style={drawerStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const MainDrawer = () => {
  const dimensions = useWindowDimensions();
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerType={dimensions.width >= 800 ? 'permanent' : 'front'}
      overlayColor="rgba(0,0,0,0.1)"
      drawerStyle={{
        backgroundColor: '#f8faff',
        width: 270,
        borderTopRightRadius: 22,
        borderBottomRightRadius: 22,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.09,
        shadowRadius: 10,
        elevation: 10,
      }}
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        drawerIcon: ({ color, size, focused }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Tenants':
              iconName = focused ? 'account-group' : 'account-group-outline';
              break;
            case 'Houses':
              iconName = focused ? 'home-city' : 'home-city-outline';
              break;
            case 'Payments':
              iconName = focused ? 'cash-multiple' : 'cash-multiple';
              break;
            case 'Charges':
              iconName = focused ? 'currency-usd' : 'currency-usd';
              break;
            case 'Maintenance':
              iconName = focused ? 'tools' : 'tools';
              break;
            case 'Documents':
              iconName = focused ? 'file-document' : 'file-document-outline';
              break;
            case 'Reports':
              iconName = focused ? 'chart-bar' : 'chart-bar';
              break;
            default:
              iconName = 'circle';
          }
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        drawerActiveTintColor: '#4caf50',
        drawerInactiveTintColor: '#888',
        drawerLabelStyle: {
          fontWeight: '600',
          fontSize: 16,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#f8faff',
          elevation: 2,
          shadowOpacity: 0.12,
        },
        headerTintColor: '#4caf50',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      })}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />
      <Drawer.Screen 
        name="Tenants" 
        component={TenantsStack}
        options={{ title: 'Tenants' }}
      />
      <Drawer.Screen 
        name="Houses" 
        component={HousesStack}
        options={{ title: 'Houses' }}
      />
      <Drawer.Screen 
        name="Payments" 
        component={PaymentsStack}
        options={{ title: 'Payments' }}
      />
      <Drawer.Screen 
        name="Charges" 
        component={ChargesScreen}
        options={{ title: 'Charges' }}
      />
      <Drawer.Screen 
        name="Maintenance" 
        component={MaintenanceScreen}
        options={{ title: 'Maintenance' }}
      />
      <Drawer.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{ title: 'Documents' }}
      />
      <Drawer.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
    </Drawer.Navigator>
  );
};


// Drawer Styles
const drawerStyles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#eaf1fb',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed',
    marginBottom: 8,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
    backgroundColor: '#dbeafe',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  role: {
    fontSize: 15,
    color: '#4caf50',
    fontWeight: '600',
    marginBottom: 2,
  },
  bottomSection: {
    marginTop: 'auto',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e6ed',
    backgroundColor: '#eaf1fb',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});


const MainNavigator = () => {
  const { user } = useContext(AuthContext);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ presentation: 'modal' }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ presentation: 'modal' }} 
          />
        </>
      ) : user.role === 'admin' || user.role === 'manager' ? (
        <Stack.Screen 
          name="MainDrawer" 
          component={MainDrawer} 
        />
      ) : user.role === 'tenant' ? (
        <Stack.Screen 
          name="TenantDashboard" 
          component={require('../screens/TenantDashboardScreen').default} 
        />
      ) : (
        <Stack.Screen 
          name="MainDrawer" 
          component={MainDrawer} 
        />
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;