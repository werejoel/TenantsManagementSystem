import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, Alert, FlatList, Dimensions } from 'react-native';
import { ActivityIndicator, Card, Text, Button, useTheme, Badge } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { fetchHouses } from '../services/houseService';
import { assignTenantToHouse } from '../services/tenantService';

const AssignHouseScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const { tenant } = route.params;
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null); // houseId being assigned
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    const loadHouses = async () => {
      try {
        const data = await fetchHouses(user?.token);
        setHouses(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch houses');
      } finally {
        setLoading(false);
      }
    };
    loadHouses();
  }, [user]);

  const handleAssign = async (houseId) => {
    setAssigning(houseId);
    try {
      await assignTenantToHouse(tenant.id, houseId, user?.token);
      Alert.alert('Success', 'Tenant assigned to house');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign house');
    } finally {
      setAssigning(null);
    }
  };

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
  );

  const renderHouse = ({ item }) => (
    <Card style={[styles.card, { width: screenWidth - 32 }]} elevation={2}>
      <Card.Title
        title={item.name}
        subtitle={`Location: ${item.location}`}
        right={() => (
          <Badge style={{ backgroundColor: item.is_occupied ? '#d9534f' : '#5cb85c', marginRight: 12 }}>
            {item.is_occupied ? 'Occupied' : 'Available'}
          </Badge>
        )}
      />
      <Card.Content>
        <Text style={styles.info}>Price: <Text style={{ color: theme.colors.primary }}>UGX {item.price}</Text></Text>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          icon="account-plus"
          onPress={() => handleAssign(item.id)}
          disabled={item.is_occupied || assigning === item.id}
          loading={assigning === item.id}
          style={styles.assignBtn}
          contentStyle={{ height: 40 }}
        >
          Assign
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign House to <Text style={{ color: theme.colors.primary }}>{tenant.name}</Text></Text>
      <FlatList
        data={houses}
        keyExtractor={item => item.id.toString()}
        renderItem={renderHouse}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No houses available.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f7f8fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 8,
    color: '#222',
  },
  listContainer: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  card: {
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  info: {
    fontSize: 15,
    marginBottom: 4,
    color: '#444',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  assignBtn: {
    borderRadius: 8,
    minWidth: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16,
  },
});

export default AssignHouseScreen;
