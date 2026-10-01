document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  const requestMessage = document.getElementById("requestMessage");
  const requestsList = document.getElementById("request-list");

  async function loadRequests() {
    const resp = await fetch("/api/requests");
    if (!resp.ok) return;
    const data = await resp.json();
    requestsList.innerHTML = data
      .map(
        (req) => `
      <div class="request-card">
        <div><strong>Owner:</strong> ${req.carOwnerName}</div>
        <div><strong>Car Type:</strong> ${req.carType}</div>
        <div><strong>Status:</strong> ${req.status}</div>
        <div><strong>Solution:</strong> ${req.recommendedSolution}</div>
        <div><strong>Submitted:</strong> ${new Date(req.createdAt).toLocaleString()}</div>
      </div>
    `,
      )
      .join("");
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        carOwnerName: form.carOwnerName.value.trim(),
        carType: form.carType.value.trim(),
        problemDescription: form.problemDescription.value.trim(),
        recommendedSolution: form.recommendedSolution.value.trim(),
      };
      if (
        !payload.carOwnerName ||
        !payload.carType ||
        !payload.problemDescription ||
        !payload.recommendedSolution
      ) {
        requestMessage.textContent =
          "Please complete all fields before submitting.";
        requestMessage.className = "text-danger mt-3";
        return;
      }

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        requestMessage.textContent =
          result.message || "Request submitted to admin.";
        requestMessage.className = "text-success mt-3";
        form.reset();
        loadRequests();
      } else {
        requestMessage.textContent =
          result.error || "Unable to submit request.";
        requestMessage.className = "text-danger mt-3";
      }
    });
  }

  loadRequests();
});
