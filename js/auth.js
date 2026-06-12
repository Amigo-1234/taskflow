const AUTH_SCREENS = {
  splash: "./pages/splash.html",
  welcome: "./pages/welcome.html",
  login: "./pages/login.html",
  register: "./pages/register.html",
  "forgot-password": "./pages/forgot-password.html",
  "verify-email": "./pages/verify-email.html",
};

document.addEventListener("DOMContentLoaded", async () => {
  await loadScreen("splash");
  wireGlobalNavigation();
});

/**
 * Load a screen partial into the main container and activate transitions
 */
async function loadScreen(screen) {
  const container = document.querySelector(".auth-main .auth-screen");
  if (!container) return;

  if (!AUTH_SCREENS[screen]) {
    console.error(`Unknown auth screen: ${screen}`);
    return;
  }

  try {
    const response = await fetch(AUTH_SCREENS[screen]);
    const html = await response.text();
    container.innerHTML = html.trim();
    container.dataset.screen = screen;

    // Trigger transition
    requestAnimationFrame(() => {
      container.classList.add("auth-screen--active");
    });

    // Wire screen-specific interactions
    initScreen(screen);
  } catch (err) {
    console.error("Failed to load auth screen:", err);
    showFeedbackOverlay({
      type: "error",
      title: "Something went wrong",
      message: "We couldn't load this screen. Please try again.",
      primaryActionLabel: "Retry",
      onPrimary: () => loadScreen(screen),
    });
  }
}

/**
 * Attach delegated navigation handlers (links/buttons with data-auth-target)
 */
function wireGlobalNavigation() {
  document.body.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-auth-target]");
    if (!trigger) return;

    const target = trigger.getAttribute("data-auth-target");
    if (!target) return;

    event.preventDefault();
    navigateTo(target);
  });

  // Button ripple effect
  document.body.addEventListener("pointerdown", (event) => {
    const btn = event.target.closest(".btn");
    if (!btn) return;
    btn.classList.add("btn--ripple-active");
    setTimeout(() => {
      btn.classList.remove("btn--ripple-active");
    }, 220);
  });
}

function navigateTo(screen) {
  const container = document.querySelector(".auth-main .auth-screen");
  if (!container) return;

  container.classList.remove("auth-screen--active");
  setTimeout(() => loadScreen(screen), 180);
}

/**
 * Initialize per-screen logic
 */
function initScreen(screen) {
  if (screen === "splash") {
    initSplash();
  } else if (screen === "welcome") {
    // nothing special for now
  } else if (screen === "login") {
    initLogin();
  } else if (screen === "register") {
    initRegister();
  } else if (screen === "forgot-password") {
    initForgotPassword();
  } else if (screen === "verify-email") {
    initVerifyEmail();
  }
}

/* Splash logic: auto-forward after brief delay */
function initSplash() {
  setTimeout(() => {
    navigateTo("welcome");
  }, 2000);
}

/* Login */
function initLogin() {
  const form = document.querySelector("#login-form");
  const passwordField = document.querySelector("#login-password");
  const toggle = document.querySelector("#login-password-toggle");

  if (toggle && passwordField) {
    toggle.addEventListener("click", () => {
      const isPassword = passwordField.type === "password";
      passwordField.type = isPassword ? "text" : "password";
      toggle.textContent = isPassword ? "🙈" : "👁";
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      simulateAuthLoading({
        actionLabel: "Logging you in",
        onComplete: () => {
          showFeedbackOverlay({
            type: "success",
            title: "Welcome back 👋",
            message: "You're now signed in to TaskFlow.",
            primaryActionLabel: "Go to dashboard",
            onPrimary: () => {
              window.location.href = "./index.html";
            },
          });
        },
      });
    });
  }
}

/* Register */
function initRegister() {
  const form = document.querySelector("#register-form");
  const passwordField = document.querySelector("#register-password");
  const confirmField = document.querySelector("#register-confirm-password");
  const toggle = document.querySelector("#register-password-toggle");

  if (toggle && passwordField && confirmField) {
    toggle.addEventListener("click", () => {
      const showing = passwordField.type === "text";
      const newType = showing ? "password" : "text";
      passwordField.type = newType;
      confirmField.type = newType;
      toggle.textContent = showing ? "👁" : "🙈";
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (passwordField && confirmField && passwordField.value !== confirmField.value) {
        showFeedbackOverlay({
          type: "error",
          title: "Passwords don't match",
          message: "Please make sure both password fields are identical.",
          primaryActionLabel: "Try again",
          onPrimary: hideFeedbackOverlay,
        });
        return;
      }

      simulateAuthLoading({
        actionLabel: "Creating your account",
        onComplete: () => {
          navigateTo("verify-email");
        },
      });
    });
  }
}

/* Forgot Password */
function initForgotPassword() {
  const form = document.querySelector("#forgot-form");
  const success = document.querySelector(".forgot-success");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!success) return;
      success.classList.add("forgot-success--visible");
    });
  }
}

/* Verify Email */
function initVerifyEmail() {
  const resendBtn = document.querySelector("#verify-resend");
  if (resendBtn) {
    resendBtn.addEventListener("click", () => {
      showFeedbackOverlay({
        type: "success",
        title: "Email sent",
        message: "We've sent you another verification link.",
        primaryActionLabel: "Got it",
        onPrimary: hideFeedbackOverlay,
      });
    });
  }
}

/* Loading overlay helper */
function simulateAuthLoading({ actionLabel, onComplete }) {
  const overlay = document.getElementById("auth-loading-overlay");
  const loadingText = overlay?.querySelector(".overlay-subtitle");

  if (!overlay) return;

  if (loadingText && actionLabel) {
    loadingText.textContent = `${actionLabel} securely.`;
  }

  overlay.classList.add("auth-overlay--visible");

  const btn = document.activeElement?.closest(".btn");
  if (btn) {
    btn.classList.add("btn--loading");
  }

  setTimeout(() => {
    overlay.classList.remove("auth-overlay--visible");
    if (btn) {
      btn.classList.remove("btn--loading");
    }
    if (typeof onComplete === "function") {
      onComplete();
    }
  }, 1400);
}

/* Feedback overlay helpers */
function showFeedbackOverlay({
  type,
  title,
  message,
  primaryActionLabel,
  onPrimary,
}) {
  const overlay = document.getElementById("auth-feedback-overlay");
  if (!overlay) return;

  const titleEl = document.getElementById("feedback-title");
  const msgEl = document.getElementById("feedback-message");
  const primaryBtn = document.getElementById("feedback-primary-action");
  const successIcon = overlay.querySelector(".feedback-icon[data-state='success']");
  const errorIcon = overlay.querySelector(".feedback-icon--error");

  if (titleEl) titleEl.textContent = title || "";
  if (msgEl) msgEl.textContent = message || "";

  if (successIcon && errorIcon) {
    if (type === "error") {
      successIcon.style.display = "none";
      errorIcon.style.display = "inline-flex";
    } else {
      successIcon.style.display = "inline-flex";
      errorIcon.style.display = "none";
    }
  }

  overlay.classList.add("auth-overlay--visible");

  if (primaryBtn) {
    primaryBtn.textContent = primaryActionLabel || "Continue";

    const handler = () => {
      primaryBtn.removeEventListener("click", handler);
      if (typeof onPrimary === "function") {
        onPrimary();
      } else {
        hideFeedbackOverlay();
      }
    };

    primaryBtn.addEventListener("click", handler);
  }
}

function hideFeedbackOverlay() {
  const overlay = document.getElementById("auth-feedback-overlay");
  if (!overlay) return;
  overlay.classList.remove("auth-overlay--visible");
}