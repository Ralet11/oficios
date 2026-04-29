const React = require('react');
const { hasRole } = require('@oficios/domain');
const { api } = require('../services/api');
const { APP_MODES, clearActiveMode, getActiveMode, saveActiveMode } = require('../services/sessionMode');

const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [booting, setBooting] = React.useState(true);
  const [token, setToken] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [professionalProfile, setProfessionalProfile] = React.useState(null);
  const [customerProfile, setCustomerProfile] = React.useState(null);
  const [activeMode, setActiveMode] = React.useState(APP_MODES.CUSTOMER);

  const syncActiveMode = React.useCallback(async (nextUser, preferredMode) => {
    const nextMode =
      hasRole(nextUser, APP_MODES.PROFESSIONAL) && preferredMode === APP_MODES.PROFESSIONAL
        ? APP_MODES.PROFESSIONAL
        : APP_MODES.CUSTOMER;

    setActiveMode(nextMode);
    await saveActiveMode(nextMode);
    return nextMode;
  }, []);

  const hydrate = React.useCallback(async () => {
    try {
      const storedToken = await api.getToken();
      if (!storedToken) {
        setActiveMode(APP_MODES.CUSTOMER);
        await clearActiveMode();
        setBooting(false);
        return;
      }

      const storedMode = await getActiveMode();
      const response = await api.me(storedToken);
      setToken(storedToken);
      setUser(response.user);
      setProfessionalProfile(response.professionalProfile);
      await syncActiveMode(response.user, storedMode);

      try {
        const customerRes = await api.myCustomerProfile(storedToken);
        setCustomerProfile(customerRes);
      } catch (_err) {
        setCustomerProfile(null);
      }
    } catch (_error) {
      await api.clearToken();
      await clearActiveMode();
      setToken(null);
      setUser(null);
      setProfessionalProfile(null);
      setCustomerProfile(null);
      setActiveMode(APP_MODES.CUSTOMER);
    } finally {
      setBooting(false);
    }
  }, [syncActiveMode]);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  async function completeSession(session) {
    await api.saveToken(session.token);
    setToken(session.token);
    setUser(session.user);
    const storedMode = await getActiveMode();
    const response = await api.me(session.token);
    setUser(response.user);
    setProfessionalProfile(response.professionalProfile);
    await syncActiveMode(response.user, storedMode);

    try {
      const customerRes = await api.myCustomerProfile(session.token);
      setCustomerProfile(customerRes);
    } catch (_err) {
      setCustomerProfile(null);
    }
    return response;
  }

  async function signIn(credentials) {
    const session = await api.login(credentials);
    await completeSession(session);
  }

  async function signUp(payload) {
    const session = await api.register(payload);
    await completeSession(session);
  }

  async function requestPhoneCode(phone) {
    return api.startPhoneAuth({ phone });
  }

  async function continueWithPhone(payload) {
    const response = await api.verifyPhoneAuth(payload);

    if (response.status === 'AUTHENTICATED' && response.session) {
      await completeSession(response.session);
    }

    return response;
  }

  async function signInWithProvider(payload) {
    const session = await api.socialLogin(payload);
    await completeSession(session);
  }

  async function refreshSession() {
    if (!token) {
      return null;
    }

    const storedMode = await getActiveMode();
    const response = await api.me(token);
    setUser(response.user);
    setProfessionalProfile(response.professionalProfile);
    await syncActiveMode(response.user, storedMode);

    try {
      const customerRes = await api.myCustomerProfile(token);
      setCustomerProfile(customerRes);
    } catch (_err) {
      setCustomerProfile(null);
    }
    return response;
  }

  async function signOut() {
    try {
      if (token) {
        await api.logout(token);
      }
    } catch (_error) {
    } finally {
      await api.clearToken();
      await clearActiveMode();
      setToken(null);
      setUser(null);
      setProfessionalProfile(null);
      setCustomerProfile(null);
      setActiveMode(APP_MODES.CUSTOMER);
    }
  }

  async function activateProfessionalRole(body) {
    const response = await api.activateProfessionalRole(body, token);
    setUser(response.user);
    setProfessionalProfile(response.professionalProfile);
    await syncActiveMode(response.user, APP_MODES.PROFESSIONAL);
    return response;
  }

  async function switchToCustomerMode() {
    setActiveMode(APP_MODES.CUSTOMER);
    await saveActiveMode(APP_MODES.CUSTOMER);
    return APP_MODES.CUSTOMER;
  }

  async function switchToProfessionalMode() {
    if (!hasRole(user, APP_MODES.PROFESSIONAL)) {
      return false;
    }

    setActiveMode(APP_MODES.PROFESSIONAL);
    await saveActiveMode(APP_MODES.PROFESSIONAL);
    return true;
  }

  const value = {
    activeMode,
    appModes: APP_MODES,
    booting,
    token,
    user,
    professionalProfile,
    customerProfile,
    signedIn: Boolean(token && user),
    signIn,
    signUp,
    requestPhoneCode,
    continueWithPhone,
    signInWithProvider,
    signOut,
    refreshSession,
    activateProfessionalRole,
    switchToCustomerMode,
    switchToProfessionalMode,
    setProfessionalProfile,
    setUser,
    setCustomerProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

module.exports = {
  AuthProvider,
  useAuth,
};
