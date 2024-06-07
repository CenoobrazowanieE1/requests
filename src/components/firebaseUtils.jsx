import { auth, database } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";

const getUserData = (userData) => ({
  roles: userData.roles || {},
  fullName: userData.fullName || "",
});

const createUser = async (email, password, fullName, role) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await set(ref(database, `users/${user.uid}`), {
    email,
    fullName,
    roles: { [role]: true },
  });
};

const signInUser = async (email, password) => {
  await signInWithEmailAndPassword(auth, email, password);
  const userRef = ref(database, `users/${auth.currentUser.uid}`);
  const snapshot = await get(userRef);
  return getUserData(snapshot.val());
};

const signOutUser = async () => {
  await signOut(auth);
};

export { getUserData, createUser, signInUser, signOutUser };
