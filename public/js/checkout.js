document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.getElementById("checkoutForm");
  if (!checkoutForm) return;

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const requestId = document.getElementById("requestId").value.trim();
    const paymentMethod = document.getElementById("paymentMethod").value;
    const checkoutMessage = document.getElementById("checkoutMessage");

    if (!requestId) {
      checkoutMessage.textContent = "Request ID is required.";
      checkoutMessage.className = "mt-3 text-danger";
      return;
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, paymentMethod }),
      });

      const result = await response.json();
      if (response.ok) {
        checkoutMessage.textContent = result.message || "Payment successful.";
        checkoutMessage.className = "mt-3 text-success";
        setTimeout(() => {
          window.location.href = "/technicianDashboard";
        }, 800);
      } else {
        checkoutMessage.textContent = result.error || "Payment failed.";
        checkoutMessage.className = "mt-3 text-danger";
      }
    } catch (error) {
      console.error(error);
      checkoutMessage.textContent = "Unable to process payment right now.";
      checkoutMessage.className = "mt-3 text-danger";
    }
  });
});
