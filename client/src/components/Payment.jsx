import React from "react";
import axios from "axios";

const Payment = () => {
  const handlePayment = async () => {
    try {
      // Create order in backend
      const orderRes = await axios.post("http://localhost:5000/api/payment/create-order", { amount: 500 });

      const options = {
        key: "YOUR_KEY_ID", // Razorpay Key
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "Test Payment",
        order_id: orderRes.data.id,
        handler: async function (response) {
          // Payment success
          await axios.post("http://localhost:5000/api/payment/payment-success", response);
          alert("Payment Successful!");
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed!");
    }
  };

  return (
    <div>
      <h2>Pay with Razorpay</h2>
      <button onClick={handlePayment}>Pay ₹500</button>
    </div>
  );
};

export default Payment;
