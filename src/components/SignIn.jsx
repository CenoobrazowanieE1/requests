import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, database } from "./firebase";
import { ref, get } from "firebase/database";
import { getUserData } from "./firebaseUtils";
import UserDashboard from "./UserDashboard";
import Notification from "./Notification";
import { useUser } from "./UserContext"; // Убедитесь, что импортируете useUser правильно

import "./Login.css";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const { currentUser, setCurrentUser } = useUser(); // Используйте useUser правильно

  useEffect(() => {
    const userSession = localStorage.getItem("currentUser");
    if (userSession) {
      setCurrentUser(JSON.parse(userSession));
    }
  }, [setCurrentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Пожалуйста, введите email и пароль.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      console.log("Успешный вход");
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      const userDataWithRoles = {
        email: auth.currentUser.email,
        ...getUserData(userData),
      };
      localStorage.setItem("currentUser", JSON.stringify(userDataWithRoles));
      setCurrentUser(userDataWithRoles);
      setShowNotification(true); // Показываем уведомление при успешном входе
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
    } catch (error) {
      console.error("Ошибка выхода:", error.message);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  return (
    <>
      {showNotification && (
        <Notification message="Вы успешно вошли!" onClose={closeNotification} />
      )}
      {currentUser ? (
        <UserDashboard currentUser={currentUser} onSignOut={handleSignOut} />
      ) : (
        <form className="login-container" onSubmit={handleSubmit}>
          <h2>Вход</h2>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Загрузка..." : "Войти"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      )}
    </>
  );
};

export default SignIn;
