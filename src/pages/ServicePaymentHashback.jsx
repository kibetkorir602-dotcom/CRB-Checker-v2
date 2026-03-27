app.post("/api/initiate-payment", async (req, res) => {
  // ... existing code ...
  
  const response = await fetch(HASHPAY_INITIATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: HASHPAY_API_KEY,
      account_id: HASHPAY_ACCOUNT_ID,
      amount: amount,
      msisdn: phone,
      reference: reference,
    }),
  });

  const data = await response.json();
  console.log("HashPay response:", data);

  // Check for successful response (ResponseCode "0")
  if (data.ResponseCode === "0" && data.CheckoutRequestID) {
    paymentSessions.set(data.CheckoutRequestID, {
      userId,
      amount,
      phone,
      reference,
      status: "pending",
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      checkoutId: data.CheckoutRequestID, // Return CheckoutRequestID
      merchantRequestId: data.MerchantRequestID,
      message: data.ResponseDescription,
    });
  } else {
    res.status(400).json({
      success: false,
      error: data.ResponseDescription || "Initiation failed",
      details: data,
    });
  }
});
