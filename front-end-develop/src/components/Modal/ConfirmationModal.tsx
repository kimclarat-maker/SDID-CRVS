import React from "react";

const ConfirmationModal = ({
  icon,
  title,
  description,
  buttonActions,
}: {
  icon: string;
  title: string;
  description: string;
  buttonActions: React.ReactNode;
}) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="confirmation-modal-container">
          <div className="confirmation-modal-header">
            <div className="confirmation-modal-icon-container">
              <span className="material-symbols-outlined">{icon}</span>
            </div>
          </div>
          <center className="confirmation-modal-content">
            <h2>{title}</h2>
            <p>{description}</p>
          </center>
        </div>
      </div>
      <div className="modal-footer">{buttonActions}</div>
    </div>
  );
};

export default ConfirmationModal;
