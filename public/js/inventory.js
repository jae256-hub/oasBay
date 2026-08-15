document.addEventListener("DOMContentLoaded", async () => {
  const inventoryList = document.getElementById("inventoryList");
  const dashboardRows = document.getElementById("dashboardRows");
  const addForm = document.getElementById("inventoryForm");
  const editForm = document.getElementById("editInventoryForm");

  if (!inventoryList || !dashboardRows) return;

  const money = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  });

  function formatMoney(value) {
    return money.format(Number(value || 0));
  }

  function renderSummary(items, dbRows) {
    const totalItems = items.length;
    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0,
    );
    const lowStock = items.filter(
      (item) => Number(item.price || 0) < 20000,
    ).length;

    document.getElementById("totalItems").textContent = totalItems;
    document.getElementById("lowStock").textContent = lowStock;
    document.getElementById("totalValue").textContent = formatMoney(totalValue);
    document.getElementById("dbRecords").textContent = dbRows.length;
  }

  function renderInventory(items) {
    inventoryList.innerHTML = "";

    if (!items.length) {
      inventoryList.innerHTML =
        '<div class="empty-state">No inventory items available.</div>';
      return;
    }

    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "inventory-card";
      article.innerHTML = `
        <img src="${item.image || "https://via.placeholder.com/400x220?text=No+Image"}" alt="${item.name || "Inventory item"}" />
        <div class="inventory-body">
          <h4>${item.name || "Unnamed item"}</h4>
          <p>${item.description || "No description provided."}</p>
          <div class="inventory-price">${formatMoney(item.price)}</div>
          <div class="inventory-actions">
            <button class="btn btn-warning" data-action="edit" data-id="${item._id || item.id}">Edit</button>
            <button class="btn btn-danger" data-action="delete" data-id="${item._id || item.id}">Delete</button>
          </div>
        </div>
      `;
      inventoryList.appendChild(article);
    });
  }

  function renderRows(rows) {
    dashboardRows.innerHTML = "";

    if (!rows.length) {
      dashboardRows.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted">No database records found.</td></tr>';
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row._id || row.id || "N/A"}</td>
        <td>${row.name || row.customerName || "N/A"}</td>
        <td>${row.status || "Pending"}</td>
        <td>${formatMoney(row.total || row.amount || row.price || 0)}</td>
        <td><button class="btn btn-sm btn-warning" data-db-edit="${row._id || row.id}">Edit</button></td>
      `;
      dashboardRows.appendChild(tr);
    });
  }

  async function refreshInventory() {
    try {
      const jsonResponse = await fetch("/api/inventory/json");
      const jsonItems = jsonResponse.ok ? await jsonResponse.json() : [];
      const dbResponse = await fetch("/api/inventory");
      const dbItems = dbResponse.ok ? await dbResponse.json() : [];
      const merged = [...(Array.isArray(jsonItems) ? jsonItems : []), ...(Array.isArray(dbItems) ? dbItems : [])];
      const byId = new Map();
      merged.forEach((item) => {
        const key = String(item._id || item.id || `${item.name}-${item.price}`);
        byId.set(key, item);
      });
      const items = [...byId.values()];

      renderInventory(items);
      renderRows(dbItems || items);
      renderSummary(items, dbItems || items);
    } catch (error) {
      console.error(error);
      inventoryList.innerHTML =
        '<div class="empty-state">Unable to load inventory.</div>';
      dashboardRows.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger">Unable to load records.</td></tr>';
    }
  }

  addForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: addForm.name.value.trim(),
      description: addForm.description.value.trim(),
      price: Number(addForm.price.value),
      currency: addForm.currency.value,
      image: addForm.image.value.trim(),
    };

    if (!payload.name || !payload.price) {
      return;
    }

    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    addForm.reset();
    refreshInventory();
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = editForm.dataset.id;
    if (!id) return;

    const payload = {
      name: editForm.name.value.trim(),
      description: editForm.description.value.trim(),
      price: Number(editForm.price.value),
      currency: editForm.currency.value,
      image: editForm.image.value.trim(),
    };

    await fetch(`/api/inventory/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    editForm.reset();
    delete editForm.dataset.id;
    refreshInventory();
  });

  document.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-action]");
    const dbEditButton = event.target.closest("[data-db-edit]");

    if (actionButton) {
      const id = actionButton.dataset.id;
      const action = actionButton.dataset.action;

      if (action === "edit") {
        const response = await fetch("/api/inventory");
        const items = await response.json();
        const item = items.find(
          (entry) => String(entry._id || entry.id) === String(id),
        );
        if (!item) return;

        editForm.dataset.id = id;
        editForm.name.value = item.name || "";
        editForm.description.value = item.description || "";
        editForm.price.value = item.price || 0;
        editForm.currency.value = item.currency || "UGX";
        editForm.image.value = item.image || "";
        editForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (action === "delete") {
        await fetch(`/api/inventory/${id}`, { method: "DELETE" });
        refreshInventory();
      }
    }

    if (dbEditButton) {
      const id = dbEditButton.dataset.dbEdit;
      const response = await fetch("/api/inventory");
      const items = await response.json();
      const item = items.find(
        (entry) => String(entry._id || entry.id) === String(id),
      );
      if (!item) return;
      editForm.dataset.id = id;
      editForm.name.value = item.name || "";
      editForm.description.value = item.description || "";
      editForm.price.value = item.price || 0;
      editForm.currency.value = item.currency || "UGX";
      editForm.image.value = item.image || "";
      editForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  refreshInventory();
});
