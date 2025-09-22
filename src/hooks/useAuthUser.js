import { useEffect, useState } from 'react';
import { auth } from '../firebase';

export function useAuthUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  return user;
}
