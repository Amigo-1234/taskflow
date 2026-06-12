/**
 * App bootstrap
 * removed eager DOM queries to support dynamic page loading
 */
document.addEventListener("DOMContentLoaded", async () => {
  await loadPageContent();
  initNavigation();
  initTaskFiltering();
});

async function loadPageContent() {
  const pageSources = {
    home: "./pages/home.html",
    tasks: "./pages/tasks.html",
    wallet: "./pages/wallet.html",
    profile: "./pages/profile.html",
  };

  await Promise.all(
    Object.entries(pageSources).map(async ([pageKey, url]) => {
      const container = document.querySelector(`.page[data-page="${pageKey}"]`);
      if (!container) return;

      try {
        const response = await fetch(url);
        const html = await response.text();
        container.innerHTML = html.trim();
      } catch (error) {
        console.error(`Failed to load content for "${pageKey}" from ${url}`, error);
      }
    })
  );
}

function initNavigation() {
  const pages = document.querySelectorAll(".page");
  const bottomNavItems = document.querySelectorAll(".bottom-nav__item");

  function setActivePage(target) {
    pages.forEach((page) => {
      if (page.dataset.page === target) {
        page.classList.add("page--active");
      } else {
        page.classList.remove("page--active");
      }
    });

    bottomNavItems.forEach((item) => {
      const itemTarget = item.dataset.target;
      if (itemTarget === target || (!itemTarget && target === "home")) {
        item.classList.add("bottom-nav__item--active");
      } else if (item.dataset.target) {
        item.classList.toggle(
          "bottom-nav__item--active",
          item.dataset.target === target
        );
      } else {
        item.classList.remove("bottom-nav__item--active");
      }
    });
  }

  bottomNavItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetPage = item.dataset.target || "home";
      const scrollTo = item.dataset.scroll;

      setActivePage(targetPage);

      if (scrollTo === "tasks") {
        const page = document.querySelector('[data-page="home"]');
        const tasksSection = page?.querySelector(".tasks-section");
        if (tasksSection) {
          tasksSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
}

function initTaskFiltering() {
  const categoryButtons = document.querySelectorAll(".task-category");
  const taskCards = document.querySelectorAll(".task-card");

  if (!categoryButtons.length || !taskCards.length) {
    // removed direct assumption that task elements always exist
    return;
  }

  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;

      categoryButtons.forEach((b) =>
        b.classList.toggle("task-category--active", b === btn)
      );

      taskCards.forEach((card) => {
        const cardCat = card.dataset.category;
        const isVisible = category === "all" || cardCat === category;
        card.style.display = isVisible ? "flex" : "none";
      });
    });
  });
}