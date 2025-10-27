import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RayzorPayPayment = () => {
  const [formData, setFormData] = useState({
    inmate_id: '',
    name: '',
    email: '',
    phone: '',
    maxAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => alert('Failed to load Razorpay SDK');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      if (!razorpayLoaded) {
        alert('Razorpay SDK not loaded. Please try again.');
        setLoading(false);
        return;
      }

      // Call backend to create subscription
      const response = await axios.post(`${import.meta.env.VITE_API_URL}mandate`, formData);
      const { subscriptionId, customerId, razorpayKeyId, authenticationNote } = response.data;
      console.log('Backend Response:', response.data);

      if (!window.Razorpay) {
        alert('Razorpay checkout not available. Please refresh and try again.');
        setLoading(false);
        return;
      }

      // Open Razorpay Checkout for Subscription
      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId, // Use subscription_id for mandate approval
        name: 'Jail Tuckshop Mandate',
        description: `Auto-pay setup for ${formData.name} (Max: ₹${formData.maxAmount}). ${authenticationNote}`,
        handler: async (response) => {
          console.log('Razorpay Response:', response);
          if (response.razorpay_subscription_id) {
            await saveMandate(response.razorpay_subscription_id, customerId);
          } else {
            alert('Mandate approval failed. Please check the response and try again.');
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        modal: {
          ondismiss: () => {
            alert('Mandate setup cancelled or failed. Please try again.');
            setLoading(false);
          },
        },
        notes: {
          inmate_id: formData.inmate_id,
          max_amount: formData.maxAmount,
        },
        recurring: 1, // Explicitly indicate this is a recurring subscription
        theme: {
          color: '#f75c03', // Match your UI
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (error) => {
        console.error('Payment Failed:', error.error);
        alert(`Payment failed: ${error.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert('Error: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const saveMandate = async (subscriptionId, customerId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}mandate/save`, {
        inmate_id: formData.inmate_id,
        subscriptionId,
        customerId,
        maxAmount: formData.maxAmount,
      });
      setSuccess(true);
      alert(`✅ Auto-pay activated for ${formData.name}!\nMax: ₹${formData.maxAmount}\nNo more OTPs needed!`);
      setFormData({ inmate_id: '', name: '', email: '', phone: '', maxAmount: '' });
      setTimeout(() => {
        setLoading(false);
        setSuccess(false);
      }, 2000);
      
    } catch (error) {
      alert('Failed to save mandate: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>📱 Setup Auto-Payment (Tuckshop)</h2>
      <p>
        <strong>One-time approval</strong> = <strong>Lifetime no-OTP purchases</strong>
      </p>

      {!razorpayLoaded && (
        <div style={{ color: 'orange', padding: '10px', background: '#fff3cd' }}>
          ⏳ Loading Razorpay...
        </div>
      )}

      {success && (
        <div style={{ color: 'green', padding: '10px', background: '#d4edda' }}>
          ✅ Mandate setup COMPLETE!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            <strong>Inmate ID</strong>
          </label>
          <input
            type="text"
            name="inmate_id"
            value={formData.inmate_id}
            onChange={handleChange}
            placeholder="INM001"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            <strong>Name</strong>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Vipin"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            <strong>Email</strong>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="amal10.sharma@example.com"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            <strong>Phone</strong>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="9876543210"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            <strong>Max Monthly Limit (₹)</strong>
          </label>
          <input
            type="number"
            name="maxAmount"
            value={formData.maxAmount}
            onChange={handleChange}
            placeholder="5000"
            min="100"
            max="50000"
            required
            onWheel={(e) => e.currentTarget.blur()}
            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !razorpayLoaded}
          style={{
            width: '100%',
            padding: '12px',
            background: loading || !razorpayLoaded ? '#ccc' : '#f75c03',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
          }}
        >
          {loading ? 'Setting up...' : !razorpayLoaded ? '⏳ Loading...' : '🚀 Setup Auto-Pay'}
        </button>
      </form>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <strong>Test Card:</strong> 4111 1111 1111 1111 | OTP: 123456
        <br />
        <strong>Token Charge:</strong> ₹100 (auto-refunded after approval)
        <br />
        <strong>After setup:</strong> Tuckshop purchases = Instant (No OTP!)
      </div>
    </div>
  );
};

export default RayzorPayPayment;