import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state || {};
  const [showApiLogs, setShowApiLogs] = useState(false);

  const isSuccess = data.orderstatus === 'SUCCESS' || 
                   data.gatewayrecommendation === 'PROCEED';

  const handleNewTransaction = () => {
    navigate('/checkout');
  };

  const handleViewConfig = () => {
    navigate('/config');
  };

  // Get API logs from session storage or location state
  const getApiLogs = () => {
    const storedLogs = sessionStorage.getItem('apiLogs');
    if (storedLogs) {
      try {
        return JSON.parse(storedLogs);
      } catch (e) {
        console.error('Error parsing API logs:', e);
      }
    }
    return [];
  };

  const apiLogs = getApiLogs();

  return (
    <div style={styles.container}>
      <div style={styles.receiptCard}>
        <div style={styles.header}>
          <div style={{...styles.statusIcon, 
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24'
          }}>
            {isSuccess ? '✓' : '✗'}
          </div>
          <h1 style={styles.title}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h1>
          <p style={styles.subtitle}>
            {isSuccess ? 'Your transaction has been completed' : 'There was an issue processing your payment'}
          </p>
        </div>

        {/* Error Message Display */}
        {data.error && (
          <div style={styles.errorBanner}>
            <span style={styles.errorIcon}>⚠️</span>
            <div>
              <div style={styles.errorTitle}>Error Details</div>
              <div style={styles.errorMessage}>{data.error}</div>
            </div>
          </div>
        )}

        <div style={styles.details}>
          <h2 style={styles.sectionTitle}>Transaction Details</h2>
          
          {data.orderid && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Order ID:</span>
              <code style={styles.value}>{data.orderid}</code>
            </div>
          )}

          {data.transactionid && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Transaction ID:</span>
              <code style={styles.value}>{data.transactionid}</code>
            </div>
          )}

          {data.amount && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Amount:</span>
              <span style={styles.value}>
                {data.amount} {data.currency || 'USD'}
              </span>
            </div>
          )}

          {data.orderstatus && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Status:</span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
                color: isSuccess ? '#155724' : '#721c24'
              }}>
                {data.orderstatus}
              </span>
            </div>
          )}

          {data.gatewaycode && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Gateway Code:</span>
              <code style={styles.value}>{data.gatewaycode}</code>
            </div>
          )}

          {data.gatewayrecommendation && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Gateway Recommendation:</span>
              <span style={styles.value}>{data.gatewayrecommendation}</span>
            </div>
          )}

          {data.authenticationStatus && (
            <div style={styles.detailRow}>
              <span style={styles.label}>3DS Authentication:</span>
              <span style={styles.value}>{data.authenticationStatus}</span>
            </div>
          )}

          <div style={styles.detailRow}>
            <span style={styles.label}>Transaction Time:</span>
            <span style={styles.value}>{new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* API Logs Section */}
        {apiLogs && apiLogs.length > 0 && (
          <div style={styles.apiLogsSection}>
            <button 
              onClick={() => setShowApiLogs(!showApiLogs)}
              style={styles.apiLogsToggle}
            >
              {showApiLogs ? '▼' : '▶'} API Request Logs ({apiLogs.length})
            </button>
            
            {showApiLogs && (
              <div style={styles.apiLogsContainer}>
                {apiLogs.map((log, index) => (
                  <details key={index} style={styles.logItem}>
                    <summary style={styles.logSummary}>
                      <span style={styles.logBadge}>{log.method || 'API'}</span>
                      <span style={styles.logEndpoint}>{log.endpoint}</span>
                      <span style={styles.logDuration}>{log.duration}</span>
                    </summary>
                    <div style={styles.logDetails}>
                      <div style={styles.logSection}>
                        <h4 style={styles.logSubtitle}>Request</h4>
                        <pre style={styles.logJson}>
                          {JSON.stringify(log.request || log, null, 2)}
                        </pre>
                      </div>
                      {log.response && (
                        <div style={styles.logSection}>
                          <h4 style={styles.logSubtitle}>Response</h4>
                          <pre style={styles.logJson}>
                            {JSON.stringify(log.response, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.error && (
                        <div style={styles.logSection}>
                          <h4 style={{...styles.logSubtitle, color: '#dc3545'}}>Error</h4>
                          <pre style={{...styles.logJson, backgroundColor: '#f8d7da', color: '#721c24'}}>
                            {JSON.stringify(log.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}

        {data.fullResponse && (
          <details style={styles.technicalDetails}>
            <summary style={styles.detailsSummary}>View Full Response</summary>
            <pre style={styles.jsonResponse}>
              {JSON.stringify(data.fullResponse, null, 2)}
            </pre>
          </details>
        )}

        <div style={styles.actions}>
          <button onClick={handleNewTransaction} style={styles.primaryButton}>
            New Transaction
          </button>
          <button onClick={handleViewConfig} style={styles.secondaryButton}>
            View Configuration
          </button>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            {isSuccess ? 
              'Thank you for your purchase!' : 
              'Please try again or contact support if the issue persists'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f7',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptCard: {
    maxWidth: '800px',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  statusIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    fontWeight: 'bold',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#86868b',
  },
  errorBanner: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    marginBottom: '24px',
    alignItems: 'flex-start',
  },
  errorIcon: {
    fontSize: '1.5rem',
  },
  errorTitle: {
    fontWeight: '600',
    color: '#856404',
    marginBottom: '4px',
  },
  errorMessage: {
    color: '#856404',
    fontSize: '0.9rem',
  },
  details: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e5e5e7',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f5f5f7',
  },
  label: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#86868b',
  },
  value: {
    fontSize: '1rem',
    color: '#1d1d1f',
    fontWeight: '500',
    textAlign: 'right',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  apiLogsSection: {
    marginBottom: '24px',
  },
  apiLogsToggle: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#f5f5f7',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0071e3',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s',
  },
  apiLogsContainer: {
    marginTop: '12px',
    border: '1px solid #e5e5e7',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  logItem: {
    borderBottom: '1px solid #e5e5e7',
  },
  logSummary: {
    padding: '12px 16px',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '500',
  },
  logBadge: {
    padding: '4px 8px',
    backgroundColor: '#0071e3',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  logEndpoint: {
    flex: 1,
    color: '#1d1d1f',
    fontSize: '0.9rem',
  },
  logDuration: {
    color: '#86868b',
    fontSize: '0.85rem',
  },
  logDetails: {
    padding: '16px',
    backgroundColor: '#fff',
  },
  logSection: {
    marginBottom: '16px',
  },
  logSubtitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '8px',
  },
  logJson: {
    backgroundColor: '#1d1d1f',
    color: '#34c759',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    overflow: 'auto',
    fontFamily: 'Monaco, Courier, monospace',
    maxHeight: '300px',
  },
  technicalDetails: {
    marginBottom: '30px',
    backgroundColor: '#f5f5f7',
    borderRadius: '8px',
    padding: '16px',
  },
  detailsSummary: {
    cursor: 'pointer',
    fontWeight: '500',
    color: '#0071e3',
    fontSize: '1rem',
  },
  jsonResponse: {
    marginTop: '16px',
    backgroundColor: '#1d1d1f',
    color: '#34c759',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    overflow: 'auto',
    fontFamily: 'Monaco, Courier, monospace',
    maxHeight: '400px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  primaryButton: {
    flex: 1,
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#0071e3',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    flex: 1,
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0071e3',
    backgroundColor: '#fff',
    border: '1px solid #0071e3',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  footer: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #e5e5e7',
  },
  footerText: {
    fontSize: '1rem',
    color: '#86868b',
  },
};

export default ReceiptPage;