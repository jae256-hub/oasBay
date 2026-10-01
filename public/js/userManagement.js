document.addEventListener("DOMContentLoaded", async () => {
  const usersTableBody = document.getElementById("usersTableBody");
  const userCount = document.getElementById("userCount");
  const adminCount = document.getElementById("adminCount");
  const techCount = document.getElementById("techCount");
  const addUserForm = document.getElementById("addUserForm");
  const editUserForm = document.getElementById("editUserForm");

  if (!usersTableBody) return;

  const notify = (message, type = "success") => {
    alert(`${type === "error" ? "Action failed" : "Success"}: ${message}`);
  };

  async function readResponse(response, fallbackMessage) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        "Your session may have expired. Please sign in and try again.",
      );
    }
    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.error || result.message || fallbackMessage);
    }
    return result;
  }

  function setSubmitting(form, submitting) {
    const button = form.querySelector("button[type='submit']");
    if (!button) return;
    button.disabled = submitting;
    button.setAttribute("aria-busy", String(submitting));
  }

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to load users");
      const users = await response.json();

      userCount.textContent = users.length;
      adminCount.textContent = users.filter(
        (user) => String(user.role).toLowerCase() === "admin",
      ).length;
      techCount.textContent = users.filter((user) =>
        String(user.role).toLowerCase().includes("technician"),
      ).length;

      if (!users.length) {
        usersTableBody.innerHTML =
          '<tr><td colspan="6" class="text-center text-muted">No users found.</td></tr>';
        return;
      }

      usersTableBody.innerHTML = users
        .map(
          (user) => `
          <tr>
            <td>${user.firstName || ""} ${user.surname || ""}</td>
            <td>${user.email || "N/A"}</td>
            <td>${user.telephone || "N/A"}</td>
            <td>${user.role || "User"}</td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</td>
            <td>
              <button class="btn btn-sm btn-warning" data-action="edit-user" data-id="${user._id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-action="delete-user" data-id="${user._id}">Delete</button>
            </td>
          </tr>
        `,
        )
        .join("");
    } catch (error) {
      console.error(error);
      usersTableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-danger">Unable to load users.</td></tr>';
    }
  };

  addUserForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (addUserForm.dataset.submitting === "true") return;
    const payload = {
      firstName: addUserForm.firstName.value.trim(),
      surname: addUserForm.surname.value.trim(),
      role: addUserForm.role.value,
      email: addUserForm.email.value.trim(),
      password: addUserForm.password.value,
      telephone: addUserForm.telephone.value.trim(),
    };

    if (
      !payload.firstName ||
      !payload.surname ||
      !payload.email ||
      !payload.password ||
      !payload.telephone
    ) {
      notify("Please complete all user fields before saving.", "error");
      return;
    }

    addUserForm.dataset.submitting = "true";
    setSubmitting(addUserForm, true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await readResponse(response, "Unable to create user.");

      addUserForm.reset();
      notify("User created successfully.");
      await loadUsers();
    } catch (error) {
      console.error(error);
      notify(error.message || "Unable to create user.", "error");
    } finally {
      delete addUserForm.dataset.submitting;
      setSubmitting(addUserForm, false);
    }
  });

  editUserForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (editUserForm.dataset.submitting === "true") return;
    const id = editUserForm.dataset.id;
    if (!id) {
      notify("Select a user to edit first.", "error");
      return;
    }

    const payload = {
      firstName: editUserForm.firstName.value.trim(),
      surname: editUserForm.surname.value.trim(),
      role: editUserForm.role.value,
      telephone: editUserForm.telephone.value.trim(),
    };

    editUserForm.dataset.submitting = "true";
    setSubmitting(editUserForm, true);
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await readResponse(response, "Unable to update user.");

      editUserForm.reset();
      delete editUserForm.dataset.id;
      notify("User updated successfully.");
      await loadUsers();
    } catch (error) {
      console.error(error);
      notify(error.message || "Unable to update user.", "error");
    } finally {
      delete editUserForm.dataset.submitting;
      setSubmitting(editUserForm, false);
    }
  });

  document.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const id = target.dataset.id;
    const action = target.dataset.action;

    if (action === "delete-user") {
      if (!window.confirm("Delete this user account? This cannot be undone.")) {
        return;
      }
      target.disabled = true;
      try {
        const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
        await readResponse(response, "Unable to delete user.");
        notify("User deleted successfully.");
        await loadUsers();
      } catch (error) {
        console.error(error);
        notify(error.message || "Unable to delete user.", "error");
      } finally {
        target.disabled = false;
      }
      return;
    }

    if (action === "edit-user") {
      try {
        const response = await fetch(`/api/users/${id}`);
        const user = await readResponse(
          response,
          "Unable to load user details.",
        );
        editUserForm.dataset.id = id;
        editUserForm.firstName.value = user.firstName || "";
        editUserForm.surname.value = user.surname || "";
        editUserForm.role.value = user.role || "Technician";
        editUserForm.telephone.value = user.telephone || "";
        editUserForm.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (error) {
        console.error(error);
        notify("Unable to load user details.", "error");
      }
    }
  });

  await loadUsers();
});
