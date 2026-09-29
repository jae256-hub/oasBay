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

  const notify = (message, isError = false) => {
    alert(`${isError ? "Action failed" : "Success"}: ${message}`);
  };

  async function readResponse(response, fallbackMessage) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        "Your session may have expired. Please sign in and try again.",
      );
    }
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || result.message || fallbackMessage);
    }
    return result;
  }

  function setSubmitting(submitting) {
    const button = pricingForm?.querySelector("button[type='submit']");
    if (!button) return;
    button.disabled = submitting;
    button.setAttribute("aria-busy", String(submitting));
  }

  async function loadPricing() {
    try {
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
    } catch (error) {
      console.error(error);
      pricingList.innerHTML =
        '<div class="empty-state">Unable to load pricing plans.</div>';
      planCountEl.textContent = "0";
      avgPriceEl.textContent = "UGX 0";
    }
  }

  pricingForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pricingForm.dataset.submitting === "true") return;
    const serviceName = pricingForm.serviceName.value.trim();
    const description = pricingForm.description.value.trim();
    const price = Number(pricingForm.price.value);
    const id = pricingForm.dataset.id;

    if (!serviceName || !Number.isFinite(price) || price < 0) {
      notify("Enter a service name and a valid, non-negative price.", true);
      return;
    }

    const payload = {
      serviceName,
      name: serviceName,
      price,
      description,
    };

    pricingForm.dataset.submitting = "true";
    setSubmitting(true);
    try {
      const response = id
        ? await fetch(`/api/pricing/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/pricing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      await readResponse(response, "Unable to save pricing plan.");

      pricingForm.reset();
      delete pricingForm.dataset.id;
      pricingForm.querySelector("button[type='submit']").textContent =
        "Add plan";
      notify(
        id
          ? "Pricing plan updated successfully."
          : "Pricing plan created successfully.",
      );
      await loadPricing();
    } catch (error) {
      console.error(error);
      notify(error.message || "Unable to save pricing plan.", true);
    } finally {
      delete pricingForm.dataset.submitting;
      setSubmitting(false);
    }
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;

    if (action === "edit") {
      try {
        const response = await fetch("/api/pricing");
        const items = response.ok ? await response.json() : [];
        const item = items.find((entry) => String(entry._id) === String(id));
        if (!item) return;

        pricingForm.dataset.id = id;
        pricingForm.serviceName.value = item.serviceName || item.name || "";
        pricingForm.price.value = item.price || 0;
        pricingForm.description.value = item.description || "";
        pricingForm.querySelector("button[type='submit']").textContent =
          "Update plan";
        pricingForm.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (error) {
        console.error(error);
        notify("Unable to load pricing plan for editing.", true);
      }
      return;
    }

    if (action === "delete") {
      if (!window.confirm("Delete this pricing plan? This cannot be undone.")) {
        return;
      }
      button.disabled = true;
      try {
        const response = await fetch(`/api/pricing/${id}`, {
          method: "DELETE",
        });
        await readResponse(response, "Unable to delete pricing plan.");
        notify("Pricing plan deleted successfully.");
        await loadPricing();
      } catch (error) {
        console.error(error);
        notify(error.message || "Unable to delete pricing plan.", true);
      } finally {
        button.disabled = false;
      }
    }
  });

  loadPricing();
});
