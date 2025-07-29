import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getMyHouse } from '../services/tenantService';
import { fetchPayments } from '../services/paymentService';


const { width } = Dimensions.get('window');

const TenantDashboardScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  // const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  // const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [maintenanceRequest, setMaintenanceRequest] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Rent Due Soon', message: 'Your rent is due in 3 days', type: 'warning', date: '2025-01-28' },
    { id: 2, title: 'Maintenance Scheduled', message: 'Plumbing maintenance on Feb 1st', type: 'info', date: '2025-01-25' },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setPaymentsLoading(true);
      // setMaintenanceLoading(true);
      const [houseData, paymentsData] = await Promise.all([
        getMyHouse(user?.token),
        fetchPayments(user?.token),
      ]);
      setHouse(houseData);
      const myPayments = paymentsData.filter(p => p.tenant && p.tenant.user === user?.id);
      setPayments(myPayments);
      // setMaintenanceRequests(maintenanceData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
      setPaymentsLoading(false);
      // setMaintenanceLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handlePayment = () => {
    if (!paymentAmount) {
      Alert.alert('Error', 'Please enter payment amount');
      return;
    }
    Alert.alert('Success', `Payment request submitted successfully via ${getPaymentMethodLabel(paymentMethod)}`);
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

  const handleMaintenanceRequest = () => {
    if (!maintenanceRequest.trim()) {
      Alert.alert('Error', 'Please describe the maintenance issue');
      return;
    }
    Alert.alert('Success', 'Maintenance request submitted successfully');
    setMaintenanceModalVisible(false);
    setMaintenanceRequest('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return '#FEE2E2';
      case 'In Progress':
        return '#FEF3C7';
      case 'Completed':
        return '#DEF7EC';
      default:
        return '#F3F4F6';
    }
  };

  const currentBalance = payments.length > 0 ? payments[0].balance_due : 0;
  const overpayment = payments.length > 0 ? payments[0].overpayment : 0;
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const nextDueDate = '2025-02-01';

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
        </View>
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStatCard}>
            <MaterialCommunityIcons name="cash-refund" size={20} color="#10B981" />
            <Text style={styles.miniStatValue}>UGX {overpayment.toLocaleString()}</Text>
            <Text style={styles.miniStatLabel}>Overpayment</Text>
          </View>
          <View style={styles.miniStatCard}>
            <MaterialCommunityIcons name="chart-line" size={20} color="#6366F1" />
            <Text style={styles.miniStatValue}>UGX {totalPaid.toLocaleString()}</Text>
            <Text style={styles.miniStatLabel}>Total Paid</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#6366F1' }]}
            onPress={() => setPaymentModalVisible(true)}
          >
            <MaterialCommunityIcons name="credit-card" size={28} color="#fff" />
            <Text style={styles.actionText}>Make Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#F59E0B' }]}
            onPress={() => setMaintenanceModalVisible(true)}
          >
            <MaterialCommunityIcons name="wrench" size={28} color="#fff" />
            <Text style={styles.actionText}>Maintenance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#10B981' }]}>
            <MaterialCommunityIcons name="file-document" size={28} color="#fff" />
            <Text style={styles.actionText}>Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#8B5CF6' }]}>
            <MaterialCommunityIcons name="message" size={28} color="#fff" />
            <Text style={styles.actionText}>Contact</Text>
          </TouchableOpacity>
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
                color={notification.type === 'warning' ? '#F59E0B' : '#6366F1'}
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
          <ActivityIndicator size="large" color="#6366F1" />
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
      <View style={styles.maintenanceHeader}>
        <Text style={styles.sectionTitle}>Maintenance Requests</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => Alert.alert('Filter', 'Filter options coming soon')}
        >
          <MaterialCommunityIcons name="filter-variant" size={20} color="#6B7280" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="wrench" size={64} color="#D1D5DB" />
        <Text style={styles.emptyStateTitle}>No Maintenance Requests</Text>
        <Text style={styles.emptyStateText}>Your requests will appear here</Text>
      </View>
    </View>
  );

  const renderPropertyTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Property Information</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading property details...</Text>
        </View>
      ) : house ? (
        <View style={styles.propertyCard}>
          <View style={styles.propertyHeader}>
            <MaterialCommunityIcons name="home" size={32} color="#6366F1" />
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
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
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
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialCommunityIcons name="bell" size={24} color="#fff" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <MaterialCommunityIcons name="logout" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
              color={selectedTab === tab.key ? '#6366F1' : '#6B7280'}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
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
              placeholder="Enter payment amount"
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

const styles = StyleSheet.create({
  paymentMethodIcon: {
    width: 32,
    height: 32,
    marginBottom: 2,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentMethodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodBtnActive: {
    backgroundColor: '#E0E7FF',
    borderColor: '#6366F1',
  },
  paymentMethodLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    color: '#1F2937',
  },
  logoutButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#6366F1',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#EBF4FF',
  },
  tabLabel: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#6366F1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  nextDue: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  miniStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  notificationsSection: {
    marginBottom: 24,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  notificationDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  paymentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DEF7EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  maintenanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  maintenanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maintenanceDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  propertyDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  propertyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  propertyLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  propertyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TenantDashboardScreen;