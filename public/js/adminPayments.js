document.addEventListener("DOMContentLoaded", async () => {
  const paymentForm = document.getElementById("paymentForm");
  const transactionsTableBody = document.getElementById(
    "transactionsTableBody",
  );

  async function loadTransactions() {
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) throw new Error("Transactions unavailable");
      const transactions = await response.json();
      const total = transactions.length;
      const paid = transactions.filter(
        (t) => String(t.status).toLowerCase() === "paid",
      ).length;
      const pending = transactions.filter(
        (t) => String(t.status).toLowerCase() === "pending",
      ).length;

      document.getElementById("totalTransactions").textContent = total;
      document.getElementById("paidTransactions").textContent = paid;
      document.getElementById("pendingTransactions").textContent = pending;

      if (!transactions.length) {
        transactionsTableBody.innerHTML =
          '<tr><td colspan="5" class="text-center text-muted">No transactions yet.</td></tr>';
        return;
      }

      transactionsTableBody.innerHTML = transactions
        .map(
          (txn) => `
            <tr>
              <td>${txn.requestName || txn.request || "N/A"}</td>
              <td>${txn.customerName || "Unknown customer"}</td>
              <td>${txn.paymentMethod || "QR"}</td>
              <td>UGX ${Number(txn.amount || 0).toLocaleString()}</td>
              <td><span class="status-pill ${txn.status === "Paid" ? "st-completed" : "st-progress"}">${txn.status || "Pending"}</span></td>
            </tr>
          `,
        )
        .join("");
    } catch (error) {
      console.error(error);
      transactionsTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger">Unable to load transactions.</td></tr>';
    }
  }

  if (paymentForm) {
    paymentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(paymentForm).entries());

      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: payload.requestId,
            customerId: payload.customerId,
            serviceName: payload.serviceName,
            description: payload.description,
            amount: Number(payload.amount || 0),
            paymentMethod: payload.paymentMethod,
            status: payload.status || "Paid",
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          alert(result.error || "Unable to record payment.");
          return;
        }

        paymentForm.reset();
        alert(
          result.message || "Transaction saved and service pricing updated.",
        );
        await loadTransactions();
      } catch (error) {
        console.error(error);
        alert("Unable to save payment details.");
      }
    });
  }

  await loadTransactions();
});
