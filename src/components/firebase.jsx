//firebase.jsx
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // Добавлено

const firebaseConfig = {
  apiKey: "AIzaSyCnGKhkgJ_ZEfqHdQqpQf0s1ll4P50V7PQ",
  authDomain: "requests-e1.firebaseapp.com",
  databaseURL:
    "https://requests-e1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "requests-e1",
  storageBucket: "requests-e1.appspot.com",
  messagingSenderId: "790948148527",
  appId: "1:790948148527:web:f6cbbb81338e9d1b6cddda",
};

// //Рабочая база
// const firebaseConfig = {
//   apiKey: "AIzaSyC4a4SVzUb-ekvsxsuQNIWumcJWB9oEggY",
//   authDomain: "nomenklature-6acda.firebaseapp.com",
//   databaseURL:
//     "https://nomenklature-6acda-default-rtdb.europe-west1.firebasedatabase.app",
//   projectId: "nomenklature-6acda",
//   storageBucket: "nomenklature-6acda.appspot.com",
//   messagingSenderId: "729807329689",
//   appId: "1:729807329689:web:8d3f5713602fe1904cdb08",
// };

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app); // Добавлено

export { firestore, auth, database, storage };
