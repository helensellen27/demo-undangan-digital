(function attachWeddingAdminUi(global) {
  function createAdminUi(options = {}) {
    const toastRoot = options.toastRoot || null;

    function setStatus(el, message) {
      if (!el) return;
      el.textContent = message;
    }

    function showToast(title, message = "", type = "info") {
      if (!toastRoot) return;
      const toast = document.createElement("article");
      toast.className = `admin-toast is-${type}`;

      const titleEl = document.createElement("p");
      titleEl.className = "admin-toast-title";
      titleEl.textContent = title;
      toast.appendChild(titleEl);

      if (message) {
        const messageEl = document.createElement("p");
        messageEl.className = "admin-toast-message";
        messageEl.textContent = message;
        toast.appendChild(messageEl);
      }

      toastRoot.appendChild(toast);
      window.setTimeout(() => {
        toast.remove();
      }, 3600);
    }

    return {
      setStatus,
      showToast
    };
  }

  global.WeddingAdminUi = {
    createAdminUi
  };
})(window);
