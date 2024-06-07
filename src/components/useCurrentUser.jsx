// src/components/useCurrentUser.js

import { useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "./firebase";
import { useUser } from "./UserContext";

const useCurrentUser = () => {
  const { currentUser, setCurrentUser } = useUser();

  useEffect(() => {
    if (currentUser?.uid) {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        setCurrentUser(snapshot.val());
      });

      return () => unsubscribe();
    }
  }, [currentUser?.uid, setCurrentUser]);

  return currentUser;
};

export default useCurrentUser;
