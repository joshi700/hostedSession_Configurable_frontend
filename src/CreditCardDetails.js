import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ApiLogger from './ApiLogger';
import apiLogManager from './utils/ApiLogManager';  // ← ADDED: Import ApiLogManager
const API_BASE_URL = process.env.REACT_APP_API_URL;

const CreditCardDetails = ({ message, sendDataToParent, sendDataToParentsessionid, sendDataToParentorderId, sendDataToParenttrxid, onApiLog }) => {
  const navigate = useNavigate();
  const cardNumberRef = useRef(null);
  const expiryMonthRef = useRef(null);
  const expiryYearRef = useRef(null);
  const securityCodeRef = useRef(null);
  const cardholderNameRef = useRef(null);
  
  const [showAuthComponent, setShowAuthComponent] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [merchantConfig, setMerchantConfig] = useState(null);
  const [apiLogs, setApiLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // Track 3DS flow step
  const [processingStep, setProcessingStep] = useState(''); // Current processing step
  
  const sessionCreatedRef = useRef(false); // ← ADDED: Prevent duplicate session creation

  // ← ADDED: API logging handler
  const handleApiLog = (logEntry) => {
    apiLogManager.addLog(logEntry);
    setApiLogs(prev => [...prev, logEntry]);
  };

  useEffect(() => {
    // ✅ Prevent duplicate session creation
    if (sessionCreatedRef.current) {
      console.log('Session already created, skipping...');
      return;
    }

    // Load merchant config
    const saved = localStorage.getItem('merchantConfig');
    if (!saved) {
      setError('Merchant configuration not found. Please configure your merchant details.');
      setIsLoading(false);
      return;
    }
    
    const config = JSON.parse(saved);
    setMerchantConfig(config);
    
    // Load Payment Session script dynamically
    loadPaymentSessionScript(config);
    
    // ✅ Mark as created before calling
    sessionCreatedRef.current = true;
    
    // Create payment session
    createPaymentSession(config);
  }, []); // ← CHANGED: Empty dependency array to run only once

  const loadPaymentSessionScript = (config) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[data-payment-session]');
    if (existingScript) {
      existingScript.remove();
    }

    // Create script URL based on merchant config
    const scriptUrl = `${config.gatewayUrl}/form/version/${config.apiVersion}/merchant/${config.merchantId}/session.js`;
    
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.setAttribute('data-payment-session', 'true');
    script.async = true;
    
    script.onload = () => {
      console.log('Payment Session script loaded successfully');
    };
    
    script.onerror = () => {
      console.error('Failed to load Payment Session script');
      setError('Failed to load Payment Session script. Please check your merchant configuration.');
    };
    
    document.head.appendChild(script);
  };

  const createPaymentSession = async (config) => {
    // ✅ Check if session already exists
    if (sessionId) {
      console.log('Session already exists:', sessionId);
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessingStep('Creating session...');
    
    try {
      const requestData = {
        merchantConfig: config,
        amount: message,
        currency: config.currency
      };

      const response = await axios.post(`${API_BASE_URL}/create-session`, requestData);
      
      console.log('Session created:', response.data);
      
      setSessionId(response.data.sessionid);
      setOrderId(response.data.orderid);
      setTransactionId(response.data.trxid);
      
      // ← UPDATED: Add API log to both state and ApiLogManager
      if (response.data.apiLog) {
        handleApiLog(response.data.apiLog);
      }
      
      // Wait for Payment Session script to be available
      waitForPaymentSession(() => {
        // Initialize hosted session - pass merchantConfig
        initiateHostedSession(response.data.sessionid, response.data.orderid, response.data.trxid, config);
      });
      
      setShowAuthComponent(1);
      sendDataToParentsessionid(response.data.sessionid);
      sendDataToParentorderId(response.data.orderid);
      sendDataToParenttrxid(response.data.trxid);
      
      setProcessingStep('');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to create session:', error);
      setError(error.response?.data?.details || error.message);
      
      // ← UPDATED: Add error log to both state and ApiLogManager
      if (error.response?.data?.apiLog) {
        handleApiLog(error.response.data.apiLog);
      }
      
      setProcessingStep('');
      setIsLoading(false);
    }
  };

  const waitForPaymentSession = (callback, attempts = 0) => {
    if (window.PaymentSession) {
      callback();
    } else if (attempts < 50) {
      // Try again in 100ms (max 5 seconds)
      setTimeout(() => waitForPaymentSession(callback, attempts + 1), 100);
    } else {
      setError('Payment Session script failed to load. Please refresh the page.');
      setIsLoading(false);
    }
  };

  // ============================================
  // 3DS FLOW - STEP 1: INITIATE AUTHENTICATION
  // ============================================
  const initiateAuthentication = async (sessionId, orderId, transactionId, configToUse) => {
    setProcessingStep('Step 1: Checking 3DS availability...');
    setCurrentStep(1);
    
    try {
      const requestData = {
        merchantConfig: configToUse,
        sessionId,
        orderId,
        transactionId
      };

      console.log('[STEP 1] Initiating authentication...');
      const response = await axios.post(`${API_BASE_URL}/api/initiate-authentication`, requestData);
      
      console.log('[STEP 1] Response:', response.data);
      
      // ← UPDATED: Add API log to both state and ApiLogManager
      if (response.data.apiLog) {
        handleApiLog(response.data.apiLog);
      }

      const authStatus = response.data.authenticationStatus;
      const gatewayRecommendation = response.data.gatewayRecommendation;

      console.log('[STEP 1] Auth Status:', authStatus);
      console.log('[STEP 1] Gateway Recommendation:', gatewayRecommendation);

      // ✅ FIXED: Check authentication status to determine next step
      // ONLY proceed to AUTHENTICATE_PAYER if status is AUTHENTICATION_AVAILABLE
      if (authStatus === 'AUTHENTICATION_AVAILABLE') {
        console.log('[STEP 1] ✅ 3DS available, proceeding to authenticate payer (Step 2)...');
        await authenticatePayer(sessionId, orderId, transactionId, configToUse);
      } else if (
        authStatus === 'AUTHENTICATION_NOT_SUPPORTED' || 
        authStatus === 'AUTHENTICATION_NOT_AVAILABLE' ||
        authStatus === 'AUTHENTICATION_NOT_IN_EFFECT'
      ) {
        console.log('[STEP 1] ⏭️ 3DS not supported/available, skipping directly to payment (Step 3)...');
        console.log('[STEP 1] Authentication Status:', authStatus);
        await authorizePay(sessionId, orderId, transactionId, configToUse);
      } else {
        // For any other status (FAILED, REJECTED, PENDING, etc.), show error
        console.error('[STEP 1] ❌ Unexpected authentication status:', authStatus);
        setProcessingStep('');
        setError(`Authentication check failed with status: ${authStatus}. Please try again or contact support.`);
      }

    } catch (error) {
      console.error('[STEP 1] Error:', error);
      
      // ← UPDATED: Add error log to both state and ApiLogManager
      if (error.response?.data?.apiLog) {
        handleApiLog(error.response.data.apiLog);
      }
      
      setProcessingStep('');
      setError(`Step 1 failed: ${error.response?.data?.details || error.message}`);
    }
  };

  // ============================================
  // 3DS FLOW - STEP 2: AUTHENTICATE PAYER
  // ============================================
  const authenticatePayer = async (sessionId, orderId, transactionId, configToUse) => {
    setProcessingStep('Step 2: Authenticating payer...');
    setCurrentStep(2);
    
    try {
      // ✅ ADDED: Collect real browser details
      const browserDetails = {
        "3DSecureChallengeWindowSize": "FULL_SCREEN",
        "acceptHeaders": "application/json",
        "colorDepth": window.screen.colorDepth || 24,
        "javaEnabled": navigator.javaEnabled ? navigator.javaEnabled() : false,
        "language": navigator.language || "en-US",
        "screenHeight": window.screen.height || 768,
        "screenWidth": window.screen.width || 1024,
        "timeZone": new Date().getTimezoneOffset()
      };

      const requestData = {
        merchantConfig: configToUse,
        sessionId,
        orderId,
        transactionId,
        amount: message,
        redirectResponseUrl: `${window.location.origin}/authentication-callback`,
        // ✅ ADDED: Include device/browser details
        device: {
          browser: "MOZILLA",
          browserDetails: browserDetails
        }
      };

      console.log('[STEP 2] Authenticating payer...');
      const response = await axios.post(`${API_BASE_URL}/api/authenticate-payer`, requestData);
      
      console.log('[STEP 2] Response:', response.data);
      
      // ← UPDATED: Add API log to both state and ApiLogManager
      if (response.data.apiLog) {
        handleApiLog(response.data.apiLog);
      }

      const redirectHtml = response.data.redirectHtml;
      const authStatus = response.data.authenticationStatus;

      console.log('[STEP 2] Auth Status:', authStatus);
      console.log('[STEP 2] Has redirect HTML:', !!redirectHtml);

      if (redirectHtml) {
        console.log('[STEP 2] 3DS challenge required, showing authentication frame...');
        sendDataToParent(redirectHtml);
        sendDataToParentsessionid(sessionId);
        sendDataToParentorderId(orderId);
        sendDataToParenttrxid(transactionId);
        setProcessingStep('Waiting for 3DS authentication...');
      } else {
        console.log('[STEP 2] No 3DS challenge needed, proceeding to payment...');
        await authorizePay(sessionId, orderId, transactionId, configToUse);
      }

    } catch (error) {
      console.error('[STEP 2] Error:', error);
      
      // ← UPDATED: Add error log to both state and ApiLogManager
      if (error.response?.data?.apiLog) {
        handleApiLog(error.response.data.apiLog);
      }
      
      setProcessingStep('');
      setError(`Step 2 failed: ${error.response?.data?.details || error.message}`);
    }
  };

  // ============================================
  // 3DS FLOW - STEP 3: AUTHORIZE/PAY
  // ============================================
  const authorizePay = async (sessionId, orderId, transactionId, configToUse) => {
    setProcessingStep('Step 3: Processing payment...');
    setCurrentStep(3);
    
    try {
      const requestData = {
        merchantConfig: configToUse,
        sessionId,
        orderId,
        transactionId
      };

      console.log('[STEP 3] Authorizing payment...');
      const response = await axios.post(`${API_BASE_URL}/api/authorize-pay`, requestData)
      
      console.log('[STEP 3] Response:', response.data);
      
      // ← UPDATED: Add API log to both state and ApiLogManager
      if (response.data.apiLog) {
        handleApiLog(response.data.apiLog);
      }

      const result = response.data.result;
      const gatewayCode = response.data.gatewayCode;

      console.log('[STEP 3] Result:', result);
      console.log('[STEP 3] Gateway Code:', gatewayCode);

      setProcessingStep('');

      if (result === 'SUCCESS') {
        console.log('[STEP 3] Payment successful!');
        
        // ✅ FIXED: Navigate to receipt page with payment details
        navigate('/receipt', {
          state: {
            orderid: orderId,
            transactionid: response.data.transactionId,
            orderstatus: result,
            gatewaycode: gatewayCode,
            gatewayrecommendation: response.data.gatewayRecommendation,
            amount: response.data.amount,
            currency: response.data.currency,
            authenticationStatus: response.data.authenticationStatus,
            fullResponse: response.data
          }
        });
      } else {
        console.log('[STEP 3] Payment not successful:', result);
        setError(`Payment failed: ${result}`);
      }

    } catch (error) {
      console.error('[STEP 3] Error:', error);
      
      // ← UPDATED: Add error log to both state and ApiLogManager
      if (error.response?.data?.apiLog) {
        handleApiLog(error.response.data.apiLog);
      }
      
      setProcessingStep('');
      setError(`Step 3 failed: ${error.response?.data?.details || error.message}`);
    }
  };

  const initiateHostedSession = (sessionId, orderId, transactionId, config) => {
    // Wait for DOM elements to be ready
    const checkAndInitialize = (attempts = 0) => {
      if (attempts > 20) {
        console.error('Timeout waiting for DOM elements');
        setError('Failed to initialize payment fields. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      // Check if all required DOM elements exist
      const cardNumber = document.getElementById('card-number');
      const securityCode = document.getElementById('security-code');
      const expiryMonth = document.getElementById('expiry-month');
      const expiryYear = document.getElementById('expiry-year');
      const cardholderName = document.getElementById('cardholder-name');

      if (!cardNumber || !securityCode || !expiryMonth || !expiryYear || !cardholderName) {
        console.log(`Attempt ${attempts + 1}: Waiting for DOM elements...`);
        setTimeout(() => checkAndInitialize(attempts + 1), 100);
        return;
      }

      // DOM elements are ready, now configure Payment Session
      try {
        if (!window.PaymentSession) {
          console.error('PaymentSession not available');
          setError('Payment Session not loaded. Please refresh the page.');
          setIsLoading(false);
          return;
        }

        console.log('✅ All DOM elements found, configuring Payment Session...');
        console.log('Configuring Payment Session with session:', sessionId);
        console.log('Using config:', config ? 'Present' : 'Missing');

        window.PaymentSession.configure({
          session: sessionId,
          fields: {
            card: {
              number: "#card-number",
              securityCode: "#security-code",
              expiryMonth: "#expiry-month",
              expiryYear: "#expiry-year",
              nameOnCard: "#cardholder-name"
            }
          },
          frameEmbeddingMitigation: ["javascript"],
          callbacks: {
            initialized: function (response) {
              console.log('Payment session initialized successfully:', response);
              
              if (response.status === 'system_error' || response.status === 'fields_in_error') {
                console.error('Payment Session initialization error:', response);
                setError(`Payment field error: ${response.message || 'Unknown error'}`);
                setIsLoading(false);
              }
            },
            formSessionUpdate: function (response) {
              console.log('Form session updated, starting 3DS flow...', response);
              
              if (response.status === 'ok' && response.session) {
                // Start the 3DS flow
                initiateAuthentication(sessionId, orderId, transactionId, config);
              } else if (response.status === 'system_error' || response.status === 'request_timeout') {
                console.error('Form session update error:', response);
                setError(`Session update failed: ${response.message || response.status}`);
                setProcessingStep('');
              } else {
                console.error('Invalid form session update response:', response);
                setError('Failed to update session. Please try again.');
                setProcessingStep('');
              }
            }
          },
          interaction: {
            displayControl: {
              formatCard: "EMBOSSED",
              invalidFieldCharacters: "REJECT"
            }
          }
        });
      } catch (error) {
        console.error('Error configuring Payment Session:', error);
        setError('Failed to configure payment session. Please try again.');
        setIsLoading(false);
      }
    };

    // Start checking for DOM elements
    checkAndInitialize();
  };

  const handlePayClicked = () => {
    if (window.PaymentSession) {
      window.PaymentSession.updateSessionFromForm('card');
    } else {
      setError('Payment session not initialized. Please refresh the page.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>{processingStep || 'Initializing payment...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !sessionId) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <h3 style={styles.errorTitle}>Configuration Error</h3>
            <p style={styles.errorText}>{error}</p>
            <button 
              style={styles.configButton}
              onClick={() => window.location.href = '/config'}
            >
              Go to Configuration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Session Details */}
      {sessionId && (
        <div style={styles.sessionDetails}>
          <h3 style={styles.sessionTitle}>Session Information</h3>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Session ID:</span>
            <code style={styles.detailValue}>{sessionId}</code>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Order ID:</span>
            <code style={styles.detailValue}>{orderId}</code>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Transaction ID:</span>
            <code style={styles.detailValue}>{transactionId}</code>
          </div>
        </div>
      )}

      {/* Payment Form */}
      <div style={styles.container}>
        {processingStep && (
          <div style={styles.stepIndicator}>
            {processingStep}
          </div>
        )}

        {error && (
          <div style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        <h2 style={styles.heading}>Payment Details</h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>Card Number</label>
          <input
            ref={cardNumberRef}
            id="card-number"
            type="text"
            placeholder="1234 5678 9012 3456"
            readOnly
            style={styles.input}
          />
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Expiry Month</label>
            <input
              ref={expiryMonthRef}
              id="expiry-month"
              type="text"
              placeholder="MM"
              readOnly
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Expiry Year</label>
            <input
              ref={expiryYearRef}
              id="expiry-year"
              type="text"
              placeholder="YY"
              readOnly
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Security Code</label>
          <input
            ref={securityCodeRef}
            id="security-code"
            type="text"
            placeholder="123"
            readOnly
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Cardholder Name</label>
          <input
            ref={cardholderNameRef}
            id="cardholder-name"
            type="text"
            placeholder="John Doe"
            readOnly
            style={styles.input}
          />
        </div>

        <button 
          style={processingStep ? styles.payButtonDisabled : styles.payButton} 
          onClick={handlePayClicked}
          disabled={!!processingStep}
        >
          {processingStep ? 'Processing...' : `Pay $${message} ${merchantConfig?.currency}`}
        </button>

        <div style={styles.securityNote}>
          <span style={styles.lockIcon}>🔒</span>
          <span style={styles.securityText}>Secured by Mastercard Payment Gateway</span>
        </div>
      </div>

      {/* API Logs */}
      {apiLogs.length > 0 && (
        <div style={styles.apiLoggerContainer}>
          <ApiLogger apiLogs={apiLogs} title="API Call Logs" />
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '40px',
  },
  spinner: {
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #0071e3',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  loadingText: {
    color: '#86868b',
    fontSize: '1rem',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '40px',
  },
  errorTitle: {
    color: '#ff3b30',
    fontSize: '1.5rem',
    marginBottom: '16px',
  },
  errorText: {
    color: '#1d1d1f',
    fontSize: '1rem',
    marginBottom: '24px',
  },
  errorBanner: {
    backgroundColor: '#fff5f5',
    color: '#ff3b30',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ffdddd',
  },
  configButton: {
    padding: '12px 24px',
    backgroundColor: '#0071e3',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  sessionDetails: {
    backgroundColor: '#f5f5f7',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  sessionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e5e5e7',
  },
  detailLabel: {
    fontSize: '0.9rem',
    color: '#86868b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '0.85rem',
    fontFamily: 'Monaco, Courier, monospace',
    backgroundColor: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#1d1d1f',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '24px',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#1d1d1f',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    border: '1px solid #d2d2d7',
    borderRadius: '8px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  payButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#0071e3',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.2rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
  },
  payButtonDisabled: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.2rem',
    fontWeight: '600',
    cursor: 'not-allowed',
    marginTop: '10px',
  },
  stepIndicator: {
    backgroundColor: '#e3f2fd',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.95rem',
    color: '#1976d2',
    textAlign: 'center',
    fontWeight: '600',
  },
  securityNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#f5f5f7',
    borderRadius: '8px',
  },
  lockIcon: {
    fontSize: '1.2rem',
  },
  securityText: {
    fontSize: '0.9rem',
    color: '#86868b',
  },
  apiLoggerContainer: {
    marginTop: '20px',
  },
};

// Add keyframe animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default CreditCardDetails;
