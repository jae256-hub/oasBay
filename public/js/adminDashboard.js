// Placeholder file for customer dashboard enhancements.
// ---------- DATA ----------
const bays = [
  { name: "Bay 1", status: "Available", tech: "—" },
  { name: "Bay 2", status: "Occupied", tech: "John D. — Oil Change" },
  { name: "Bay 3", status: "Available", tech: "—" },
  { name: "Bay 4", status: "Occupied", tech: "Mike S. — Brake Repair" },
];
const techActivity = [
  {
    tech: "Kato",
    act: "Oil Change",
    time: "10:15 AM",
    details: "Completed",
  },
  {
    tech: "Mwesigwa Johnson",
    act: "Brake Repair",
    time: "11:30 AM",
    details: "In Progress",
  },
  {
    tech: "Busingye Ashraf",
    act: "Inspection",
    time: "12:45 PM",
    details: "Finished",
  },
  {
    tech: "Ssali Lameck",
    act: "Tire Rotation",
    time: "1:20 PM",
    details: "Ongoing",
  },
];
const invAlerts = [
  {
    title: "Engine Oil Filters",
    detail:
      "Only 8 units remain. Reorder immediately before the next service batch.",
    level: "Critical",
  },
  {
    title: "Brake Pads",
    detail:
      "Below approved safety threshold in the main store. Urgent replenishment needed.",
    level: "Urgent",
  },
  {
    title: "Engine Oil",
    detail:
      "Bay 2 and Bay 3 are below target stock. Restock before the afternoon shift.",
    level: "High",
  },
  {
    title: "Air Filters",
    detail:
      "Only 14 units left across all bays. Weekly target has been missed.",
    level: "Moderate",
  },
  {
    title: "Coolant",
    detail:
      "Rear bay stock is low. Top-up is required before the next maintenance cycle.",
    level: "Medium",
  },
  {
    title: "Spark Plugs",
    detail:
      "Current stock is under reorder point. Procurement should be scheduled today.",
    level: "Medium",
  },
];
const revenue = [500, 900, 1400, 1100, 1300, 1850];
const revenueDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Today"];

const records = [
  {
    id: "AB1234",
    type: "Oil Change",
    parts: "Oil Filter, 5W-30 Oil",
    tech: "John D.",
    cost: "$120",
    status: "Completed",
    oils: "5W-30 Oil",
    filters: "Oil Filter",
    labour: "$120",
    notes: "Routine oil change and inspection.",
  },
  {
    id: "CD5678",
    type: "Brake Repair",
    parts: "Brake Pads",
    tech: "Mike S.",
    cost: "$250",
    status: "In Progress",
    oils: "—",
    filters: "—",
    labour: "$180",
    notes: "Front brake pads replaced; rear pending inspection.",
  },
  {
    id: "EF9102",
    type: "Inspection",
    parts: "Air Filter, Cabin Filter",
    tech: "Karen T.",
    cost: "$80",
    status: "Completed",
    oils: "—",
    filters: "Air Filter, Cabin Filter",
    labour: "$60",
    notes: "General inspection, filters replaced.",
  },
  {
    id: "GH3456",
    type: "Tire Rotation",
    parts: "New Tires",
    tech: "Jason R.",
    cost: "$180",
    status: "Completed",
    oils: "—",
    filters: "—",
    labour: "$40",
    notes: "All four tires rotated and balanced.",
  },
  {
    id: "IJ6789",
    type: "Alignment",
    parts: "Alignment Kit",
    tech: "Lisa P.",
    cost: "$100",
    status: "Pending",
    oils: "—",
    filters: "—",
    labour: "$100",
    notes: "Awaiting parts delivery.",
  },
];

const inventory = [
  {
    name: "5W-30 Motor Oil",
    cat: "Oil",
    qty: 120,
    price: "UGX 25,000",
    supplier: "AutoSupply Ltd.",
    restocked: "02/10/22",
    reorder: 50,
    usage: 40,
    history: [
      "02/10/22 - Received 100 units",
      "01/05/22 - Received 150 units",
      "12/15/21 - Received 120 units",
    ],
  },
  {
    name: "Brake Pads",
    cat: "Parts",
    qty: 15,
    price: "UGX 60,000",
    supplier: "BrakeWorks Co.",
    restocked: "01/25/22",
    reorder: 20,
    usage: 12,
    history: ["01/25/22 - Received 30 units", "12/20/21 - Received 40 units"],
  },
  {
    name: "Air Filters",
    cat: "Filters",
    qty: 60,
    price: "UGX 15,000",
    supplier: "Parts Depot",
    restocked: "02/05/22",
    reorder: 25,
    usage: 18,
    history: ["02/05/22 - Received 50 units"],
  },
  {
    name: "Engine Oil Filters",
    cat: "Filters",
    qty: 8,
    price: "UGX 8,000",
    supplier: "LubriTech",
    restocked: "01/18/22",
    reorder: 20,
    usage: 15,
    history: ["01/18/22 - Received 20 units"],
  },
  {
    name: "Spark Plugs",
    cat: "Parts",
    qty: 50,
    price: "UGX 12,000",
    supplier: "Ignition Pros",
    restocked: "01/30/22",
    reorder: 30,
    usage: 10,
    history: ["01/30/22 - Received 60 units"],
  },
];

const users = [
  {
    name: "John D.",
    role: "Technician",
    email: "john@example.com",
    status: "Active",
    login: "02/22/22 08:15 AM",
    phone: "(123) 456-7890",
    bays: "Bay 1, Bay 2",
    activity: ["Completed Oil Change on AB1234", "Updated Inventory Record"],
  },
  {
    name: "Karen T.",
    role: "Senior Technician",
    email: "karen@example.com",
    status: "Active",
    login: "02/21/22 03:40 PM",
    phone: "(123) 555-0142",
    bays: "Bay 3",
    activity: ["Approved Parts Request", "Checked Inspection on EF9102"],
  },
  {
    name: "Mike S.",
    role: "Technician",
    email: "mike@example.com",
    status: "Inactive",
    login: "02/15/22 01:10 PM",
    phone: "(123) 555-0198",
    bays: "Bay 4",
    activity: ["Started Brake Repair on CD5678"],
  },
  {
    name: "Lisa P.",
    role: "Admin",
    email: "lisa@example.com",
    status: "Active",
    login: "02/22/22 09:00 AM",
    phone: "(123) 555-0111",
    bays: "—",
    activity: ["Added New User: Jason R."],
  },
  {
    name: "Jason R.",
    role: "Technician",
    email: "jason@example.com",
    status: "Active",
    login: "02/21/22 03:30 AM",
    phone: "(123) 555-0177",
    bays: "Bay 1",
    activity: ["Completed Tire Rotation on GH3456"],
  },
  {
    name: "Mark A.",
    role: "Technician",
    email: "jason@example.com",
    status: "Active",
    login: "02/21/22 10:30 AM",
    phone: "(123) 555-0155",
    bays: "Bay 2",
    activity: ["Checked Alignment on GH3456"],
  },
];

const logs = [
  {
    user: "John D.",
    role: "Technician",
    action: "Completed Service",
    record: "Car ID: AB1234",
    time: "01/22/22 10:35 AM",
    status: "Successful",
    details: "Performed oil change and inspection on vehicle.",
  },
  {
    user: "Karen T.",
    role: "Technician",
    action: "Approved Parts Request",
    record: "Job: Brake Repair",
    time: "01/22/22 11:00 AM",
    status: "Approved",
    details: "Approved brake pad replacement request for CD5678.",
  },
  {
    user: "Mike S.",
    role: "Technician",
    action: "Updated Inventory",
    record: "5W-30 Motor Oil",
    time: "01/22/22 11:45 AM",
    status: "Updated",
    details: "Adjusted stock count after usage on AB1234.",
  },
  {
    user: "Lisa P.",
    role: "Admin",
    action: "Added New User",
    record: "User: Jason R.",
    time: "01/22/22 12:10 PM",
    status: "Created",
    details: "Created technician account for Jason R.",
  },
  {
    user: "Mark A.",
    role: "Technician",
    action: "Checked Alignment",
    record: "Car ID: GH3456",
    time: "01/22/22 12:40 PM",
    status: "Checked",
    details: "Verified wheel alignment specs post-service.",
  },
];

const pricing = [
  {
    name: "Oil Change",
    cat: "Maintenance",
    labour: "UGX 15,000",
    partsRange: "UGX 30,000 - 50,000",
    total: "UGX 45,000 - 65,000",
    desc: "Complete oil and filter change.",
    notes: "Check tire pressure and top up fluids.",
    updated: "25/07/26",
  },
  {
    name: "Brake Repair",
    cat: "Repair",
    labour: "UGX 25,000",
    partsRange: "UGX 30,000 - 120,000",
    total: "UGX 105,000 - 145,000",
    desc: "Brake pad and rotor inspection/replacement.",
    notes: "Test brakes after service before release.",
    updated: "25/07/26",
  },
  {
    name: "Wheel Alignment",
    cat: "Alignment",
    labour: "UGX 20,000",
    partsRange: "UGX 0 - 10,000",
    total: "UGX 20,000 - 30,000",
    desc: "Four-wheel alignment adjustment.",
    notes: "Recommend after tire rotation.",
    updated: "25/07/26",
  },
  {
    name: "Engine Diagnostics",
    cat: "Diagnostics",
    labour: "UGX 30,000",
    partsRange: "UGX 20,000 - 35,000",
    total: "UGX 50,000 - 65,000",
    desc: "Full engine diagnostic scan and report.",
    notes: "Share fault codes with customer.",
    updated: "25/07/26",
  },
  {
    name: "AC Servicing",
    cat: "Maintenance",
    labour: "UGX 18,000",
    partsRange: "UGX 50,000 - 70,000",
    total: "UGX 68,000 - 88,000",
    desc: "AC gas refill and system check.",
    notes: "Check for leaks before refilling gas.",
    updated: "25/07/26",
  },
];

// ---------- RENDER HELPERS ----------
function statusClass(s) {
  const m = {
    Completed: "st-completed",
    "In Progress": "st-progress",
    Pending: "st-pending",
    Active: "st-active",
    Inactive: "st-inactive",
    Successful: "st-completed",
    Approved: "st-completed",
    Updated: "st-progress",
    Created: "st-completed",
    Checked: "st-completed",
  };
  return m[s] || "st-progress";
}

function renderBays() {
  document.getElementById("bay-status").innerHTML = bays
    .map(
      (b) => `
    <div class="bay-row">
      <div>
        <div class="bay-name">${b.name}</div>
        <div class="bay-assigned">${b.status === "Available" ? "Unassigned" : "Assigned to: " + b.tech}</div>
      </div>
      <span class="badge ${b.status === "Available" ? "avail" : "busy"}">${b.status}</span>
    </div>`,
    )
    .join("");
}

function renderChart() {
  const svg = document.getElementById("revenue-chart");
  const max = Math.max(...revenue) * 1.15;
  const w = 320,
    h = 170,
    pad = 28;
  const stepX = (w - pad * 2) / (revenue.length - 1);
  const pts = revenue.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / max) * (h - pad * 1.6);
    return [x, y];
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `${pad},${h - pad} ` + line + ` ${w - pad},${h - pad}`;
  let s = `<polygon points="${area}" fill="#c9a22733"/>`;
  s += `<polyline points="${line}" fill="none" stroke="#c9a227" stroke-width="2.5"/>`;
  pts.forEach((p, i) => {
    s += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#0f2138"/>`;
    s += `<text x="${p[0]}" y="${h - 8}" font-size="10" fill="#6b7280" text-anchor="middle">${revenueDays[i]}</text>`;
  });
  for (let i = 0; i <= 2; i++) {
    const y = pad + i * ((h - pad * 1.6) / 2);
    s += `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="#e3ded2" stroke-width="1"/>`;
  }
  svg.innerHTML = s;
}

function renderTechActivity() {
  const tableBody = document.getElementById("tech-activity");
  if (!tableBody) return;

  tableBody.innerHTML = techActivity
    .map(
      (t) => `
    <tr><td>${t.tech}</td><td>${t.act}</td><td>${t.time}</td><td>${t.details}</td></tr>`,
    )
    .join("");
}

function renderInvAlerts() {
  const container = document.getElementById("inv-alerts");
  if (!container) return;

  container.innerHTML = invAlerts
    .map(
      (alertItem) => `
        <div class="checklist-item" style="display:block; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:4px;">
            <strong>${alertItem.title}</strong>
            <span class="status-pill ${statusClass(alertItem.level === "Critical" ? "Pending" : alertItem.level === "Urgent" ? "In Progress" : "Completed")}">${alertItem.level}</span>
          </div>
          <div style="color: var(--muted); font-size: 12px; line-height: 1.5;">${alertItem.detail}</div>
        </div>
      `,
    )
    .join("");
}

function renderRecords(selIdx = 0) {
  document.getElementById("records-table").innerHTML = records
    .map(
      (r, i) => `
    <tr class="row-selectable ${i === selIdx ? "row-selected" : ""}" onclick="selectRecord(${i})">
      <td>${r.id}</td><td>${r.type}</td><td>${r.parts}</td><td>${r.tech}</td><td>${r.cost}</td>
      <td><span class="status-pill ${statusClass(r.status)}">${r.status}</span></td>
    </tr>`,
    )
    .join("");
  const r = records[selIdx];
  document.getElementById("record-details").innerHTML = `
    <div class="detail-row"><span class="k">Car ID</span><span class="v">${r.id}</span></div>
    <div class="detail-row"><span class="k">Technician</span><span class="v">${r.tech}</span></div>
    <div class="detail-row"><span class="k">Oils Used</span><span class="v">${r.oils}</span></div>
    <div class="detail-row"><span class="k">Filters</span><span class="v">${r.filters}</span></div>
    <div class="detail-row"><span class="k">Labour Charge</span><span class="v">${r.labour}</span></div>
    <div class="section-title">Notes</div>
    <div class="notes-box">${r.notes}</div>`;
}
function selectRecord(i) {
  renderRecords(i);
}

function renderInventory(selIdx = 0) {
  document.getElementById("inventory-table").innerHTML = inventory
    .map(
      (it, i) => `
    <tr class="row-selectable ${i === selIdx ? "row-selected" : ""}" onclick="selectInventory(${i})">
      <td>${it.name}</td><td>${it.cat}</td><td>${it.qty}</td><td>${it.price}</td><td>${it.supplier}</td><td>${it.restocked}</td>
    </tr>`,
    )
    .join("");
  const it = inventory[selIdx];
  document.getElementById("inventory-details").innerHTML = `
    <div class="detail-row"><span class="k">Item</span><span class="v">${it.name}</span></div>
    <div class="detail-row"><span class="k">Category</span><span class="v">${it.cat}</span></div>
    <div class="detail-row"><span class="k">Reorder Level</span><span class="v">${it.reorder}</span></div>
    <div class="detail-row"><span class="k">Usage Per Week</span><span class="v">${it.usage}</span></div>
    <div class="section-title">Purchase History</div>
    ${it.history.map((h) => `<div class="notes-box" style="margin-top:6px;">${h}</div>`).join("")}`;
}
function selectInventory(i) {
  renderInventory(i);
}

function renderUsers(selIdx = 0) {
  document.getElementById("users-table").innerHTML = users
    .map(
      (u, i) => `
    <tr class="row-selectable ${i === selIdx ? "row-selected" : ""}" onclick="selectUser(${i})">
      <td>${u.name}</td><td>${u.role}</td><td>${u.email}</td>
      <td><span class="status-pill ${statusClass(u.status)}">${u.status}</span></td><td>${u.login}</td>
    </tr>`,
    )
    .join("");
  const u = users[selIdx];
  document.getElementById("user-details").innerHTML = `
    <div class="detail-row"><span class="k">Name</span><span class="v">${u.name}</span></div>
    <div class="detail-row"><span class="k">Role</span><span class="v">${u.role}</span></div>
    <div class="detail-row"><span class="k">Email</span><span class="v">${u.email}</span></div>
    <div class="detail-row"><span class="k">Phone</span><span class="v">${u.phone}</span></div>
    <div class="detail-row"><span class="k">Assigned Bays</span><span class="v">${u.bays}</span></div>
    <div class="section-title">Recent Activity</div>
    ${u.activity.map((a) => `<div class="notes-box" style="margin-top:6px;">${a}</div>`).join("")}`;
}
function selectUser(i) {
  renderUsers(i);
}

function renderLogs(selIdx = 0) {
  document.getElementById("logs-table").innerHTML = logs
    .map(
      (l, i) => `
    <tr class="row-selectable ${i === selIdx ? "row-selected" : ""}" onclick="selectLog(${i})">
      <td>${l.user}</td><td>${l.role}</td><td>${l.action}</td><td>${l.record}</td><td>${l.time}</td>
      <td><span class="status-pill ${statusClass(l.status)}">${l.status}</span></td>
    </tr>`,
    )
    .join("");
  const l = logs[selIdx];
  document.getElementById("log-details").innerHTML = `
    <div class="detail-row"><span class="k">User</span><span class="v">${l.user}</span></div>
    <div class="detail-row"><span class="k">Role</span><span class="v">${l.role}</span></div>
    <div class="detail-row"><span class="k">Action</span><span class="v">${l.action}</span></div>
    <div class="detail-row"><span class="k">Record</span><span class="v">${l.record}</span></div>
    <div class="section-title">Details</div>
    <div class="notes-box">${l.details}</div>`;
}
function selectLog(i) {
  renderLogs(i);
}

function renderPricing(selIdx = 0) {
  document.getElementById("pricing-table").innerHTML = pricing
    .map(
      (p, i) => `
    <tr class="row-selectable ${i === selIdx ? "row-selected" : ""}" onclick="selectPricing(${i})">
      <td>${p.name}</td><td>${p.cat}</td><td>${p.labour}</td><td>${p.partsRange}</td><td>${p.total}</td>
    </tr>`,
    )
    .join("");
  const p = pricing[selIdx];
  document.getElementById("pricing-details").innerHTML = `
    <div class="detail-row"><span class="k">Service</span><span class="v">${p.name}</span></div>
    <div class="detail-row"><span class="k">Category</span><span class="v">${p.cat}</span></div>
    <div class="detail-row"><span class="k">Labour Charge</span><span class="v">${p.labour}</span></div>
    <div class="detail-row"><span class="k">Parts Cost Range</span><span class="v">${p.partsRange}</span></div>
    <div class="section-title">Description</div>
    <div class="notes-box">${p.desc}</div>
    <div class="section-title">Technician Notes</div>
    <div class="notes-box">${p.notes}<br><em style="color:var(--muted);">Last Updated: ${p.updated}</em></div>`;
}
function selectPricing(i) {
  renderPricing(i);
}

// ---------- NAVIGATION ----------
const titles = {
  dashboard: ["Admin Dashboard", "Wed, Feb 22 2022"],
  records: ["Service Records", "48 cars serviced"],
  inventory: ["Inventory Records", "320 items tracked"],
  users: ["User Management", "15 total users"],
  logs: ["User Activity Logs", "85 actions today"],
  pricing: ["Service Pricing", "10 active services"],
};
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    const view = item.getAttribute("data-view");
    const targetView = document.getElementById("view-" + view);
    const title = document.getElementById("topbar-title1");
    const subtitle = document.getElementById("topbar-sub");
    if (!view || !targetView || !title || !subtitle) return;

    document
      .querySelectorAll(".nav-item")
      .forEach((n) => n.classList.remove("active"));
    item.classList.add("active");
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.remove("active"));
    targetView.classList.add("active");
    title.textContent = titles[view][0];
    subtitle.textContent = titles[view][1];
  });
});
let bayCapacity = 30;
const carsServiced = document.querySelector(".stat-value1");

// ---------- INIT ----------
renderBays();
renderChart();
renderTechActivity();
renderInvAlerts();
renderRecords();
renderInventory();
renderUsers();
renderLogs();
renderPricing();
