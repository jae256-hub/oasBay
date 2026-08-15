document.addEventListener("DOMContentLoaded", async () => {
  const recordsTableBody = document.getElementById("recordsTableBody");
  const recordCount = document.getElementById("recordCount");
  const completedCount = document.getElementById("completedCount");
  const inProgressCount = document.getElementById("inProgressCount");

  if (!recordsTableBody) return;

  try {
    const response = await fetch("/api/records");
    if (!response.ok) throw new Error("Failed to load service records");
    const records = await response.json();

    recordCount.textContent = records.length;
    completedCount.textContent = records.filter(
      (record) => String(record.status || "").toLowerCase() === "completed",
    ).length;
    inProgressCount.textContent = records.filter(
      (record) => String(record.status || "").toLowerCase() === "in progress",
    ).length;

    if (!records.length) {
      recordsTableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">No service records found.</td></tr>';
      return;
    }

    recordsTableBody.innerHTML = records
      .map(
        (record) => `
        <tr>
          <td>${record._id || record.id || "N/A"}</td>
          <td>${record.vehicle || record.carType || "N/A"}</td>
          <td>${record.service || record.problemDescription || "N/A"}</td>
          <td>${record.technician || record.assignedTechnicianName || "N/A"}</td>
          <td>${record.status || "Pending"}</td>
          <td>${record.cost || record.quotedAmount || 0}</td>
        </tr>
      `,
      )
      .join("");
  } catch (error) {
    console.error(error);
    recordsTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">Unable to load records.</td></tr>';
  }
});
