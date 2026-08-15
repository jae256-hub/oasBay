document.addEventListener("DOMContentLoaded", async () => {
  const usersTableBody = document.getElementById("usersTableBody");
  const userCount = document.getElementById("userCount");
  const adminCount = document.getElementById("adminCount");
  const techCount = document.getElementById("techCount");
  const addUserForm = document.getElementById("addUserForm");
  const editUserForm = document.getElementById("editUserForm");

  if (!usersTableBody) return;

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
      return;
    }

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      addUserForm.reset();
      await loadUsers();
    }
  });

  editUserForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = editUserForm.dataset.id;
    if (!id) return;

    const payload = {
      firstName: editUserForm.firstName.value.trim(),
      surname: editUserForm.surname.value.trim(),
      role: editUserForm.role.value,
      telephone: editUserForm.telephone.value.trim(),
    };

    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    editUserForm.reset();
    delete editUserForm.dataset.id;
    await loadUsers();
  });

  document.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const id = target.dataset.id;
    const action = target.dataset.action;

    if (action === "delete-user") {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      await loadUsers();
      return;
    }

    if (action === "edit-user") {
      const response = await fetch(`/api/users/${id}`);
      const user = await response.json();
      if (!user) return;
      editUserForm.dataset.id = id;
      editUserForm.firstName.value = user.firstName || "";
      editUserForm.surname.value = user.surname || "";
      editUserForm.role.value = user.role || "Technician";
      editUserForm.telephone.value = user.telephone || "";
      editUserForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  await loadUsers();
});
