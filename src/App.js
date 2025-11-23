import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MerchantConfig from './MerchantConfig';
import MerchantCheckoutPage from './MerchantCheckoutPage';
import MyComponent from './MyComponent';
import ReceiptPage from './ReceiptPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/config" replace />} />
        <Route path="/config" element={<MerchantConfig />} />
        <Route path="/checkout" element={<MerchantCheckoutPage />} />
        <Route path="/payment" element={<MyComponent />} />
        <Route path="/receipt" element={<ReceiptPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
