document.addEventListener("DOMContentLoaded", () => {
  const requestsTable = document.getElementById("assigned-requests");
  if (!requestsTable) return;

  async function loadAssignedRequests() {
    const resp = await fetch("/api/requests");
    if (!resp.ok) return;
    const data = await resp.json();
    requestsTable.innerHTML = data
      .map(
        (req) => `
        <tr>
          <td>${req.carOwnerName}</td>
          <td>${req.carType}</td>
          <td>${req.problemDescription}</td>
          <td>${req.status}</td>
          <td>${req.quoteNotes || "—"}</td>
        </tr>
      `,
      )
      .join("");
  }

  loadAssignedRequests();
});
