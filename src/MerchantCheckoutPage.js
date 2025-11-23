import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MerchantCheckoutPage() {
  const navigate = useNavigate();
  const [merchantConfig, setMerchantConfig] = useState(null);
  const [cart, setCart] = useState([
    { id: 1, name: 'Laptop', price: 1000, quantity: 1, icon: '💻' },
    { id: 2, name: 'Phone', price: 500, quantity: 1, icon: '📱' },
    { id: 3, name: 'Tablet', price: 300, quantity: 1, icon: '📱' },
  ]);

  useEffect(() => {
    // Check if merchant config exists
    const saved = localStorage.getItem('merchantConfig');
    if (!saved) {
      // Redirect to config if not set
      navigate('/config');
    } else {
      setMerchantConfig(JSON.parse(saved));
    }
  }, [navigate]);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(
      cart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotal = () =>
    cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handlePayNow = () => {
    if (cart.length === 0) {
      console.log('Your cart is empty!');
      return;
    }
    navigate('/payment', {
      state: {
        total: getTotal().toFixed(2),
      }
    });
  };

  const handleSettings = () => {
    navigate('/config');
  };

  if (!merchantConfig) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.merchantName}>{merchantConfig.merchantName}</h1>
          <button onClick={handleSettings} style={styles.settingsButton} title="Settings">
            ⚙️
          </button>
        </div>
        <div style={styles.merchantInfo}>
          <span style={styles.merchantId}>Merchant ID: {merchantConfig.merchantId}</span>
        </div>
      </header>

      <div style={styles.mainContent}>
        <h2 style={styles.heading}>Shopping Cart</h2>
        
        {cart.length === 0 ? (
          <div style={styles.emptyCart}>
            <p style={styles.emptyCartText}>Your cart is empty</p>
            <p style={styles.emptyCartSubtext}>Add some items to get started</p>
          </div>
        ) : (
          <>
            <div style={styles.orderSummary}>
              <div style={styles.itemList}>
                {cart.map(item => (
                  <div key={item.id} style={styles.item}>
                    <div style={styles.itemLeft}>
                      <span style={styles.itemIcon}>{item.icon}</span>
                      <div style={styles.itemInfo}>
                        <span style={styles.itemName}>{item.name}</span>
                        <span style={styles.itemPrice}>${item.price.toFixed(2)} each</span>
                      </div>
                    </div>
                    
                    <div style={styles.itemRight}>
                      <div style={styles.quantityControl}>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={styles.quantityButton}
                        >
                          −
                        </button>
                        <span style={styles.quantity}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={styles.quantityButton}
                        >
                          +
                        </button>
                      </div>
                      
                      <div style={styles.itemTotal}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      
                      <button 
                        onClick={() => removeItem(item.id)}
                        style={styles.removeButton}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.summarySection}>
              <div style={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Tax:</span>
                <span>$0.00</span>
              </div>
              <div style={{...styles.summaryRow, ...styles.totalRow}}>
                <strong>Total:</strong>
                <strong>${getTotal().toFixed(2)} {merchantConfig.currency}</strong>
              </div>
            </div>

            <button onClick={handlePayNow} style={styles.payButton}>
              Proceed to Payment
            </button>
          </>
        )}
      </div>

      <footer style={styles.footer}>
        <p>{merchantConfig.merchantName} © 2025</p>
        <p style={styles.footerLink}>
          <a href={merchantConfig.merchantUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
            {merchantConfig.merchantUrl}
          </a>
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f7',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.2rem',
    color: '#86868b',
  },
  header: {
    backgroundColor: '#fff',
    padding: '20px',
    borderBottom: '1px solid #d2d2d7',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '900px',
    margin: '0 auto',
  },
  merchantName: {
    fontSize: '1.8rem',
    fontWeight: '600',
    color: '#1d1d1f',
    margin: 0,
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
  merchantInfo: {
    maxWidth: '900px',
    margin: '8px auto 0',
    fontSize: '0.9rem',
    color: '#86868b',
  },
  merchantId: {},
  mainContent: {
    flex: 1,
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
    padding: '40px 20px',
  },
  heading: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: '30px',
  },
  emptyCart: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
  },
  emptyCartText: {
    fontSize: '1.3rem',
    color: '#1d1d1f',
    marginBottom: '8px',
  },
  emptyCartSubtext: {
    fontSize: '1rem',
    color: '#86868b',
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f5f5f7',
    borderRadius: '8px',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  itemIcon: {
    fontSize: '2rem',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemName: {
    fontSize: '1.1rem',
    fontWeight: '500',
    color: '#1d1d1f',
  },
  itemPrice: {
    fontSize: '0.9rem',
    color: '#86868b',
  },
  itemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '4px',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: '#e5e5e7',
    borderRadius: '6px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: '1rem',
    fontWeight: '500',
    minWidth: '30px',
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1d1d1f',
    minWidth: '80px',
    textAlign: 'right',
  },
  removeButton: {
    fontSize: '1.2rem',
    padding: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    fontSize: '1rem',
    color: '#1d1d1f',
  },
  totalRow: {
    fontSize: '1.3rem',
    paddingTop: '16px',
    borderTop: '2px solid #d2d2d7',
    marginTop: '8px',
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
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
  },
  footer: {
    textAlign: 'center',
    padding: '30px 20px',
    fontSize: '0.9rem',
    color: '#86868b',
    borderTop: '1px solid #d2d2d7',
    backgroundColor: '#fff',
  },
  footerLink: {
    marginTop: '8px',
  },
  link: {
    color: '#0071e3',
    textDecoration: 'none',
  },
};

export default MerchantCheckoutPage;
