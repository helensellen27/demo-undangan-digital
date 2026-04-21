(function attachWeddingAdminApi(global) {
  function createAdminApiClient(options = {}) {
    const getApiUrl = typeof options.getApiUrl === "function"
      ? options.getApiUrl
      : () => options.rsvpApiUrl;

    function getValidApiUrl() {
      const rsvpApiUrl = String(getApiUrl() || "").trim();
      if (!rsvpApiUrl || rsvpApiUrl.includes("PASTE_WEB_APP_URL")) {
        throw new Error("Isi RSVP_API_URL di config.js terlebih dahulu");
      }
      return rsvpApiUrl;
    }

    async function postApi(payload) {
      const response = await fetch(getValidApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Request gagal");
      }

      return result;
    }

    async function getConfig() {
      const url = new URL(getValidApiUrl());
      url.searchParams.set("action", "config");
      url.searchParams.set("_ts", String(Date.now()));
      const response = await fetch(url.toString(), { cache: "no-store" });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Gagal memuat config");
      }
      return result.config || {};
    }

    return {
      getValidApiUrl,
      postApi,
      getConfig
    };
  }

  global.WeddingAdminApi = {
    createAdminApiClient
  };
})(window);
