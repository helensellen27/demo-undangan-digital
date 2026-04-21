(function attachWeddingGuestAdminModule(global) {
  function createGuestAdminModule(options = {}) {
    const {
      elements,
      getAdminKeyOrThrow,
      setStatus,
      postApi,
      normalizeBaseUrl
    } = options;

    const state = {
      guests: [],
      paging: {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        groups: [],
        statuses: ["active", "vip", "disabled"]
      }
    };

    function normalizeInviteType(value) {
      return String(value || "").trim().toLowerCase() === "group" ? "group" : "personal";
    }

    function parseGuestInput() {
      return elements.guestInput.value
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split("|").map((part) => part.trim());
          const rawType = parts[3] || "";
          const inviteType = normalizeInviteType(rawType);
          const notes = rawType && !["group", "personal"].includes(rawType.toLowerCase())
            ? rawType
            : (parts[4] || "");
          return {
            name: parts[0] || "",
            group: parts[1] || "Umum",
            phone: parts[2] || "",
            inviteType,
            notes,
            status: "active"
          };
        })
        .filter((item) => item.name);
    }

    function buildGuestLink(baseUrl, guest) {
      const safeBase = normalizeBaseUrl(baseUrl);
      if (!safeBase) return "";
      const url = new URL(safeBase, window.location.origin);
      const guestName = String(guest && guest.name || "").trim();
      const guestCode = String(guest && guest.code || "").trim();
      const inviteType = normalizeInviteType(guest && guest.inviteType);
      if (guestName) url.searchParams.set("to", guestName);
      if (guestCode) url.searchParams.set("guest", guestCode);
      if (inviteType === "group") url.searchParams.set("type", "group");
      return url.toString();
    }

    function toCsvCell(value) {
      const text = String(value || "");
      return `"${text.replace(/"/g, "\"\"")}"`;
    }

    function renderGuestLinks(guests) {
      const baseUrl = normalizeBaseUrl(elements.invitationBaseUrlInput.value);
      if (!baseUrl) {
        elements.guestLinks.value = "Isi Base URL Undangan terlebih dahulu.";
        return;
      }

      elements.guestLinks.value = guests
        .map((guest) => `${guest.name} => ${buildGuestLink(baseUrl, guest)}`)
        .join("\n");
    }

    function renderGuestMeta() {
      if (elements.guestPageInfo) {
        elements.guestPageInfo.textContent = `Halaman ${state.paging.page} / ${state.paging.totalPages} (${state.paging.total} tamu)`;
      }

      if (elements.btnGuestPrev) elements.btnGuestPrev.disabled = state.paging.page <= 1;
      if (elements.btnGuestNext) elements.btnGuestNext.disabled = state.paging.page >= state.paging.totalPages;
    }

    function renderGuestFilterOptions() {
      if (!elements.guestGroupFilter) return;
      const current = elements.guestGroupFilter.value || "all";
      const groups = Array.isArray(state.paging.groups) ? state.paging.groups : [];
      elements.guestGroupFilter.innerHTML = `<option value="all">Semua Group</option>${groups.map((group) => `<option value="${group}">${group}</option>`).join("")}`;
      elements.guestGroupFilter.value = groups.includes(current) ? current : "all";
    }

    async function updateGuestName(code, payload) {
      try {
        const adminKey = getAdminKeyOrThrow();
        const cleanName = String((payload && payload.name) || "").trim();
        if (!cleanName) throw new Error("Nama tamu tidak boleh kosong");

        setStatus(elements.statusGuests, "Menyimpan perubahan tamu...");
        await postApi({
          action: "updateGuest",
          adminKey,
          code,
          name: cleanName,
          group: String((payload && payload.group) || "Umum").trim() || "Umum",
          status: String((payload && payload.status) || "active").trim() || "active",
          inviteType: normalizeInviteType(payload && payload.inviteType),
          phone: String((payload && payload.phone) || "").trim(),
          notes: String((payload && payload.notes) || "").trim()
        });
        setStatus(elements.statusGuests, "Data tamu berhasil diperbarui");
        await loadGuests();
      } catch (error) {
        setStatus(elements.statusGuests, `Error: ${error.message}`);
      }
    }

    async function deleteGuestByCode(code) {
      try {
        const adminKey = getAdminKeyOrThrow();
        if (!window.confirm("Hapus tamu ini?")) return;

        setStatus(elements.statusGuests, "Menghapus tamu...");
        await postApi({
          action: "deleteGuest",
          adminKey,
          code
        });
        setStatus(elements.statusGuests, "Tamu berhasil dihapus");
        await loadGuests();
      } catch (error) {
        setStatus(elements.statusGuests, `Error: ${error.message}`);
      }
    }

    function renderGuestTable(guests) {
      if (!elements.guestTableBody) return;

      elements.guestTableBody.innerHTML = "";
      if (!guests.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.textContent = "Belum ada data tamu.";
        row.appendChild(cell);
        elements.guestTableBody.appendChild(row);
        return;
      }

      const baseUrl = normalizeBaseUrl(elements.invitationBaseUrlInput.value);
      guests.forEach((guest) => {
        const row = document.createElement("tr");

        const codeCell = document.createElement("td");
        codeCell.textContent = guest.code || "-";

        const nameCell = document.createElement("td");
        const nameInput = document.createElement("input");
        nameInput.className = "guest-name-input";
        nameInput.type = "text";
        nameInput.value = guest.name || "";
        nameCell.appendChild(nameInput);

        const groupCell = document.createElement("td");
        const groupInput = document.createElement("input");
        groupInput.className = "guest-inline-input";
        groupInput.type = "text";
        groupInput.value = guest.group || "Umum";
        groupCell.appendChild(groupInput);

        const typeCell = document.createElement("td");
        const typeSelect = document.createElement("select");
        typeSelect.className = "guest-inline-input";
        ["personal", "group"].forEach((inviteTypeValue) => {
          const option = document.createElement("option");
          option.value = inviteTypeValue;
          option.textContent = inviteTypeValue === "group" ? "GROUP" : "PERSONAL";
          if (normalizeInviteType(guest.inviteType) === inviteTypeValue) option.selected = true;
          typeSelect.appendChild(option);
        });
        typeCell.appendChild(typeSelect);

        const statusCell = document.createElement("td");
        const statusSelect = document.createElement("select");
        statusSelect.className = "guest-inline-input";
        ["active", "vip", "disabled"].forEach((statusValue) => {
          const option = document.createElement("option");
          option.value = statusValue;
          option.textContent = statusValue.toUpperCase();
          if ((guest.status || "active") === statusValue) option.selected = true;
          statusSelect.appendChild(option);
        });
        statusCell.appendChild(statusSelect);

        const phoneCell = document.createElement("td");
        const phoneInput = document.createElement("input");
        phoneInput.className = "guest-inline-input";
        phoneInput.type = "text";
        phoneInput.value = guest.phone || "";
        phoneCell.appendChild(phoneInput);

        const linkCell = document.createElement("td");
        if (baseUrl && guest.name) {
          const link = document.createElement("a");
          link.className = "guest-link-mini";
          link.href = buildGuestLink(baseUrl, guest);
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "Buka Link";
          linkCell.appendChild(link);
        } else {
          linkCell.textContent = "-";
        }

        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "guest-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "btn-mini";
        saveBtn.textContent = "Simpan";
        saveBtn.addEventListener("click", () => updateGuestName(guest.code, {
          name: nameInput.value,
          group: groupInput.value,
          inviteType: typeSelect.value,
          status: statusSelect.value,
          phone: phoneInput.value
        }));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn-mini";
        deleteBtn.textContent = "Hapus";
        deleteBtn.addEventListener("click", () => deleteGuestByCode(guest.code));

        actions.appendChild(saveBtn);
        actions.appendChild(deleteBtn);
        actionCell.appendChild(actions);

        row.appendChild(codeCell);
        row.appendChild(nameCell);
        row.appendChild(groupCell);
        row.appendChild(typeCell);
        row.appendChild(statusCell);
        row.appendChild(phoneCell);
        row.appendChild(linkCell);
        row.appendChild(actionCell);
        elements.guestTableBody.appendChild(row);
      });
    }

    function refreshViews() {
      renderGuestTable(state.guests);
      renderGuestLinks(state.guests);
      renderGuestMeta();
    }

    function exportGuestsCsv() {
      const guests = [...state.guests];
      if (!guests.length) {
        setStatus(elements.statusGuests, "Belum ada data tamu untuk diexport.");
        return;
      }

      const baseUrl = normalizeBaseUrl(elements.invitationBaseUrlInput.value);
      const lines = [
        "code,nama,group,invite_type,status,telepon,link_undangan",
        ...guests.map((guest) => {
          const link = baseUrl ? buildGuestLink(baseUrl, guest) : "";
          return [
            toCsvCell(guest.code),
            toCsvCell(guest.name),
            toCsvCell(guest.group || "Umum"),
            toCsvCell(normalizeInviteType(guest.inviteType)),
            toCsvCell(guest.status || "active"),
            toCsvCell(guest.phone || ""),
            toCsvCell(link)
          ].join(",");
        })
      ];

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "daftar-tamu-undangan.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setStatus(elements.statusGuests, `CSV berhasil diexport (${guests.length} tamu).`);
    }

    async function importGuests() {
      try {
        const adminKey = getAdminKeyOrThrow();
        const guests = parseGuestInput();
        if (!guests.length) throw new Error("Daftar tamu kosong");

        setStatus(elements.statusGuests, "Mengimport tamu...");
        const result = await postApi({
          action: "importGuests",
          adminKey,
          guests
        });

        setStatus(elements.statusGuests, `${result.importedCount} tamu baru diimport. Total: ${result.totalGuests}`);
        await loadGuests();
      } catch (error) {
        setStatus(elements.statusGuests, `Error: ${error.message}`);
      }
    }

    async function loadGuests() {
      try {
        const adminKey = getAdminKeyOrThrow();

        setStatus(elements.statusGuests, "Memuat daftar tamu...");
        const result = await postApi({
          action: "listGuests",
          adminKey,
          search: String((elements.guestSearch && elements.guestSearch.value) || "").trim(),
          group: String((elements.guestGroupFilter && elements.guestGroupFilter.value) || "all").trim(),
          status: String((elements.guestStatusFilter && elements.guestStatusFilter.value) || "all").trim(),
          page: state.paging.page,
          pageSize: Number((elements.guestPageSize && elements.guestPageSize.value) || state.paging.pageSize || 20)
        });
        state.guests = Array.isArray(result.guests) ? result.guests : [];
        state.paging.total = Number(result.total || state.guests.length);
        state.paging.page = Number(result.page || 1);
        state.paging.pageSize = Number(result.pageSize || state.paging.pageSize || 20);
        state.paging.totalPages = Number(result.totalPages || 1);
        state.paging.groups = Array.isArray(result.groups) ? result.groups : [];
        state.paging.statuses = Array.isArray(result.statuses) ? result.statuses : state.paging.statuses;
        renderGuestFilterOptions();
        refreshViews();
        setStatus(elements.statusGuests, `Berhasil memuat ${state.guests.length} tamu (total ${state.paging.total})`);
      } catch (error) {
        setStatus(elements.statusGuests, `Error: ${error.message}`);
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
      loadGuests,
      importGuests,
      exportGuestsCsv,
      refreshViews,
      setPage,
      getPage,
      getTotalPages
    };
  }

  global.WeddingGuestAdminModule = {
    createGuestAdminModule
  };
}(window));
