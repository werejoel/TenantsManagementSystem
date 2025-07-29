import React, { useState, useMemo, useRef } from 'react';
import { SafeAreaView } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Modal,
  Alert,
  Dimensions,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PaymentList = ({ payments, navigation }) => {
  // State variables Management
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expanded, setExpanded] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const scrollViewRef = useRef(null);

  // Animation for card entry
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get status
  const getStatus = (item) => {
    if (item.balance_due > 0) return {
      label: 'Arrears',
      color: '#ff5252',
      bgColor: '#ffe6e6',
      icon: 'alert-circle',
      priority: 3
    };
    if (item.overpayment > 0) return {
      label: 'Overpaid',
      color: '#4caf50',
      bgColor: '#e6f3e6',
      icon: 'cash-refund',
      priority: 1
    };
    return {
      label: 'Paid',
      color: '#2196f3',
      bgColor: '#e6f0fa',
      icon: 'check-circle',
      priority: 2
    };
  };

  // Calculations with memoization
  const summaryData = useMemo(() => {
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const totalArrears = payments.reduce((sum, p) => sum + (p.balance_due || 0), 0);
    const totalOverpayment = payments.reduce((sum, p) => sum + (p.overpayment || 0), 0);
    const averagePayment = payments.length > 0 ? totalPaid / payments.length : 0;

    const statusCounts = payments.reduce((acc, p) => {
      const status = getStatus(p).label.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPaid,
      totalArrears,
      totalOverpayment,
      averagePayment,
      totalPayments: payments.length,
      statusCounts
    };
  }, [payments]);

  // Filtering and sorting
  const filteredAndSortedPayments = useMemo(() => {
    let filtered = payments.filter(p => {
      const searchTerms = [
        p.tenant_name || p.tenant || '',
        p.house_name || p.house || '',
        p.payment_method || '',
        p.reference_number || ''
      ].map(term => String(term).toLowerCase());

      const searchStr = search.toLowerCase();
      const matchesSearch = searchTerms.some(term => term.includes(searchStr));

      const status = getStatus(p).label.toLowerCase();
      const matchesStatus = filterStatus === 'all' || status === filterStatus;

      let matchesDateRange = true;
      if (dateRange.start && dateRange.end) {
        const paymentDate = new Date(p.payment_date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        matchesDateRange = paymentDate >= startDate && paymentDate <= endDate;
      }

      let matchesAmountRange = true;
      if (amountRange.min || amountRange.max) {
        const amount = p.amount_paid || 0;
        const min = parseFloat(amountRange.min) || 0;
        const max = parseFloat(amountRange.max) || Infinity;
        matchesAmountRange = amount >= min && amount <= max;
      }

      return matchesSearch && matchesStatus && matchesDateRange && matchesAmountRange;
    });

    filtered = filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.payment_date) - new Date(a.payment_date);
          break;
        case 'amount':
          comparison = (b.amount_paid || 0) - (a.amount_paid || 0);
          break;
        case 'tenant': {
          const aTenant = a.tenant_name || a.tenant || '';
          const bTenant = b.tenant_name || b.tenant || '';
          const aStr = typeof aTenant === 'string' ? aTenant : String(aTenant);
          const bStr = typeof bTenant === 'string' ? bTenant : String(bTenant);
          comparison = aStr.localeCompare(bStr);
          break;
        }
        case 'status':
          comparison = getStatus(a).priority - getStatus(b).priority;
          break;
        case 'balance':
          comparison = (b.balance_due || 0) - (a.balance_due || 0);
          break;
        default:
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return filtered;
  }, [payments, search, sortBy, sortOrder, filterStatus, dateRange, amountRange]);

  const toggleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const clearFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setDateRange({ start: '', end: '' });
    setAmountRange({ min: '', max: '' });
    setSelectedPayments([]);
  };

  const applyQuickFilter = (preset) => {
    switch (preset) {
      case 'thisMonth':
        const now = new Date();
        setDateRange({
          start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        });
        break;
      case 'overdue':
        setFilterStatus('arrears');
        break;
      case 'highValue':
        setAmountRange({ min: '100000', max: '' });
        break;
      default:
        clearFilters();
    }
    setShowFilters(false);
  };

  const exportPayments = () => {
    const selectedData = selectedPayments.length > 0
      ? payments.filter(p => selectedPayments.includes(p.id))
      : filteredAndSortedPayments;

    const csvContent = [
      ['Tenant', 'House', 'Amount Paid', 'Balance Due', 'Overpayment', 'Payment Date', 'Status'],
      ...selectedData.map(p => [
        p.tenant_name || p.tenant,
        p.house_name || p.house,
        p.amount_paid,
        p.balance_due,
        p.overpayment,
        p.payment_date,
        getStatus(p).label
      ])
    ].map(row => row.join(',')).join('\n');

    Alert.alert('Export', 'CSV data generated. In a real app, this would initiate a download.');
    console.log(csvContent);
  };

  const handleBulkAction = (action) => {
    if (selectedPayments.length === 0) {
      Alert.alert('No Selection', 'Please select at least one payment');
      return;
    }

    switch (action) {
      case 'markPaid':
        Alert.alert('Bulk Action', `Marking ${selectedPayments.length} payments as paid`);
        break;
      case 'sendReminder':
        Alert.alert('Bulk Action', `Sending reminders for ${selectedPayments.length} payments`);
        break;
      default:
        break;
    }
  };

  // UI Components
  const SummaryCard = ({ title, value, icon, color, bgColor, subtitle, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.summaryCard, { backgroundColor: bgColor }]}
      activeOpacity={0.9}
    >
      <View style={styles.summaryCardContent}>
        <View style={[styles.summaryIconContainer, { backgroundColor: color + '22' }]}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <View style={styles.summaryTextContainer}>
          <Text style={styles.summaryCardTitle}>{title}</Text>
          <Text style={[styles.summaryCardValue, { color }]}>{value}</Text>
        </View>
      </View>
      {subtitle && <Text style={styles.summaryCardSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  const PaymentCard = ({ item, isExpanded, onPress, onLongPress, isSelected, onSelect }) => {
    const status = getStatus(item);

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onLongPress={onLongPress}
          activeOpacity={0.9}
        >
          <View style={[
            styles.card,
            {
              borderLeftWidth: 4,
              borderLeftColor: status.color,
              backgroundColor: isSelected ? status.bgColor : '#fff'
            }
          ]}>
            <View style={styles.cardHeader}>
              <TouchableOpacity
                onPress={onSelect}
                style={styles.checkboxContainer}
              >
                <MaterialCommunityIcons
                  name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={22}
                  color={isSelected ? status.color : '#ccc'}
                />
              </TouchableOpacity>

              <View style={styles.cardHeaderCenter}>
                <Text style={styles.tenantName} numberOfLines={1}>{item.tenant_name || item.tenant}</Text>
                <Text style={styles.houseName} numberOfLines={1}>{item.house_name || item.house}</Text>
              </View>

              <View style={styles.cardHeaderRight}>
                <View style={[styles.statusContainer, { backgroundColor: status.bgColor }]}>
                  <MaterialCommunityIcons
                    name={status.icon}
                    size={14}
                    color={status.color}
                  />
                  <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
                </View>
                <Text style={styles.date}>{item.payment_date}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Amount Paid:</Text>
                <Text style={styles.amountValue}>UGX {item.amount_paid.toLocaleString()}</Text>
              </View>

              <View style={styles.balanceContainer}>
                {item.balance_due > 0 && (
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Balance:</Text>
                    <Text style={styles.balanceValue}>UGX {item.balance_due.toLocaleString()}</Text>
                  </View>
                )}
                {item.overpayment > 0 && (
                  <View style={styles.balanceItem}>
                    <Text style={styles.overpaymentLabel}>Overpayment:</Text>
                    <Text style={styles.overpaymentValue}>UGX {item.overpayment.toLocaleString()}</Text>
                  </View>
                )}
              </View>
            </View>

            {isExpanded && (
              <View style={styles.expandedSection}>
                <View style={styles.expandedRow}>
                  <MaterialCommunityIcons name="credit-card" size={16} color="#4f8cff" />
                  <Text style={styles.expandedText}>{item.payment_method || 'Not specified'}</Text>
                </View>
                <View style={styles.expandedRow}>
                  <MaterialCommunityIcons name="barcode" size={16} color="#4f8cff" />
                  <Text style={styles.expandedText}>{item.reference_number || 'Not provided'}</Text>
                </View>
                <View style={styles.expandedRow}>
                  <MaterialCommunityIcons name="calendar-range" size={16} color="#4f8cff" />
                  <Text style={styles.expandedText}>
                    {item.payment_start_date} to {item.payment_end_date}
                  </Text>
                </View>
                {item.notes && (
                  <View style={styles.expandedRow}>
                    <MaterialCommunityIcons name="note-text" size={16} color="#4f8cff" />
                    <Text style={styles.expandedText}>{item.notes}</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={() => toggleExpand(item.id)}
              style={styles.expandButton}
            >
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.filterLabel}>Quick Filters</Text>
            <View style={styles.quickFilterRow}>
              {[
                { key: 'thisMonth', label: 'This Month' },
                { key: 'overdue', label: 'Overdue' },
                { key: 'highValue', label: 'High Value' },
                { key: 'clear', label: 'Clear All' }
              ].map(filter => (
                <TouchableOpacity
                  key={filter.key}
                  style={styles.quickFilterBtn}
                  onPress={() => applyQuickFilter(filter.key)}
                >
                  <Text style={styles.quickFilterText}>{filter.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Payment Status</Text>
            <View style={styles.statusFilterRow}>
              {['all', 'paid', 'arrears', 'overpaid'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusFilterBtn,
                    filterStatus === status && styles.statusFilterBtnActive
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text style={[
                    styles.statusFilterText,
                    filterStatus === status && styles.statusFilterTextActive
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRangeRow}>
              <TextInput
                style={styles.dateInput}
                placeholder="Start Date (YYYY-MM-DD)"
                value={dateRange.start}
                onChangeText={text => setDateRange(prev => ({ ...prev, start: text }))}
                placeholderTextColor="#999"
              />
              <Text style={styles.dateRangeSeparator}>to</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="End Date (YYYY-MM-DD)"
                value={dateRange.end}
                onChangeText={text => setDateRange(prev => ({ ...prev, end: text }))}
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.filterLabel}>Amount Range (UGX)</Text>
            <View style={styles.amountRangeRow}>
              <TextInput
                style={styles.amountInput}
                placeholder="Min Amount"
                value={amountRange.min}
                onChangeText={text => setAmountRange(prev => ({ ...prev, min: text }))}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              <Text style={styles.amountRangeSeparator}>to</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Max Amount"
                value={amountRange.max}
                onChangeText={text => setAmountRange(prev => ({ ...prev, max: text }))}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyFiltersBtn} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const PaymentDetailModal = () => (
    <Modal
      visible={!!selectedPayment}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectedPayment(null)}
    >
      {selectedPayment && (
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Payment Details</Text>
              <TouchableOpacity onPress={() => setSelectedPayment(null)}>
                <MaterialCommunityIcons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailModalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tenant:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.tenant_name || selectedPayment.tenant}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>House:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.house_name || selectedPayment.house}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Date:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.payment_date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Period:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPayment.payment_start_date} to {selectedPayment.payment_end_date}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Financial Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount Paid:</Text>
                  <Text style={[styles.detailValue, styles.amountValue]}>
                    UGX {selectedPayment.amount_paid.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance Due:</Text>
                  <Text style={[styles.detailValue, { color: '#ff5252' }]}>
                    UGX {selectedPayment.balance_due.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Overpayment:</Text>
                  <Text style={[styles.detailValue, { color: '#4caf50' }]}>
                    UGX {selectedPayment.overpayment.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Payment Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.payment_method || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.reference_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>{selectedPayment.notes || 'N/A'}</Text>
                </View>
              </View>

              {selectedPayment.charges && selectedPayment.charges.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Itemized Charges</Text>
                  {selectedPayment.charges.map((charge, idx) => (
                    <View key={idx} style={styles.chargeDetailRow}>
                      <Text style={styles.chargeType}>{charge.charge_type}</Text>
                      <Text style={styles.chargeAmount}>UGX {charge.amount.toLocaleString()}</Text>
                      <View style={[
                        styles.chargeStatus,
                        { backgroundColor: charge.is_paid ? '#4caf50' : '#ff5252' }
                      ]}>
                        <Text style={styles.chargeStatusText}>
                          {charge.is_paid ? 'Paid' : 'Unpaid'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContentWrapper}>
        {/* Search, Filter, Sort, and Summary Section */}
        <View style={styles.controlsCard}>
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.summaryScrollContent}
            >
              <SummaryCard
                title="Total Paid"
                value={`UGX ${summaryData.totalPaid.toLocaleString()}`}
                icon="cash-multiple"
                color="#4f8cff"
                bgColor="#f0f6ff"
                subtitle={`${summaryData.totalPayments} payments`}
                onPress={() => applyQuickFilter('all')}
              />
              <SummaryCard
                title="Arrears"
                value={`UGX ${summaryData.totalArrears.toLocaleString()}`}
                icon="alert-circle"
                color="#ff6b6b"
                bgColor="#fff0f0"
                subtitle={`${summaryData.statusCounts.arrears || 0} tenants`}
                onPress={() => applyQuickFilter('overdue')}
              />
              <SummaryCard
                title="Overpayment"
                value={`UGX ${summaryData.totalOverpayment.toLocaleString()}`}
                icon="cash-refund"
                color="#4caf50"
                bgColor="#f0f9f0"
                subtitle={`${summaryData.statusCounts.overpaid || 0} tenants`}
                onPress={() => setFilterStatus('overpaid')}
              />
              <SummaryCard
                title="Average"
                value={`UGX ${Math.round(summaryData.averagePayment).toLocaleString()}`}
                icon="chart-line"
                color="#ff9800"
                bgColor="#fff8e6"
                subtitle="per payment"
                onPress={() => applyQuickFilter('highValue')}
              />
            </ScrollView>
          </View>

          {/* Controls Row with Sort Controls */}
          <View style={styles.controlsRowCombined}>
            <View style={styles.searchContainerReduced}>
              <MaterialCommunityIcons name="magnify" size={22} color="#4f8cff" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInputReduced}
                placeholder="Search payments..."
                placeholderTextColor="#b0b0b0"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtnImproved}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#bbb" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.filterButtonsRight}>
              <TouchableOpacity
                style={styles.filterBtnImproved}
                onPress={() => setShowFilters(true)}
              >
                <MaterialCommunityIcons name="filter-variant" size={22} color="#fff" />
                <Text style={styles.filterBtnTextImproved}>Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewModeBtnImproved}
                onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                <MaterialCommunityIcons
                  name={viewMode === 'list' ? 'view-grid' : 'view-list'}
                  size={22}
                  color="#4f8cff"
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sortContainerInline}
              contentContainerStyle={styles.sortContent}
            >
              {[
                { key: 'date', icon: 'calendar', label: 'Date' },
                { key: 'amount', icon: 'currency-usd', label: 'Amount' },
                { key: 'tenant', icon: 'account', label: 'Tenant' },
                { key: 'status', icon: 'check-circle', label: 'Status' },
                { key: 'balance', icon: 'alert-circle', label: 'Balance' }
              ].map(sort => (
                <TouchableOpacity
                  key={sort.key}
                  style={[
                    styles.sortBtn,
                    sortBy === sort.key && styles.sortBtnActive
                  ]}
                  onPress={() => toggleSort(sort.key)}
                >
                  <MaterialCommunityIcons
                    name={sort.icon}
                    size={16}
                    color={sortBy === sort.key ? '#fff' : '#4f8cff'}
                  />
                  <Text style={[
                    styles.sortBtnText,
                    sortBy === sort.key && styles.sortBtnTextActive
                  ]}>
                    {sort.label}
                  </Text>
                  {sortBy === sort.key && (
                    <MaterialCommunityIcons
                      name={sortOrder === 'desc' ? 'chevron-down' : 'chevron-up'}
                      size={14}
                      color="#fff"
                      style={styles.sortIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>


        {/* Results Info */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            Showing {filteredAndSortedPayments.length} of {payments.length} payments
          </Text>
          {(search || filterStatus !== 'all' || dateRange.start || dateRange.end || amountRange.min || amountRange.max) && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearAllText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment List*/}
        {filteredAndSortedPayments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#d0d0d0" />
            <Text style={styles.emptyText}>No payments found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
              <Text style={styles.emptyButtonText}>Clear all filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={[styles.tableContainer, { minWidth: 1300 }]}> {/*horizontal scroll */}
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Tenant</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>House</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Amount Paid</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Balance</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Overpayment</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Date</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Status</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 0.9, textAlign: 'center' }]}>Payment Details</Text>
                </View>
                {/* Table Rows */}
                {filteredAndSortedPayments.map(item => {
                  const status = getStatus(item);
                  return (
                    <View
                      key={item.id}
                      style={styles.tableRow}
                    >
                      <Text style={[styles.tableCell, { flex: 1.6 }]} numberOfLines={1}>{item.tenant_name || item.tenant}</Text>
                      <Text style={[styles.tableCell, { flex: 1.3 }]} numberOfLines={1}>{item.house_name || item.house}</Text>
                      <Text style={[styles.tableCell, { flex: 1.1 }]}>UGX {item.amount_paid.toLocaleString()}</Text>
                      <Text style={[styles.tableCell, { flex: 1.1, color: '#e74c3c' }]}>{item.balance_due > 0 ? `UGX ${item.balance_due.toLocaleString()}` : '-'}</Text>
                      <Text style={[styles.tableCell, { flex: 1.1, color: '#2ecc71' }]}>{item.overpayment > 0 ? `UGX ${item.overpayment.toLocaleString()}` : '-'}</Text>
                      <Text style={[styles.tableCell, { flex: 1.3 }]}>{item.payment_date}</Text>
                      <View style={[styles.tableCell, { flex: 1.1, flexDirection: 'row', alignItems: 'center' }]}>
                        <MaterialCommunityIcons name={status.icon} size={16} color={status.color} />
                        <Text style={{ color: status.color, marginLeft: 4, fontWeight: '600' }}>{status.label}</Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 0.9, alignItems: 'center', justifyContent: 'center' }]}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setSelectedPayment(item)}
                        >
                          <MaterialCommunityIcons name="eye" size={20} color="#4f8cff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </ScrollView>
        )}


        {/* Add Payment FA*/}
        {navigation && (
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddPayment')}>
            <MaterialCommunityIcons name="plus" size={28} color="white" />
          </TouchableOpacity>
        )}

        {/* Modals */}
        <FilterModal />
        <PaymentDetailModal />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContentWrapper: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 15,
  },
  summaryContainer: {
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  summaryScrollContent: {
    paddingBottom: 8,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    width: SCREEN_WIDTH * 0.42,
    minWidth: 180,
    maxWidth: 220,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a5a5a',
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryCardSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  bulkActionsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  bulkActionsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
  },
  bulkActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  markPaidBtn: {
    backgroundColor: '#4caf50',
  },
  reminderBtn: {
    backgroundColor: '#2196f3',
  },
  exportBtn: {
    backgroundColor: '#ff9800',
  },
  bulkActionText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  controlsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  controlsRowCombined: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  searchContainerReduced: {
    width: '55%',
    minWidth: 160,
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f8ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e8f8',
  },
  searchInputReduced: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  filterButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  clearSearchBtnImproved: {
    padding: 2,
    marginLeft: 2,
  },
  filterBtnImproved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    elevation: 1,
  },
  filterBtnTextImproved: {
    marginLeft: 6,
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  viewModeBtnImproved: {
    padding: 10,
    backgroundColor: '#f4f8ff',
    borderRadius: 10,
    marginLeft: 2,
    borderWidth: 1,
    borderColor: '#e0e8f8',
  },
  sortContainerInline: {
    marginLeft: 8,
    flexGrow: 1,
    minWidth: 0,
  },
  sortContent: {
    paddingBottom: 4,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf4ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sortBtnActive: {
    backgroundColor: '#4f8cff',
  },
  sortBtnText: {
    marginLeft: 6,
    color: '#4f8cff',
    fontWeight: '600',
    fontSize: 14,
  },
  sortBtnTextActive: {
    color: '#fff',
  },
  sortIcon: {
    marginLeft: 4,
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  clearAllText: {
    color: '#ff6b6b',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listCardContainer: {
    marginBottom: 12,
  },
  gridCardContainer: {
    width: (SCREEN_WIDTH - 40) / 2,
    margin: 6,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 10,
    padding: 4,
  },
  cardHeaderCenter: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2,
  },
  houseName: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  status: {
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  date: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27ae60',
  },
  balanceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  balanceItem: {
    flexDirection: 'row',
    marginRight: 12,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    marginRight: 4,
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e74c3c',
  },
  overpaymentLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    marginRight: 4,
  },
  overpaymentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ecc71',
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  expandButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4f8cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#4f8cff',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  clearFiltersBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearFiltersText: {
    color: '#666',
    fontWeight: '600',
  },
  applyFiltersBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4f8cff',
  },
  applyFiltersText: {
    color: '#fff',
    fontWeight: '600',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  quickFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  quickFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    marginRight: 8,
    marginBottom: 8,
  },
  quickFilterText: {
    color: '#4f8cff',
    fontWeight: '600',
    fontSize: 14,
  },
  statusFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statusFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    marginRight: 8,
    marginBottom: 8,
  },
  statusFilterBtnActive: {
    backgroundColor: '#4f8cff',
  },
  statusFilterText: {
    color: '#4f8cff',
    fontWeight: '600',
    fontSize: 14,
  },
  statusFilterTextActive: {
    color: '#fff',
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  dateRangeSeparator: {
    marginHorizontal: 12,
    color: '#666',
    fontWeight: '500',
  },
  amountRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  amountRangeSeparator: {
    marginHorizontal: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingTop: 20,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  detailModalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  amountValue: {
    fontWeight: 'bold',
    color: '#2196f3',
  },
  chargeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  chargeType: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  chargeAmount: {
    fontSize: 14,
    color: '#4f8cff',
    fontWeight: 'bold',
  },
  chargeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chargeStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e8f8',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f4f8ff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e8f8',
  },
  tableHeaderCell: {
    fontWeight: '700',
    fontSize: 14,
    color: '#4f8cff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    letterSpacing: 0.1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: 13,
    color: '#222',
    paddingHorizontal: 4,
    paddingVertical: 2,
    textAlignVertical: 'center',
  },

  actionBtn: {
    backgroundColor: '#f4f8ff',
    borderRadius: 16,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e8f8',
    shadowColor: '#4f8cff22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tableHeaderCell: {
    fontWeight: '700',
    fontSize: 14,
    color: '#4f8cff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    letterSpacing: 0.1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: 13,
    color: '#222',
    paddingHorizontal: 4,
    paddingVertical: 2,
    textAlignVertical: 'center',
  },
});

export default PaymentList;