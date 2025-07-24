
import React, { useContext } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { deactivateTenant } from '../services/tenantService';
import { Card, Text, Button, Avatar, useTheme, Badge, Divider } from 'react-native-paper';
import { Dimensions } from 'react-native';

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
      Alert.alert('Success', 'Tenant deactivated');
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

  
  // card width and font size
  let cardWidth = '100%';
  let cardMaxWidth = 1100; // Increased from 800
  let cardMinWidth = 260;  // Increased from 180
  let infoFontSize = 16;
  let listMaxWidth = 1400; // Increased from 1000
  if (screenWidth < 350) {
    cardWidth = '99%';
    cardMinWidth = 180; // Increased from 120
    infoFontSize = 14;
    listMaxWidth = 400;
  } else if (screenWidth < 420) {
    cardWidth = '98%';
    cardMinWidth = 210; // Increased from 150
    infoFontSize = 15;
    listMaxWidth = 600;
  } else if (screenWidth > 700) {
    cardWidth = '100%';
    cardMaxWidth = 1300; // Increased from 900
    listMaxWidth = 1600;
  }

  const renderTenant = ({ item }) => (
    <Card
      style={[
        styles.card,
        {
          width: cardWidth,
          minWidth: cardMinWidth,
          maxWidth: cardMaxWidth,
          alignSelf: 'stretch',
          marginHorizontal: 0,
          paddingHorizontal: screenWidth < 350 ? 4 : 12,
        },
      ]}
      elevation={3}
      onPress={() => handleEdit(item)}
      rippleColor={theme.colors.primary + '22'}
    >
      <Card.Title
        title={item.name}
        subtitle={item.email}
        left={(props) => <Avatar.Text {...props} label={item.name ? item.name[0] : '?'} style={{ backgroundColor: theme.colors.primary }} />}
        right={() => (
          <Badge
            style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'active' ? '#5cb85c' : '#d9534f' },
            ]}
            size={24}
          >
            {item.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        )}
      />
      <Card.Content>
        <Text style={[styles.info, { fontSize: infoFontSize }]}>Phone: <Text style={{ color: theme.colors.primary }}>{item.phone}</Text></Text>
      </Card.Content>
      <Divider style={styles.divider} />
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => handleEdit(item)}
          style={styles.actionBtn}
          icon="pencil"
          compact
          contentStyle={{ height: 38 }}
          buttonColor={theme.colors.primary}
          textColor="#fff"
        >
          Edit
        </Button>
        <Button
          mode="contained-tonal"
          onPress={() => handleDeactivate(item.id)}
          style={styles.actionBtn}
          icon="account-off"
          buttonColor="#d9534f"
          textColor="#fff"
          loading={deactivatingId === item.id}
          disabled={deactivatingId === item.id}
          compact
          contentStyle={{ height: 38 }}
        >
          Deactivate
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleAssignHouse(item)}
          style={styles.actionBtn}
          icon="home"
          compact
          contentStyle={{ height: 38 }}
          textColor={theme.colors.primary}
        >
          Assign House
        </Button>
      </Card.Actions>
    </Card>
  );

  // rows for grid display
  const numColumns = screenWidth > 700 ? 3 : screenWidth > 500 ? 2 : 1;
  const rows = [];
  for (let i = 0; i < tenants.length; i += numColumns) {
    rows.push(tenants.slice(i, i + numColumns));
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f8fa' }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[styles.listOuter, { maxWidth: listMaxWidth, alignSelf: 'center', width: '100%' }]}> 
        <View style={styles.gridContainer}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((item, colIndex) => (
                <View key={item.id} style={[styles.col, { flex: 1 / numColumns }]}> 
                  {renderTenant({ item })}
                </View>
              ))}

              {/* Fill empty columns for last row if needed */}
              {row.length < numColumns &&
                Array.from({ length: numColumns - row.length }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={[styles.col, { flex: 1 / numColumns }]} />
                ))}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  listOuter: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    alignItems: 'center',
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'column',
    width: '100%',
    padding: 8,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
    alignItems: 'stretch',
  },
  col: {
    flexDirection: 'column',
    paddingHorizontal: 4,
    minWidth: 0,
  },
  card: {
    marginBottom: 28, // Increased spacing
    borderRadius: 22, // Slightly larger corners
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
    transitionDuration: '150ms',
    alignSelf: 'center',
    paddingVertical: 8, // Add vertical padding for more space
    paddingHorizontal: 8, // Add horizontal padding for more space
  },
  statusBadge: {
    alignSelf: 'center',
    marginRight: 8,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
    elevation: 2,
  },
  divider: {
    marginVertical: 4,
    backgroundColor: '#eee',
    height: 1,
  },
  info: {
    fontSize: 15,
    marginBottom: 4,
    color: '#444',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 10,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 8,
    minWidth: 80,
  },
});

export default TenantList;
