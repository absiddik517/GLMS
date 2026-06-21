import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Office, UserProfile } from '../types';
import { createOrGetOffice, getUserProfile, saveUserProfile } from '../services/store';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  office: Office | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, designation: string, officeName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfileAndOffice: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [office, setOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndOffice = async (currentUser: User) => {
    try {
      // 1. Get or create user profile
      let userProf = await getUserProfile(currentUser.uid);
      
      if (!userProf) {
        // If profile doesn't exist, build a default one (temporary office ID mapped to current user)
        const placeholderOfficeId = 'office_haluaghat'; // default office ID
        
        userProf = {
          id: currentUser.uid,
          office_id: placeholderOfficeId,
          name: currentUser.displayName || 'দাপ্তরিক কর্মকর্তা',
          designation: 'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তা',
          email: currentUser.email || '',
          mobile: '',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await saveUserProfile(userProf);
      }

      // 2. Load or bootstrap office
      const officeData = await createOrGetOffice(userProf.office_id, {
        office_name: 'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়',
        office_code: '০৩',
        geo_code: '৬১২৪',
        address: 'হালুয়াঘাট, ময়মনসিংহ',
        email: 'unfeohaluaghat@gmail.com'
      });

      setProfile(userProf);
      setOffice(officeData);
    } catch (error) {
      console.error("Error loading auth profile or office details:", error);
    }
  };

  const refreshProfileAndOffice = async () => {
    if (user) {
      setLoading(true);
      await fetchProfileAndOffice(user);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfileAndOffice(currentUser);
      } else {
        setProfile(null);
        setOffice(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    designation: string, 
    officeName: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const officeId = 'office_' + Date.now();
    
    // Create user profile first so security rules can resolve getUserOfficeId() during office seeding
    const userProf: UserProfile = {
      id: cred.user.uid,
      office_id: officeId,
      name: name,
      designation: designation,
      email: email,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await saveUserProfile(userProf);

    // Create office
    const officeData = await createOrGetOffice(officeId, {
      office_name: officeName,
      office_code: '০৩',
      geo_code: '৬১২৪',
      address: 'বাংলাদেশ',
      email: email
    });
    
    setProfile(userProf);
    setOffice(officeData);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    
    // Check if profile exists, if not create one
    let userProf = await getUserProfile(cred.user.uid);
    if (!userProf) {
      const defaultOfficeId = 'office_' + Date.now();
      
      userProf = {
        id: cred.user.uid,
        office_id: defaultOfficeId,
        name: cred.user.displayName || 'দাপ্তরিক কর্মকর্তা',
        designation: 'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তা',
        email: cred.user.email || '',
        mobile: '',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save user profile first so subsequent office seeding doesn't hit permission denied issues
      await saveUserProfile(userProf);

      const officeData = await createOrGetOffice(defaultOfficeId, {
        office_name: 'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়',
        office_code: '০৩',
        geo_code: '৬১২৪',
        address: 'বাংলাদেশ',
        email: cred.user.email || ''
      });

      setProfile(userProf);
      setOffice(officeData);
    } else {
      const officeData = await createOrGetOffice(userProf.office_id, {
        office_name: 'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়',
        office_code: '০৩',
        geo_code: '৬১২৪',
        address: 'বাংলাদেশ',
        email: userProf.email
      });
      setProfile(userProf);
      setOffice(officeData);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      office,
      loading,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      refreshProfileAndOffice
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
