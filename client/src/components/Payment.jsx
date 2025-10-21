import React, { useState } from "react";
import axios from "axios";
import "../App.css";

const Payment = () => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const orderRes = await axios.post("http://localhost:5000/api/payment/create-order", { amount: 500 });

      const options = {
        key: "rzp_test_RW0UtjfH41ooGV",
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "Simple Payment App",
        description: "Test Payment",
        order_id: orderRes.data.id,
        handler: async function (response) {
          await axios.post("http://localhost:5000/api/payment/payment-success", response);
          alert("Payment Successful!");
          setLoading(false);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed!");
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h2>Complete Your Payment</h2>
        <p>Pay securely using Razorpay. Amount: <strong>₹500</strong></p>
        <button onClick={handlePayment} disabled={loading}>
          {loading ? "Processing..." : "Pay ₹500"}
        </button>
      </div>
    </div>
  );
};

export default Payment;
