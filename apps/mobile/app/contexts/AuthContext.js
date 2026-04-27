const React = require('react');
const { api } = require('../services/api');

const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [booting, setBooting] = React.useState(true);
  const [token, setToken] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [professionalProfile, setProfessionalProfile] = React.useState(null);
  const [customerProfile, setCustomerProfile] = React.useState(null);

  const hydrate = React.useCallback(async () => {
    try {
      const storedToken = await api.getToken();
      if (!storedToken) {
        setBooting(false);
        return;
      }

      const response = await api.me(storedToken);
      setToken(storedToken);
      setUser(response.user);
      setProfessionalProfile(response.professionalProfile);

      try {
        const customerRes = await api.myCustomerProfile(storedToken);
        setCustomerProfile(customerRes);
      } catch (_err) {
        setCustomerProfile(null);
      }
    } catch (_error) {
      await api.clearToken();
      setToken(null);
      setUser(null);
      setProfessionalProfile(null);
      setCustomerProfile(null);
    } finally {
      setBooting(false);
    }
  }, []);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  async function completeSession(session) {
    await api.saveToken(session.token);
    setToken(session.token);
    setUser(session.user);
    const response = await api.me(session.token);
    setProfessionalProfile(response.professionalProfile);

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

    const response = await api.me(token);
    setUser(response.user);
    setProfessionalProfile(response.professionalProfile);

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
      setToken(null);
      setUser(null);
      setProfessionalProfile(null);
      setCustomerProfile(null);
    }
  }

  async function activateProfessionalRole(body) {
    const response = await api.activateProfessionalRole(body, token);
    setUser(response.user);
    setProfessionalProfile(response.professionalProfile);
    return response;
  }

  const value = {
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