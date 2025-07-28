import React, { useState, useMemo, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PaymentList = ({ payments }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expanded, setExpanded] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // Changed to 'list' and 'grid'
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

  // Get status with enhanced color coding
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
        case 'tenant':
          comparison = (a.tenant_name || a.tenant || '').localeCompare(b.tenant_name || b.tenant || '');
          break;
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

  // Quick filter presets
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

  // Export functionality
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

  // Bulk actions
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

  const SummaryCard = ({ title, value, icon, color, bgColor, subtitle, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.summaryCard, { borderTopColor: color, backgroundColor: bgColor }]}>
      <View style={styles.summaryCardHeader}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <Text style={styles.summaryCardTitle}>{title}</Text>
      </View>
      <Text style={[styles.summaryCardValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.summaryCardSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

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
              />
              <Text style={styles.dateRangeSeparator}>to</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="End Date (YYYY-MM-DD)"
                value={dateRange.end}
                onChangeText={text => setDateRange(prev => ({ ...prev, end: text }))}
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
              />
              <Text style={styles.amountRangeSeparator}>to</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Max Amount"
                value={amountRange.max}
                onChangeText={text => setAmountRange(prev => ({ ...prev, max: text }))}
                keyboardType="numeric"
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
                <Text style={styles.detailSectionTitle}>Basic Information</Text>
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
                    UGX {selectedPayment.amount_paid}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance Due:</Text>
                  <Text style={[styles.detailValue, { color: '#ff5252' }]}>
                    UGX {selectedPayment.balance_due}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Overpayment:</Text>
                  <Text style={[styles.detailValue, { color: '#4caf50' }]}>
                    UGX {selectedPayment.overpayment}
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
                      <Text style={styles.chargeAmount}>UGX {charge.amount}</Text>
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

  const PaymentCard = ({ item, isExpanded, onPress, onLongPress, isSelected, onSelect }) => {
    const status = getStatus(item);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.85}>
          <View style={[styles.card, { borderLeftColor: status.color, backgroundColor: isSelected ? status.bgColor : '#fff' }]}>
            <View style={styles.cardHeader}>
              <View style={styles.statusContainer}>
                <TouchableOpacity onPress={onSelect}>
                  <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={20}
                    color={status.color}
                  />
                </TouchableOpacity>
                <MaterialCommunityIcons name={status.icon} size={20} color={status.color} style={styles.statusIcon} />
                <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
              </View>
              <View style={styles.dateContainer}>
                <Text style={styles.date}>{item.payment_date}</Text>
                <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.tenantName} numberOfLines={1}>{item.tenant_name || item.tenant}</Text>
              <Text style={styles.houseName} numberOfLines={1}>{item.house_name || item.house}</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount Paid:</Text>
                <Text style={styles.amountValue}>UGX {item.amount_paid}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.balanceInfo}>
                {item.balance_due > 0 && <Text style={styles.balanceText}>Balance: UGX {item.balance_due}</Text>}
                {item.overpayment > 0 && <Text style={styles.overpaymentText}>Overpayment: UGX {item.overpayment}</Text>}
              </View>
            </View>

            {isExpanded && (
              <View style={styles.expandedSection}>
                <View style={styles.expandedRow}>
                  <MaterialCommunityIcons name="credit-card" size={16} color="#4f8cff" />
                  <Text style={styles.expandedText}>{item.payment_method || 'N/A'}</Text>
                </View>
                <View style={styles.expandedRow}>
                  <MaterialCommunityIcons name="barcode" size={16} color="#4f8cff" />
                  <Text style={styles.expandedText}>{item.reference_number || 'N/A'}</Text>
                </View>
                <View style={styles.expandedRow}>
                  <MaterialCommunityIcons name="calendar-range" size={16} color="#4f8cff" />
                  <Text style={styles.expandedText}>{item.payment_start_date} to {item.payment_end_date}</Text>
                </View>
                {item.notes && (
                  <View style={styles.expandedRow}>
                    <MaterialCommunityIcons name="note-text" size={16} color="#4f8cff" />
                    <Text style={styles.expandedText}>{item.notes}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator Much more
        style={styles.summaryScrollView}
        contentContainerStyle={styles.summaryContainer}
      >
        <SummaryCard
          title="Total Paid"
          value={`UGX ${summaryData.totalPaid.toLocaleString()}`}
          icon="cash-multiple"
          color="#2196f3"
          bgColor="#e6f0fa"
          subtitle={`${summaryData.totalPayments} payments`}
          onPress={() => applyQuickFilter('all')}
        />
        <SummaryCard
          title="Arrears"
          value={`UGX ${summaryData.totalArrears.toLocaleString()}`}
          icon="alert-circle"
          color="#ff5252"
          bgColor="#ffe6e6"
          subtitle={`${summaryData.statusCounts.arrears || 0} tenants`}
          onPress={() => applyQuickFilter('overdue')}
        />
        <SummaryCard
          title="Overpayment"
          value={`UGX ${summaryData.totalOverpayment.toLocaleString()}`}
          icon="cash-refund"
          color="#4caf50"
          bgColor="#e6f3e6"
          subtitle={`${summaryData.statusCounts.overpaid || 0} tenants`}
          onPress={() => setFilterStatus('overpaid')}
        />
        <SummaryCard
          title="Average"
          value={`UGX ${summaryData.averagePayment.toLocaleString()}`}
          icon="chart-line"
          color="#ff9800"
          bgColor="#fff3e0"
          subtitle="per payment"
          onPress={() => applyQuickFilter('highValue')}
        />
      </ScrollView>

      {selectedPayments.length > 0 && (
        <View style={styles.bulkActionsContainer}>
          <Text style={styles.bulkActionsText}>
            {selectedPayments.length} selected
          </Text>
          <View style={styles.bulkActionsButtons}>
            <TouchableOpacity
              style={styles.bulkActionBtn}
              onPress={() => handleBulkAction('markPaid')}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="#4caf50" />
              <Text style={styles.bulkActionText}>Mark Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkActionBtn}
              onPress={() => handleBulkAction('sendReminder')}
            >
              <MaterialCommunityIcons name="email" size={20} color="#4f8cff" />
              <Text style={styles.bulkActionText}>Send Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkActionBtn}
              onPress={exportPayments}
            >
              <MaterialCommunityIcons name="download" size={20} color="#ff9800" />
              <Text style={styles.bulkActionText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search payments..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#888"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(true)}
          >
            <MaterialCommunityIcons name="filter-variant" size={18} color="#4f8cff" />
            <Text style={styles.filterBtnText}>Filters</Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortButtonsContainer}
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
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.viewModeBtn}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <MaterialCommunityIcons
              name={viewMode === 'list' ? 'view-grid' : 'view-list'}
              size={18}
              color="#4f8cff"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          Showing {filteredAndSortedPayments.length} of {payments.length} payments
        </Text>
        {(search || filterStatus !== 'all' || dateRange.start || dateRange.end || amountRange.min || amountRange.max) && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredAndSortedPayments}
        keyExtractor={item => item.id.toString()}
        key={viewMode}
        numColumns={viewMode === 'list' ? 1 : 2}
        renderItem={({ item }) => (
          <View style={[
            styles.cardContainer,
            viewMode === 'grid' && styles.gridCardContainer
          ]}>
            <PaymentCard
              item={item}
              isExpanded={expanded[item.id]}
              onPress={() => toggleExpand(item.id)}
              onLongPress={() => setSelectedPayment(item)}
              isSelected={selectedPayments.includes(item.id)}
              onSelect={() => {
                setSelectedPayments(prev =>
                  prev.includes(item.id)
                    ? prev.filter(id => id !== item.id)
                    : [...prev, item.id]
                );
              }}
            />
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No payments found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        )}
      />

      <FilterModal />
      <PaymentDetailModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
    paddingTop: 16,
  },
  summaryScrollView: {
    marginBottom: 16,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginRight: 16,
    minWidth: SCREEN_WIDTH * 0.42,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  summaryCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryCardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e3eaff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  bulkActionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
  },
  bulkActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  bulkActionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },
  controlsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearSearchBtn: {
    padding: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3eaff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  filterBtnText: {
    marginLeft: 6,
    color: '#4f8cff',
    fontWeight: '600',
    fontSize: 14,
  },
  sortButtonsContainer: {
    flex: 1,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sortBtnActive: {
    backgroundColor: '#4f8cff',
  },
  sortBtnText: {
    marginLeft: 4,
    color: '#4f8cff',
    fontWeight: '600',
    fontSize: 12,
    marginRight: 2,
  },
  sortBtnTextActive: {
    color: '#fff',
  },
  viewModeBtn: {
    padding: 10,
    backgroundColor: '#e3eaff',
    borderRadius: 10,
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    color: '#4f8cff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardContainer: {
    marginBottom: 8,
  },
  gridCardContainer: {
    width: (SCREEN_WIDTH - 48) / 2,
    marginHorizontal: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 8,
  },
  status: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  cardBody: {
    marginBottom: 12,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  houseName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceText: {
    color: '#ff5252',
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 2,
  },
  overpaymentText: {
    color: '#4caf50',
    fontWeight: '600',
    fontSize: 12,
  },
  expandedSection: {
    marginTop: 12,
    backgroundColor: '#f7faff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e3eaff',
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
  separator: {
    height: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
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
});

export default PaymentList;