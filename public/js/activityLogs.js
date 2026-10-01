document.addEventListener("DOMContentLoaded", async () => {
  const logsTableBody = document.getElementById("logsTableBody");
  const logCount = document.getElementById("logCount");

  async function loadLogs() {
    try {
      const response = await fetch("/api/activity-logs");
      const logs = response.ok ? await response.json() : [];

      logCount.textContent = String(logs.length);

      if (!logs.length) {
        logsTableBody.innerHTML =
          '<tr><td colspan="4" class="text-center text-muted">No activity yet.</td></tr>';
        return;
      }

      logsTableBody.innerHTML = logs
        .map(
          (log) => `
            <tr>
              <td>${log.action || "Activity"}</td>
              <td>${log.message || "System activity"}</td>
              <td>${log.actor || "System"}</td>
              <td>${log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}</td>
            </tr>
          `,
        )
        .join("");
    } catch (error) {
      console.error(error);
      logsTableBody.innerHTML =
        '<tr><td colspan="4" class="text-center text-danger">Unable to load logs.</td></tr>';
    }
  }

  loadLogs();
});
