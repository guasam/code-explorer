import React from 'react';
import '@renderer/styles/DialogBox.css';

interface DialogBoxProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const CloseIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DialogBox: React.FC<DialogBoxProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <div className="dialog-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="close-button">
            <CloseIcon />
          </button>
        </div>
        <div className="dialog-content">{children}</div>
      </div>
    </div>
  );
};

export default DialogBox;
