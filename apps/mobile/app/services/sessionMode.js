const SecureStore = require('expo-secure-store');

const ACTIVE_MODE_KEY = 'oficios.session.active-mode';

const APP_MODES = {
  CUSTOMER: 'CUSTOMER',
  PROFESSIONAL: 'PROFESSIONAL',
};

async function saveActiveMode(mode) {
  if (!mode) {
    await SecureStore.deleteItemAsync(ACTIVE_MODE_KEY);
    return;
  }

  await SecureStore.setItemAsync(ACTIVE_MODE_KEY, mode);
}

async function getActiveMode() {
  return SecureStore.getItemAsync(ACTIVE_MODE_KEY);
}

async function clearActiveMode() {
  await SecureStore.deleteItemAsync(ACTIVE_MODE_KEY);
}

module.exports = {
  APP_MODES,
  clearActiveMode,
  getActiveMode,
  saveActiveMode,
};
