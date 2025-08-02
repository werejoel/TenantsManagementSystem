import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import styles from '../css/TenantDashboardScreen.styles';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getMyHouse } from '../services/tenantService';
import { fetchPayments } from '../services/paymentService';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const { width } = Dimensions.get('window');

const TenantDashboardScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [maintenanceRequest, setMaintenanceRequest] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [myMaintenanceRequests, setMyMaintenanceRequests] = useState([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceFilter, setMaintenanceFilter] = useState('all');
  const [maintenanceSort, setMaintenanceSort] = useState('created_at_desc');
  const [maintenanceSearch, setMaintenanceSearch] = useState('');

  // --- Push Notification Setup ---
  useEffect(() => {
    let notificationListener;
    let responseListener;

    async function registerForPushNotificationsAsync() {
      let token;
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('Failed to get push token for push notification!');
          return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        // Send token to backend
        if (user?.token) {
          try {
            await axios.post('http://127.0.0.1:8000/api/devices/register/', { token }, {
              headers: { Authorization: `Bearer ${user.token}` }
            });
          } catch (e) {
            // Optionally handle error
          }
        }
      } else {
        alert('Must use physical device for Push Notifications');
      }
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      return token;
    }

    // Register and set up listeners
    registerForPushNotificationsAsync();
    notificationListener = Notifications.addNotificationReceivedListener(notification => {
      // Show an alert or update state/UI as needed
      Alert.alert(
        notification.request.content.title || 'Notification',
        notification.request.content.body || ''
      );
    });
    responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Optionally handle notification tap
    });
    return () => {
      if (notificationListener) Notifications.removeNotificationSubscription(notificationListener);
      if (responseListener) Notifications.removeNotificationSubscription(responseListener);
    };
  }, [user]);

  const registerForPushNotificationsAsync = async (userToken) => {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      // Send token to backend
      await axios.post('http://127.0.0.1:8000/api/devices/register/', { token }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
    } else {
      alert('Must use physical device for Push Notifications');
    }
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    return token;
  };

  const fetchNotifications = useCallback(async () => {
    try {
      // backend endpoint for notifications
      const res = await axios.get('https://your-backend.com/api/notifications/', {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      // fallback to demo notifications if backend fails
      const demo = [
        { id: 1, title: 'Rent Due Soon', message: 'Your rent is due in 3 days', type: 'warning', date: '2025-01-28', read: false },
        { id: 2, title: 'Maintenance Scheduled', message: 'Plumbing maintenance on Feb 1st', type: 'info', date: '2025-01-25', read: true },
      ];
      setNotifications(demo);
      setUnreadCount(demo.filter(n => !n.read).length);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setPaymentsLoading(true);
      const [houseData, paymentsData] = await Promise.all([
        getMyHouse(user?.token),
        fetchPayments(user?.token),
      ]);
      setHouse(houseData);
      const myPayments = paymentsData.filter(p => p.tenant && p.tenant.user === user?.id);
      setPayments(myPayments);
      await fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
      setPaymentsLoading(false);
    }
  }, [user, fetchNotifications]);

  const fetchMyMaintenanceRequests = useCallback(async () => {
    setMaintenanceLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/maintenance/requests/', {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setMyMaintenanceRequests(res.data);
    } catch (error) {
      setMyMaintenanceRequests([]);
    } finally {
      setMaintenanceLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    fetchMyMaintenanceRequests();
  }, [fetchData, fetchMyMaintenanceRequests]);

  useEffect(() => {
    if (user?.token) {
      registerForPushNotificationsAsync(user.token);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount');
      return;
    }
    Alert.alert('Success', `Payment request for UGX ${amount.toLocaleString()} submitted successfully via ${getPaymentMethodLabel(paymentMethod)}`);
    setPaymentModalVisible(false);
    setPaymentAmount('');
    setPaymentMethod('cash');
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'mtn': return 'Mobile Money (MTN UG)';
      case 'airtel': return 'Mobile Money (Airtel UG)';
      case 'centenary': return 'Centenary Bank';
      case 'stanbic': return 'Stanbic Bank';
      case 'equity': return 'Equity Bank';
      default: return 'Other';
    }
  };

  const handleMaintenanceRequest = async () => {
    if (!maintenanceRequest.trim()) {
      Alert.alert('Error', 'Please describe the maintenance issue');
      return;
    }
    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/api/maintenance/requests/create/',
        { description: maintenanceRequest },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      Alert.alert('Success', 'Maintenance request submitted successfully');
      setMaintenanceModalVisible(false);
      setMaintenanceRequest('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit maintenance request');
    }
  };

  const currentBalance = payments.length > 0 ? payments[0].balance_due : 0;
  const overpayment = payments.length > 0 ? payments[0].overpayment : 0;
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const nextDueDate = '2025-02-01';

  const filteredSortedRequests = myMaintenanceRequests
    .filter(req => (maintenanceFilter === 'all' || req.status === maintenanceFilter))
    .filter(req => req.description.toLowerCase().includes(maintenanceSearch.toLowerCase()) || (req.notes && req.notes.toLowerCase().includes(maintenanceSearch.toLowerCase())))
    .sort((a, b) => {
      if (maintenanceSort === 'created_at_desc') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (maintenanceSort === 'created_at_asc') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (maintenanceSort === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.balanceCard]}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="wallet" size={24} color="#fff" />
              <Text style={styles.statTitle}>Current Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>UGX {currentBalance.toLocaleString()}</Text>
            <Text style={styles.nextDue}>Next due: {nextDueDate}</Text>
            <View style={styles.allActionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#260477FF' }]}
                onPress={() => setPaymentModalVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="credit-card" size={22} color="#fff" style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}>Payment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F01048FF' }]}
                onPress={() => setMaintenanceModalVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="wrench" size={22} color="#fff" style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}>Maintenance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F59E0B' }]} activeOpacity={0.85}>
                <MaterialCommunityIcons name="file-document" size={22} color="#fff" style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}>Documents</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#1F2937' }]} activeOpacity={0.85}>
                <MaterialCommunityIcons name="message" size={22} color="#fff" style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatCard}>
              <MaterialCommunityIcons name="cash-refund" size={20} color="#10B981" />
              <Text style={styles.miniStatValue}>UGX {overpayment.toLocaleString()}</Text>
              <Text style={styles.miniStatLabel}>Overpayment</Text>
            </View>
            <View style={styles.miniStatCard}>
              <MaterialCommunityIcons name="chart-line" size={20} color="#10B981" />
              <Text style={styles.miniStatValue}>UGX {totalPaid.toLocaleString()}</Text>
              <Text style={styles.miniStatLabel}>Total Paid</Text>
            </View>
          </View>
        </View>

      <View style={styles.notificationsSection}>
        <Text style={styles.sectionTitle}>Recent Notifications</Text>
        {notifications.map((notification) => (
          <View key={notification.id} style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <MaterialCommunityIcons
                name={notification.type === 'warning' ? 'alert-circle' : 'information'}
                size={20}
                color={notification.type === 'warning' ? '#F59E0B' : '#10B981'}
              />
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationDate}>{notification.date}</Text>
            </View>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPaymentsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.paymentsHeader}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => Alert.alert('Filter', 'Filter options coming soon')}
        >
          <MaterialCommunityIcons name="filter-variant" size={20} color="#6B7280" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>
      {paymentsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : payments.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="receipt" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Payments Yet</Text>
          <Text style={styles.emptyStateText}>Your payment history will appear here</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {payments.map((payment, idx) => (
            <View key={payment.id || idx} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentIconContainer}>
                  <MaterialCommunityIcons name="cash" size={24} color="#10B981" />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentAmount}>UGX {payment.amount_paid?.toLocaleString()}</Text>
                  <Text style={styles.paymentDate}>{payment.payment_date}</Text>
                </View>
                <View style={styles.paymentStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: '#DEF7EC' }]}>
                    <Text style={[styles.statusText, { color: '#047857' }]}>Paid</Text>
                  </View>
                </View>
              </View>
              <View style={styles.paymentDetails}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Period:</Text>
                  <Text style={styles.paymentValue}>
                    {payment.payment_start_date} - {payment.payment_end_date}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Balance Due:</Text>
                  <Text style={styles.paymentValue}>UGX {payment.balance_due?.toLocaleString()}</Text>
                </View>
                {payment.overpayment > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Overpayment:</Text>
                    <Text style={[styles.paymentValue, { color: '#10B981' }]}>
                      UGX {payment.overpayment?.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderMaintenanceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.myHeader}>
        <Text style={styles.sectionTitle}>Maintenance Requests</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setMaintenanceFilter(maintenanceFilter === 'all' ? 'pending' : maintenanceFilter === 'pending' ? 'in_progress' : maintenanceFilter === 'in_progress' ? 'completed' : 'all')}
          >
            <MaterialCommunityIcons name="filter-variant" size={20} color="#6B7280" />
            <Text style={styles.filterText}>Filter: {maintenanceFilter.replace('_', ' ').replace(/^./, c => c.toUpperCase())}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, { marginLeft: 8 }]}
            onPress={() => setMaintenanceSort(maintenanceSort === 'created_at_desc' ? 'created_at_asc' : maintenanceSort === 'created_at_asc' ? 'status' : 'created_at_desc')}
          >
            <MaterialCommunityIcons name="sort" size={20} color="#6B7280" />
            <Text style={styles.filterText}>Sort: {maintenanceSort === 'created_at_desc' ? 'Newest' : maintenanceSort === 'created_at_asc' ? 'Oldest' : 'Status'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={[styles.input, { marginBottom: 10 }]}
        placeholder="Search maintenance requests..."
        value={maintenanceSearch}
        onChangeText={setMaintenanceSearch}
      />
      {maintenanceLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : filteredSortedRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="wrench" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Maintenance Requests</Text>
          <Text style={styles.emptyStateText}>Your requests will appear here</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredSortedRequests.map((req) => (
            <View key={req.id} style={styles.paymentCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>Status: <Text style={{ color: req.status === 'completed' ? '#10B981' : req.status === 'in_progress' ? '#F59E0B' : '#EF4444' }}>{req.status.replace('_', ' ')}</Text></Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={{ marginTop: 8, color: '#374151', fontWeight: 'bold' }}>Description:</Text>
              <Text style={{ color: '#374151', marginBottom: 4 }}>{req.description}</Text>
              <Text style={{ color: '#374151', fontWeight: 'bold' }}>Notes:</Text>
              <Text style={{ color: '#6B7280', fontStyle: req.notes ? 'italic' : 'normal' }}>{req.notes || 'No notes yet.'}</Text>
              <Text style={{ color: '#374151', fontWeight: 'bold', marginTop: 4 }}>Last Updated:</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>{new Date(req.updated_at).toLocaleDateString()} {new Date(req.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#E0E7FF', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8 }}
                  onPress={() => {
                    Alert.alert(
                      'Request Details',
                      `Status: ${req.status.replace('_', ' ')}\n\nDescription: ${req.description}\n\nNotes: ${req.notes || 'No notes yet.'}\n\nCreated: ${new Date(req.created_at).toLocaleString()}\nLast Updated: ${new Date(req.updated_at).toLocaleString()}`
                    );
                  }}
                >
                  <Text style={{ color: '#1F2937', fontWeight: 'bold' }}>View Details</Text>
                </TouchableOpacity>
                {req.status === 'pending' && (
                  <TouchableOpacity
                    style={{ backgroundColor: '#F59E0B', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 }}
                    onPress={async () => {
                      try {
                        await axios.patch(
                          `http://127.0.0.1:8000/api/maintenance/requests/${req.id}/`,
                          { status: 'cancelled' },
                          { headers: { Authorization: `Bearer ${user?.token}` } }
                        );
                        fetchMyMaintenanceRequests();
                        Alert.alert('Cancelled', 'Request cancelled successfully');
                      } catch (e) {
                        Alert.alert('Error', 'Could not cancel request');
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{ backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, marginLeft: 8 }}
                  onPress={() => {
                    Alert.alert('Export', 'Exporting this request as JSON...');
                    const dataStr = JSON.stringify(req, null, 2);
                    console.log('Exported request:', dataStr);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Export</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderPropertyTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Property Information</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading property details...</Text>
        </View>
      ) : house ? (
        <View style={styles.propertyCard}>
          <View style={styles.propertyHeader}>
            <MaterialCommunityIcons name="home" size={32} color="#10B981" />
            <Text style={styles.propertyTitle}>Your Property</Text>
          </View>
          <View style={styles.propertyDetails}>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Property ID:</Text>
              <Text style={styles.propertyValue}>{house.id}</Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Address:</Text>
              <Text style={styles.propertyValue}>{house.address || 'Not specified'}</Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Monthly Rent:</Text>
              <Text style={styles.propertyValue}>UGX {house.rent?.toLocaleString() || 'Not specified'}</Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Lease Start:</Text>
              <Text style={styles.propertyValue}>{house.lease_start || 'Not specified'}</Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Lease End:</Text>
              <Text style={styles.propertyValue}>{house.lease_end || 'Not specified'}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="home-alert" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Property Assigned</Text>
          <Text style={styles.emptyStateText}>Contact your landlord for property assignment</Text>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Tenant'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.notificationButton} onPress={() => {
              setNotificationsVisible(true);
              // Mark all as read
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              setUnreadCount(0);
            }}>
              <MaterialCommunityIcons name="bell" size={24} color="#fff" />
              {unreadCount > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <MaterialCommunityIcons name="logout" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notification Modal */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { minHeight: 200, maxHeight: 400 }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {notifications.length === 0 ? (
              <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 24 }}>No notifications</Text>
            ) : (
              <ScrollView>
                {notifications.map((notification) => (
                  <View key={notification.id} style={[styles.notificationCard, { backgroundColor: notification.read ? '#fff' : '#EEF2FF' }]}> 
                    <View style={styles.notificationHeader}>
                      <MaterialCommunityIcons
                        name={notification.type === 'warning' ? 'alert-circle' : 'information'}
                        size={20}
                        color={notification.type === 'warning' ? '#F59E0B' : '#10B981'}
                      />
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationDate}>{notification.date}</Text>
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Overview', icon: 'view-dashboard' },
          { key: 'payments', label: 'Payments', icon: 'credit-card' },
          { key: 'maintenance', label: 'Maintenance', icon: 'wrench' },
          { key: 'property', label: 'Property', icon: 'home' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, selectedTab === tab.key && styles.activeTabButton]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={20}
              color={selectedTab === tab.key ? '#10B981' : '#6B7280'}
            />
            <Text style={[styles.tabLabel, selectedTab === tab.key && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800020']} />}
      >
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'payments' && renderPaymentsTab()}
        {selectedTab === 'maintenance' && renderMaintenanceTab()}
        {selectedTab === 'property' && renderPropertyTab()}
      </ScrollView>

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter payment amount (UGX)"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={{fontWeight:'600',marginBottom:8,marginTop:4}}>Select Payment Method</Text>
            <View style={styles.paymentMethodsRow}>
              <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod==='cash' && styles.paymentMethodBtnActive]} onPress={()=>setPaymentMethod('cash')}>
                <MaterialCommunityIcons name="cash" size={32} color="#10B981" style={styles.paymentMethodIcon} />
                <Text style={styles.paymentMethodLabel}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod==='mtn' && styles.paymentMethodBtnActive]} onPress={()=>setPaymentMethod('mtn')}>
                <Image source={require('../assets/payment-methods/mtn_mobile.jpeg')} style={styles.paymentMethodIcon} resizeMode="contain" />
                <Text style={styles.paymentMethodLabel}>MTN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod==='airtel' && styles.paymentMethodBtnActive]} onPress={()=>setPaymentMethod('airtel')}>
                <Image source={require('../assets/payment-methods/airtel.png')} style={styles.paymentMethodIcon} resizeMode="contain" />
                <Text style={styles.paymentMethodLabel}>Airtel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.paymentMethodsRow}>
              <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod==='centenary' && styles.paymentMethodBtnActive]} onPress={()=>setPaymentMethod('centenary')}>
                <Image source={require('../assets/payment-methods/centenary_logo.png')} style={styles.paymentMethodIcon} resizeMode="contain" />
                <Text style={styles.paymentMethodLabel}>Centenary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod==='stanbic' && styles.paymentMethodBtnActive]} onPress={()=>setPaymentMethod('stanbic')}>
                <Image source={require('../assets/payment-methods/stanbic bank.jpeg')} style={styles.paymentMethodIcon} resizeMode="contain" />
                <Text style={styles.paymentMethodLabel}>Stanbic</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod==='equity' && styles.paymentMethodBtnActive]} onPress={()=>setPaymentMethod('equity')}>
                <Image source={require('../assets/payment-methods/Equity.jpeg')} style={styles.paymentMethodIcon} resizeMode="contain" />
                <Text style={styles.paymentMethodLabel}>Equity</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handlePayment}>
              <Text style={styles.submitButtonText}>Submit Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={maintenanceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMaintenanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Maintenance Request</Text>
              <TouchableOpacity onPress={() => setMaintenanceModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the maintenance issue..."
              value={maintenanceRequest}
              onChangeText={setMaintenanceRequest}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleMaintenanceRequest}>
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default TenantDashboardScreen;