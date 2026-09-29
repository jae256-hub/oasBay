document.addEventListener("DOMContentLoaded", () => {
  const bays = [
    { name: "Bay 1", status: "Occupied", tech: "Mwesigwa — Oil Change" },
    { name: "Bay 2", status: "Available", tech: "—" },
    { name: "Bay 3", status: "Occupied", tech: "Sarah — Brake Repair" },
    { name: "Bay 4", status: "Available", tech: "—" },
  ];

  const revenue = [420, 680, 950, 1260, 1410, 1760];
  const revenueDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Today"];
  const invAlerts = [
    "Engine oil stock is below the recommended threshold for Bay 1.",
    "Brake pads need replenishment before the next repair cycle.",
    "Air filters are running low in the workshop store.",
  ];

  function renderBays() {
    const bayStatus = document.getElementById("bay-status");
    if (!bayStatus) return;

    bayStatus.innerHTML = bays
      .map(
        (bay) => `
          <div class="bay-row">
            <div>
              <div class="bay-name">${bay.name}</div>
              <div class="bay-assigned">${bay.status === "Available" ? "Ready for next vehicle" : "Assigned to: " + bay.tech}</div>
            </div>
            <span class="badge ${bay.status === "Available" ? "avail" : "busy"}">${bay.status}</span>
          </div>
        `,
      )
      .join("");
  }

  function renderChart() {
    const svg = document.getElementById("revenue-chart");
    if (!svg) return;

    const max = Math.max(...revenue) * 1.15;
    const w = 320;
    const h = 170;
    const pad = 28;
    const stepX = (w - pad * 2) / (revenue.length - 1);
    const pts = revenue.map((value, index) => {
      const x = pad + index * stepX;
      const y = h - pad - (value / max) * (h - pad * 1.6);
      return [x, y];
    });

    const line = pts.map((point) => point.join(",")).join(" ");
    const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
    let chartMarkup = `<polygon points="${area}" fill="#c9a22733"/>`;
    chartMarkup += `<polyline points="${line}" fill="none" stroke="#c9a227" stroke-width="2.5"/>`;

    pts.forEach((point, index) => {
      chartMarkup += `<circle cx="${point[0]}" cy="${point[1]}" r="4" fill="#0f2138"/>`;
      chartMarkup += `<text x="${point[0]}" y="${h - 8}" font-size="10" fill="#6b7280" text-anchor="middle">${revenueDays[index]}</text>`;
    });

    svg.innerHTML = chartMarkup;
  }

  function renderInvAlerts() {
    const alertsContainer = document.getElementById("inv-alerts");
    if (!alertsContainer) return;

    alertsContainer.innerHTML = invAlerts
      .map(
        (alert) => `
          <div class="checklist-item"><span class="dot-warn"></span>${alert}</div>
        `,
      )
      .join("");
  }

  const requestsTable = document.getElementById("assigned-requests");
  if (requestsTable) {
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
  }

  renderBays();
  renderChart();
  renderInvAlerts();
});
