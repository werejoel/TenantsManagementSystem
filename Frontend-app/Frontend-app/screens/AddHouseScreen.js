import React, { useContext } from 'react';
import { View, Alert } from 'react-native';
import HouseForm from '../components/HouseForm';
import { AuthContext } from '../context/AuthContext';
import { addHouse } from '../services/houseService';

const AddHouseScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const handleAddHouse = async (houseData) => {
    try {
      await addHouse(houseData, user?.token);
      Alert.alert('Success', 'House/Unit added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add house/unit');
    }
  };

  return (
    <View>
      <HouseForm onSubmit={handleAddHouse} />
    </View>
  );
};

export default AddHouseScreen;
