import React, { useState } from 'react';

const ApiLogger = ({ apiLogs, title = "API Request/Response Logs" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  if (!apiLogs || apiLogs.length === 0) {
    return null;
  }

  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  const renderLogEntry = (log, index) => {
    const hasError = log.error !== undefined;
    
    return (
      <div key={index} style={{...styles.logEntry, ...(hasError ? styles.logEntryError : {})}}>
        <div style={styles.logHeader}>
          <div style={styles.logTitle}>
            <span style={styles.logBadge}>{log.method || 'N/A'}</span>
            <span style={styles.logEndpoint}>{log.endpoint}</span>
            {hasError && <span style={styles.errorBadge}>ERROR</span>}
          </div>
          <div style={styles.logMeta}>
            <span style={styles.timestamp}>{new Date(log.timestamp).toLocaleString()}</span>
            <span style={styles.duration}>{log.duration}</span>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setSelectedLog(log);
            setShowModal(true);
          }}
          style={styles.viewDetailsButton}
        >
          View Details
        </button>
      </div>
    );
  };

  const renderModalContent = () => {
    if (!selectedLog) return null;

    const sections = [];

    // Request sections
    if (selectedLog.createSession) {
      sections.push({
        title: 'Create Session Request',
        type: 'request',
        data: selectedLog.createSession
      });
    }
    if (selectedLog.createSessionResponse) {
      sections.push({
        title: 'Create Session Response',
        type: 'response',
        data: selectedLog.createSessionResponse
      });
    }
    if (selectedLog.updateSession) {
      sections.push({
        title: 'Update Session Request',
        type: 'request',
        data: selectedLog.updateSession
      });
    }
    if (selectedLog.updateSessionResponse) {
      sections.push({
        title: 'Update Session Response',
        type: 'response',
        data: selectedLog.updateSessionResponse
      });
    }
    if (selectedLog.payment) {
      sections.push({
        title: 'Payment Request',
        type: 'request',
        data: selectedLog.payment
      });
    }
    if (selectedLog.paymentResponse) {
      sections.push({
        title: 'Payment Response',
        type: 'response',
        data: selectedLog.paymentResponse
      });
    }
    if (selectedLog.retrieve) {
      sections.push({
        title: 'Retrieve Transaction Request',
        type: 'request',
        data: selectedLog.retrieve
      });
    }
    if (selectedLog.retrieveResponse) {
      sections.push({
        title: 'Retrieve Transaction Response',
        type: 'response',
        data: selectedLog.retrieveResponse
      });
    }
    if (selectedLog.error) {
      sections.push({
        title: 'Error Details',
        type: 'error',
        data: selectedLog.error
      });
    }

    return (
      <div>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>API Call Details</h2>
          <div style={styles.modalMeta}>
            <span style={styles.modalEndpoint}>{selectedLog.endpoint}</span>
            <span style={styles.modalDuration}>{selectedLog.duration}</span>
          </div>
        </div>

        {sections.map((section, index) => (
          <div key={index} style={styles.section}>
            <h3 style={{
              ...styles.sectionTitle,
              color: section.type === 'error' ? '#ff3b30' : 
                     section.type === 'response' ? '#34c759' : '#0071e3'
            }}>
              {section.title}
            </h3>
            
            {section.data.url && (
              <div style={styles.field}>
                <strong>URL:</strong>
                <div style={styles.codeBlock}>{section.data.url}</div>
              </div>
            )}
            
            {section.data.method && (
              <div style={styles.field}>
                <strong>Method:</strong> <code>{section.data.method}</code>
              </div>
            )}
            
            {section.data.status && (
              <div style={styles.field}>
                <strong>Status:</strong> 
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: section.data.status < 300 ? '#d4edda' : '#f8d7da',
                  color: section.data.status < 300 ? '#155724' : '#721c24'
                }}>
                  {section.data.status} {section.data.statusText}
                </span>
              </div>
            )}
            
            {section.data.headers && (
              <div style={styles.field}>
                <strong>Headers:</strong>
                <pre style={styles.codeBlock}>{formatJson(section.data.headers)}</pre>
              </div>
            )}
            
            {section.data.body && (
              <div style={styles.field}>
                <strong>Body:</strong>
                <pre style={styles.codeBlock}>{formatJson(section.data.body)}</pre>
              </div>
            )}
            
            {section.data.data && (
              <div style={styles.field}>
                <strong>Response Data:</strong>
                <pre style={styles.codeBlock}>{formatJson(section.data.data)}</pre>
              </div>
            )}
            
            {section.data.message && (
              <div style={styles.field}>
                <strong>Error Message:</strong>
                <div style={styles.errorMessage}>{section.data.message}</div>
              </div>
            )}
            
            {section.data.response && (
              <div style={styles.field}>
                <strong>Error Response:</strong>
                <pre style={styles.codeBlock}>{formatJson(section.data.response)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div style={styles.container}>
        <div style={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
          <div style={styles.headerLeft}>
            <span style={styles.icon}>{isExpanded ? '▼' : '▶'}</span>
            <h3 style={styles.title}>{title}</h3>
            <span style={styles.count}>{apiLogs.length} call{apiLogs.length !== 1 ? 's' : ''}</span>
          </div>
          <span style={styles.toggleText}>{isExpanded ? 'Collapse' : 'Expand'}</span>
        </div>

        {isExpanded && (
          <div style={styles.content}>
            {apiLogs.map((log, index) => renderLogEntry(log, index))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button 
              style={styles.closeButton}
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <div style={styles.modalContent}>
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  container: {
    margin: '20px 0',
    border: '1px solid #d2d2d7',
    borderRadius: '8px',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    backgroundColor: '#f5f5f7',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    fontSize: '0.8rem',
    color: '#86868b',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1d1d1f',
  },
  count: {
    fontSize: '0.9rem',
    color: '#86868b',
    backgroundColor: '#e5e5e7',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  toggleText: {
    fontSize: '0.9rem',
    color: '#0071e3',
  },
  content: {
    padding: '16px 20px',
  },
  logEntry: {
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #e5e5e7',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  logEntryError: {
    borderColor: '#ff3b30',
    backgroundColor: '#fff5f5',
  },
  logHeader: {
    marginBottom: '12px',
  },
  logTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  logBadge: {
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 8px',
    backgroundColor: '#0071e3',
    color: '#fff',
    borderRadius: '4px',
  },
  logEndpoint: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1d1d1f',
  },
  errorBadge: {
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 8px',
    backgroundColor: '#ff3b30',
    color: '#fff',
    borderRadius: '4px',
  },
  logMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.85rem',
    color: '#86868b',
  },
  timestamp: {},
  duration: {
    fontWeight: '600',
  },
  viewDetailsButton: {
    padding: '8px 16px',
    fontSize: '0.9rem',
    color: '#0071e3',
    backgroundColor: '#fff',
    border: '1px solid #0071e3',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    maxWidth: '900px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
  },
  closeButton: {
    position: 'sticky',
    top: '16px',
    right: '16px',
    float: 'right',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: '#e5e5e7',
    borderRadius: '50%',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalContent: {
    padding: '24px',
  },
  modalHeader: {
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e5e7',
  },
  modalTitle: {
    margin: '0 0 8px 0',
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1d1d1f',
  },
  modalMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.9rem',
    color: '#86868b',
  },
  modalEndpoint: {
    fontWeight: '600',
  },
  modalDuration: {},
  section: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f5f5f7',
    borderRadius: '8px',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.1rem',
    fontWeight: '600',
  },
  field: {
    marginBottom: '12px',
  },
  codeBlock: {
    backgroundColor: '#1d1d1f',
    color: '#34c759',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    overflow: 'auto',
    marginTop: '8px',
    fontFamily: 'Monaco, Courier, monospace',
  },
  statusBadge: {
    marginLeft: '8px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  errorMessage: {
    color: '#ff3b30',
    backgroundColor: '#fff5f5',
    padding: '12px',
    borderRadius: '6px',
    marginTop: '8px',
    fontFamily: 'Monaco, Courier, monospace',
    fontSize: '0.9rem',
  },
};

export default ApiLogger;
