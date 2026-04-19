import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  googleProvider,
  FirebaseUser,
  signInWithEmailAndPassword
} from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  balance: number;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'mwstore@admin.id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            const isInitialAdmin = user.email === ADMIN_EMAIL || user.email === 'akunmlzarr22@gmail.com';
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              balance: 0,
              role: isInitialAdmin ? 'admin' : 'user'
            };
            await setDoc(userDocRef, {
              ...newProfile,
              createdAt: new Date().toISOString()
            });
            setProfile(newProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile sync error:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, loginEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
