// URL Web App Google Apps Script.
// Di Vercel, biarkan kosong dan isi environment variable RSVP_API_URL.
// Untuk mode static tanpa Vercel, isi manual di sini.
const RSVP_API_URL = "";
const RUNTIME_CONFIG_URL = "/api/runtime-config";
const PUBLIC_CONFIG_MODE = "";

// Pengaturan lokal khusus admin.
// Ganti ke domain Vercel/GitHub Pages baru setelah demo dideploy.
const ADMIN_CONFIG = {
  invitationBaseUrl: ""
};

// Data demo lengkap agar clone baru langsung tampil rapi walaupun backend belum aktif.
// Untuk produksi/client asli, konten utama tetap sebaiknya dikelola lewat admin + Apps Script.
const WEDDING_CONFIG = {
  invitationBaseUrl: "",
  brandInitials: "A & F",
  seoTitle: "Undangan Pernikahan Alya & Fajar",
  seoDescription: "Dengan bahagia kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberi doa restu.",
  heroOverline: "Wedding Invitation",
  themeName: "rose",
  brideShortName: "Alya",
  groomShortName: "Fajar",
  brideFullName: "Alya Putri Ramadhani",
  groomFullName: "Fajar Maulana Pratama",
  brideParents: "Putri dari Bapak Ahmad & Ibu Nurhayati",
  groomParents: "Putra dari Bapak Hadi & Ibu Siti Aminah",
  heroDatePlace: "Minggu, 20 Desember 2026 - Surabaya",
  heroBackgroundPhoto: "assets/photos/demo-photo-1.jpg",
  footerNames: "Alya & Fajar",
  weddingDateISO: "2026-12-20T08:00:00+07:00",
  eventStartISO: "2026-12-20T08:00:00+07:00",
  quranVerseArabic: "&#x648;&#x64E;&#x645;&#x650;&#x646;&#x652; &#x622;&#x64A;&#x64E;&#x627;&#x62A;&#x650;&#x647;&#x650; &#x623;&#x64E;&#x646;&#x652; &#x62E;&#x64E;&#x644;&#x64E;&#x642;&#x64E; &#x644;&#x64E;&#x643;&#x64F;&#x645;&#x652; &#x645;&#x650;&#x646;&#x652; &#x623;&#x64E;&#x646;&#x652;&#x641;&#x64F;&#x633;&#x650;&#x643;&#x64F;&#x645;&#x652; &#x623;&#x64E;&#x632;&#x652;&#x648;&#x64E;&#x627;&#x62C;&#x64B;&#x627; &#x644;&#x650;&#x62A;&#x64E;&#x633;&#x652;&#x643;&#x64F;&#x646;&#x64F;&#x648;&#x627; &#x625;&#x650;&#x644;&#x64E;&#x64A;&#x652;&#x647;&#x64E;&#x627; &#x648;&#x64E;&#x62C;&#x64E;&#x639;&#x64E;&#x644;&#x64E; &#x628;&#x64E;&#x64A;&#x652;&#x646;&#x64E;&#x643;&#x64F;&#x645;&#x652; &#x645;&#x64E;&#x648;&#x64E;&#x62F;&#x64E;&#x651;&#x629;&#x64B; &#x648;&#x64E;&#x631;&#x64E;&#x62D;&#x652;&#x645;&#x64E;&#x629;&#x64B;",
  quranVerseTranslation: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri supaya kamu merasa tenteram kepadanya.",
  quranVerseReference: "QS. Ar-Rum: 21",
  hadithText: "\"Sebaik-baik kalian adalah yang paling baik kepada keluarganya.\"",
  hadithReference: "HR. Tirmidzi",
  marriageDoaText: "\"Barakallahu laka, wa baraka 'alaika, wa jama'a bainakuma fii khair.\"",
  marriageDoaReference: "Semoga Allah memberkahimu dan mengumpulkan kalian berdua dalam kebaikan.",
  backgroundMusicUrl: "assets/music/akad-payung-teduh.mp3",
  musicPlaybackMode: "ordered",
  musicPlaylist: [
    {
      id: "demo-track-1",
      title: "Musik Demo",
      url: "assets/music/akad-payung-teduh.mp3",
      isActive: true
    }
  ],
  musicStartSec: "",
  musicLoopStartSec: "",
  musicLoopEndSec: "",
  akad: {
    date: "Minggu, 20 Desember 2026",
    time: "08.00 WIB",
    venue: "Masjid Al-Ikhlas, Surabaya",
    mapUrl: "https://maps.google.com"
  },
  resepsi: {
    date: "Minggu, 20 Desember 2026",
    time: "11.00 - 14.00 WIB",
    venue: "Graha Puspita, Surabaya",
    mapUrl: "https://maps.google.com"
  },
  loveStoryPhotos: [
    "assets/photos/demo-photo-1.jpg",
    "assets/photos/demo-photo-2.jpg",
    "assets/photos/demo-photo-3.jpg"
  ],
  loveStoryItems: [
    {
      date: "2021",
      title: "Pertama Bertemu",
      photo: "assets/photos/demo-photo-1.jpg",
      description: "Kami bertemu dalam sebuah kegiatan komunitas dan mulai saling mengenal lebih dekat."
    },
    {
      date: "2023",
      title: "Lamaran",
      photo: "assets/photos/demo-photo-2.jpg",
      description: "Dengan restu keluarga, kami melangkah ke tahap yang lebih serius."
    },
    {
      date: "2026",
      title: "Hari Pernikahan",
      photo: "assets/photos/demo-photo-3.jpg",
      description: "InsyaAllah kami memulai perjalanan rumah tangga dengan penuh doa dan harapan."
    }
  ],
  galleryPhotos: [
    "assets/photos/demo-photo-1.jpg",
    "assets/photos/demo-photo-2.jpg",
    "assets/photos/demo-photo-3.jpg",
    "assets/photos/demo-photo-4.jpg",
    "assets/photos/demo-photo-5.jpg",
    "assets/photos/demo-photo-6.jpg"
  ],
  galleryPhotoFocus: {},
  galleryMode: "grid",
  galleryMaxItems: "",
  galleryAutoplaySec: "3.5",
  galleryStyle: "elegant",
  giftEnabled: true,
  giftSectionTitle: "Wedding Gift",
  giftSectionSubtitle: "Doa restu Anda adalah hadiah terindah. Jika berkenan, Anda dapat mengirimkan tanda kasih melalui rekening berikut.",
  giftAccounts: [
    {
      type: "bank",
      providerCode: "bca",
      providerName: "BCA",
      accountNumber: "1234567890",
      accountHolder: "Alya Putri Ramadhani",
      logoUrl: "assets/bank/bca.svg",
      isActive: true
    },
    {
      type: "ewallet",
      providerCode: "dana",
      providerName: "DANA",
      accountNumber: "081234567890",
      accountHolder: "Fajar Maulana Pratama",
      logoUrl: "assets/ewallet/dana.svg",
      isActive: true
    }
  ]
};

window.RSVP_API_URL = RSVP_API_URL;
window.RUNTIME_CONFIG_URL = RUNTIME_CONFIG_URL;
window.PUBLIC_CONFIG_MODE = PUBLIC_CONFIG_MODE;
window.ADMIN_CONFIG = ADMIN_CONFIG;
window.WEDDING_CONFIG = WEDDING_CONFIG;

window.RUNTIME_CONFIG_PROMISE = (async () => {
  const canFetchRuntime = typeof fetch === "function"
    && typeof window !== "undefined"
    && window.location
    && /^https?:$/i.test(window.location.protocol);

  if (!canFetchRuntime || !RUNTIME_CONFIG_URL) return null;

  try {
    const response = await fetch(RUNTIME_CONFIG_URL, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result || !result.success) return null;

    if (result.rsvpApiUrl) window.RSVP_API_URL = String(result.rsvpApiUrl).trim();
    if (result.publicConfigMode) window.PUBLIC_CONFIG_MODE = String(result.publicConfigMode).trim();
    if (result.invitationBaseUrl) {
      const invitationBaseUrl = String(result.invitationBaseUrl).trim();
      window.ADMIN_CONFIG = {
        ...(window.ADMIN_CONFIG || {}),
        invitationBaseUrl
      };
      window.WEDDING_CONFIG = {
        ...(window.WEDDING_CONFIG || {}),
        invitationBaseUrl
      };
    }

    return result;
  } catch (error) {
    return null;
  }
})();
