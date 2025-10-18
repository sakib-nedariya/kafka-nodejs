import React, { useState } from "react";
import axios from "axios";
import "../App.css";

function PaymentForm() {
  const [form, setForm] = useState({ name: "", phone: "", amount: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.amount) {
      alert("Please fill all fields!");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post("http://localhost:4000/api/create-order", form);

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "My Payment App",
        description: "Simple Transaction",
        order_id: data.id,
        handler: async function (response) {
          await axios.post("http://localhost:4000/api/verify-payment", {
            ...response,
            name: form.name,
            phone: form.phone,
            amount: form.amount,
          });

          alert("✅ Payment Successful! Check backend console for notification.");
        },
        prefill: {
          name: form.name,
          contact: form.phone,
        },
        theme: { color: "#007bff" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      setTimeout(() => setLoading(false), 1000);
    } catch (err) {
      console.error(err);
      alert("Payment failed! Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Make a Payment</h2>
      <form onSubmit={handlePayment}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="input-box"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="input-box"
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount (INR)"
          value={form.amount}
          onChange={handleChange}
          className="input-box"
        />
        <button type="submit" disabled={loading} className="pay-button">
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
}

export default PaymentForm;
