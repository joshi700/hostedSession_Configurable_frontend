import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CardInputForm from './CardInputForm';
import AuthenticationComponent from './AuthenticationComponent';
import ApiLogger from './ApiLogger';

const MyComponent = () => {
  const [paymentStatus, setPaymentStatus] = useState('');
  const [showAuthComponent, setShowAuthComponent] = useState(0);
  const [responseHTML, setResponseHTML] = useState('');
  const [sessionId, setsessionId] = useState('');
  const [orderID, setorderID] = useState('');
  const [trxID, settrxID] = useState('');
  const [apiLogs, setApiLogs] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  const handleDataFromChild = (data) => {
    setResponseHTML(String(data));
    setShowAuthComponent(1);
    setPaymentStatus(1);
  };

  const DataSessionID = (data1) => {
    setsessionId(String(data1));
  };

  const DataOrderID = (data2) => {
    setorderID(String(data2));
  };

  const handleDataFromChildTrxid = (data3) => {
    settrxID(String(data3));
  };

  const handleApiLog = (log) => {
    setApiLogs(prev => [...prev, log]);
  };

  const handleSettings = () => {
    navigate('/config');
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <div style={styles.header}>
          <img
            src="/screenshot.png"
            alt="Merchant Logo"
            style={styles.logo}
          />
          <button onClick={handleSettings} style={styles.settingsButton} title="Settings">
            ⚙️
          </button>
        </div>
        
        <h1 style={styles.title}>Mastercard Payment Gateway</h1>
        <h2 style={styles.subtitle}>Hosted Session with 3DS Authentication</h2>

        <CardInputForm 
          message={data?.total} 
          sendDataToParent={handleDataFromChild} 
          sendDataToParentsessionID={DataSessionID} 
          sendDataToParentorderID={DataOrderID}  
          sendDataToParenttrxid={handleDataFromChildTrxid}
          onApiLog={handleApiLog}
        />

        {showAuthComponent === 1 && (
          <AuthenticationComponent 
            htmlContent={responseHTML} 
            sessionId={sessionId} 
            sendDataToParentorderID={orderID} 
            htmlTrx={trxID}
            onApiLog={handleApiLog}
          />
        )}

        {apiLogs.length > 0 && (
          <div style={styles.logsSection}>
            <ApiLogger apiLogs={apiLogs} title="Payment Flow API Logs" />
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f7',
    padding: '20px',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  logo: {
    width: '150px',
  },
  settingsButton: {
    fontSize: '1.5rem',
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#1d1d1f',
    textAlign: 'center',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '1.2rem',
    fontWeight: '400',
    color: '#86868b',
    textAlign: 'center',
    marginBottom: '40px',
  },
  logsSection: {
    marginTop: '30px',
  },
};

export default MyComponent;
