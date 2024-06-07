import React, { useState, useEffect } from "react";
import "./UserDashboard.css";
import RegistrationModal from "./RegistrationModal";
import RequestTable from "./RequestTable";
import ProductsTable from "./ProductsTable";
import CreateRequestModal from "./CreateRequestModal"; // Импортируем CreateRequestModal
import {
  FaBars,
  FaTimes,
  FaUserPlus,
  FaCog,
  FaQuestionCircle,
} from "react-icons/fa";

const UserDashboard = ({ currentUser, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] =
    useState(false); // Состояние для модалки создания заявки
  const [showProductsTable, setShowProductsTable] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openRegistrationModal = () => {
    setIsRegistrationModalOpen(true);
    setIsMenuOpen(false);
  };

  const closeRegistrationModal = () => {
    setIsRegistrationModalOpen(false);
  };

  const openCreateRequestModal = () => {
    setIsCreateRequestModalOpen(true);
  };

  const closeCreateRequestModal = () => {
    setIsCreateRequestModalOpen(false);
  };

  const toggleTable = () => {
    setShowProductsTable(!showProductsTable);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const menuContainer = document.querySelector(".menu-container");
      if (menuContainer && !menuContainer.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="user-dashboard-container">
      <header className="header-users">
        <div className="menu-container">
          <button className="menu-button" onClick={toggleMenu}>
            {isMenuOpen ? (
              <FaTimes className="icons" />
            ) : (
              <FaBars className="icons" />
            )}
          </button>
          {isMenuOpen && (
            <ul className="menu-options">
              {currentUser.roles && currentUser.roles.admin && (
                <li className="menu-option" onClick={openRegistrationModal}>
                  <FaUserPlus className="icons" /> Регистрация
                </li>
              )}
              <li className="menu-option">
                <FaCog className="icons" /> Настройки
              </li>
              <li className="menu-option">
                <FaQuestionCircle className="icons" /> Помощь
              </li>
            </ul>
          )}
        </div>
        <div className="block-info">
          <p>{currentUser.fullName}</p>
        </div>
        <button
          className="create-request-button"
          onClick={openCreateRequestModal}
        >
          Создать заявку
        </button>
        <button className="view-products-button" onClick={toggleTable}>
          {showProductsTable ? "Посмотреть заявки" : "Посмотреть ТМЦ"}
        </button>
        <button className="sign-out-button" onClick={onSignOut}>
          Выход
        </button>
      </header>
      <main className="main-users">
        {showProductsTable ? <ProductsTable /> : <RequestTable />}
      </main>

      {isRegistrationModalOpen && (
        <RegistrationModal onClose={closeRegistrationModal} />
      )}
      {isCreateRequestModalOpen && (
        <CreateRequestModal
          onClose={closeCreateRequestModal}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default UserDashboard;
