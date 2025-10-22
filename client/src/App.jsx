import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || !email) {
      alert("Please enter amount and email");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post('http://localhost:4000/api/payment/create-order', {
        amount,
        email,
        name
      });

      const { order, key } = data;

      const options = {
        key,
        amount: order.amount,
        currency: "INR",
        name: "Razorpay Demo",
        description: "Test Payment",
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await axios.post('http://localhost:4000/api/payment/verify', {
            ...response,
            email,
            name,
            amount
          });
          alert(verifyRes.data.message);
        },
        prefill: {
          name,
          email,
        },
        theme: { color: "#3B82F6" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Razorpay Payment Demo</h2>
        <p>Enter details to test a payment</p>

        <div className="input-group">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <button onClick={handlePayment} disabled={loading}>
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}

export default App;
