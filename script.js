/* =====================================================
   MBG-KU v2 Demo — Guru + Siswa + Operator (static, localStorage)
   Baseline visual/layout dipertahankan. Versi ini menyiapkan
   data model yang lebih rapi untuk tahap Supabase selanjutnya.
   ===================================================== */
const KEY = "mbgku_v2_static_demo";
const SEKOLAH_LABEL = { SMK1: "SMK 1", SMK2: "SMK 2", SMP: "SMP" };
const SEK_FULL = { SMK1: "SMK 1 (SARADAN)", SMK2: "SMK 2 (AT-TAJIR)", SMP: "SMP (SULTAN)" };
const ROM = { X: 10, XI: 11, XII: 12, VII: 7, VIII: 8, IX: 9 };
const SEK_ORDER = ["SMK1", "SMK2", "SMP"];
const STATUS_META = {
  menunggu: { label: "Menunggu", cls: "status-menunggu" },
  tiba: { label: "Menunggu kedatangan", cls: "status-tiba" },
  selesai: { label: "Sudah ambil", cls: "status-selesai" },
};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let S, currentFilter = "semua", loginRole = "guru", curScreen = "landing", landingBusy = false;

// ---------- DATA ----------
function today(d = new Date()) { return d.toISOString().slice(0, 10); }
function nowTime() { const d = new Date(); return String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0"); }
function makeKode(k) {
  const p = String(k).trim().split(/\s+/);
  const grade = ROM[p[0]] || p[0] || "SMP";
  const major = p[1] || "SMP";
  const section = p.slice(2).join("");
  return String(major).toUpperCase() + grade + section;
}
function randKode() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 5 }, () => a[Math.floor(Math.random() * a.length)]).join(""); }
function seed() {
  const L = [];
  const grades = ["X", "XI", "XII"];
  ["DKV", "RPL", "TKJ"].forEach(j => grades.forEach(k => L.push(["SMK1", `${k} ${j}`])));
  ["X", "XI", "XII"].forEach(k => ["1", "2"].forEach(n => L.push(["SMK1", `${k} TKR ${n}`])));
  ["MPLB", "AKL"].forEach(j => grades.forEach(k => L.push(["SMK2", `${k} ${j}`])));
  [["SMP", "VII"], ["SMP", "VIII"], ["SMP", "IX"]].forEach(x => L.push(x));

  const classes = L.map(([sekolah, kelas], i) => ({
    id: i + 1, sekolah, kelas, aktif: true, kode: makeKode(kelas)
  }));
  const students = {}, daily = {}, y = today(new Date(Date.now() - 864e5));
  daily[y] = {};
  classes.forEach((c, i) => {
    // Master siswa sengaja kosong pada demo serius ini.
    // Operator/Guru dapat mengisinya sendiri melalui menu Siswa.
    students[c.id] = [];
    if (i === classes.findIndex(x => x.kelas === "XI RPL")) {
      daily[y][c.id] = { st: "tiba", ping: "08.10", names: [], jumlahSiswa: 0 };
    }
  });
  const rpl = classes.find(c => c.kelas === "XI RPL");
  return {
    version: 2,
    classes, students, daily, nid: 3, session: null, seen: {},
    users: [
      { u: "guru1", pass: "guru123", role: "guru", nama: "Pak Taufik Hidayat", sekolah: ["SMK1", "SMK2"] },
      { u: "guru2", pass: "guru123", role: "guru", nama: "Ibu Tati", sekolah: ["SMP"] },
      { u: "admin", pass: "admin123", role: "operator", nama: "Dzawkan Hanan", sekolah: [] },
    ],
    menu: { 1: "Nasi + Ayam + Sayur + Buah", 2: "Nasi + Telur + Tempe + Pisang", 3: "Nasi + Ikan + Sayur + Jeruk", 4: "Nasi + Ayam + Tahu + Pepaya", 5: "Nasi + Telur + Sayur + Susu", 6: "", 0: "" },
    ann: [{ id: 1, txt: "MBG hari ini bisa sedikit terlambat dari jadwal. Mohon tetap tunggu di kelas.", cid: null, date: y }],
    log: [
      { id: 1, date: y, time: "07.30", txt: "MBG hari ini aktif", sub: "Semua sekolah", color: "purple", cid: null },
      { id: 2, date: y, time: "08.10", txt: "MBG sudah dikirim ke XI RPL", sub: "SMK 1 · menunggu kedatangan", color: "blue", cid: rpl ? rpl.id : null },
    ],
  };
}
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || S.version !== 2 || !Array.isArray(S.classes) || !S.users) {
    S = seed();
    save();
    return;
  }
  // Normalisasi agar data demo lama dari v2 yang belum punya field baru tetap aman.
  S.classes.forEach(c => { if (!Array.isArray(S.students[c.id])) S.students[c.id] = []; });
  S.classes = S.classes.map(c => ({ ...c, aktif: c.aktif !== false }));
  Object.keys(S.daily || {}).forEach(d => Object.keys(S.daily[d] || {}).forEach(cid => {
    const r = S.daily[d][cid];
    if (!Array.isArray(r.names)) r.names = [];
    if (r.jumlahSiswa !== undefined && r.jumlahSiswa !== null) r.jumlahSiswa = Number(r.jumlahSiswa) || 0;
  }));
  S.users.forEach(u => { if (u.role === "guru" && u.u === "guru1") u.sekolah = ["SMK1", "SMK2"]; if (u.role === "guru" && u.u === "guru2") u.sekolah = ["SMP"]; });
  save();
}
const cls = id => S.classes.find(c => c.id == id);
const rec = (cid, d = today()) => (S.daily[d] && S.daily[d][cid]) || { st: "menunggu", names: [], jumlahSiswa: null };
function setRec(cid, r) { (S.daily[today()] = S.daily[today()] || {})[cid] = { ...r, names: Array.isArray(r.names) ? r.names : [] }; }
const user = () => S.session && S.users.find(u => u.u === S.session.u);
function classTotal(cid, r = rec(cid)) {
  const master = (S.students[cid] || []).length;
  if (r && r.jumlahSiswa !== undefined && r.jumlahSiswa !== null && Number.isFinite(Number(r.jumlahSiswa))) return Math.max(0, Number(r.jumlahSiswa));
  return master;
}
function myClasses() {
  const u = user(); if (!u) return [];
  if (u.role === "siswa") return [];
  return S.classes.filter(c => c.aktif && (u.role === "operator" || u.sekolah.includes(c.sekolah)));
}
function pushRiwayat(txt, sub, color, cid = null, op = false, snapshot = null) {
  const savedSnapshot = snapshot ? { ...snapshot, names: Array.isArray(snapshot.names) ? [...snapshot.names] : [] } : null;
  S.log.unshift({ id: S.nid++, date: today(), time: nowTime(), txt, sub, color, cid, op, snapshot: savedSnapshot });
  if (S.log.length > 200) S.log.pop();
  save(); renderAll();
}
function visibleLog() {
  const u = user(), s = S.session; if (!u) return [];
  if (u.role === "operator") return S.log;
  const mine = u.role === "siswa" ? [s.cid] : myClasses().map(c => c.id);
  return S.log.filter(l => !l.op && (l.cid == null || mine.includes(l.cid)));
}
function unread() { const k = S.session.u; return visibleLog().filter(l => l.id > (S.seen[k] || 0)).length; }
function showToast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(showToast._t); showToast._t = setTimeout(() => t.classList.add("hidden"), 2200);
}
function menuHariIni() { return (S.menu[new Date().getDay()] || "").split("+").map(s => s.trim()).filter(Boolean); }

// ---------- GURU: BERANDA ----------
function guruStats() {
  const mc = myClasses(), r = mc.map(c => rec(c.id));
  return { total: mc.length, selesai: r.filter(x => x.st === "selesai").length, tiba: r.filter(x => x.st === "tiba").length, menunggu: r.filter(x => x.st === "menunggu").length };
}
function renderStats() {
  const s = guruStats();
  $("stat-total").textContent = s.total; $("stat-selesai").textContent = s.selesai;
  $("stat-menunggu").textContent = s.tiba; $("stat-belum").textContent = s.menunggu;
  $("tanggal").textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function renderKelasList() {
  const wrap = $("kelas-groups"); wrap.innerHTML = "";
  const mc = myClasses();
  const list = (currentFilter === "semua" ? SEK_ORDER : [currentFilter]);
  list.forEach(sek => {
    const items = mc.filter(c => c.sekolah === sek); if (!items.length) return;
    const g = document.createElement("div"); g.className = "kelas-group";
    g.innerHTML = `<div class="kelas-group-header"><span>🏫 </span><span>${SEKOLAH_LABEL[sek]}</span><span class="count">${items.length} kelas</span></div><div class="kelas-grid"></div>`;
    items.forEach(c => {
      const r = rec(c.id), m = STATUS_META[r.st], total = classTotal(c.id, r);
      const note = r.st === "menunggu" ? `Belum ada ping · ${total} siswa` : r.st === "tiba" ? `Dikirim ${r.ping} · ${total} siswa` : `Diambil ${r.at} · ${r.names.length}/${total} siswa`;
      const b = document.createElement("button"); b.className = `kelas-card status-${r.st}`;
      b.innerHTML = `<div class="kelas-top"><div><h4>${esc(c.kelas)}</h4><div class="siswa">${total} siswa</div></div></div><span class="status-chip ${m.cls}">${m.label}</span><span class="time-note">${note}</span>`;
      b.onclick = () => kelasModal(c.id); g.querySelector(".kelas-grid").appendChild(b);
    });
    wrap.appendChild(g);
  });
  if (!wrap.innerHTML) wrap.innerHTML = '<p class="group-label">Belum ada kelas aktif untuk akunmu.</p>';
}
// ---------- GURU: LAPORAN ----------
function renderLaporan() {
  const mc = myClasses(); let tot = 0, sudah = 0, tiba = 0, menunggu = 0;
  mc.forEach(c => {
    const r = rec(c.id), n = classTotal(c.id, r);
    tot += n;
    if (r.st === "selesai") { sudah += r.names.length; menunggu += Math.max(0, n - r.names.length); }
    else if (r.st === "tiba") tiba += n;
    else menunggu += n;
  });
  $("rep-total").textContent = tot; $("rep-sudah").textContent = sudah; $("rep-menunggu").textContent = tiba; $("rep-belum").textContent = menunggu;
  const col = { green: "var(--green)", orange: "var(--orange)", red: "var(--red)", purple: "var(--purple)", blue: "#1f64c8" };
  const logs = visibleLog().slice(0, 30);
  $("riwayat-list").innerHTML = logs.map(r => `<button type="button" class="riwayat-item riwayat-item-button" data-report-log="${r.id}" aria-label="Lihat detail ${esc(r.txt)}"><span class="riwayat-dot" style="background:${col[r.color] || "var(--purple)"}"></span><span class="riwayat-body"><strong>${esc(r.txt)}</strong><span>${esc(r.sub)}</span></span><span class="riwayat-time">${r.date === today() ? r.time : r.date.slice(5) + " " + r.time}</span></button>`).join("") || '<p class="group-label">Belum ada riwayat.</p>';
  $("riwayat-list").querySelectorAll("[data-report-log]").forEach(row => {
    row.onclick = () => showReportDetail(Number(row.dataset.reportLog));
  });
}

// ---------- NOTIFIKASI ----------
const NOTIF_ICON = { green: { emoji: "✅", bg: "bg-green" }, orange: { emoji: "🕐", bg: "bg-orange" }, red: { emoji: "⚠️", bg: "bg-red" }, purple: { emoji: "📬", bg: "bg-purple" }, blue: { emoji: "🚚", bg: "bg-blue" } };
function renderNotifikasi() {
  const u = user(); if (!u) return;
  const k = S.session.u, seen = S.seen[k] || 0, all = visibleLog();
  const row = r => { const i = NOTIF_ICON[r.color] || NOTIF_ICON.purple; return `<div class="notif-item"><div class="notif-icon ${i.bg}">${i.emoji}</div><div class="notif-body"><strong>${esc(r.txt)}</strong><span>${esc(r.sub)}</span></div><div class="notif-right"><span class="time">${r.date === today() ? r.time : r.date.slice(5)}</span>${r.id > seen ? '<span class="unread-dot"></span>' : ""}</div></div>`; };
  $("notif-today").innerHTML = all.filter(r => r.date === today()).map(row).join("") || '<p class="group-label">Belum ada.</p>';
  $("notif-yesterday").innerHTML = all.filter(r => r.date !== today()).slice(0, 20).map(row).join("") || '<p class="group-label">Belum ada.</p>';
  const n = unread();
  document.querySelectorAll("#bell-badge,#nav-badge,#desktop-nav-badge").forEach(el => { el.textContent = n; el.classList.toggle("hidden", n === 0); });
}

// ---------- AKUN ----------
function renderAkun() {
  const u = user(), s = S.session; if (!u) return;
  const c = cls(s.cid);
  $("pf-av").textContent = (u.nama || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  $("pf-nama").textContent = u.role === "siswa" ? (c ? c.kelas : "Siswa") : u.nama;
  $("pf-role").textContent = { guru: "Guru", operator: "Admin / Operator", siswa: "Siswa" }[u.role];
  $("pf-sek").textContent = u.role === "siswa" ? (c ? SEK_FULL[c.sekolah] : "-") : u.role === "guru" ? u.sekolah.map(x => SEKOLAH_LABEL[x]).join(" & ") : "MBG-KU · Semua sekolah";
  const extra = u.role === "operator" ? '<button class="menu-item" id="m-reset">♻️ &nbsp;Reset Data Demo</button>' : "";
  $("m-extra") && $("m-extra").remove();
  const d = document.createElement("div"); d.id = "m-extra"; d.innerHTML = extra;
  document.querySelector("#screen-akun .menu-list").appendChild(d);
  if ($("m-reset")) $("m-reset").onclick = () => openM("Reset Data Demo", `<p>Semua perubahan lokal dihapus dan data demo dimuat kembali. Kamu akan keluar dari akun.</p><button class="btn-primary" id="m-save">Ya, reset</button>`, () => { localStorage.removeItem(KEY); S = seed(); save(); closeM(); go("landing"); showToast("Data demo direset"); });
}

// ---------- SISWA ----------
function head(t, s) { return `<div class="page-header"><div><h1>${t}</h1><p class="subtitle">${s}</p></div></div>`; }
function renderSiswa() {
  if (!user() || user().role !== "siswa") return;
  const c = cls(S.session.cid); if (!c) return;
  const r = rec(c.id), m = STATUS_META[r.st], total = classTotal(c.id, r);
  const wali = S.users.filter(x => x.role === "guru" && x.sekolah.includes(c.sekolah)).map(x => x.nama).join(", ") || "-";
  const info = r.st === "menunggu" ? "MBG belum dikirim" : r.st === "tiba" ? `MBG sudah dikirim · ${r.ping}` : `Tercatat mengambil · ${r.at}`;
  const dipilih = r.names.length ? `${r.names.length} / ${total} siswa sudah ambil` : "";
  const mn = menuHariIni(), anns = S.ann.filter(a => a.cid == null || a.cid == c.id);
  $("screen-sberanda").innerHTML = `<header class="hero"><div class="hero-top"><div><h1>Selamat datang 👋</h1><p class="subtitle">${esc(c.kelas)} · ${SEK_FULL[c.sekolah]}</p></div><button class="bell-btn" data-nav="notifikasi">🔔<span class="badge" id="bell-badge"></span></button></div></header>
  <div class="content"><h2 class="section-title">MBG Hari Ini</h2>
  <div class="banner"><div class="banner-icon">${r.st === "selesai" ? "✅" : r.st === "tiba" ? "🚚" : "⏳"}</div><div class="banner-text"><strong>${m.label}</strong><span>${info}</span></div></div>
  ${dipilih ? `<p class="group-label">${dipilih}</p>` : ""}
  <h2 class="section-title">Menu Hari Ini</h2><div class="report-card">${mn.length ? `<div class="menu-tags">${mn.map(x => `<span class="status-chip status-selesai">${esc(x)}</span>`).join("")}</div>` : "Tidak ada MBG hari ini."}</div>
  <h2 class="section-title">Informasi Kelas</h2><div class="report-card"><div class="report-row"><div><strong>${total}</strong><span>Jumlah siswa hari ini</span></div><div><strong style="font-size:15px">${esc(wali)}</strong><span>Guru pengelola</span></div></div></div>
  <h2 class="section-title">Pengumuman</h2>${anns.map(a => `<div class="notif-item"><div class="notif-icon bg-orange">📢</div><div class="notif-body"><strong>${esc(a.txt)}</strong><span>${a.cid ? "Kelas" : "Sekolah"} · ${a.date.slice(5)}</span></div></div>`).join("") || '<p class="group-label">Belum ada pengumuman.</p>'}</div>`;
  const days = Object.keys(S.daily || {})
    .filter(d => S.daily[d] && Object.prototype.hasOwnProperty.call(S.daily[d], c.id))
    .sort().reverse().slice(0, 30);
  const rows = days.map(d => {
    const x = rec(c.id, d), mm = STATUS_META[x.st], totalDay = classTotal(c.id, x);
    const summary = x.st === "selesai" ? `${x.names.length}/${totalDay} siswa mengambil` : `${totalDay} siswa · ${mm.label}`;
    return `<button type="button" class="row-card report-open-row" data-student-report="${d}"><span class="report-open-main"><strong>${esc(formatDate(d))}</strong><span class="sub">${esc(summary)}</span></span><span class="report-open-side"><span class="status-chip ${mm.cls}">${mm.label}</span><span class="report-open-chevron" aria-hidden="true">›</span></span></button>`;
  }).join("");
  $("screen-sriwayat").innerHTML = head("Laporan", `Riwayat status MBG · ${esc(c.kelas)}`) + `<div class="content"><div class="student-report-list">${rows || '<div class="empty-report"><strong>Belum ada laporan</strong><span>Catatan MBG untuk kelas ini akan muncul di sini.</span></div>'}</div></div>`;
  $("screen-sriwayat").querySelectorAll("[data-student-report]").forEach(row => {
    row.onclick = () => showStudentReportDetail(c.id, row.dataset.studentReport);
  });
}

// ---------- OPERATOR ----------
function renderOperator() {
  if (!user() || user().role !== "operator") return;
  const mc = myClasses(), st = mc.map(c => rec(c.id).st);
  $("screen-okelas").innerHTML = head("Kelola Kelas", `${mc.length} kelas aktif · ${st.filter(x => x === "selesai").length} sudah ambil`) + `<div class="content"><button class="btn-primary add-btn" id="o-add">+ Tambah kelas</button>` + SEK_ORDER.map(sek => `<p class="group-label">${SEK_FULL[sek]}</p>` + S.classes.filter(c => c.sekolah === sek).map(c => `<div class="row-card"><div><strong>${esc(c.kelas)} ${c.aktif ? "" : "· nonaktif"}</strong><span class="sub">Kode: ${esc(c.kode)} · ${(S.students[c.id] || []).length} siswa master · ${STATUS_META[rec(c.id).st].label}</span></div><div><button class="mini-btn" data-a="edit" data-id="${c.id}">Edit</button><button class="mini-btn" data-a="siswa" data-id="${c.id}">Siswa</button><button class="mini-btn" data-a="kode" data-id="${c.id}">Kode</button><button class="mini-btn danger" data-a="tog" data-id="${c.id}">${c.aktif ? "Nonaktif" : "Aktifkan"}</button></div></div>`).join("")).join("") + "</div>";
  $("o-add").onclick = () => kelasForm();
  document.querySelectorAll("#screen-okelas [data-a]").forEach(b => b.onclick = () => {
    const c = cls(b.dataset.id), a = b.dataset.a; if (!c) return;
    if (a === "edit") kelasForm(c);
    if (a === "tog") { c.aktif = !c.aktif; pushRiwayat(`Kelas ${c.kelas} ${c.aktif ? "diaktifkan" : "dinonaktifkan"}`, SEKOLAH_LABEL[c.sekolah], "purple", null, true); }
    if (a === "kode") {
  openM(
    "Ubah secret " + c.kelas,
    `<label>Secret / sandi kelas</label>
     <input id="f-kode" type="text" value="${esc(c.kode)}" placeholder="Masukkan secret baru" />
     <p class="group-label">Secret ini digunakan bersama oleh siswa kelas ${esc(c.kelas)} untuk login.</p>
     <button class="btn-primary" id="m-save">Simpan</button>`,
    () => {
      const kodeBaru = $("f-kode").value.trim();
      if (!kodeBaru) return showToast("Secret belum diisi");

      c.kode = kodeBaru;
      closeM();
      pushRiwayat(
        `Secret ${c.kelas} diubah`,
        "Secret baru ditetapkan oleh operator",
        "orange",
        c.id,
        true
      );
    }
  );
}
    if (a === "siswa") openM("Siswa " + c.kelas, `<label>Satu nama per baris</label><p class="group-label">Ini adalah master siswa kelas. Data ini dipakai untuk daftar pilihan pengambilan.</p><textarea id="f-sw">${esc((S.students[c.id] || []).join("\n"))}</textarea><button class="btn-primary" id="m-save">Simpan</button>`, () => { S.students[c.id] = $("f-sw").value.split("\n").map(s => s.trim()).filter(Boolean); closeM(); pushRiwayat(`Data siswa ${c.kelas} diperbarui`, S.students[c.id].length + " siswa", "purple", null, true); });
  });

  $("screen-opengguna").innerHTML = head("Pengguna", "Akun Guru & Operator") + `<div class="content"><button class="btn-primary add-btn" id="u-add">+ Tambah akun</button>${S.users.filter(u => u.role !== "siswa").map(u => {
    const scope = u.role === "guru" ? u.sekolah.map(x => SEKOLAH_LABEL[x]).join(" + ") : "Semua sekolah";
    const editName = u.role === "guru" ? `<button class="mini-btn" data-u="${esc(u.u)}" data-a="editname">Edit nama</button>` : "";
    return `<div class="row-card"><div><strong>${esc(u.nama)}</strong><span class="sub">${u.role} · ${esc(u.u)} · ${esc(scope)}</span></div><div>${editName}<button class="mini-btn" data-u="${esc(u.u)}" data-a="pw">Sandi</button>${u.u !== S.session.u ? `<button class="mini-btn danger" data-u="${esc(u.u)}" data-a="del">Hapus</button>` : ""}</div></div>`;
  }).join("")}</div>`;
  $("u-add").onclick = userForm;
  document.querySelectorAll("#screen-opengguna [data-u]").forEach(b => b.onclick = () => {
    const u = S.users.find(x => x.u === b.dataset.u); if (!u) return;
    if (b.dataset.a === "del") { S.users = S.users.filter(x => x !== u); pushRiwayat("Akun " + u.u + " dihapus", u.role, "red", null, true); }
    else if (b.dataset.a === "editname") {
      openM("Edit nama pengurus", `<label>Nama pengurus</label><input id="f-nama-pengurus" value="${esc(u.nama)}" /><p class="group-label">Ruang lingkup tetap: ${esc(u.sekolah.map(x => SEKOLAH_LABEL[x]).join(" + "))}</p><button class="btn-primary" id="m-save">Simpan</button>`, () => { const n = $("f-nama-pengurus").value.trim(); if (!n) return showToast("Nama belum diisi"); u.nama = n; closeM(); pushRiwayat("Nama pengurus diperbarui", u.nama, "purple", null, true); });
    } else openM("Sandi baru: " + u.u, `<input id="f-pw" type="text" placeholder="Sandi baru" /><button class="btn-primary" id="m-save">Simpan</button>`, () => { if (!$("f-pw").value) return; u.pass = $("f-pw").value; closeM(); pushRiwayat("Sandi " + u.u + " diubah", u.role, "orange", null, true); });
  });

  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  $("screen-okonten").innerHTML = head("Konten", "Menu MBG & pengumuman") + `<div class="content"><h2 class="section-title">Master menu</h2>${[1, 2, 3, 4, 5].map(i => `<div class="row-card"><div><strong>${hari[i]}</strong><span class="sub">${esc(S.menu[i])}</span></div><button class="mini-btn" data-m="${i}">Edit</button></div>`).join("")}<h2 class="section-title">Pengumuman</h2><button class="btn-primary add-btn" id="a-add">+ Pengumuman</button>${S.ann.map(a => `<div class="row-card"><div><strong>${esc(a.txt)}</strong><span class="sub">${a.cid ? esc((cls(a.cid) ? cls(a.cid).kelas : "Kelas")) : "Semua"} · ${a.date}</span></div><button class="mini-btn danger" data-ad="${a.id}">Hapus</button></div>`).join("")}</div>`;
  document.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const i = b.dataset.m; openM("Menu " + hari[i], `<label>Pisahkan dengan +</label><input id="f-mn" value="${esc(S.menu[i])}" /><button class="btn-primary" id="m-save">Simpan</button>`, () => { S.menu[i] = $("f-mn").value; closeM(); pushRiwayat("Menu " + hari[i] + " diperbarui", S.menu[i], "purple", null, true); }); });
  $("a-add").onclick = () => openM("Pengumuman baru", `<label>Isi</label><textarea id="f-an"></textarea><label>Untuk</label><select id="f-ac"><option value="">Semua kelas</option>${S.classes.map(c => `<option value="${c.id}">${esc(c.kelas)} · ${SEKOLAH_LABEL[c.sekolah]}</option>`).join("")}</select><button class="btn-primary" id="m-save">Kirim</button>`, () => { const t = $("f-an").value.trim(); if (!t) return; const cid = $("f-ac").value ? +$("f-ac").value : null; S.ann.unshift({ id: S.nid++, txt: t, cid, date: today() }); closeM(); pushRiwayat("Pengumuman: " + t.slice(0, 40), cid ? cls(cid).kelas : "Semua", "orange", cid); });
  document.querySelectorAll("[data-ad]").forEach(b => b.onclick = () => { S.ann = S.ann.filter(a => a.id != b.dataset.ad); save(); renderAll(); });
  $("screen-olog").innerHTML = head("Log Aktivitas", "Pantau semua kegiatan sistem") + `<div class="content">${S.log.slice(0, 60).map(r => `<div class="riwayat-item"><span class="riwayat-dot" style="background:var(--purple)"></span><div class="riwayat-body"><strong>${esc(r.txt)}</strong><span>${esc(r.sub)}</span></div><span class="riwayat-time">${r.date.slice(5)} ${r.time}</span></div>`).join("")}</div>`;
}
function kelasForm(c) {
  openM(c ? "Edit kelas" : "Tambah kelas", `<label>Sekolah</label><select id="f-sk">${Object.keys(SEK_FULL).map(k => `<option value="${k}" ${c && c.sekolah === k ? "selected" : ""}>${SEK_FULL[k]}</option>`).join("")}</select><label>Nama kelas</label><input id="f-nm" value="${c ? esc(c.kelas) : ""}" placeholder="mis. XI RPL" /><button class="btn-primary" id="m-save">Simpan</button>`, () => {
    const n = $("f-nm").value.trim(); if (!n) return;
    if (c) { c.kelas = n; c.sekolah = $("f-sk").value; }
    else { const id = Math.max(0, ...S.classes.map(x => x.id)) + 1; S.classes.push({ id, sekolah: $("f-sk").value, kelas: n, aktif: true, kode: randKode() }); S.students[id] = []; }
    closeM(); pushRiwayat(`Kelas ${n} ${c ? "diubah" : "ditambahkan"}`, "Operator", "purple", null, true);
  });
}
function userForm() {
  openM("Tambah akun", `<label>Nama</label><input id="f-n" /><label>Nama pengguna</label><input id="f-u" /><label>Sandi</label><input id="f-p" /><label>Peran</label><select id="f-r"><option value="guru">Guru</option><option value="operator">Operator</option></select><label>Sekolah pengelolaan (Guru)</label><select id="f-s" multiple>${Object.keys(SEK_FULL).map(k => `<option value="${k}">${SEK_FULL[k]}</option>`).join("")}</select><button class="btn-primary" id="m-save">Simpan</button>`, () => {
    const u = $("f-u").value.trim(), n = $("f-n").value.trim(), p = $("f-p").value;
    if (!u || !n || !p || S.users.some(x => x.u === u)) return showToast("Lengkapi data / nama pengguna sudah dipakai");
    S.users.push({ u, nama: n, pass: p, role: $("f-r").value, sekolah: $("f-r").value === "guru" ? [...$("f-s").selectedOptions].map(o => o.value) : [] });
    closeM(); pushRiwayat("Akun " + u + " dibuat", $("f-r").value, "purple", null, true);
  });
}

// ---------- DETAIL LAPORAN ----------
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function reportDetailHtml({ c, date, time, record, subtitle = "", activity = "" }) {
  const r = record;
  const meta = r && STATUS_META[r.st] ? STATUS_META[r.st] : null;
  const total = c && r ? classTotal(c.id, r) : null;
  const names = r && Array.isArray(r.names) ? r.names : [];
  const hasClassReport = Boolean(c && r);
  const facts = hasClassReport ? `
    <div class="report-detail-stats">
      <div><span>Status MBG</span><strong><span class="status-chip ${meta ? meta.cls : "status-menunggu"}">${meta ? meta.label : "Belum tercatat"}</span></strong></div>
      <div><span>Jumlah siswa</span><strong>${total}</strong></div>
      <div><span>Sudah mengambil</span><strong>${names.length} siswa</strong></div>
    </div>
    <h4 class="report-detail-heading">Siswa yang mengambil</h4>
    <div class="report-detail-students">${names.length ? names.map((name, i) => `<div class="report-detail-student"><span class="report-detail-number">${i + 1}</span><span>${esc(name)}</span></div>`).join("") : '<p class="report-detail-empty">Belum ada siswa yang tercatat mengambil MBG.</p>'}</div>` : `<div class="report-detail-note">${esc(subtitle || "Aktivitas ini tidak memiliki detail pencatatan kelas.")}</div>`;
  return `<div class="report-detail-meta">
      ${c ? `<div><span>Kelas</span><strong>${esc(c.kelas)}</strong></div><div><span>Sekolah</span><strong>${esc(SEKOLAH_LABEL[c.sekolah] || c.sekolah)}</strong></div>` : `<div><span>Jenis aktivitas</span><strong>Aktivitas umum</strong></div>`}
      <div><span>Tanggal</span><strong>${esc(formatDate(date))}</strong></div>
      <div><span>Waktu aktivitas</span><strong>${esc(time || "-")}</strong></div>
    </div>
    ${activity ? `<p class="report-detail-activity">${esc(activity)}</p>` : ""}
    ${facts}`;
}
function recordForLog(log, c) {
  if (!c) return null;
  if (log.snapshot) return log.snapshot;

  // Legacy log entries did not store snapshots. Recover their stated status/count
  // from the log text where possible, then fall back to the saved daily record.
  const current = rec(c.id, log.date);
  const sub = String(log.sub || "");
  const fraction = sub.match(/(\d+)\s*\/\s*(\d+)\s*siswa/i);
  const singleCount = sub.match(/(\d+)\s*siswa/i);
  const savedTotal = fraction ? Number(fraction[2]) : singleCount ? Number(singleCount[1]) : classTotal(c.id, current);
  const names = current.st === "selesai" && Array.isArray(current.names) ? [...current.names] : [];

  if (/selesai mengambil MBG/i.test(log.txt || "")) {
    return { ...current, st: "selesai", at: log.time || current.at, names, jumlahSiswa: savedTotal };
  }
  if (/MBG sudah dikirim ke|pencatatan dikosongkan/i.test(log.txt || "")) {
    return { ...current, st: "tiba", ping: log.time || current.ping, names: [], jumlahSiswa: savedTotal };
  }
  return current;
}
function showReportDetail(logId) {
  const log = visibleLog().find(item => item.id === logId);
  if (!log) return showToast("Detail laporan tidak ditemukan");
  const c = log.cid != null ? cls(log.cid) : null;
  const record = recordForLog(log, c);
  const time = log.time || (record && (record.at || record.ping)) || "-";
  openM(log.txt || "Detail laporan", reportDetailHtml({ c, date: log.date, time, record, subtitle: log.sub, activity: log.sub }), null, "report-detail-modal");
}
function showStudentReportDetail(cid, date) {
  const c = cls(cid);
  if (!c || !user() || user().role !== "siswa" || String(S.session.cid) !== String(cid)) return showToast("Laporan kelas tidak tersedia");
  const record = S.daily[date] && S.daily[date][cid];
  if (!record) return showToast("Catatan laporan tidak ditemukan");
  const relatedLog = S.log.find(item => item.cid == cid && item.date === date && !item.op);
  const time = record.at || record.ping || (relatedLog && relatedLog.time) || "-";
  openM(`Laporan ${c.kelas}`, reportDetailHtml({ c, date, time, record, subtitle: `Riwayat MBG kelas ${c.kelas}` }), null, "report-detail-modal");
}

// ---------- MODAL ----------
const overlay = $("modal-overlay");
function openM(title, html, onSave, extraClass = "") {
  $("modal-title").textContent = title;
  $("modal-body").innerHTML = html;

  const modal = overlay.querySelector(".modal");
  modal.className = "modal";
  if (extraClass) modal.classList.add(extraClass);

  overlay.classList.remove("hidden");
  if ($("m-save") && onSave) $("m-save").onclick = onSave;
}
function closeM() {
  overlay.classList.add("hidden");
  const modal = overlay.querySelector(".modal");
  modal.className = "modal";
  modal.style.height = "";
  modal.style.maxHeight = "";
}

// Tombol X modal harus bekerja untuk seluruh jenis modal.
$("modal-close").onclick = closeM;

// Modal kelas Guru: scroll dan pertumbuhan sheet dikendalikan bersama.
function kelasModal(cid) {
  const mc = myClasses(); if (!mc.length) return showToast("Tidak ada kelas");
  cid = cid || mc[0].id;
  const c = cls(cid), r = rec(cid), m = STATUS_META[r.st], sw = S.students[cid] || [], total = classTotal(cid, r);
  const countValue = r.jumlahSiswa !== null && r.jumlahSiswa !== undefined ? r.jumlahSiswa : sw.length;
  const studentArea = sw.length
    ? `<label class="chk chk-empty"><input type="checkbox" id="m-kosongkan" data-empty /> Kosongkan</label>${sw.map((n, i) => `<label class="chk"><input type="checkbox" value="${i}" data-student ${r.names.includes(n) ? "checked" : ""} /> ${esc(n)}</label>`).join("")}`
    : '<p class="group-label">Belum ada data siswa. Tambahkan nama melalui Operator → Kelas → Siswa.</p>';
  const action = r.st === "menunggu"
    ? `<button class="btn-primary" id="m-save">MBG Sudah Dikirim</button>`
    : `<button class="btn-primary" id="m-save">Simpan pencatatan</button>`;
  const body = `<div class="class-sheet-scroll" id="class-sheet-scroll">
    <label for="m-ks">Kelas</label><select id="m-ks">${mc.map(x => `<option value="${x.id}" ${x.id == cid ? "selected" : ""}>${esc(x.kelas)} · ${SEKOLAH_LABEL[x.sekolah]}</option>`).join("")}</select>
    <p><span class="status-chip ${m.cls}">${m.label}</span></p>
    <label for="m-jumlah">Jumlah siswa</label><input id="m-jumlah" type="number" min="0" step="1" inputmode="numeric" value="${esc(countValue)}" placeholder="Masukkan jumlah siswa" /><p id="m-jumlah-err" class="form-err-inline" aria-live="polite"></p>
    <label class="student-list-heading">Siswa yang mengambil hari ini</label>
    <div id="m-student-list" class="class-student-list">${studentArea}</div>
  </div>
  <div class="class-sheet-footer">${action}</div>`;
  openM(c.kelas, body, () => {
    const countRaw = $("m-jumlah") ? $("m-jumlah").value.trim() : "";
    const count = countRaw === "" ? null : Number(countRaw);
    const err = $("m-jumlah-err");
    if (countRaw !== "" && (!Number.isFinite(count) || !/^\d+$/.test(countRaw))) {
      if (err) err.textContent = "Jumlah siswa harus berupa angka.";
      if ($("m-jumlah")) $("m-jumlah").focus();
      return;
    }
    if (count === null || count < 0) {
      if (err) err.textContent = "Jumlah siswa wajib diisi.";
      if ($("m-jumlah")) $("m-jumlah").focus();
      return;
    }
    const names = [...document.querySelectorAll("#modal-body [data-student]:checked")].map(i => sw[Number(i.value)]).filter(Boolean);
    if (r.st === "menunggu") {
      const next = { st: "tiba", ping: nowTime(), names: [], jumlahSiswa: count };
      setRec(cid, next);
      closeM();
      pushRiwayat(`MBG sudah dikirim ke ${c.kelas}`, `${SEKOLAH_LABEL[c.sekolah]} · ${count} siswa`, "blue", c.id, false, next);
      showToast("Status pengiriman disimpan");
      return;
    }
    const next = names.length ? { st: "selesai", ping: r.ping, at: nowTime(), names, jumlahSiswa: count } : { st: "tiba", ping: r.ping || nowTime(), names: [], jumlahSiswa: count };
    setRec(cid, next);
    closeM();
    pushRiwayat(names.length ? `${c.kelas} selesai mengambil MBG` : `${c.kelas} pencatatan dikosongkan`, `${SEKOLAH_LABEL[c.sekolah]} · ${names.length}/${count} siswa`, names.length ? "green" : "blue", c.id, false, next);
    showToast("Pencatatan disimpan");
  }, "class-modal");
  $("m-ks").onchange = () => kelasModal(+$("m-ks").value);

  const sheet = overlay.querySelector(".modal.class-modal");
  const scroller = $("class-sheet-scroll");
  if (sheet && scroller) {
    const viewportHeight = () => window.visualViewport && window.visualViewport.height ? window.visualViewport.height : window.innerHeight;
    const minHeight = () => Math.round(viewportHeight() * 0.50);
    const maxHeight = () => Math.round(viewportHeight() * 0.90);
    const setHeight = value => {
      const h = Math.max(minHeight(), Math.min(maxHeight(), value));
      sheet.style.height = `${h}px`;
      sheet.classList.toggle("expanded", h >= maxHeight() - 1);
      return h;
    };
    setHeight(minHeight());
    let lastY = null, gestureActive = false;
    scroller.addEventListener("touchstart", e => {
      if (!e.touches || !e.touches.length) return;
      lastY = e.touches[0].clientY;
      gestureActive = true;
    }, { passive: true });
    scroller.addEventListener("touchmove", e => {
      if (!gestureActive || lastY === null || !e.touches || !e.touches.length) return;
      const y = e.touches[0].clientY;
      const dy = lastY - y; // positif = jari bergerak ke atas
      lastY = y;
      if (Math.abs(dy) < 0.5) return;
      const current = sheet.getBoundingClientRect().height;
      if (dy > 0) {
        const grown = setHeight(current + dy);
        const used = grown - current;
        const remaining = dy - used;
        if (remaining > 0) scroller.scrollTop += remaining;
        if (used > 0 || remaining > 0) e.preventDefault();
      } else {
        let remaining = -dy;
        if (scroller.scrollTop > 0) {
          const consumed = Math.min(scroller.scrollTop, remaining);
          scroller.scrollTop -= consumed;
          remaining -= consumed;
        }
        if (remaining > 0) setHeight(sheet.getBoundingClientRect().height - remaining);
        e.preventDefault();
      }
    }, { passive: false });
    const finishGesture = () => { gestureActive = false; lastY = null; };
    scroller.addEventListener("touchend", finishGesture, { passive: true });
    scroller.addEventListener("touchcancel", finishGesture, { passive: true });
    scroller.addEventListener("wheel", e => {
      const dy = e.deltaY;
      if (!dy) return;
      const current = sheet.getBoundingClientRect().height;
      if (dy > 0) {
        const grown = setHeight(current + dy);
        const used = grown - current;
        const remaining = dy - used;
        if (remaining > 0) scroller.scrollTop += remaining;
        e.preventDefault();
      } else {
        let remaining = -dy;
        if (scroller.scrollTop > 0) {
          const consumed = Math.min(scroller.scrollTop, remaining);
          scroller.scrollTop -= consumed;
          remaining -= consumed;
        }
        if (remaining > 0) setHeight(sheet.getBoundingClientRect().height - remaining);
        e.preventDefault();
      }
    }, { passive: false });
  }
  const empty = $("m-kosongkan"), checks = [...document.querySelectorAll("#modal-body [data-student]")];
  if (empty) empty.onchange = () => { if (empty.checked) checks.forEach(x => { x.checked = false; }); };
  checks.forEach(x => x.onchange = () => { if (x.checked && empty) empty.checked = false; });
}
function kirimKelas(list) {
  let n = 0;
  list.forEach(c => {
    if (rec(c.id).st === "menunggu") {
      const r = rec(c.id), total = classTotal(c.id, r), ping = nowTime();
      const snapshot = { st: "tiba", ping, names: [], jumlahSiswa: total };
      setRec(c.id, snapshot);
      n++;
      S.log.unshift({ id: S.nid++, date: today(), time: ping, txt: `MBG sudah dikirim ke ${c.kelas}`, sub: `${SEKOLAH_LABEL[c.sekolah]} · menunggu kedatangan`, color: "blue", cid: c.id, snapshot: { ...snapshot, names: [] } });
    }
  });
  save(); renderAll(); showToast(n ? `MBG dikirim ke ${n} kelas` : "Tidak ada kelas yang menunggu");
}
// ---------- NAVIGASI ----------
const NAV = {
  guru: [["beranda", "🏠", "Beranda"], ["laporan", "📊", "Laporan"], "fab", ["notifikasi", "🔔", "Notifikasi"], ["akun", "👤", "Akun"]],
  siswa: [["sberanda", "🏠", "Beranda"], ["sriwayat", "📊", "Laporan"], ["notifikasi", "🔔", "Notifikasi"], ["akun", "👤", "Akun"]],
  operator: [["okelas", "🏫", "Kelas"], ["opengguna", "👥", "Pengguna"], ["okonten", "🍽️", "Konten"], ["olog", "📋", "Log"], ["akun", "👤", "Akun"]],
};
function syncBrandTheme(role = "guest") { const app = document.querySelector(".app"); if (app) app.dataset.role = role || "guest"; }
function buildNav() {
  const role = S.session.role; syncBrandTheme(role);
  $("bottom-nav").innerHTML = NAV[role].map(n => n === "fab" ? '<button class="fab" id="fab-btn" aria-label="Catat MBG">+</button>' : `<button class="nav-item" data-nav="${n[0]}">${n[0] === "notifikasi" ? `<span id="nav-badge-wrap">🔔<span class="nav-badge" id="nav-badge"></span></span>` : n[1]}<span>${n[2]}</span></button>`).join("");
  if ($("fab-btn")) $("fab-btn").onclick = () => kelasModal();
  buildDesktopNav(role);
}
function buildDesktopNav(role) {
  const menu = $("desktop-menu-items");
  if (!menu) return;
  menu.innerHTML = (NAV[role] || []).filter(n => Array.isArray(n)).map(n => `
    <button type="button" class="desktop-nav-item" data-nav="${n[0]}" aria-current="false">
      <span class="desktop-nav-icon">${n[1]}</span>
      <span class="desktop-nav-label">${n[2]}</span>
      ${n[0] === "notifikasi" ? '<span class="desktop-nav-badge hidden" id="desktop-nav-badge">0</span>' : '<span class="desktop-nav-arrow" aria-hidden="true">›</span>'}
    </button>`).join("");

  const action = $("desktop-menu-action");
  if (action) {
    action.innerHTML = role === "guru" ? `
      <button type="button" class="desktop-action-btn" id="desktop-fab-btn">
        <span class="desktop-action-plus" aria-hidden="true">+</span>
        <span class="desktop-action-copy"><strong>Catat MBG</strong><small>Perbarui status kelas</small></span>
        <span class="desktop-action-arrow" aria-hidden="true">↗</span>
      </button>` : "";
    const actionButton = $("desktop-fab-btn");
    if (actionButton) actionButton.onclick = () => { closeDesktopMenu(); kelasModal(); };
  }

  const currentUser = user();
  const classForStudent = currentUser && currentUser.role === "siswa" ? cls(S.session.cid) : null;
  const shownName = currentUser ? (classForStudent ? classForStudent.kelas : currentUser.nama) : "Pengguna";
  const roleName = { guru: "Guru", siswa: "Siswa", operator: "Operator" }[role] || "Pengguna";
  if ($("desktop-drawer-name")) $("desktop-drawer-name").textContent = shownName || "Pengguna";
  if ($("desktop-drawer-role")) $("desktop-drawer-role").textContent = roleName + " · Akun aktif";
  if ($("desktop-drawer-user-mark")) $("desktop-drawer-user-mark").textContent = String(shownName || "MB").trim().split(/\s+/).map(x => x[0] || "").join("").slice(0, 2).toUpperCase() || "MB";
  syncDesktopNavState();
}
function syncDesktopNavState() {
  document.querySelectorAll(".desktop-nav-item").forEach(b => {
    const active = b.dataset.nav === curScreen;
    b.classList.toggle("active", active);
    b.setAttribute("aria-current", active ? "page" : "false");
  });
  const titles = {
    landing: "", login: "Pilih akses", beranda: "Beranda", laporan: "Laporan", notifikasi: "Notifikasi", akun: "Akun",
    sberanda: "Beranda", sriwayat: "Laporan", okelas: "Kelola Kelas", opengguna: "Pengguna", okonten: "Konten", olog: "Log Aktivitas"
  };
  const activeItem = Array.from(document.querySelectorAll(".desktop-nav-item")).find(b => b.dataset.nav === curScreen);
  const heading = $("desktop-current-title");
  if (heading) heading.textContent = activeItem ? activeItem.querySelector(".desktop-nav-label").textContent : (titles[curScreen] || "MBG-KU");
}
function setDesktopMenu(open) {
  const drawer = $("desktop-drawer"), backdrop = $("desktop-menu-backdrop"), toggle = $("desktop-menu-toggle");
  if (!drawer || !backdrop || !toggle) return;
  drawer.classList.toggle("is-open", open);
  backdrop.classList.toggle("is-visible", open);
  toggle.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.setAttribute("aria-label", open ? "Tutup navigasi" : "Buka navigasi");
  drawer.setAttribute("aria-hidden", open ? "false" : "true");
  backdrop.setAttribute("aria-hidden", open ? "false" : "true");
}
function toggleDesktopMenu() {
  const drawer = $("desktop-drawer");
  setDesktopMenu(!(drawer && drawer.classList.contains("is-open")));
}
function closeDesktopMenu() { setDesktopMenu(false); }
function switchScreen(name) {
  closeDesktopMenu();
  curScreen = name;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screen = $("screen-" + name); if (screen) screen.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.nav === name));
  syncDesktopNavState();
  if ($("notif-today") && name === "notifikasi") markSeen();
  window.scrollTo(0, 0);
}
function markSeen() { if (!S.session) return; const l = visibleLog(); S.seen[S.session.u] = Math.max(0, ...l.map(x => x.id)); save(); }
const homeOf = { guru: "beranda", siswa: "sberanda", operator: "okelas" };
function go(name) {
  const auth = name !== "landing" && name !== "login";
  syncBrandTheme(auth && S.session ? S.session.role : "guest");
  if (document.querySelector(".app")) document.querySelector(".app").classList.toggle("noauth", !auth);
  if (auth) { buildNav(); renderAll(); }
  switchScreen(name);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-nav]"); if (!b || !S.session) return;
  const n = b.dataset.nav, role = S.session.role, ok = NAV[role].some(x => x[0] === n);
  if (ok) { if (n === "notifikasi") renderNotifikasi(); switchScreen(n); setTimeout(renderNotifikasi, 600); }
});

// Desktop drawer controls; mobile navigation tetap menggunakan bottom-nav.
if ($("desktop-menu-toggle")) $("desktop-menu-toggle").onclick = toggleDesktopMenu;
if ($("desktop-drawer-close")) $("desktop-drawer-close").onclick = closeDesktopMenu;
if ($("desktop-menu-backdrop")) $("desktop-menu-backdrop").onclick = closeDesktopMenu;
if ($("desktop-logout")) $("desktop-logout").onclick = () => { closeDesktopMenu(); if ($("logout-btn")) $("logout-btn").click(); };
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDesktopMenu(); });
function renderAll() {
  if (!S.session || !user()) return;
  renderStats(); renderKelasList(); renderLaporan(); renderNotifikasi(); renderAkun(); renderSiswa(); renderOperator();
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.nav === curScreen));
}

// ---------- TABS, KIRIM, NOTIF, AKUN ----------
document.querySelectorAll(".tab").forEach(t => t.onclick = () => { document.querySelectorAll(".tab").forEach(x => x.classList.remove("active")); t.classList.add("active"); currentFilter = t.dataset.filter; renderKelasList(); });
$("kirim-btn").onclick = () => $("kirim-menu").classList.toggle("hidden");
document.querySelectorAll("#kirim-menu button").forEach(o => o.onclick = () => { $("kirim-menu").classList.add("hidden"); kirimKelas(myClasses().filter(c => c.sekolah === o.dataset.sekolah)); });
document.addEventListener("click", e => { if ($("kirim-btn") && !$('kirim-btn').contains(e.target)) $("kirim-menu").classList.add("hidden"); });
$("tandai-dibaca").onclick = () => { markSeen(); renderNotifikasi(); showToast("Semua notifikasi ditandai dibaca"); };
document.querySelectorAll(".menu-item[data-info]").forEach(i => i.onclick = () => showToast(i.dataset.info));
$("logout-btn").onclick = () => openM("Keluar dari akun?", `<p>Kamu akan kembali ke halaman awal.</p><button class="btn-primary" id="m-save">Keluar</button>`, () => { S.session = null; save(); closeM(); resetLoginUI(); go("landing"); });

// ---------- LANDING & LOGIN ----------
function animateLandingToLogin() {
  if (landingBusy) return;
  landingBusy = true;

  const landing = $("screen-landing");
  const tagline = landing ? landing.querySelector(".tagline") : null;
  const btn = $("btn-masuk");

  if (!landing) {
    resetLoginUI();
    go("login");
    landingBusy = false;
    return;
  }

  if (btn) btn.disabled = true;

  // Kembalikan animasi logo ke versi awal MBG-KU:
  // logo mengecil dan fade out melalui class .leave.
  landing.classList.add("leave");

  // Teks landing dan tombol ikut menghilang dengan fade.
  if (tagline) {
    tagline.style.transition = "opacity 450ms ease, transform 450ms ease";
    tagline.style.opacity = "0";
    tagline.style.transform = "translateY(8px)";
  }

  if (btn) {
    btn.style.transition = "opacity 450ms ease, transform 450ms ease";
    btn.style.opacity = "0";
    btn.style.transform = "translateY(8px)";
  }

  setTimeout(() => {
    landing.classList.remove("leave");

    if (tagline) {
      tagline.style.transition = "";
      tagline.style.opacity = "";
      tagline.style.transform = "";
    }

    if (btn) {
      btn.style.transition = "";
      btn.style.opacity = "";
      btn.style.transform = "";
    }

    resetLoginUI();
    go("login");
    landingBusy = false;
    if (btn) btn.disabled = false;
  }, 450);
}
$("btn-masuk").onclick = animateLandingToLogin;

// ---------- LOGIN ----------
function classLabel(id) { const c = cls(id); return c ? `${SEK_FULL[c.sekolah]} — ${c.kelas}` : "Pilih kelas"; }
function renderClassOptions(query = "") {
  const wrap = $("l-kelas-options"); if (!wrap) return;
  const q = query.trim().toLowerCase();
  let html = "";
  SEK_ORDER.forEach(sek => {
    const items = S.classes.filter(c => c.aktif && c.sekolah === sek && (!q || `${c.kelas} ${SEK_FULL[sek]} ${c.kode}`.toLowerCase().includes(q)));
    if (!items.length) return;
    html += `<div class="class-picker-group"><div class="class-picker-group-title">${esc(SEK_FULL[sek])}</div>`;
    items.forEach(c => { html += `<button type="button" class="class-option" data-class-id="${c.id}"><span>${esc(c.kelas)}</span></button>`; });
    html += `</div>`;
  });
  wrap.innerHTML = html || '<p class="class-picker-empty">Kelas tidak ditemukan.</p>';
  wrap.querySelectorAll("[data-class-id]").forEach(b => b.onclick = () => {
    const id = b.dataset.classId;
    $("l-kelas").value = id;
    $("l-kelas-label").textContent = classLabel(id);
    closeClassPicker();
  });
}
function openClassPicker() {
  const panel = $("l-kelas-panel"); if (!panel) return;
  panel.classList.remove("hidden"); if ($("l-kelas-trigger")) $("l-kelas-trigger").setAttribute("aria-expanded", "true");
  $("l-kelas-search").value = ""; renderClassOptions();
  setTimeout(() => { if ($("l-kelas-search")) $("l-kelas-search").focus(); }, 0);
}
function closeClassPicker() {
  if ($("l-kelas-panel")) $("l-kelas-panel").classList.add("hidden"); if ($("l-kelas-trigger")) $("l-kelas-trigger").setAttribute("aria-expanded", "false");
}
$("l-kelas-trigger").onclick = () => $("l-kelas-panel").classList.contains("hidden") ? openClassPicker() : closeClassPicker();
$("l-kelas-search").oninput = e => renderClassOptions(e.target.value);

document.addEventListener("click", e => {
  const picker = $("class-picker"); if (picker && !picker.contains(e.target)) closeClassPicker();
});
function selectRole(r) {
  loginRole = r;
  syncBrandTheme(r);
  document.querySelectorAll(".role-card").forEach(c => c.classList.toggle("sel", c.dataset.role === r));
  $("f-staff").classList.toggle("hidden", r === "siswa"); $("f-siswa").classList.toggle("hidden", r !== "siswa"); $("l-err").textContent = "";
  if (r !== "siswa") closeClassPicker();
}
function resetLoginUI() {
  syncBrandTheme("guest");
  $("l-kelas").value = ""; $("l-kelas-label").textContent = "Pilih kelas"; closeClassPicker(); renderClassOptions();
  ["l-user", "l-pass", "l-kode"].forEach(i => $(i).value = ""); selectRole("guru");
}
document.querySelectorAll(".role-card").forEach(c => c.onclick = () => selectRole(c.dataset.role));
$("btn-login").onclick = () => {
  const err = m => $("l-err").textContent = m;
  if (loginRole === "siswa") {
    const c = cls($("l-kelas").value); if (!c) return err("Pilih kelas dulu.");
    if ($("l-kode").value.trim().toUpperCase() !== c.kode.toUpperCase()) return err("Kode kelas salah.");
    S.users = S.users.filter(u => u.role !== "siswa");
    S.users.push({ u: "siswa-" + c.id, role: "siswa", nama: c.kelas, sekolah: [c.sekolah] });
    S.session = { u: "siswa-" + c.id, role: "siswa", cid: c.id };
  } else {
    const u = S.users.find(x => x.u === $("l-user").value.trim() && x.pass === $("l-pass").value && x.role === loginRole);
    if (!u) return err("Nama pengguna atau sandi salah.");
    S.session = { u: u.u, role: u.role };
  }
  save(); currentFilter = "semua"; syncBrandTheme(S.session.role); go(homeOf[S.session.role]); showToast("Selamat datang!");
};

// ---------- INIT ----------
load();
if (S.session && user() && (S.session.role !== "siswa" || cls(S.session.cid))) { go(homeOf[S.session.role]); }
else { S.session = null; resetLoginUI(); }