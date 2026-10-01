document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username")?.value?.trim() || "";
    const password = document.getElementById("password")?.value?.trim() || "";

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: username, password }),
      });

      const result = await response.json();
      if (response.ok) {
        window.location.href = result.redirect || "/technicianDashboard";
      } else {
        alert(result.error || "Login failed");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to log in right now.");
    }
  });
});
