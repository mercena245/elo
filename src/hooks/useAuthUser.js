import { useEffect, useState } from 'react';
import { auth, db, ref, get } from '../firebase';

export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Buscar dados do usuário no Firebase
          const userRef = ref(db, `usuarios/${firebaseUser.uid}`);
          const snap = await get(userRef);
          
          if (snap.exists()) {
            const userData = snap.val();
            setUserRole(userData.role);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return { user, userRole, loading };
}
