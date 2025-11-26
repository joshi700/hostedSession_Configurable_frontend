import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import CreditCardDetails from "./CreditCardDetails";
import { useLocation, useNavigate } from 'react-router-dom';

var ssessionId = "";
var oorderId = "";
var ttransactionId = "";

// ✅ FIXED: Added onApiLog prop
function CardInputForm({ 
  message, 
  sendDataToParent, 
  sendDataToParentsessionID, 
  sendDataToParentorderID, 
  sendDataToParenttrxid,
  onApiLog  // ← ADDED: Now receiving onApiLog
}) {
  const [showAuthComponent, setShowAuthComponent] = useState(0);
  const [Name, setName] = useState('');
  
  const handleDataFromChild = (data) => {
    //setShowAuthComponent(1);
    sendDataToParent(data);
  };

  const handleDataFromChildsessionid = (data) => {
    //setShowAuthComponent(1);
    sendDataToParentsessionID(data);
  };

  const handleDataFromChildorderId = (data) => {
    //setShowAuthComponent(1);
    sendDataToParentorderID(data);
  };

  const handleDataFromChildtrxid = (data) => {
    //setShowAuthComponent(1);
    sendDataToParenttrxid(data);
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      <h1 className="App" style={{ display: 'flex', flexDirection: 'column', width: '100%' , fontSize: '2rem', color: '#333'}} >
        Payment total is: {message}
      </h1>
      
      <CreditCardDetails 
        message={message} 
        sendDataToParent={handleDataFromChild} 
        sendDataToParentsessionid={handleDataFromChildsessionid} 
        sendDataToParentorderId={handleDataFromChildorderId}  
        sendDataToParenttrxid={handleDataFromChildtrxid}
        onApiLog={onApiLog}  // ← ADDED: Now passing onApiLog to CreditCardDetails
      />
      
    </div>
  );
}

const styles = {
  heading: {
    
  },
}

export default CardInputForm;
