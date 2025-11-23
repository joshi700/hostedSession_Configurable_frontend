// ApiLogManager.js
// Centralized API logging utility

import { useState, useEffect } from 'react'; // ← MOVED TO TOP

class ApiLogManager {
  constructor() {
    this.logs = [];
    this.maxLogs = 50; // Keep last 50 logs
  }

  /**
   * Add a new API log entry
   * @param {Object} logEntry - The log entry to add
   */
  addLog(logEntry) {
    const timestamp = new Date().toISOString();
    const enhancedLog = {
      ...logEntry,
      timestamp,
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.logs.push(enhancedLog);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to session storage
    this.saveLogs();

    console.log('[API Log]', enhancedLog);
    return enhancedLog;
  }

  /**
   * Get all logs
   */
  getAllLogs() {
    return [...this.logs];
  }

  /**
   * Get logs for a specific order
   * @param {string} orderId - The order ID to filter by
   */
  getLogsByOrderId(orderId) {
    return this.logs.filter(log => 
      log.request?.body?.orderId === orderId ||
      log.request?.url?.includes(orderId)
    );
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  /**
   * Save logs to session storage
   */
  saveLogs() {
    try {
      sessionStorage.setItem('apiLogs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Error saving logs to session storage:', error);
    }
  }

  /**
   * Load logs from session storage
   */
  loadLogs() {
    try {
      const stored = sessionStorage.getItem('apiLogs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading logs from session storage:', error);
      this.logs = [];
    }
  }

  /**
   * Export logs as JSON file
   */
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `api-logs-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  /**
   * Get log statistics
   */
  getStats() {
    const total = this.logs.length;
    const successful = this.logs.filter(log => !log.error).length;
    const failed = this.logs.filter(log => log.error).length;
    
    const endpoints = {};
    this.logs.forEach(log => {
      const endpoint = log.endpoint || 'unknown';
      endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;
    });

    return {
      total,
      successful,
      failed,
      endpoints
    };
  }
}

// Create a singleton instance
const apiLogManager = new ApiLogManager();

// Load existing logs on initialization
apiLogManager.loadLogs();

export default apiLogManager;


// React Hook for using the logger in components
export const useApiLogger = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Load logs on mount
    const currentLogs = apiLogManager.getAllLogs();
    setLogs(currentLogs);
  }, []);

  const addLog = (logEntry) => {
    const newLog = apiLogManager.addLog(logEntry);
    setLogs(apiLogManager.getAllLogs());
    return newLog;
  };

  const clearLogs = () => {
    apiLogManager.clearLogs();
    setLogs([]);
  };

  const exportLogs = () => {
    apiLogManager.exportLogs();
  };

  const getStats = () => {
    return apiLogManager.getStats();
  };

  return {
    logs,
    addLog,
    clearLogs,
    exportLogs,
    getStats
  };
};