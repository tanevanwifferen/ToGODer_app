import { store } from '../redux/store';
import { setPersonalData, selectPersonalData } from '../redux/slices/personalSlice';
import Toast from 'react-native-toast-message';

class PersonalDataService {
  private static instance: PersonalDataService;

  private constructor() {
    console.log('[PersonalDataService] Service initialized');
  }

  public static getInstance(): PersonalDataService {
    if (!PersonalDataService.instance) {
      console.log('[PersonalDataService] Creating new instance');
      PersonalDataService.instance = new PersonalDataService();
    }
    return PersonalDataService.instance;
  }

  private getCurrentData(): Record<string, any> {
    const data = selectPersonalData(store.getState());
    console.log('[PersonalDataService] Current data retrieved:', data);
    return typeof data == "string" ? JSON.parse(data) : data;
  }

  private isEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  public handleUpdateData(updateData: Record<string, any>) {
    try {
      console.log('[PersonalDataService] Handling update data:', updateData);
      const currentData = this.getCurrentData();
      const updatedData = JSON.parse(JSON.stringify(currentData));
      let hasChanges = false;

      Object.entries(updateData).forEach(([key, value]) => {
        console.log('[PersonalDataService] Processing operation:', key, value);
        
        if (key.startsWith('set')) {
          const propertyName = key.slice(3).toLowerCase();
          console.log(`[PersonalDataService] SET operation: ${propertyName}:`, value);
          updatedData[propertyName] = value;
        } else if (key.startsWith('add')) {
          const propertyName = (key.slice(3).toLowerCase() + 's').replace(/ss$/, 's');
          console.log(`[PersonalDataService] ADD operation: ${propertyName}:`, value);
          if (!Array.isArray(updatedData[propertyName])) {
            updatedData[propertyName] = [];
          }
          const itemsToAdd = Array.isArray(value) ? value : [value];
          const maxId = Math.max(...updatedData[propertyName].map((item: any) => item.id || 0), 0);
          itemsToAdd.forEach((item: any, index: number) => {
            const item_copy = typeof item === 'string' ? item : { ...item, id: maxId + index + 1 };
            updatedData[propertyName].push(item_copy);
          });
        } else if (key.startsWith('remove')) {
          const propertyName = (key.slice(6).toLowerCase() + 's').replace(/ss$/, 's');
          console.log(`[PersonalDataService] REMOVE operation: ${propertyName}:`, value);
          if (Array.isArray(updatedData[propertyName])) {
            const itemsToRemove = Array.isArray(value) ? value : [value];
            const idsToRemove = itemsToRemove.map(item => typeof item === 'number' ? item : item.id);
            updatedData[propertyName] = updatedData[propertyName].filter(item => !idsToRemove.includes(item.id));
          }
        } else if (key.startsWith('update')) {
          const propertyName = (key.slice(6).toLowerCase() + 's').replace(/ss$/, 's');
          console.log(`[PersonalDataService] UPDATE operation: ${propertyName}:`, value);
          if (Array.isArray(updatedData[propertyName])) {
            const itemsToUpdate = Array.isArray(value) ? value : [value];
            const updateMap = new Map(itemsToUpdate.map(item => [item.id, item]));
            updatedData[propertyName] = updatedData[propertyName].map(item => 
              updateMap.has(item.id) ? { ...item, ...updateMap.get(item.id) } : item
            );
          }
        }
      });

      // Only dispatch and show toast if data actually changed
      if (!this.isEqual(currentData, updatedData)) {
        console.log('[PersonalDataService] Changes detected, dispatching updated data:', updatedData);
        store.dispatch(setPersonalData(updatedData));
        Toast.show({
          type: 'success',
          text1: 'Memory updated',
          position: 'top',
          visibilityTime: 3000,
        });
      } else {
        console.log('[PersonalDataService] No changes detected');
      }
    } catch (error) {
      console.error('[PersonalDataService] Error updating data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update data. Please try again.',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
  }

  public processMessage(message: any) {
    console.log('[PersonalDataService] Processing message:', message);
    if (message.updateData) {
      this.handleUpdateData(message.updateData);
    }
  }
}

export default PersonalDataService;
