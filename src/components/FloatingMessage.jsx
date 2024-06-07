import React from "react";
import "./FloatingMessage.css";

const FloatingMessage = ({ message, success }) => {
  return (
    <div className={`floating-message ${success ? "success" : "error"}`}>
      {message}
    </div>
  );
};

export default FloatingMessage;
