document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("customerLoginForm");
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const loginMessage = document.getElementById("loginMessage");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(input, errorEl, message) {
    input.classList.add("invalid");
    errorEl.textContent = message;
  }

  function clearFieldError(input, errorEl) {
    input.classList.remove("invalid");
    errorEl.textContent = "";
  }

  function validateLoginForm() {
    let isValid = true;

    clearFieldError(emailInput, emailError);
    clearFieldError(passwordInput, passwordError);

    if (!emailInput.value.trim()) {
      setFieldError(emailInput, emailError, "Email is required.");
      isValid = false;
    } else if (!emailPattern.test(emailInput.value.trim())) {
      setFieldError(
        emailInput,
        emailError,
        "Please enter a valid email address.",
      );
      isValid = false;
    }

    if (!passwordInput.value.trim()) {
      setFieldError(passwordInput, passwordError, "Password is required.");
      isValid = false;
    } else if (passwordInput.value.trim().length < 6) {
      setFieldError(
        passwordInput,
        passwordError,
        "Password must be at least 6 characters.",
      );
      isValid = false;
    }

    return isValid;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!validateLoginForm()) {
        loginMessage.textContent = "Please fix the highlighted fields.";
        loginMessage.className = "mt-3 text-center small text-danger";
        return;
      }

      const payload = {
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
      };

      try {
        const response = await fetch("/customerLogin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (response.ok) {
          loginMessage.textContent = result.message || "Login successful.";
          loginMessage.className = "mt-3 text-center small text-success";
          setTimeout(() => {
            window.location.href = "/customerDashboard";
          }, 700);
        } else {
          loginMessage.textContent =
            result.error || result.message || "Login failed.";
          loginMessage.className = "mt-3 text-center small text-danger";
        }
      } catch (error) {
        loginMessage.textContent =
          "Customer login failed. Please try again later.";
        loginMessage.className = "mt-3 text-center small text-danger";
      }
    });
  }

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
      loginMessage.textContent =
        "Google sign-in is ready for OAuth integration.";
      loginMessage.className = "mt-3 text-center small text-info";
    });
  }
});
