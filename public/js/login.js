const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const emailInput = document.getElementById("emailOrPhone");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailOrPhone-error");
const passwordError = document.getElementById("password-error");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const telephonePattern = /^\+?[0-9\s-]{7,15}$/;

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

  const rawValue = emailInput.value.trim();
  if (!rawValue) {
    setFieldError(emailInput, emailError, "Email or phone number is required.");
    isValid = false;
  } else if (!emailPattern.test(rawValue) && !telephonePattern.test(rawValue)) {
    setFieldError(
      emailInput,
      emailError,
      "Enter a valid email or phone number.",
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
      emailOrPhone: emailInput.value.trim(),
      password: passwordInput.value.trim(),
    };

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        loginMessage.textContent = result.message || "Login successful.";
        loginMessage.className = "mt-3 text-center small text-success";
        setTimeout(() => {
          window.location.href = result.redirect || "/login";
        }, 700);
      } else {
        loginMessage.textContent =
          result.error || result.message || "Login failed.";
        loginMessage.className = "mt-3 text-center small text-danger";
      }
    } catch (error) {
      loginMessage.textContent = "Unable to login. Please try again later.";
      loginMessage.className = "mt-3 text-center small text-danger";
    }
  });
}
