const KEY = "mbgku_v1";
const SEKOLAH_LABEL = { SMK1: "SMK 1", SMK2: "SMK 2", SMP: "SMP" };
const SEK_FULL = { SMK1: "SMK 1 (SARADAN)", SMK2: "SMK 2 (AT-TAJIR)", SMP: "SMP (SULTAN)" };
const ROM = { VII: 7, VIII: 8, IX: 9, XI: 11, XII: 12 };
const STATUS_META = {
  menunggu: { label: "Menunggu", cls: "status-menunggu" },
  tiba: { label: "Menunggu kedatangan", cls: "status-tiba" },
  selesai: { label: "Sudah ambil", cls: "status-selesai" },
};
const NAMES = ["Ahmad","Budi","Citra","Dimas","Eka","Fajar","Gita","Hana","Indra","Joko","Kiki","Lina","Maya","Nando","Oki","Putri","Rani","Sinta","Tono","Udin","Vina","Wati","Yoga","Zahra"];
const CUSTOM_STUDENTS = {
  "XI RPL": [
    "Dzakwan",
    "Adit",
    "Rehan"
  ],

  "XI DKV": [
    "Adel",
    "Alya",
    "Angger",
    "Dennys",
    "Jihan",
    "Fadil",
    "Ijul",
    "Ayu",
    "Rahma",
    "Bowo",
    "Fabyan"
  ]
};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let S, currentFilter = "semua", loginRole = "guru", curScreen = "landing";

// ---------- DATA ----------
function today(d = new Date()) { return d.toISOString().slice(0, 10); }
function nowTime() { const d = new Date(); return String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0"); }
function makeKode(k) { const p = k.split(" "); return (p[1] || "SMP") + ROM[p[0]]; }
function randKode() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 5 }, () => a[Math.floor(Math.random() * a.length)]).join(""); }
function seed() {
  const L = [["SMP","VII"],["SMP","VIII"],["SMP","IX"]];
  ["DKV","RPL","TKJ","TKR"].forEach(j => ["XI","XII"].forEach(k => L.push(["SMK1", k + " " + j])));
  ["MPLB","AKL"].forEach(j => ["XI","XII"].forEach(k => L.push(["SMK2", k + " " + j])));
  const classes = L.map(([sekolah, kelas], i) => ({ id: i + 1, sekolah, kelas, aktif: true, kode: makeKode(kelas) }));
  const students = {}, daily = {}, y = today(new Date(Date.now() - 864e5));
  daily[y] = {};
  classes.forEach((c, i) => {
    const customNames = CUSTOM_STUDENTS[c.kelas];
students[c.id] = customNames
  ? [...customNames]
  : Array.from({ length: 10 + (i % 4) }, (_, k) => NAMES[(k + i) % NAMES.length]);
    if (i % 2 === 0) daily[y][c.id] = { st: "selesai", ping: "08.10", at: "09.10", names: students[c.id].slice(0, 8) };
  });
  return {
    classes, students, daily, nid: 3, session: null, seen: {},
    users: [
      { u: "guru1", pass: "guru123", role: "guru", nama: "Pak Taufik Hidayat", sekolah: ["SMK1"] },
      { u: "guru2", pass: "guru123", role: "guru", nama: "Ibu Tati", sekolah: ["SMK2", "SMP"] },
      { u: "admin", pass: "admin123", role: "operator", nama: "Dzawkan Hanan", sekolah: [] },
    ],
    menu: { 1: "Nasi + Ayam + Sayur + Buah", 2: "Nasi + Telur + Tempe + Pisang", 3: "Nasi + Ikan + Sayur + Jeruk", 4: "Nasi + Ayam + Tahu + Pepaya", 5: "Nasi + Telur + Sayur + Susu", 6: "", 0: "" },
    ann: [{ id: 1, txt: "MBG hari ini bisa sedikit terlambat dari jadwal. Mohon tetap tunggu di kelas.", cid: null, date: y }],
    log: [
      { id: 1, date: y, time: "07.30", txt: "MBG hari ini aktif", sub: "Semua sekolah", color: "purple", cid: null },
      { id: 2, date: y, time: "09.10", txt: "XI RPL selesai mengambil MBG", sub: "SMK 1 · 8 siswa", color: "green", cid: classes.find(c => c.kelas === "XI RPL").id },
    ],
  };
}
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function load() {
  try {
    S = JSON.parse(localStorage.getItem(KEY));
  } catch (e) {
    S = null;
  }

  if (!S) {
    S = seed();
    save();
    return;
  }

  // Gunakan daftar nama khusus untuk kelas tertentu
  S.classes.forEach(c => {
    const customNames = CUSTOM_STUDENTS[c.kelas];

    if (customNames) {
      S.students[c.id] = [...customNames];
    }
  });

  save();
}
const cls = id => S.classes.find(c => c.id == id);
const rec = (cid, d = today()) => (S.daily[d] && S.daily[d][cid]) || { st: "menunggu", names: [] };
function setRec(cid, r) { (S.daily[today()] = S.daily[today()] || {})[cid] = r; }
const user = () => S.session && S.users.find(u => u.u === S.session.u);
function myClasses() {
  const u = user(); if (!u) return [];
  if (u.role === "siswa") return [];
  return S.classes.filter(c => c.aktif && (u.role === "operator" || u.sekolah.includes(c.sekolah)));
}
function pushRiwayat(txt, sub, color, cid = null, op = false) {
  S.log.unshift({ id: S.nid++, date: today(), time: nowTime(), txt, sub, color, cid, op });
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
  const mc = myClasses(), r = mc.map(c => rec(c.id).st);
  return { total: mc.length, selesai: r.filter(x => x === "selesai").length, tiba: r.filter(x => x === "tiba").length, menunggu: r.filter(x => x === "menunggu").length };
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
  const list = (currentFilter === "semua" ? ["SMK1", "SMK2", "SMP"] : [currentFilter]);
  list.forEach(sek => {
    const items = mc.filter(c => c.sekolah === sek); if (!items.length) return;
    const g = document.createElement("div"); g.className = "kelas-group";
    g.innerHTML = `<div class="kelas-group-header"><span>🏫 </span><span>${SEKOLAH_LABEL[sek]}</span><span class="count">${items.length} kelas</span></div><div class="kelas-grid"></div>`;
    items.forEach(c => {
      const r = rec(c.id), m = STATUS_META[r.st];
      const note = r.st === "menunggu" ? "Belum ada ping" : r.st === "tiba" ? `Dikirim ${r.ping}` : `Diambil ${r.at} · ${r.names.length} siswa`;
      const b = document.createElement("button"); b.className = `kelas-card status-${r.st}`;
      b.innerHTML = `<div class="kelas-top"><div><h4>${esc(c.kelas)}</h4><div class="siswa">${(S.students[c.id] || []).length} siswa</div></div></div><span class="status-chip ${m.cls}">${m.label}</span><span class="time-note">${note}</span>`;
      b.onclick = () => kelasModal(c.id); g.querySelector(".kelas-grid").appendChild(b);
    });
    wrap.appendChild(g);
  });
  if (!wrap.innerHTML) wrap.innerHTML = '<p class="group-label">Belum ada kelas aktif untuk akunmu.</p>';
}

// ---------- GURU: LAPORAN ----------
function renderLaporan() {
  const mc = myClasses(); let tot = 0, sudah = 0, tiba = 0, menunggu = 0;
  mc.forEach(c => { const n = (S.students[c.id] || []).length, r = rec(c.id); tot += n; if (r.st === "selesai") { sudah += r.names.length; menunggu += n - r.names.length; } else if (r.st === "tiba") tiba += n; else menunggu += n; });
  $("rep-total").textContent = tot; $("rep-sudah").textContent = sudah; $("rep-menunggu").textContent = tiba; $("rep-belum").textContent = menunggu;
  const col = { green: "var(--green)", orange: "var(--orange)", red: "var(--red)", purple: "var(--purple)", blue: "#1f64c8" };
  $("riwayat-list").innerHTML = visibleLog().slice(0, 30).map(r => `<div class="riwayat-item"><span class="riwayat-dot" style="background:${col[r.color]}"></span><div class="riwayat-body"><strong>${esc(r.txt)}</strong><span>${esc(r.sub)}</span></div><span class="riwayat-time">${r.date === today() ? r.time : r.date.slice(5) + " " + r.time}</span></div>`).join("") || '<p class="group-label">Belum ada riwayat.</p>';
}

// ---------- NOTIFIKASI (semua role) ----------
const NOTIF_ICON = { green: { emoji: "✅", bg: "bg-green" }, orange: { emoji: "🕐", bg: "bg-orange" }, red: { emoji: "⚠️", bg: "bg-red" }, purple: { emoji: "📬", bg: "bg-purple" }, blue: { emoji: "🚚", bg: "bg-purple" } };
function renderNotifikasi() {
  const u = user(); if (!u) return;
  const k = S.session.u, seen = S.seen[k] || 0, all = visibleLog();
  const row = r => { const i = NOTIF_ICON[r.color]; return `<div class="notif-item"><div class="notif-icon ${i.bg}">${i.emoji}</div><div class="notif-body"><strong>${esc(r.txt)}</strong><span>${esc(r.sub)}</span></div><div class="notif-right"><span class="time">${r.date === today() ? r.time : r.date.slice(5)}</span>${r.id > seen ? '<span class="unread-dot"></span>' : ""}</div></div>`; };
  $("notif-today").innerHTML = all.filter(r => r.date === today()).map(row).join("") || '<p class="group-label">Belum ada.</p>';
  $("notif-yesterday").innerHTML = all.filter(r => r.date !== today()).slice(0, 20).map(row).join("") || '<p class="group-label">Belum ada.</p>';
  const n = unread();
  document.querySelectorAll("#bell-badge,#nav-badge").forEach(el => { el.textContent = n; el.classList.toggle("hidden", n === 0); });
}

// ---------- AKUN ----------
function renderAkun() {
  const u = user(), s = S.session; if (!u) return;
  const c = cls(s.cid);
  $("pf-av").textContent = (u.nama || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  $("pf-nama").textContent = u.role === "siswa" ? c.kelas : u.nama;
  $("pf-role").textContent = { guru: "Guru", operator: "Admin / Operator", siswa: "Siswa" }[u.role];
  $("pf-sek").textContent = u.role === "siswa" ? SEK_FULL[c.sekolah] : u.role === "guru" ? u.sekolah.map(x => SEKOLAH_LABEL[x]).join(" & ") : "MBG-ku · Semua sekolah";
  const extra = u.role === "operator" ? '<button class="menu-item" id="m-reset">♻️ &nbsp;Reset Data Demo</button>' : "";
  $("m-extra") && $("m-extra").remove();
  const d = document.createElement("div"); d.id = "m-extra"; d.innerHTML = extra;
  document.querySelector("#screen-akun .menu-list").appendChild(d);
  if ($("m-reset")) $("m-reset").onclick = () => openM("Reset Data Demo", `<p>Semua perubahan lokal dihapus dan data awal dimuat kembali. Kamu akan keluar dari akun.</p><button class="btn-primary" id="m-save">Ya, reset</button>`, () => { localStorage.removeItem(KEY); S = seed(); save(); closeM(); go("landing"); showToast("Data demo direset"); });
}

// ---------- SISWA ----------
function head(t, s) { return `<div class="page-header"><div><h1>${t}</h1><p class="subtitle">${s}</p></div></div>`; }
function renderSiswa() {
  if (!user() || user().role !== "siswa") return;
  const c = cls(S.session.cid), r = rec(c.id), m = STATUS_META[r.st];
  const wali = S.users.filter(x => x.role === "guru" && x.sekolah.includes(c.sekolah)).map(x => x.nama).join(", ") || "-";
  const info = r.st === "menunggu" ? "MBG belum dikirim" : r.st === "tiba" ? `MBG sudah dikirim · ${r.ping}` : `Kamu tercatat mengambil · ${r.at}`;
  const dipilih = r.names.length ? `${r.names.length} / ${(S.students[c.id] || []).length} siswa sudah ambil` : "";
  const mn = menuHariIni(), anns = S.ann.filter(a => a.cid == null || a.cid == c.id);
  $("screen-sberanda").innerHTML = `<header class="hero"><div class="hero-top"><div><h1>Selamat datang 👋</h1><p class="subtitle">${esc(c.kelas)} · ${SEK_FULL[c.sekolah]}</p></div><button class="bell-btn" data-nav="notifikasi">🔔<span class="badge" id="bell-badge"></span></button></div></header>
  <div class="content"><h2 class="section-title">MBG Hari Ini</h2>
  <div class="banner"><div class="banner-icon">${r.st === "selesai" ? "✅" : r.st === "tiba" ? "🚚" : "⏳"}</div><div class="banner-text"><strong>${m.label}</strong><span>${info}</span></div></div>
  ${dipilih ? `<p class="group-label">${dipilih}</p>` : ""}
  <h2 class="section-title">Menu Hari Ini</h2><div class="report-card">${mn.length ? `<div class="menu-tags">${mn.map(x => `<span class="status-chip status-selesai">${esc(x)}</span>`).join("")}</div>` : "Tidak ada MBG hari ini."}</div>
  <h2 class="section-title">Informasi Kelas</h2><div class="report-card"><div class="report-row"><div><strong>${(S.students[c.id] || []).length}</strong><span>Jumlah siswa</span></div><div><strong style="font-size:15px">${esc(wali)}</strong><span>Guru pengelola</span></div></div></div>
  <h2 class="section-title">Pengumuman</h2>${anns.map(a => `<div class="notif-item"><div class="notif-icon bg-orange">📢</div><div class="notif-body"><strong>${esc(a.txt)}</strong><span>${a.cid ? "Kelas" : "Sekolah"} · ${a.date.slice(5)}</span></div></div>`).join("") || '<p class="group-label">Belum ada pengumuman.</p>'}</div>`;
  const days = [...new Set([today(), ...Object.keys(S.daily)])].sort().reverse().slice(0, 14);
  $("screen-sriwayat").innerHTML = head("Riwayat", "MBG kelas " + esc(c.kelas)) + `<div class="content">${days.map(d => { const x = rec(c.id, d), mm = STATUS_META[x.st]; return `<div class="row-card"><div><strong>${d}</strong><span class="sub">${x.st === "selesai" ? x.names.length + " siswa mengambil" : "—"}</span></div><span class="status-chip ${mm.cls}">${mm.label}</span></div>`; }).join("")}</div>`;
}

// ---------- OPERATOR ----------
function renderOperator() {
  if (!user() || user().role !== "operator") return;
  const mc = myClasses(), st = mc.map(c => rec(c.id).st);
  $("screen-okelas").innerHTML = head("Kelola Kelas", `${mc.length} kelas aktif · ${st.filter(x => x === "selesai").length} sudah ambil`) + `<div class="content"><button class="btn-primary add-btn" id="o-add">+ Tambah kelas</button>` + ["SMK1", "SMK2", "SMP"].map(sek => `<p class="group-label">${SEK_FULL[sek]}</p>` + S.classes.filter(c => c.sekolah === sek).map(c => `<div class="row-card"><div><strong>${esc(c.kelas)} ${c.aktif ? "" : "· nonaktif"}</strong><span class="sub">Kode: ${esc(c.kode)} · ${(S.students[c.id] || []).length} siswa · ${STATUS_META[rec(c.id).st].label}</span></div><div><button class="mini-btn" data-a="edit" data-id="${c.id}">Edit</button><button class="mini-btn" data-a="siswa" data-id="${c.id}">Siswa</button><button class="mini-btn" data-a="kode" data-id="${c.id}">Kode</button><button class="mini-btn danger" data-a="tog" data-id="${c.id}">${c.aktif ? "Nonaktif" : "Aktifkan"}</button></div></div>`).join("")).join("") + "</div>";
  $("o-add").onclick = () => kelasForm();
  document.querySelectorAll("#screen-okelas [data-a]").forEach(b => b.onclick = () => {
    const c = cls(b.dataset.id), a = b.dataset.a;
    if (a === "edit") kelasForm(c);
    if (a === "tog") { c.aktif = !c.aktif; pushRiwayat(`Kelas ${c.kelas} ${c.aktif ? "diaktifkan" : "dinonaktifkan"}`, SEKOLAH_LABEL[c.sekolah], "purple", null, true); }
    if (a === "kode") { c.kode = randKode(); pushRiwayat(`Kode ${c.kelas} dibuat ulang`, "Kode baru: " + c.kode, "orange", null, true); showToast("Kode baru: " + c.kode); }
    if (a === "siswa") openM("Siswa " + c.kelas, `<label>Satu nama per baris</label><textarea id="f-sw">${esc((S.students[c.id] || []).join("\n"))}</textarea><button class="btn-primary" id="m-save">Simpan</button>`, () => { S.students[c.id] = $("f-sw").value.split("\n").map(s => s.trim()).filter(Boolean); closeM(); pushRiwayat(`Data siswa ${c.kelas} diperbarui`, S.students[c.id].length + " siswa", "purple", null, true); });
  });
  $("screen-opengguna").innerHTML = head("Pengguna", "Akun Guru & Operator") + `<div class="content"><button class="btn-primary add-btn" id="u-add">+ Tambah akun</button>${S.users.filter(u => u.role !== "siswa").map(u => `<div class="row-card"><div><strong>${esc(u.nama)}</strong><span class="sub">${u.role} · ${esc(u.u)}${u.role === "guru" ? " · " + u.sekolah.map(x => SEKOLAH_LABEL[x]).join(", ") : ""}</span></div><div><button class="mini-btn" data-u="${esc(u.u)}" data-a="pw">Sandi</button>${u.u !== S.session.u ? `<button class="mini-btn danger" data-u="${esc(u.u)}" data-a="del">Hapus</button>` : ""}</div></div>`).join("")}</div>`;
  $("u-add").onclick = userForm;
  document.querySelectorAll("#screen-opengguna [data-u]").forEach(b => b.onclick = () => {
    const u = S.users.find(x => x.u === b.dataset.u);
    if (b.dataset.a === "del") { S.users = S.users.filter(x => x !== u); pushRiwayat("Akun " + u.u + " dihapus", u.role, "red", null, true); }
    else openM("Sandi baru: " + u.u, `<input id="f-pw" type="text" placeholder="Sandi baru" /><button class="btn-primary" id="m-save">Simpan</button>`, () => { if (!$("f-pw").value) return; u.pass = $("f-pw").value; closeM(); pushRiwayat("Sandi " + u.u + " diubah", u.role, "orange", null, true); });
  });
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  $("screen-okonten").innerHTML = head("Konten", "Menu MBG & pengumuman") + `<div class="content"><h2 class="section-title">Master menu</h2>${[1, 2, 3, 4, 5].map(i => `<div class="row-card"><div><strong>${hari[i]}</strong><span class="sub">${esc(S.menu[i])}</span></div><button class="mini-btn" data-m="${i}">Edit</button></div>`).join("")}<h2 class="section-title">Pengumuman</h2><button class="btn-primary add-btn" id="a-add">+ Pengumuman</button>${S.ann.map(a => `<div class="row-card"><div><strong>${esc(a.txt)}</strong><span class="sub">${a.cid ? esc(cls(a.cid).kelas) : "Semua"} · ${a.date}</span></div><button class="mini-btn danger" data-ad="${a.id}">Hapus</button></div>`).join("")}</div>`;
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
function userForm(){
openM("Tambah akun", `<label>Nama</label><input id="f-n" /><label>Nama pengguna</label><input id="f-u" /><label>Sandi</label><input id="f-p" /><label>Peran</label><select id="f-r"><option value="guru">Guru</option><option value="operator">Operator</option></select><label>Sekolah (Guru)</label><select id="f-s" multiple>${Object.keys(SEK_FULL).map(k => `<option value="${k}">${SEK_FULL[k]}</option>`).join("")}</select><button class="btn-primary" id="m-save">Simpan</button>`, () => {
    const u = $("f-u").value.trim(), n = $("f-n").value.trim(), p = $("f-p").value;
    if (!u || !n || !p || S.users.some(x => x.u === u)) return showToast("Lengkapi data / nama pengguna sudah dipakai");
    S.users.push({ u, nama: n, pass: p, role: $("f-r").value, sekolah: [...$("f-s").selectedOptions].map(o => o.value) });
    closeM(); pushRiwayat("Akun " + u + " dibuat", $("f-r").value, "purple", null, true);
  });
}

// ---------- MODAL ----------
const overlay = $("modal-overlay");
function openM(title, html, onSave) { $("modal-title").textContent = title; $("modal-body").innerHTML = html; overlay.classList.remove("hidden"); if ($("m-save") && onSave) $("m-save").onclick = onSave; }
function closeM() { overlay.classList.add("hidden"); }
$("modal-close").onclick = closeM;
overlay.onclick = e => { if (e.target === overlay) closeM(); };

// Modal kelas Guru: ping + pencatatan pickup (data harian)
function kelasModal(cid) {
  const mc = myClasses(); if (!mc.length) return showToast("Tidak ada kelas");
  cid = cid || mc[0].id; const c = cls(cid), r = rec(cid), m = STATUS_META[r.st], sw = S.students[cid] || [];
  const body = `<label>Kelas</label><select id="m-ks">${mc.map(x => `<option value="${x.id}" ${x.id == cid ? "selected" : ""}>${esc(x.kelas)} · ${SEKOLAH_LABEL[x.sekolah]}</option>`).join("")}</select>
  <p><span class="status-chip ${m.cls}">${m.label}</span></p>` + (r.st === "menunggu" ? `<p class="group-label">MBG belum dikirim. Tekan tombol setelah MBG dikirim ke kelas.</p><button class="btn-primary" id="m-save">MBG Sudah Dikirim</button>` : `<label>Siswa yang mengambil hari ini</label>${sw.map((n, i) => `<label class="chk"><input type="checkbox" value="${i}" ${r.names.includes(n) ? "checked" : ""}/> ${esc(n)}</label>`).join("") || '<p class="group-label">Belum ada data siswa.</p>'}<button class="btn-primary" id="m-save" style="margin-top:12px">Simpan pencatatan</button>`);
  openM(c.kelas, body, () => {
    if (r.st === "menunggu") { kirimKelas([c]); closeM(); return; }
    const names = [...document.querySelectorAll("#modal-body .chk input:checked")].map(i => sw[i.value]);
    if (!names.length) { setRec(cid, { st: "tiba", ping: r.ping, names: [] }); }
    else setRec(cid, { st: "selesai", ping: r.ping, at: nowTime(), names });
    closeM(); pushRiwayat(names.length ? `${c.kelas} selesai mengambil MBG` : `${c.kelas} pencatatan dikosongkan`, `${SEKOLAH_LABEL[c.sekolah]} · ${names.length} siswa`, names.length ? "green" : "blue", c.id);
    showToast("Pencatatan disimpan");
  });
  $("m-ks").onchange = () => kelasModal(+$("m-ks").value);
}
function kirimKelas(list) {
  let n = 0; list.forEach(c => { if (rec(c.id).st === "menunggu") { setRec(c.id, { st: "tiba", ping: nowTime(), names: [] }); n++; S.log.unshift({ id: S.nid++, date: today(), time: nowTime(), txt: `MBG sudah dikirim ke ${c.kelas}`, sub: `${SEKOLAH_LABEL[c.sekolah]} · menunggu kedatangan`, color: "blue", cid: c.id }); } });
  save(); renderAll(); showToast(n ? `MBG dikirim ke ${n} kelas` : "Tidak ada kelas yang menunggu");
}

// ---------- NAVIGASI ----------
const NAV = {
  guru: [["beranda", "🏠", "Beranda"], ["laporan", "📊", "Laporan"], "fab", ["notifikasi", "🔔", "Notifikasi"], ["akun", "👤", "Akun"]],
  siswa: [["sberanda", "🏠", "Beranda"], ["sriwayat", "🍱", "Riwayat"], ["notifikasi", "🔔", "Notifikasi"], ["akun", "👤", "Akun"]],
  operator: [["okelas", "🏫", "Kelas"], ["opengguna", "👥", "Pengguna"], ["okonten", "🍽️", "Konten"], ["olog", "📋", "Log"], ["akun", "👤", "Akun"]],
};
function syncBrandTheme(role = "guest") {
  const app = document.querySelector(".app");
  if (!app) return;
  app.dataset.role = role || "guest";
}

function buildNav() {
  const role = S.session.role;
  syncBrandTheme(role);
  $("bottom-nav").innerHTML = NAV[role].map(n => n === "fab" ? '<button class="fab" id="fab-btn">+</button>' : `<button class="nav-item" data-nav="${n[0]}">${n[0] === "notifikasi" ? `<span id="nav-badge-wrap">🔔<span class="nav-badge" id="nav-badge"></span></span>` : n[1]}<span>${n[2]}</span></button>`).join("");
  if ($("fab-btn")) $("fab-btn").onclick = () => kelasModal();
}
function switchScreen(name) {
  curScreen = name;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.nav === name));
  $("notif-today") && name === "notifikasi" && markSeen();
  window.scrollTo(0, 0);
}
function markSeen() { const l = visibleLog(); S.seen[S.session.u] = Math.max(0, ...l.map(x => x.id)); save(); }
const homeOf = { guru: "beranda", siswa: "sberanda", operator: "okelas" };
function go(name) {
  const auth = name !== "landing" && name !== "login";
  syncBrandTheme(auth && S.session ? S.session.role : "guest");
  document.querySelector(".app").classList.toggle("noauth", !auth);
  if (auth) { buildNav(); renderAll(); }
  switchScreen(name);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-nav]"); if (!b || !S.session) return;
  const n = b.dataset.nav, role = S.session.role, ok = NAV[role].some(x => x[0] === n);
  if (ok) { if (n === "notifikasi") renderNotifikasi(); switchScreen(n); setTimeout(renderNotifikasi, 600); }
});
function renderAll() {
  if (!S.session || !user()) return;
  renderStats(); renderKelasList(); renderLaporan(); renderNotifikasi(); renderAkun(); renderSiswa(); renderOperator();
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.nav === curScreen));
}

// ---------- TABS, KIRIM, NOTIF, AKUN ----------
document.querySelectorAll(".tab").forEach(t => t.onclick = () => { document.querySelectorAll(".tab").forEach(x => x.classList.remove("active")); t.classList.add("active"); currentFilter = t.dataset.filter; renderKelasList(); });
$("kirim-btn").onclick = () => $("kirim-menu").classList.toggle("hidden");
document.querySelectorAll("#kirim-menu button").forEach(o => o.onclick = () => { $("kirim-menu").classList.add("hidden"); kirimKelas(myClasses().filter(c => c.sekolah === o.dataset.sekolah)); });
document.addEventListener("click", e => { if (!$("kirim-btn").contains(e.target)) $("kirim-menu").classList.add("hidden"); });
$("tandai-dibaca").onclick = () => { markSeen(); renderNotifikasi(); showToast("Semua notifikasi ditandai dibaca"); };
document.querySelectorAll(".menu-item[data-info]").forEach(i => i.onclick = () => showToast(i.dataset.info));
$("logout-btn").onclick = () => openM("Keluar dari akun?", `<p>Kamu akan kembali ke halaman login.</p><button class="btn-primary" id="m-save">Keluar</button>`, () => { S.session = null; save(); closeM(); resetLoginUI(); go("login"); });

// ---------- LANDING & LOGIN ----------
$("btn-masuk").onclick = () => { const l = $("screen-landing"); l.classList.add("leave"); setTimeout(() => { l.classList.remove("leave"); resetLoginUI(); go("login"); }, 450); };
function selectRole(r) {
  loginRole = r;
  syncBrandTheme(r); document.querySelectorAll(".role-card").forEach(c => c.classList.toggle("sel", c.dataset.role === r));
  $("f-staff").classList.toggle("hidden", r === "siswa"); $("f-siswa").classList.toggle("hidden", r !== "siswa"); $("l-err").textContent = "";
}
function resetLoginUI() {
  syncBrandTheme("guest");
  $("l-kelas").innerHTML = '<option value="">Pilih kelas</option>' + S.classes.filter(c => c.aktif).map(c => `<option value="${c.id}">${SEK_FULL[c.sekolah]} — ${esc(c.kelas)}</option>`).join("");
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
