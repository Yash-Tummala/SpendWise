// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/database/supabaseClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(supabase.auth.user());

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signIn({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
