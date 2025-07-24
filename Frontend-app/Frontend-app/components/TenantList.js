import React, { useContext } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { deactivateTenant } from '../services/tenantService';
import { Text, Button, Avatar, useTheme, Badge, Divider } from 'react-native-paper';
import { Dimensions } from 'react-native';

//Main Function
const TenantList = ({ tenants, onActionComplete }) => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const [deactivatingId, setDeactivatingId] = React.useState(null);
  const screenWidth = Dimensions.get('window').width;

  const handleDeactivate = async (id) => {
    setDeactivatingId(id);
    try {
      await deactivateTenant(id, user?.token);
      Alert.alert('Success', 'Tenant deactivated successfully');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to deactivate tenant');
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleEdit = (tenant) => {
    navigation.navigate('EditTenant', { tenant });
    const unsubscribe = navigation.addListener('focus', () => {
      if (onActionComplete) onActionComplete();
      unsubscribe();
    });
  };

  const handleAssignHouse = (tenant) => {
    navigation.navigate('AssignHouse', { tenant });
    const unsubscribe = navigation.addListener('focus', () => {
      if (onActionComplete) onActionComplete();
      unsubscribe();
    });
  };

  const renderTenantRow = (item, idx) => (
    <View key={item.id} style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}> 
      <View style={styles.tableCellAvatar}>
        <Avatar.Text size={32} label={item.name ? item.name[0] : '?'} style={{ backgroundColor: theme.colors.primary }} />
      </View>
      <View style={styles.tableCellName}>
        <Text style={styles.tableCell}>{item.name}</Text>
      </View>
      <View style={styles.tableCellEmail}>
        <Text style={styles.tableCell}>{item.email}</Text>
      </View>
      <View style={styles.tableCellPhone}>
        <Text style={styles.tableCell}>{item.phone}</Text>
      </View>
      <View style={styles.tableCellStatus}>
        <Badge style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#28a745' : '#dc3545' }]} size={22}>
          {item.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </View>
      <View style={styles.tableCellActions}>
        <Button
          mode="contained"
          onPress={() => handleEdit(item)}
          style={[styles.actionBtn, styles.editBtn]}
          icon="pencil"
          compact={false}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Edit
        </Button>
        <Button
          mode="contained"
          onPress={() => handleDeactivate(item.id)}
          style={[styles.actionBtn, styles.deactivateBtn]}
          icon="account-cancel"
          loading={deactivatingId === item.id}
          disabled={deactivatingId === item.id || item.status === 'inactive'}
          compact={false}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {deactivatingId === item.id ? 'Deactivating...' : 'Deactivate'}
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleAssignHouse(item)}
          style={[styles.actionBtn, styles.assignBtn]}
          icon="home-plus"
          compact={false}
          contentStyle={styles.buttonContent}
          labelStyle={[styles.buttonLabel, styles.outlinedButtonLabel]}
        >
          Assign Property
        </Button>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tableWrapper}>
        {/* Fixed Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.tableCellAvatar}>
              <Text style={styles.headerText}>Avatar</Text>
            </View>
            <View style={styles.tableCellName}>
              <Text style={styles.headerText}>Name</Text>
            </View>
            <View style={styles.tableCellEmail}>
              <Text style={styles.headerText}>Email</Text>
            </View>
            <View style={styles.tableCellPhone}>
              <Text style={styles.headerText}>Phone</Text>
            </View>
            <View style={styles.tableCellStatus}>
              <Text style={styles.headerText}>Status</Text>
            </View>
            <View style={styles.tableCellActions}>
              <Text style={styles.headerText}>Actions</Text>
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
        >
          {tenants.map((item, idx) => renderTenantRow(item, idx))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  tableWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  headerContainer: {
    backgroundColor: '#2c3e50',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    minHeight: 60,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
    maxHeight: 500,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    minHeight: 80, 
  },
  tableRowEven: {
    backgroundColor: '#f8f9fa',
  },
  tableRowOdd: {
    backgroundColor: '#ffffff',
  },
  tableCell: {
    fontSize: 15,
    color: '#495057',
    fontWeight: '500',
  },
  tableCellAvatar: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellName: {
    width: 170,
    paddingHorizontal: 10,
  },
  tableCellEmail: {
    width: 240,
    paddingHorizontal: 10,
  },
  tableCellPhone: {
    width: 150,
    paddingHorizontal: 10,
  },
  tableCellStatus: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellActions: {
    width: 430, // Further increased for full Assign Property label
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
  },
  statusBadge: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionBtn: {
    minWidth: 135,
    maxWidth: 170,
    borderRadius: 8,
    elevation: 2, 
    marginHorizontal: 2,
  },
  editBtn: {
    backgroundColor: '#007bff', 
  },
  deactivateBtn: {
    backgroundColor: '#dc3545',
  },
  assignBtn: {
    borderColor: '#28a745', 
    borderWidth: 2,
    minWidth: 155, // Increased for long label
    maxWidth: 190,
  },
  buttonContent: {
    height: 42, 
    paddingHorizontal: 8,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  outlinedButtonLabel: {
    color: '#28a745', 
  },
});

export default TenantList;