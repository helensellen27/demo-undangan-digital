(function attachWeddingAdminNavigation(global) {
  function createAdminSectionNavigator(options = {}) {
    const tabs = Array.from(options.tabs || []);
    const sections = Array.from(options.sections || []);
    const onChange = typeof options.onChange === "function" ? options.onChange : null;

    function setActive(targetId) {
      const safeTarget = String(targetId || "").trim();
      if (!safeTarget) return;

      tabs.forEach((button) => {
        const isActive = button.dataset.target === safeTarget;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      sections.forEach((section) => {
        const isActive = section.id === safeTarget;
        section.hidden = !isActive;
        section.classList.toggle("is-active", isActive);
      });

      if (onChange) onChange(safeTarget);
    }

    function getActiveId() {
      const activeTab = tabs.find((button) => button.classList.contains("is-active"));
      return activeTab ? String(activeTab.dataset.target || "") : "";
    }

    tabs.forEach((button) => {
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", button.classList.contains("is-active") ? "true" : "false");
      button.addEventListener("click", () => setActive(button.dataset.target));
    });

    const initialTarget = getActiveId() || (tabs[0] && tabs[0].dataset.target);
    if (initialTarget) setActive(initialTarget);

    return {
      getActiveId,
      setActive
    };
  }

  global.WeddingAdminNavigation = {
    createAdminSectionNavigator
  };
})(window);
