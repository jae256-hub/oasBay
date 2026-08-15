document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const messages = document.getElementById("messages");

  function show(msg, isError = false) {
    messages.textContent = msg;
    messages.style.color = isError ? "red" : "green";
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    try {
      const res = await fetch("/customerLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw json;
      show(json.message || "Logged in successfully");
      setTimeout(() => {
        window.location.href = "/customerDashboard";
      }, 600);
    } catch (err) {
      show(
        err.error ||
          (err.errors && err.errors.map((e) => e.msg).join(", ")) ||
          "Login failed",
        true,
      );
    }
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(signupForm).entries());
    try {
      const res = await fetch("/customerSignUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw json;
      show(json.message || "Account created");
      signupForm.reset();
    } catch (err) {
      show(
        err.error ||
          (err.errors && err.errors.map((e) => e.msg).join(", ")) ||
          "Signup failed",
        true,
      );
    }
  });
});
