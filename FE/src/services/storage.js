// Local storage service to persist device state

const DEVICE_STATE_KEY = 'iot_device_states';

export const storageService = {
  // Save device state to localStorage
  saveDeviceState: (deviceStates) => {
    try {
      localStorage.setItem(DEVICE_STATE_KEY, JSON.stringify(deviceStates));
      console.log('Device state saved to localStorage:', deviceStates);
    } catch (error) {
      console.error('Error saving device state:', error);
    }
  },

  // Get device state from localStorage
  getDeviceState: () => {
    try {
      const saved = localStorage.getItem(DEVICE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Device state loaded from localStorage:', parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Error loading device state:', error);
      return null;
    }
  },

  // Clear device state from localStorage
  clearDeviceState: () => {
    try {
      localStorage.removeItem(DEVICE_STATE_KEY);
      console.log('Device state cleared from localStorage');
    } catch (error) {
      console.error('Error clearing device state:', error);
    }
  }
};

export default storageService;

