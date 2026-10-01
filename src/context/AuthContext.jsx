import React, { createContext, useContext, useState, useEffect } from 'react';

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
        console.error('Failed to parse auth user', e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    }
  }, [user]);

  const login = (email, password, role = 'patient') => {
    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

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

    // Direct user session for new login
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

    // Save to registered users list
    registeredUsers.push({ ...loggedUser, password });
    localStorage.setItem(STORAGE_REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));

    setUser(loggedUser);
    return loggedUser;
  };

  const signup = (name, email, password, role = 'patient') => {
    if (!name || !email || !password) {
      throw new Error('Please fill in all required fields.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const registeredUsers = JSON.parse(localStorage.getItem(STORAGE_REGISTERED_USERS_KEY) || '[]');
    const alreadyExists = registeredUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
    );

    if (alreadyExists) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const initials = name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U';

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

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        signup,
        logout,
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
