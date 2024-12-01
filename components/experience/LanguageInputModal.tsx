import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { setModalVisible, setInputLanguage } from '../../redux/slices/experienceSlice';

interface LanguageInputModalProps {
  onSubmit: (language: string) => void;
}

export const LanguageInputModal = ({
  onSubmit,
}: LanguageInputModalProps) => {
  const dispatch = useDispatch();
  const { modalVisible, inputLanguage } = useSelector((state: RootState) => state.experience);

  const handleSubmit = () => {
    if (inputLanguage.trim()) {
      onSubmit(inputLanguage);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => dispatch(setModalVisible(false))}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => dispatch(setModalVisible(false))}
      >
        <Pressable 
          style={styles.modalContent}
          onPress={e => e.stopPropagation()}
        >
          <TextInput
            style={styles.input}
            placeholder="Enter language"
            value={inputLanguage}
            onChangeText={(text) => dispatch(setInputLanguage(text))}
            autoFocus
            onSubmitEditing={handleSubmit}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleSubmit}
            >
              <Text>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => dispatch(setModalVisible(false))}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    padding: 10,
    elevation: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center'
  }
});
