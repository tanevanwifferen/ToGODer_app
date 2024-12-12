import { Modal, View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { setModalVisible, setInputLanguage } from '../../redux/slices/experienceSlice';

interface LanguageInputModalProps {
  onSubmit: (language: string) => void;
}

export const LanguageInputModal = ({ onSubmit }: LanguageInputModalProps) => {
  const dispatch = useDispatch();
  const { modalVisible, inputLanguage } = useSelector((state: RootState) => state.experience);

  const handleSubmit = () => {
    if (inputLanguage.trim()) {
      onSubmit(inputLanguage);
      dispatch(setModalVisible(false));
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => dispatch(setModalVisible(false))}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput
              style={styles.input}
              placeholder="Enter language"
              value={inputLanguage}
              onChangeText={(text) => dispatch(setInputLanguage(text))}
              autoFocus
              onSubmitEditing={handleSubmit}
            />
            <View style={styles.buttonContainer}>
              <Pressable 
                style={[styles.button, styles.buttonSubmit]}
                onPress={handleSubmit}
              >
                <Text style={styles.textStyle}>Submit</Text>
              </Pressable>
              <Pressable 
                style={[styles.button, styles.buttonCancel]}
                onPress={() => dispatch(setModalVisible(false))}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
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
    elevation: 5,
    width: '80%'
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
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: 100,
    marginHorizontal: 5
  },
  buttonSubmit: {
    backgroundColor: '#2196F3',
  },
  buttonCancel: {
    backgroundColor: '#F194FF',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
