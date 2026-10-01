document.addEventListener("DOMContentLoaded", () => {
  const root = document.body;
  if (root.classList.contains("home-page")) {
    document.querySelectorAll(".glass-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.href = "/login";
      });
    });
  }
});
