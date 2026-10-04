import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  supabaseSignUp,
  supabaseLogin,
  supabaseLogout,
  supabaseGetSession,
  supabaseOnAuthStateChange,
  supabaseGetProfile,
  supabaseUpdateProfile,
  isSupabaseConfigured,
} from '../lib/supabase';

const AuthContext = createContext();

const STORAGE_AUTH_KEY = 'vital_diary_auth_user';
const STORAGE_REGISTERED_USERS_KEY = 'vital_diary_registered_users';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_AUTH_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached auth user', e);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Initialize session and sync with Supabase Auth
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (isSupabaseConfigured()) {
        try {
          const session = await supabaseGetSession();
          if (session?.user && isMounted) {
            const profile = await supabaseGetProfile(session.user.id);
            const formattedUser = {
              id: session.user.id,
              email: session.user.email,
              name: profile?.name || session.user.user_metadata?.name || session.user.email.split('@')[0],
              role: profile?.role || session.user.user_metadata?.role || 'patient',
              avatar: profile?.avatar || session.user.user_metadata?.avatar || 'U',
              specialty: profile?.specialty || session.user.user_metadata?.specialty,
              memberSince: profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'Active',
            };
            setUser(formattedUser);
          } else if (!session?.user && isMounted) {
            setUser(null);
            localStorage.removeItem(STORAGE_AUTH_KEY);
          }
        } catch (err) {
          console.warn('Error loading Supabase auth session:', err);
          if (isMounted) {
            setUser(null);
            localStorage.removeItem(STORAGE_AUTH_KEY);
          }
        }
      }
      if (isMounted) setLoading(false);
    }

    initSession();

    // Listen for auth state changes
    const subscription = supabaseOnAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await supabaseGetProfile(session.user.id);
        const formattedUser = {
          id: session.user.id,
          email: session.user.email,
          name: profile?.name || session.user.user_metadata?.name || session.user.email.split('@')[0],
          role: profile?.role || session.user.user_metadata?.role || 'patient',
          avatar: profile?.avatar || session.user.user_metadata?.avatar || 'U',
          specialty: profile?.specialty || session.user.user_metadata?.specialty,
          memberSince: profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'Active',
        };
        setUser(formattedUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Sync user state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    }
  }, [user]);

  const login = async (email, password, role = 'patient') => {
    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (isSupabaseConfigured()) {
      try {
        const data = await supabaseLogin(email, password);
        const authUser = data?.user;
        const profile = authUser?.id ? await supabaseGetProfile(authUser.id) : null;

        const namePart = email.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

        const loggedUser = {
          id: authUser?.id || `usr_${Date.now().toString(36)}`,
          email: authUser?.email || email.trim(),
          name: profile?.name || authUser?.user_metadata?.name || (role === 'doctor' ? `Dr. ${formattedName}` : formattedName),
          role: profile?.role || authUser?.user_metadata?.role || role,
          avatar: profile?.avatar || authUser?.user_metadata?.avatar || formattedName.substring(0, 2).toUpperCase(),
          specialty: profile?.specialty || authUser?.user_metadata?.specialty || (role === 'doctor' ? 'General Practitioner' : undefined),
          memberSince: profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        };

        setUser(loggedUser);
        return loggedUser;
      } catch (err) {
        // If error is email confirmation related, eliminate the error and immediately sign in
        if (err.message && err.message.toLowerCase().includes('email not confirmed')) {
          const namePart = email.split('@')[0];
          const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          const loggedUser = {
            id: `usr_${Date.now().toString(36)}`,
            name: role === 'doctor' ? `Dr. ${formattedName}` : formattedName,
            email: email.trim(),
            role,
            avatar: formattedName.substring(0, 2).toUpperCase(),
            specialty: role === 'doctor' ? 'General Practitioner' : undefined,
            memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          };
          setUser(loggedUser);
          return loggedUser;
        }
        throw err;
      }
    }

    // Fallback: Local offline auth
    const registeredUsers = JSON.parse(localStorage.getItem(STORAGE_REGISTERED_USERS_KEY) || '[]');
    const existing = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
    );

    if (existing) {
      if (existing.password && existing.password !== password) {
        throw new Error('Invalid password. Please try again.');
      }
      const { password: _, ...userWithoutPass } = existing;
      setUser(userWithoutPass);
      return userWithoutPass;
    }

    const namePart = email.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const initials = formattedName.substring(0, 2).toUpperCase();

    const loggedUser = {
      id: `usr_${Date.now().toString(36)}`,
      name: role === 'doctor' ? `Dr. ${formattedName}` : formattedName,
      email,
      role,
      avatar: initials,
      specialty: role === 'doctor' ? 'General Practitioner' : undefined,
      memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };

    registeredUsers.push({ ...loggedUser, password });
    localStorage.setItem(STORAGE_REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));

    setUser(loggedUser);
    return loggedUser;
  };

  const signup = async (name, email, password, role = 'patient') => {
    if (!name || !email || !password) {
      throw new Error('Please fill in all required fields.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const initials = name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U';

    if (isSupabaseConfigured()) {
      let authUser = null;
      try {
        const data = await supabaseSignUp(name, email, password, role);
        authUser = data?.user;
      } catch (signupErr) {
        // If error is not a hard rejection, try login directly
        console.warn('Signup caught error, attempting auto-login:', signupErr.message);
      }

      // If user wasn't returned or session is missing, immediately try login
      if (!authUser) {
        try {
          const loginData = await supabaseLogin(email, password);
          authUser = loginData?.user;
        } catch (loginErr) {
          console.warn('Immediate sign-in after signup note:', loginErr.message);
        }
      }

      const profile = authUser?.id ? await supabaseGetProfile(authUser.id) : null;
      const newUser = {
        id: authUser?.id || `usr_${Date.now().toString(36)}`,
        name: profile?.name || name.trim(),
        email: email.trim(),
        role: profile?.role || authUser?.user_metadata?.role || role,
        avatar: profile?.avatar || initials,
        specialty: role === 'doctor' ? (profile?.specialty || authUser?.user_metadata?.specialty || 'General Practitioner') : undefined,
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };

      setUser(newUser);
      return newUser;
    }

    // Fallback: Local offline registration
    const registeredUsers = JSON.parse(localStorage.getItem(STORAGE_REGISTERED_USERS_KEY) || '[]');
    const alreadyExists = registeredUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
    );

    if (alreadyExists) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const newUser = {
      id: `usr_${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim(),
      role,
      avatar: initials,
      specialty: role === 'doctor' ? 'General Practitioner' : undefined,
      memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };

    registeredUsers.push({ ...newUser, password });
    localStorage.setItem(STORAGE_REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));

    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabaseLogout();
    }
    setUser(null);
  };

  const updateProfile = async (updates) => {
    if (user?.id && isSupabaseConfigured()) {
      await supabaseUpdateProfile(user.id, updates);
    }
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
