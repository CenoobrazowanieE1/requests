import React, { useState } from "react"; // Импорт React и useState из библиотеки react
import { ref, set } from "firebase/database"; // Импорт функций ref и set из библиотеки firebase/database
import { createUserWithEmailAndPassword } from "firebase/auth"; // Импорт функции createUserWithEmailAndPassword из библиотеки firebase/auth
import { auth, database } from "./firebase"; // Импорт объектов auth и database из файла firebase.js
import "./RegistrationModal.css";

const RegistrationModal = ({ onClose }) => {
  // Объявление функционального компонента RegistrationModal с параметром onClose
  const [email, setEmail] = useState(""); // Состояние для хранения email
  const [password, setPassword] = useState(""); // Состояние для хранения пароля
  const [fullName, setFullName] = useState(""); // Состояние для хранения полного имени
  const [role, setRole] = useState(""); // Состояние для хранения выбранной роли
  const [error, setError] = useState(null); // Состояние для хранения ошибки

  const handleSubmit = async (e) => {
    // Функция для обработки отправки формы регистрации
    e.preventDefault();
    try {
      // Регистрация пользователя в Firebase Authentication
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Записываем данные пользователя в базу данных
      const userRef = ref(database, `users/${user.uid}`);
      await set(userRef, {
        email,
        fullName,
        roles: {
          [role]: true, // Добавляем выбранную роль в объект ролей пользователя
        },
      });

      // Закрытие модального окна
      onClose();
    } catch (error) {
      setError(error.message); // Установка сообщения об ошибке при возникновении ошибки регистрации
    }
  };

  return (
    <div className="registration-modal">
      <h2>Регистрация пользователя</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Пароль:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label>ФИО:</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        {/* Добавляем селект для выбора роли */}
        <label>Роль:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="">Выберите роль</option>
          <option value="admin">Администратор</option>
          <option value="user">Пользователь</option>
        </select>
        <div className="registration-modal-footer">
          <button onClick={onClose}>Закрыть</button>
          <button type="submit">Зарегистрировать</button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationModal; // Экспорт компонента RegistrationModal по умолчанию для использования в других частях приложения
