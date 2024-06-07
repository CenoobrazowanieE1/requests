import React from "react";
import SignIn from "./components/SignIn";
import { UserProvider } from "./components/UserContext"; // Убедитесь, что импортируете UserProvider правильно
import "./App.css";

const App = () => {
  return (
    <UserProvider>
      <div className="App">
        <SignIn />
      </div>
    </UserProvider>
  );
};

export default App;
