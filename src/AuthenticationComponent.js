
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Use environment variable for API base URL with fallback for local development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AuthenticationComponent = ({ htmlContent, sessionId, sendDataToParentorderID, htmlTrx, onApiLog }) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const hasProcessedRef = useRef(false); // Prevent double processing

  useEffect(() => {
    const submit3DSChallenge = () => {
      if (sessionId && sendDataToParentorderID && htmlTrx && htmlContent && !hasProcessedRef.current) {
        console.log('[3DS] Displaying challenge in modal...');
        
        // Auto-close after 15 seconds
        setTimeout(() => {
          if (!hasProcessedRef.current) {
            console.log('[3DS] Auto-closing and retrieving transaction status');
            hasProcessedRef.current = true;
            retrieveTransactionStatus(sessionId, sendDataToParentorderID, htmlTrx);
          }
        }, 15000);
      }
    };

    const retrieveTransactionStatus = async (sessionId, orderId, transactionId) => {
      try {
        const merchantConfig = JSON.parse(localStorage.getItem('merchantConfig'));
        
        if (!merchantConfig) {
          setError('Merchant configuration not found');
          setIsProcessing(false);
          return;
        }

        // Step 1: Retrieve authentication transaction status
        console.log('[3DS] Retrieving authentication status...');
        console.log('[3DS] Auth Transaction ID:', transactionId);
        
        const response = await axios.post(`${API_BASE_URL}/retrieve-transaction`, {
          merchantConfig,
          orderId,
          transactionId
        });
        
        console.log('[3DS] Authentication response:', response.data);
        
        if (onApiLog && response.data.apiLog) {
          onApiLog(response.data.apiLog);
        }

        const authStatus = response.data.order?.authenticationStatus;
        console.log('[3DS] Authentication Status:', authStatus);
        
        // Step 2: Check if authentication was successful
        if (authStatus === 'AUTHENTICATION_SUCCESSFUL') {
          console.log('[3DS] Authentication successful! Proceeding to payment...');
          
          // Step 3: Call PAY endpoint
          console.log('[3DS] Calling PAY endpoint...');
          console.log('[3DS] Using Auth Transaction ID:', transactionId);
          
          const payResponse = await axios.post(`${API_BASE_URL}/api/authorize-pay`, {
            merchantConfig,
            sessionId,
            orderId,
            transactionId  // This is the auth transaction ID
          });
          
          console.log('[3DS] Payment response:', payResponse.data);
          
          if (onApiLog && payResponse.data.apiLog) {
            onApiLog(payResponse.data.apiLog);
          }
          
          setIsProcessing(false);
          setShowModal(false);
          
          // Navigate to receipt with PAYMENT transaction data
          navigate('/receipt', {
            state: {
              orderid: orderId,
              transactionid: payResponse.data.transactionId,  // NEW payment transaction ID
              orderstatus: payResponse.data.result,
              gatewaycode: payResponse.data.gatewayCode,
              gatewayrecommendation: payResponse.data.gatewayRecommendation,
              amount: payResponse.data.amount,
              currency: payResponse.data.currency,
              authenticationStatus: payResponse.data.authenticationStatus,
              fullResponse: payResponse.data
            }
          });
        } else {
          // Authentication failed or pending
          console.log('[3DS] Authentication not successful:', authStatus);
          setIsProcessing(false);
          setShowModal(false);
          
          const errorMessage = `Authentication status: ${authStatus || 'Unknown'}`;
          setError(errorMessage);
          
          // Navigate to receipt with error
          navigate('/receipt', {
            state: {
              orderid: orderId,
              transactionid: transactionId,
              orderstatus: 'FAILED',
              gatewaycode: response.data.response?.gatewayCode,
              gatewayrecommendation: response.data.response?.gatewayRecommendation,
              amount: response.data.order?.amount,
              currency: response.data.order?.currency,
              authenticationStatus: authStatus,
              fullResponse: response.data,
              error: errorMessage
            }
          });
        }
        
      } catch (error) {
        console.error('[3DS] Error:', error);
        console.error('[3DS] Error response:', error.response?.data);
        
        setIsProcessing(false);
        setShowModal(false);
        
        if (onApiLog && error.response?.data?.apiLog) {
          onApiLog(error.response.data.apiLog);
        }
        
        let errorMessage = 'Failed to complete payment';
        if (error.response?.data?.details) {
          const details = error.response.data.details;
          errorMessage = typeof details === 'object' ? details.error?.explanation || JSON.stringify(details) : details;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        
        navigate('/receipt', {
          state: {
            orderid: sendDataToParentorderID,
            transactionid: htmlTrx,
            orderstatus: 'FAILED',
            error: errorMessage,
            fullResponse: error.response?.data
          }
        });
      }
    };
  
    submit3DSChallenge();
  }, [htmlContent, sessionId, sendDataToParentorderID, htmlTrx, navigate, onApiLog]);

  // Write HTML content to iframe after it mounts
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
    }
  }, [htmlContent]);

  const handleCloseModal = () => {
    if (!isProcessing) {
      setShowModal(false);
      navigate('/checkout');
    }
  };

  if (!showModal) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div style={styles.modalOverlay} onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          handleCloseModal();
        }
      }}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={styles.title}>3D Secure Authentication</h3>
            {!isProcessing && (
              <button 
                onClick={handleCloseModal}
                style={styles.closeButton}
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
          
          <p style={styles.message}>Please complete the authentication challenge below.</p>
          <p style={styles.submessage}>The process will complete automatically after you verify your identity.</p>
          
          {error && (
            <div style={styles.errorContainer}>
              <span style={styles.errorIcon}>⚠️</span>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}
          
          <div style={styles.iframeContainer}>
            <iframe 
              ref={iframeRef}
              style={styles.iframe}
              title="3D Secure Challenge"
              sandbox="allow-forms allow-scripts allow-same-origin"
            />
          </div>
          
          {isProcessing && (
            <div style={styles.loader}>
              <div style={styles.spinner}></div>
              <p style={styles.loaderText}>Processing authentication...</p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.3s ease-in-out',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '900px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    position: 'relative',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1d1d1f',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#86868b',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  message: {
    fontSize: '1rem',
    color: '#1d1d1f',
    marginBottom: '8px',
    textAlign: 'center',
  },
  submessage: {
    fontSize: '0.9rem',
    color: '#86868b',
    marginBottom: '24px',
    textAlign: 'center',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  errorIcon: {
    fontSize: '1.2rem',
  },
  errorText: {
    color: '#856404',
    fontSize: '0.9rem',
    flex: 1,
  },
  iframeContainer: {
    width: '100%',
    height: '500px',
    marginBottom: '20px',
    border: '1px solid #d2d2d7',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f7',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  loader: {
    padding: '20px',
    textAlign: 'center',
  },
  spinner: {
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #0071e3',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loaderText: {
    fontSize: '0.9rem',
    color: '#86868b',
  },
};

export default AuthenticationComponent;
