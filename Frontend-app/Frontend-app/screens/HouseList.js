
import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { 
  ScrollView, 
  View, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView
} from 'react-native';
import { 
  Text, 
  Button, 
  TextInput, 
  Avatar, 
  useTheme, 
  Badge, 
  Switch, 
  ActivityIndicator, 
  Card,
  Chip,
  Searchbar,
  FAB,
  Portal,
  Modal,
  IconButton,
  Surface,
  Provider as PaperProvider,
  Divider
} from 'react-native-paper';
import { fetchHouses, addHouse, updateHouse, deleteHouse, setHouseOccupancy } from '../services/houseService';
import { AuthContext } from '../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth > 768;

const initialForm = {
  name: '',
  price: '',
  location: '',
  model: '',
  is_occupied: false,
  landlord: '',
};

const HouseListContent = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  
  // State management
  const [houses, setHouses] = useState([]);
  const [filteredHouses, setFilteredHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState(isTablet ? 'table' : 'card');

  // Color palette
  const COLORS = {
    primary: '#22c55e',      // Main blue (FAB,#007bff buttons)
    secondary: '#f7f8fa',    // App background
    card: '#fff',            // Card/blocks background
    text: '#222',            // Main text
    textLight: '#555',       // Less prominent text
    divider: '#e0e0e0',      // Divider
    fabIcon: '#fff',         // FAB icon
    accent: '#22c55e',       // Accent (for success, vacant, etc.)
    error: '#ef4444',        // Error
    chipBg: '#e0e0e0',       // Chip background
    chipText: '#ffffff',     // Chip text
    badgeOccupied: '#ef4444',// Red for occupied
    badgeVacant: '#22c55e',  // Green for vacant
    white: '#fff',
  };

  // Memoized styles
  const dynamicStyles = useMemo(() => createStyles(theme, COLORS), [theme]);

  // Load houses
  const loadHouses = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const data = await fetchHouses(user.token);
      setHouses(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch houses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.token]);

  // Filter houses
  useEffect(() => {
    let filtered = houses;
    if (searchQuery) {
      filtered = filtered.filter(house => 
        house.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        house.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        house.model.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(house => 
        statusFilter === 'occupied' ? house.is_occupied : !house.is_occupied
      );
    }
    setFilteredHouses(filtered);
  }, [houses, searchQuery, statusFilter]);

  useEffect(() => {
    loadHouses();
  }, [loadHouses]);

  // Form handlers
  const handleAddOrUpdate = async () => {
    if (!form.name.trim() || !form.price.trim() || !form.location.trim() || !form.model.trim()) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
    }
    setLoading(true);
    try {
      const houseData = {
        ...form,
        price: Number(form.price),
        name: form.name.trim(),
        location: form.location.trim(),
        model: form.model.trim(),
        landlord: form.landlord.trim()
      };
      if (editingId) {
        await updateHouse(editingId, houseData, user.token);
        Alert.alert('Success', 'House updated successfully');
      } else {
        await addHouse(houseData, user.token);
        Alert.alert('Success', 'House added successfully');
      }
      resetForm();
      loadHouses();
    } catch (error) {
      Alert.alert('Error', 'Failed to save house. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setModalVisible(false);
  };

  const handleEdit = (house) => {
    setForm({
      name: house.name,
      price: String(house.price),
      location: house.location,
      model: house.model,
      is_occupied: house.is_occupied,
      landlord: house.landlord || '',
    });
    setEditingId(house.id);
    setModalVisible(true);
  };

  const handleDelete = (id, houseName) => {
    Alert.alert(
      'Delete House', 
      `Are you sure you want to delete "${houseName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            setLoading(true);
            try {
              await deleteHouse(id, user.token);
              Alert.alert('Success', 'House deleted successfully');
              loadHouses();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete house. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleOccupancyToggle = async (house) => {
    const action = house.is_occupied ? 'mark as vacant' : 'mark as occupied';
    Alert.alert(
      'Update Occupancy',
      `Are you sure you want to ${action} "${house.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              await setHouseOccupancy(house.id, !house.is_occupied, user.token);
              loadHouses();
            } catch (error) {
              Alert.alert('Error', 'Failed to update occupancy. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Render form modal
  const renderFormModal = () => (
    <Portal>
      <Modal 
        visible={modalVisible} 
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={dynamicStyles.modalContainer}
      >
        <Card style={dynamicStyles.modalCard}>
          <Card.Title 
            title={editingId ? 'Edit House' : 'Add New House'}
            right={(props) => (
              <IconButton 
                {...props} 
                icon="close" 
                onPress={() => setModalVisible(false)} 
              />
            )}
          />
          <Card.Content>
            <TextInput
              label="House Name *"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              style={dynamicStyles.input}
              mode="outlined"
            />
            <TextInput
              label="Price (UGX) *"
              value={form.price}
              onChangeText={v => setForm(f => ({ ...f, price: v }))}
              keyboardType="numeric"
              style={dynamicStyles.input}
              mode="outlined"
            />
            <TextInput
              label="Location *"
              value={form.location}
              onChangeText={v => setForm(f => ({ ...f, location: v }))}
              style={dynamicStyles.input}
              mode="outlined"
            />
            <TextInput
              label="House Type *"
              value={form.model}
              onChangeText={v => setForm(f => ({ ...f, model: v }))}
              style={dynamicStyles.input}
              mode="outlined"
            />
            <TextInput
              label="Landlord ID (Optional)"
              value={form.landlord}
              onChangeText={v => setForm(f => ({ ...f, landlord: v }))}
              style={dynamicStyles.input}
              mode="outlined"
            />
            <View style={dynamicStyles.switchContainer}>
              <Text variant="bodyLarge">Currently Occupied</Text>
              <Switch 
                value={form.is_occupied} 
                onValueChange={v => setForm(f => ({ ...f, is_occupied: v }))} 
              />
            </View>
          </Card.Content>
          <Card.Actions style={dynamicStyles.modalActions}>
            <Button 
              mode="contained" 
              onPress={handleAddOrUpdate} 
              loading={loading}
              disabled={loading}
              style={dynamicStyles.primaryButton}
            >
              {editingId ? 'Update' : 'Add'}
            </Button>
            <Button 
              mode="outlined" 
              onPress={resetForm}
              disabled={loading}
            >
              Cancel
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );

  // Render table view (for tablets)
  const renderTableView = () => (
    <Surface style={dynamicStyles.tableContainer}>
      <View style={dynamicStyles.tableHeader}>
        <View style={dynamicStyles.tableHeaderCell}>
          <Text variant="labelMedium" style={dynamicStyles.tableHeaderText}>House</Text>
        </View>
        <View style={dynamicStyles.tableHeaderCell}>
          <Text variant="labelMedium" style={dynamicStyles.tableHeaderText}>Price</Text>
        </View>
        <View style={dynamicStyles.tableHeaderCell}>
          <Text variant="labelMedium" style={dynamicStyles.tableHeaderText}>Location</Text>
        </View>
        <View style={dynamicStyles.tableHeaderCell}>
          <Text variant="labelMedium" style={dynamicStyles.tableHeaderText}>Type</Text>
        </View>
        <View style={dynamicStyles.tableHeaderCell}>
          <Text variant="labelMedium" style={dynamicStyles.tableHeaderText}>Status</Text>
        </View>
        <View style={dynamicStyles.tableHeaderCell}>
          <Text variant="labelMedium" style={dynamicStyles.tableHeaderText}>Actions</Text>
        </View>
      </View>
      <ScrollView style={dynamicStyles.tableBody}>
        {filteredHouses.map((house, index) => (
          <View 
            key={house.id} 
            style={[
              dynamicStyles.tableRow,
              index % 2 === 0 ? dynamicStyles.tableRowEven : dynamicStyles.tableRowOdd
            ]}
          >
            <View style={dynamicStyles.tableCell}>
              <View style={dynamicStyles.tableCellContent}>
                <Avatar.Icon 
                  size={32} 
                  icon="home-city" 
                  style={{ backgroundColor: COLORS.primary }}
                />
                <Text variant="bodyMedium" style={dynamicStyles.tableCellText}>
                  {house.name}
                </Text>
              </View>
            </View>
            <View style={dynamicStyles.tableCell}>
              <Text variant="bodyMedium" style={dynamicStyles.tableCellText}>
                UGX {house.price.toLocaleString()}
              </Text>
            </View>
            <View style={dynamicStyles.tableCell}>
              <Text variant="bodyMedium" style={dynamicStyles.tableCellText}>
                {house.location}
              </Text>
            </View>
            <View style={dynamicStyles.tableCell}>
              <Text variant="bodyMedium" style={dynamicStyles.tableCellText}>
                {house.model}
              </Text>
            </View>
            <View style={dynamicStyles.tableCell}>
              <Badge 
                style={[
                  dynamicStyles.statusBadge,
                  { backgroundColor: house.is_occupied ? COLORS.badgeOccupied : COLORS.badgeVacant, color: '#fff' }
                ]}
              >
                {house.is_occupied ? 'Occupied' : 'Vacant'}
              </Badge>
            </View>
            <View style={[dynamicStyles.tableCell, dynamicStyles.actionsCell]}>
              <IconButton 
                icon="pencil" 
                size={20}
                iconColor={COLORS.primary}
                onPress={() => handleEdit(house)}
                style={{ backgroundColor: '#e6f9ed', borderRadius: 16 }}
              />
              <IconButton 
                icon={house.is_occupied ? 'home-off' : 'home'}
                size={20}
                iconColor={house.is_occupied ? COLORS.badgeOccupied : COLORS.accent}
                onPress={() => handleOccupancyToggle(house)}
                style={{ backgroundColor: '#f7f8fa', borderRadius: 16 }}
              />
              <IconButton 
                icon="delete" 
                size={20}
                iconColor={COLORS.error}
                onPress={() => handleDelete(house.id, house.name)}
                style={{ backgroundColor: '#fff0f0', borderRadius: 16 }}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </Surface>
  );

  // Render card view
  const renderCardView = () => (
    <View style={dynamicStyles.cardContainer}>
      {filteredHouses.map((house) => (
        <Card key={house.id} style={dynamicStyles.houseCard}>
          <Card.Content>
            <View style={dynamicStyles.cardHeader}>
              <Avatar.Icon 
                size={48} 
                icon="home-city" 
                style={{ backgroundColor: COLORS.primary }}
              />
              <View style={dynamicStyles.cardHeaderText}>
                <Text variant="titleMedium" style={dynamicStyles.houseName}>
                  {house.name}
                </Text>
                <Badge 
                  style={[
                    dynamicStyles.statusBadge,
                    { backgroundColor: house.is_occupied ? COLORS.badgeOccupied : COLORS.badgeVacant, color: '#fff' }
                  ]}
                >
                  {house.is_occupied ? 'Occupied' : 'Vacant'}
                </Badge>
              </View>
            </View>
            <View style={dynamicStyles.cardDetails}>
              <View style={dynamicStyles.detailRow}>
                <Text variant="bodyMedium" style={dynamicStyles.detailLabel}>Price:</Text>
                <Text variant="bodyMedium" style={dynamicStyles.detailValue}>
                  UGX {house.price.toLocaleString()}
                </Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text variant="bodyMedium" style={dynamicStyles.detailLabel}>Location:</Text>
                <Text variant="bodyMedium" style={dynamicStyles.detailValue}>
                  {house.location}
                </Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text variant="bodyMedium" style={dynamicStyles.detailLabel}>Type:</Text>
                <Text variant="bodyMedium" style={dynamicStyles.detailValue}>
                  {house.model}
                </Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions style={dynamicStyles.cardActions}>
            <Button 
              mode="outlined" 
              onPress={() => handleEdit(house)}
              icon="pencil"
              compact
              textColor={COLORS.primary}
              style={{ borderColor: COLORS.primary, borderWidth: 1 }}
            >
              Edit
            </Button>
            <Button 
              mode="contained" 
              onPress={() => handleOccupancyToggle(house)}
              icon={house.is_occupied ? 'home-off' : 'home'}
              style={[
                dynamicStyles.actionButton,
                { backgroundColor: house.is_occupied ? COLORS.badgeOccupied : COLORS.accent }
              ]}
              compact
              textColor={'#fff'}
            >
              {house.is_occupied ? 'Mark Vacant' : 'Mark Occupied'}
            </Button>
            <IconButton 
              icon="delete" 
              iconColor={COLORS.error}
              onPress={() => handleDelete(house.id, house.name)}
              style={{ backgroundColor: '#fff0f0', borderRadius: 16 }}
            />
          </Card.Actions>
        </Card>
      ))}
    </View>
  );

  // Render filter chips
  const renderFilterChips = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={dynamicStyles.filterContainer}
      contentContainerStyle={dynamicStyles.filterContent}
    >
      <Chip
        selected={statusFilter === 'all'}
        onPress={() => setStatusFilter('all')}
        style={dynamicStyles.filterChip}
      >
        All Houses ({houses.length})
      </Chip>
      <Chip
        selected={statusFilter === 'vacant'}
        onPress={() => setStatusFilter('vacant')}
        style={dynamicStyles.filterChip}
      >
        Vacant ({houses.filter(h => !h.is_occupied).length})
      </Chip>
      <Chip
        selected={statusFilter === 'occupied'}
        onPress={() => setStatusFilter('occupied')}
        style={dynamicStyles.filterChip}
      >
        Occupied ({houses.filter(h => h.is_occupied).length})
      </Chip>
    </ScrollView>
  );

  // Analytics
  const total = houses.length;
  const occupied = houses.filter(h => h.is_occupied).length;
  const vacant = houses.filter(h => !h.is_occupied).length;

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <Surface style={dynamicStyles.header}>
        <Text variant="headlineSmall" style={dynamicStyles.headerTitle}>
          House Management Dashboard
        </Text>
      </Surface>
      <View style={dynamicStyles.analyticsBlockRow}>
        <View style={dynamicStyles.analyticsLeftRow}>
          <Text variant="titleSmall" style={dynamicStyles.sectionTitle}>Find a House</Text>
          <View style={dynamicStyles.searchFilterRowRow}>
            <Searchbar
              placeholder="Search houses..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={dynamicStyles.searchbarRow}
            />
            <View style={dynamicStyles.filterChipsRowRow}>{renderFilterChips()}</View>
          </View>
        </View>
        <View style={dynamicStyles.analyticsRightRow}>
          <Text variant="titleSmall" style={[dynamicStyles.analyticsTitle, { color: COLORS.primary, fontWeight: 'bold', letterSpacing: 0.5 }]}>Analytics</Text>
          <View style={dynamicStyles.analyticsRowRow}>
            <Chip style={[dynamicStyles.analyticsChipRow, { backgroundColor: COLORS.primary }]} textStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }} icon="home-group">
              Total: {total}
            </Chip>
            <Chip style={[dynamicStyles.analyticsChipRow, { backgroundColor: COLORS.badgeOccupied }]} textStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }} icon="home-alert">
              Occupied: {occupied}
            </Chip>
            <Chip style={[dynamicStyles.analyticsChipRow, { backgroundColor: COLORS.badgeVacant }]} textStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }} icon="home-outline">
              Vacant: {vacant}
            </Chip>
          </View>
          {isTablet && (
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <IconButton
                icon="view-grid"
                selected={viewMode === 'card'}
                onPress={() => setViewMode('card')}
                iconColor={viewMode === 'card' ? COLORS.primary : COLORS.textLight}
              />
              <IconButton
                icon="table"
                selected={viewMode === 'table'}
                onPress={() => setViewMode('table')}
                iconColor={viewMode === 'table' ? COLORS.primary : COLORS.textLight}
              />
            </View>
          )}
        </View>
      </View>
      <Divider style={dynamicStyles.analyticsDivider} />
      <View style={dynamicStyles.sectionBlock}>
        <Text variant="titleSmall" style={dynamicStyles.sectionTitle}>All Houses</Text>
        <ScrollView
          style={dynamicStyles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHouses(true)}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {loading && !refreshing && (
            <View style={dynamicStyles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text variant="bodyMedium" style={dynamicStyles.loadingText}>
                Loading houses...
              </Text>
            </View>
          )}
          {!loading && filteredHouses.length === 0 && (
            <View style={dynamicStyles.emptyContainer}>
              <Avatar.Icon 
                size={64} 
                icon="home-search" 
                style={{ backgroundColor: COLORS.secondary }}
              />
              <Text variant="titleMedium" style={dynamicStyles.emptyTitle}>
                {searchQuery || statusFilter !== 'all' ? 'No houses found' : 'No houses yet'}
              </Text>
              <Text variant="bodyMedium" style={dynamicStyles.emptySubtitle}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Add your first house to get started'
                }
              </Text>
            </View>
          )}
          {!loading && filteredHouses.length > 0 && (
            viewMode === 'table' && isTablet ? renderTableView() : renderCardView()
          )}
        </ScrollView>
      </View>
      <FAB
        icon="plus"
        style={dynamicStyles.fab}
        onPress={() => setModalVisible(true)}
        label={!isTablet ? undefined : "Add House"}
      />
      {renderFormModal()}
    </SafeAreaView>
  );
};

const createStyles = (theme, COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 0,
    elevation: 0,
    minHeight: 44,
    maxHeight: 56,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  analyticsBlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  analyticsLeftRow: {
    flex: 1,
  },
  analyticsRightRow: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222', // darker for visibility
    fontSize: 17,
  },
  searchFilterRowRow: {
    flexDirection: 'column',
  },
  searchbarRow: {
    marginBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  filterChipsRowRow: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: COLORS.chipBg,
    borderColor: COLORS.divider,
    borderWidth: 1,
  },
  analyticsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222', // darker for visibility
    fontSize: 17,
  },
  analyticsRowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  analyticsChipRow: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.chipBg,
    borderColor: COLORS.divider,
    borderWidth: 1,
  },
  analyticsChipTextRow: {
    color: '#fff', // white for best contrast
    fontWeight: 'bold',
  },
  analyticsDivider: {
    marginHorizontal: 18,
    backgroundColor: COLORS.divider,
    height: 1.5,
  },
  sectionBlock: {
    flex: 1,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontSize: 18,
  },
  emptySubtitle: {
    color: COLORS.textLight,
  },
  cardContainer: {
    paddingBottom: 80,
  },
  houseCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 18,
    backgroundColor: COLORS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    marginLeft: 16,
  },
  houseName: {
    fontWeight: 'bold',
    color: COLORS.text,
    fontSize: 16,
  },
  statusBadge: {
    marginTop: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: 'bold',
    color: COLORS.white,
    fontSize: 13,
  },
  cardDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: COLORS.textLight,
    fontWeight: '500',
  },
  detailValue: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  tableContainer: {
    marginBottom: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: COLORS.white,
    fontSize: 15,
  },
  tableBody: {
    backgroundColor: COLORS.white,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tableRowEven: {
    backgroundColor: COLORS.secondary,
  },
  tableRowOdd: {
    backgroundColor: COLORS.white,
  },
  tableCell: {
    flex: 1,
    alignItems: 'center',
  },
  tableCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCellText: {
    marginLeft: 8,
    color: COLORS.text,
  },
  actionsCell: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    margin: 16,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modalCard: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  primaryButton: {
    marginRight: 8,
    backgroundColor: COLORS.primary,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: COLORS.primary,
    elevation: 4,
    borderRadius: 30,
    paddingHorizontal: 12,
  },
});

const HouseList = () => {
  return (
    <PaperProvider>
      <HouseListContent />
    </PaperProvider>
  );
};

export default HouseList;