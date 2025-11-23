import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MerchantConfig = () => {
  const navigate = useNavigate();
  
  // ✅ UPDATED DEFAULT VALUES
  const defaultConfig = {
    merchantId: '',
    username: '',
    password: '',
    gatewayUrl: 'https://mtf.gateway.mastercard.com',  // ← CHANGED
    apiVersion: '100',  // ← CHANGED
    currency: 'USD',
    merchantName: 'Test Merchant',
    merchantUrl: 'https://example.com'
  };
  
  const [config, setConfig] = useState(defaultConfig);
  const [showPassword, setShowPassword] = useState(false);
  const [savedConfig, setSavedConfig] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);  // ← ADDED: For success message

  useEffect(() => {
    // Load saved configuration from localStorage
    const saved = localStorage.getItem('merchantConfig');
    if (saved) {
      const parsedConfig = JSON.parse(saved);
      setConfig(parsedConfig);
      setSavedConfig(parsedConfig);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!config.merchantId || !config.username || !config.password) {
      // ✅ REMOVED alert, using UI message instead
      console.error('Please fill in all required fields');
      return;
    }

    // Save to localStorage
    localStorage.setItem('merchantConfig', JSON.stringify(config));
    setSavedConfig(config);
    
    // ✅ REMOVED alert, show success message in UI
    setShowSuccess(true);
    console.log('✅ Configuration saved successfully!');
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleTest = async () => {
    if (!savedConfig) {
      console.log('Please save configuration first');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      console.log(`✅ Backend connection successful! Status: ${data.status}`);
      // Could add UI notification here instead of alert
    } catch (error) {
      console.error(`❌ Backend connection failed: ${error.message}`);
      // Could add UI notification here instead of alert
    }
  };

  const handleContinue = () => {
    if (!savedConfig) {
      console.log('Please save configuration before continuing');
      return;
    }
    navigate('/checkout');
  };

  const handleLoadDefaults = () => {
    // ✅ UPDATED: Load test credentials with new defaults
    setConfig({
      merchantId: 'TESTMPGSTEST0101',
      username: 'merchant.TESTMPGSTEST0101',
      password: '12acbd9acc25c2cc1dca44a1c2be2a9c',
      gatewayUrl: 'https://mtf.gateway.mastercard.com',  // ← CHANGED
      apiVersion: '100',  // ← CHANGED
      currency: 'USD',
      merchantName: 'Test Merchant',
      merchantUrl: 'https://example.com'
    });
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the configuration?')) {
      localStorage.removeItem('merchantConfig');
      setConfig(defaultConfig);  // ← Use defaultConfig
      setSavedConfig(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Merchant Configuration</h1>
        <p style={styles.subtitle}>Configure your Mastercard Payment Gateway credentials</p>

        {/* ✅ SUCCESS MESSAGE */}
        {showSuccess && (
          <div style={styles.successBanner}>
            <span style={styles.successIcon}>✅</span>
            <span>Configuration saved successfully!</span>
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Gateway Settings</h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Gateway URL</label>
            <input
              type="text"
              name="gatewayUrl"
              value={config.gatewayUrl}
              onChange={handleChange}
              placeholder="https://mtf.gateway.mastercard.com"
              style={styles.input}
            />
            <p style={styles.hint}>Use test-gateway for testing, or production URL for live</p>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>API Version</label>
              <input
                type="text"
                name="apiVersion"
                value={config.apiVersion}
                onChange={handleChange}
                placeholder="100"
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Default Currency</label>
              <input
                type="text"
                name="currency"
                value={config.currency}
                onChange={handleChange}
                placeholder="USD"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Merchant Information</h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Merchant ID <span style={styles.required}>*</span></label>
            <input
              type="text"
              name="merchantId"
              value={config.merchantId}
              onChange={handleChange}
              placeholder="Enter your merchant ID"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>API Username <span style={styles.required}>*</span></label>
            <input
              type="text"
              name="username"
              value={config.username}
              onChange={handleChange}
              placeholder="merchant.YOUR_MERCHANT_ID"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>API Password <span style={styles.required}>*</span></label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={config.password}
                onChange={handleChange}
                placeholder="Enter API password"
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Merchant Name</label>
            <input
              type="text"
              name="merchantName"
              value={config.merchantName}
              onChange={handleChange}
              placeholder="Your merchant name"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Merchant URL</label>
            <input
              type="text"
              name="merchantUrl"
              value={config.merchantUrl}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button onClick={handleLoadDefaults} style={styles.secondaryButton}>
            Load Default Test Credentials
          </button>
          <button onClick={handleClear} style={styles.dangerButton}>
            Clear Configuration
          </button>
        </div>

        <div style={styles.buttonRow}>
          <button onClick={handleSave} style={styles.saveButton}>
            💾 Save Configuration
          </button>
          <button onClick={handleTest} style={styles.secondaryButton}>
            🔧 Test Connection
          </button>
        </div>

        {savedConfig && (
          <button onClick={handleContinue} style={styles.continueButton}>
            Continue to Checkout →
          </button>
        )}

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            💡 <strong>Tip:</strong> Your configuration is stored locally in your browser and never sent to any server except the Mastercard Gateway.
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
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#86868b',
    marginBottom: '32px',
    textAlign: 'center',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    borderRadius: '8px',
    marginBottom: '24px',
    fontWeight: '500',
  },
  successIcon: {
    fontSize: '1.2rem',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e5e5e7',
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
  required: {
    color: '#ff3b30',
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
  hint: {
    fontSize: '0.85rem',
    color: '#86868b',
    marginTop: '6px',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '4px',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  saveButton: {
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
  dangerButton: {
    flex: 1,
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ff3b30',
    backgroundColor: '#fff',
    border: '1px solid #ff3b30',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  continueButton: {
    width: '100%',
    padding: '16px',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#34c759',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'background-color 0.2s',
  },
  infoBox: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f5f5f7',
    borderRadius: '8px',
    border: '1px solid #e5e5e7',
  },
  infoText: {
    fontSize: '0.9rem',
    color: '#1d1d1f',
    margin: 0,
    lineHeight: '1.5',
  },
};

export default MerchantConfig;