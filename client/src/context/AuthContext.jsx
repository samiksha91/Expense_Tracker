import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const me = await authApi.login(credentials);
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (data) => {
    const me = await authApi.register(data);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout failures; clear local state regardless.
    }
    setUser(null);
  }, []);

  const updateName = useCallback(async (name) => {
    const me = await authApi.updateName({ name });
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateName, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
