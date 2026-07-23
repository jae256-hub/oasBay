document.addEventListener("DOMContentLoaded", () => {
  const signUpForm = document.getElementById("customerSignUpForm");
  const signupMessage = document.getElementById("signupMessage");

  const firstNameInput = document.getElementById("firstName");
  const surnameInput = document.getElementById("surname");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const telephoneInput = document.getElementById("telephone");

  const firstNameError = document.getElementById("firstName-error");
  const surnameError = document.getElementById("surname-error");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const telephoneError = document.getElementById("telephone-error");

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

  function validateSignUpForm() {
    let isValid = true;

    clearFieldError(firstNameInput, firstNameError);
    clearFieldError(surnameInput, surnameError);
    clearFieldError(emailInput, emailError);
    clearFieldError(passwordInput, passwordError);
    clearFieldError(telephoneInput, telephoneError);

    if (!firstNameInput.value.trim()) {
      setFieldError(firstNameInput, firstNameError, "First name is required.");
      isValid = false;
    }

    if (!surnameInput.value.trim()) {
      setFieldError(surnameInput, surnameError, "Surname is required.");
      isValid = false;
    }

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

    if (!telephoneInput.value.trim()) {
      setFieldError(telephoneInput, telephoneError, "Telephone is required.");
      isValid = false;
    } else if (!telephonePattern.test(telephoneInput.value.trim())) {
      setFieldError(
        telephoneInput,
        telephoneError,
        "Please enter a valid telephone number.",
      );
      isValid = false;
    }

    return isValid;
  }

  if (signUpForm) {
    signUpForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!validateSignUpForm()) {
        signupMessage.textContent = "Please correct the highlighted fields.";
        signupMessage.className = "mt-3 text-center small text-danger";
        return;
      }

      const payload = {
        firstName: firstNameInput.value.trim(),
        surname: surnameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        telephone: telephoneInput.value.trim(),
      };

      try {
        const response = await fetch("/customerSignUp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (response.ok) {
          signupMessage.textContent =
            result.message || "Account created successfully.";
          signupMessage.className = "mt-3 text-center small text-success";
          signUpForm.reset();
        } else {
          signupMessage.textContent =
            result.error || result.message || "Signup failed.";
          signupMessage.className = "mt-3 text-center small text-danger";
        }
      } catch (error) {
        signupMessage.textContent =
          "Customer signup failed. Please try again later.";
        signupMessage.className = "mt-3 text-center small text-danger";
      }
    });
  }
});
