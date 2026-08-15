document.addEventListener("DOMContentLoaded", async () => {
  const pricingList = document.getElementById("pricingList");
  const pricingForm = document.getElementById("pricingForm");
  const planCountEl = document.getElementById("planCount");
  const avgPriceEl = document.getElementById("avgPrice");

  if (!pricingList) return;

  const money = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  });

  async function loadPricing() {
    const response = await fetch("/api/pricing");
    const items = response.ok ? await response.json() : [];
    pricingList.innerHTML = "";

    if (!items.length) {
      pricingList.innerHTML =
        '<div class="empty-state">No pricing plans available.</div>';
      planCountEl.textContent = "0";
      avgPriceEl.textContent = "UGX 0";
      return;
    }

    const average =
      items.reduce((sum, item) => sum + Number(item.price || 0), 0) /
      items.length;
    planCountEl.textContent = String(items.length);
    avgPriceEl.textContent = money.format(average);

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "inventory-card";
      card.innerHTML = `
        <div class="inventory-body">
          <h4>${item.serviceName || item.name || "Service plan"}</h4>
          <p>${item.description || "Service plan description"}</p>
          <div class="inventory-price">${money.format(Number(item.price || 0))}</div>
          <div class="inventory-actions">
            <button class="btn btn-warning" data-action="edit" data-id="${item._id}">Edit</button>
            <button class="btn btn-danger" data-action="delete" data-id="${item._id}">Delete</button>
          </div>
        </div>
      `;
      pricingList.appendChild(card);
    });
  }

  pricingForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      serviceName: pricingForm.serviceName.value.trim(),
      name: pricingForm.serviceName.value.trim(),
      price: Number(pricingForm.price.value),
      description: pricingForm.description.value.trim(),
    };

    if (!payload.serviceName || Number.isNaN(payload.price)) {
      return;
    }

    await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    pricingForm.reset();
    loadPricing();
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;

    if (action === "delete") {
      await fetch(`/api/pricing/${id}`, { method: "DELETE" });
      loadPricing();
    }
  });

  loadPricing();
});
