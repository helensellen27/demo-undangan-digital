(function attachWeddingRsvpAdminModule(global) {
  function createRsvpAdminModule(options = {}) {
    const {
      elements,
      getAdminKeyOrThrow,
      setStatus,
      postApi,
      rsvpApiUrl
    } = options;

    const state = {
      rows: [],
      paging: {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1
      },
      fullMode: true
    };

    function formatDateTime(value) {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      try {
        return new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }).format(date);
      } catch (error) {
        return String(value);
      }
    }

    function renderRsvpMeta() {
      if (!elements.rsvpPageInfo) return;
      elements.rsvpPageInfo.textContent = `Halaman ${state.paging.page} / ${state.paging.totalPages} (${state.paging.total} RSVP)`;
      if (elements.btnRsvpPrev) elements.btnRsvpPrev.disabled = state.paging.page <= 1;
      if (elements.btnRsvpNext) elements.btnRsvpNext.disabled = state.paging.page >= state.paging.totalPages;
    }

    async function deleteRsvpByRow(rowNumber) {
      try {
        if (!state.fullMode) {
          throw new Error("Hapus RSVP butuh update Code.gs terbaru terlebih dahulu");
        }
        const adminKey = getAdminKeyOrThrow();
        if (!window.confirm("Hapus data RSVP ini?")) return;

        setStatus(elements.statusRsvps, "Menghapus RSVP...");
        await postApi({
          action: "deleteRsvp",
          adminKey,
          rowNumber
        });

        setStatus(elements.statusRsvps, "RSVP berhasil dihapus");
        await loadRsvps();
      } catch (error) {
        setStatus(elements.statusRsvps, `Error: ${error.message}`);
      }
    }

    function renderRsvpTable(rows) {
      if (!elements.rsvpTableBody) return;
      elements.rsvpTableBody.innerHTML = "";

      if (!rows.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.textContent = "Belum ada data RSVP.";
        row.appendChild(cell);
        elements.rsvpTableBody.appendChild(row);
        return;
      }

      rows.forEach((item) => {
        const row = document.createElement("tr");

        const waktuCell = document.createElement("td");
        waktuCell.textContent = formatDateTime(item.waktu);

        const codeCell = document.createElement("td");
        codeCell.textContent = item.guestCode || "-";

        const typeCell = document.createElement("td");
        typeCell.textContent = item.inviteType === "group" ? "GROUP" : "PERSONAL";

        const namaCell = document.createElement("td");
        namaCell.textContent = item.nama || "-";

        const jumlahCell = document.createElement("td");
        jumlahCell.textContent = String(item.jumlah || 0);

        const kehadiranCell = document.createElement("td");
        kehadiranCell.textContent = item.kehadiran || "-";

        const ucapanCell = document.createElement("td");
        ucapanCell.textContent = item.ucapan || "-";

        const actionCell = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn-mini";
        deleteBtn.textContent = state.fullMode ? "Hapus" : "Read Only";
        deleteBtn.disabled = !state.fullMode;
        if (state.fullMode) {
          deleteBtn.addEventListener("click", () => deleteRsvpByRow(item.rowNumber));
        }
        actionCell.appendChild(deleteBtn);

        row.appendChild(waktuCell);
        row.appendChild(codeCell);
        row.appendChild(typeCell);
        row.appendChild(namaCell);
        row.appendChild(jumlahCell);
        row.appendChild(kehadiranCell);
        row.appendChild(ucapanCell);
        row.appendChild(actionCell);
        elements.rsvpTableBody.appendChild(row);
      });
    }

    function refreshViews() {
      renderRsvpTable(state.rows);
      renderRsvpMeta();
    }

    async function loadRsvps() {
      try {
        state.fullMode = true;
        const adminKey = getAdminKeyOrThrow();
        setStatus(elements.statusRsvps, "Memuat RSVP...");

        const result = await postApi({
          action: "listRsvps",
          adminKey,
          search: String((elements.rsvpSearch && elements.rsvpSearch.value) || "").trim(),
          kehadiran: String((elements.rsvpKehadiranFilter && elements.rsvpKehadiranFilter.value) || "all").trim(),
          page: state.paging.page,
          pageSize: Number((elements.rsvpPageSize && elements.rsvpPageSize.value) || state.paging.pageSize || 20)
        });

        state.rows = Array.isArray(result.rsvps) ? result.rsvps : [];
        state.paging.total = Number(result.total || state.rows.length);
        state.paging.page = Number(result.page || 1);
        state.paging.pageSize = Number(result.pageSize || state.paging.pageSize || 20);
        state.paging.totalPages = Number(result.totalPages || 1);
        refreshViews();
        setStatus(elements.statusRsvps, `Berhasil memuat ${state.rows.length} data RSVP (total ${state.paging.total})`);
      } catch (error) {
        try {
          const fallbackUrl = new URL(rsvpApiUrl);
          fallbackUrl.searchParams.set("action", "wishes");
          fallbackUrl.searchParams.set("limit", String(Number((elements.rsvpPageSize && elements.rsvpPageSize.value) || 20)));
          fallbackUrl.searchParams.set("_ts", String(Date.now()));

          const response = await fetch(fallbackUrl.toString(), { cache: "no-store" });
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal memuat fallback ucapan");
          }

          state.rows = (result.wishes || []).map((item, index) => ({
            rowNumber: index + 2,
            waktu: item.waktu,
            guestCode: item.guestCode || "",
            inviteType: item.inviteType || "personal",
            nama: item.nama,
            jumlah: "-",
            kehadiran: item.kehadiran || "-",
            ucapan: item.ucapan || "-"
          }));
          state.paging.total = state.rows.length;
          state.paging.page = 1;
          state.paging.totalPages = 1;
          state.fullMode = false;
          refreshViews();
          setStatus(elements.statusRsvps, "Mode fallback aktif: menampilkan data ucapan. Update Code.gs untuk manajemen RSVP penuh.");
        } catch (fallbackError) {
          setStatus(elements.statusRsvps, `Error: ${error.message}`);
        }
      }
    }

    function setPage(nextPage) {
      state.paging.page = Math.max(1, Number(nextPage || 1));
    }

    function getPage() {
      return state.paging.page;
    }

    function getTotalPages() {
      return state.paging.totalPages || 1;
    }

    return {
      loadRsvps,
      refreshViews,
      setPage,
      getPage,
      getTotalPages
    };
  }

  global.WeddingRsvpAdminModule = {
    createRsvpAdminModule
  };
}(window));
