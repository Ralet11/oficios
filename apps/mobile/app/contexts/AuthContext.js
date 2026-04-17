const React = require('react');
const { api } = require('../services/api');

const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [booting, setBooting] = React.useState(true);
  const [token, setToken] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [professionalProfile, setProfessionalProfile] = React.useState(null);

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
    } catch (_error) {
      await api.clearToken();
      setToken(null);
      setUser(null);
      setProfessionalProfile(null);
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
    return response;
  }

  async function signOut() {
    try {
      if (token) {
        await api.logout(token);
      }
    } catch (_error) {
      // Ignore logout transport issues and clear session locally.
    } finally {
      await api.clearToken();
      setToken(null);
      setUser(null);
      setProfessionalProfile(null);
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
    signedIn: Boolean(token && user),
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    refreshSession,
    activateProfessionalRole,
    setProfessionalProfile,
    setUser,
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
