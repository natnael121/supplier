import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Supplier } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  supplierId: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  created_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'supplierUsers', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as AuthUser;
            setUser({ id: firebaseUser.uid, ...userData });
          } else {
            // Check if user exists in suppliers collection (for backward compatibility)
            const supplierDoc = await getDoc(doc(db, 'suppliers', firebaseUser.uid));
            if (supplierDoc.exists()) {
              const supplierData = supplierDoc.data() as Supplier;
              // Create a user record from supplier data
              const userData: AuthUser = {
                id: firebaseUser.uid,
                email: supplierData.email,
                name: supplierData.contactPerson.name,
                supplierId: firebaseUser.uid,
                role: 'admin',
                isActive: supplierData.isActive,
                created_at: supplierData.created_at,
              };
              
              // Create the user record for future logins
              await setDoc(doc(db, 'supplierUsers', firebaseUser.uid), userData);
              setUser(userData);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user exists in supplierUsers collection
      const userDoc = await getDoc(doc(db, 'supplierUsers', userCredential.user.uid));
      if (!userDoc.exists()) {
        // Check if user exists in suppliers collection (backward compatibility)
        const supplierDoc = await getDoc(doc(db, 'suppliers', userCredential.user.uid));
        if (!supplierDoc.exists()) {
          await signOut(auth);
          throw new Error('Access denied. Supplier account required.');
        }
      }
      
      const userData = userDoc.exists() ? userDoc.data() as AuthUser : null;
      if (userData && !userData.isActive) {
        await signOut(auth);
        throw new Error('Account has been deactivated. Please contact support.');
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string, supplierData: {
    name: string;
    businessName: string;
    phone: string;
    address: any;
    contactPerson: any;
  }) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create supplier record
      const supplier: Omit<Supplier, 'id'> = {
        name: supplierData.businessName,
        email,
        phone: supplierData.phone,
        address: supplierData.address,
        contactPerson: supplierData.contactPerson,
        businessInfo: {
          description: `${supplierData.businessName} - Professional supplier services`
        },
        isActive: true,
        paymentTerms: {
          method: 'bank_transfer',
          daysNet: 30,
          discountPercent: 0,
          discountDays: 0,
        },
        deliveryInfo: {
          minimumOrder: 0,
          deliveryFee: 0,
          freeDeliveryThreshold: 100,
          estimatedDeliveryDays: 3,
          deliveryAreas: [supplierData.address.city],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add supplier to suppliers collection
      await setDoc(doc(db, 'suppliers', firebaseUser.uid), supplier);
      
      // Create user record
      const newUser: AuthUser = {
        id: firebaseUser.uid,
        email,
        name: supplierData.name,
        supplierId: firebaseUser.uid,
        role: 'admin',
        isActive: true,
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, 'supplierUsers', firebaseUser.uid), newUser);
      setUser(newUser);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    firebaseUser,
    loading,
    login,
    register,
    logout,
  };
};