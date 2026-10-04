/* SkillGap AI — Second Inning (government -> corporate transition)
   Self-contained: wrapped in an IIFE so it never clashes with script.js.
   Demo storage = browser localStorage (+ Supabase insert if configured). No passwords are stored. */
(function () {
  "use strict";

  var KEYS = {
    profiles: "skillgapai_si_profiles",
    session: "skillgapai_si_session",
    progress: "skillgapai_si_progress_"
  };

  /* ---------------- Data ---------------- */
  var BACKGROUNDS = {
    clerical: { label: "Clerk / Assistant / Office staff", tags: ["documentation", "records", "procedures", "coordination"],
      strengths: ["File & record handling", "Following procedures accurately", "Inter-department coordination", "Working to deadlines"] },
    finance: { label: "Accounts / Revenue / Tax / PSU Bank", tags: ["finance", "compliance", "documentation", "reporting", "records"],
      strengths: ["Accounting & audit discipline", "Rule & regulation compliance", "Statutory reporting", "Handling sensitive data"] },
    teaching: { label: "Teacher / Trainer / Lecturer", tags: ["communication", "training", "planning", "people-mgmt"],
      strengths: ["Explaining complex topics", "Lesson & curriculum planning", "Managing groups", "Assessing progress"] },
    admin: { label: "Administrative / Section / Block officer", tags: ["coordination", "procedures", "stakeholder", "compliance", "planning", "people-mgmt", "documentation", "projects"],
      strengths: ["Running schemes & programmes", "Stakeholder & public dealing", "Policy interpretation", "Leading teams & budgets"] },
    technical: { label: "Engineer / Technical (PWD, PSU, Railways)", tags: ["technical", "projects", "vendors", "compliance", "planning", "procedures"],
      strengths: ["Project execution on site", "Vendor & contractor handling", "Technical standards & safety", "Estimates & planning"] },
    defence: { label: "Ex-serviceman / Police / Defence", tags: ["leadership", "people-mgmt", "security", "logistics", "procedures", "planning", "vendors"],
      strengths: ["Leading large teams", "Discipline under pressure", "Logistics & planning", "Security & risk awareness"] }
  };

  var TARGETS = {
    operations: { label: "Operations Executive / Manager", needs: [
      { s: "Process documentation & SOPs", t: ["documentation", "procedures"] },
      { s: "Vendor & stakeholder coordination", t: ["coordination", "vendors", "stakeholder"] },
      { s: "Excel & business reporting", t: ["reporting", "finance"] },
      { s: "KPI & dashboard thinking", t: [] },
      { s: "Project tools (Trello / Asana / Jira)", t: [] } ] },
    hr: { label: "HR Operations / Talent Partner", needs: [
      { s: "Employee records & policy compliance", t: ["records", "compliance", "documentation"] },
      { s: "Communication & people handling", t: ["communication", "people-mgmt"] },
      { s: "Labour-law basics (corporate view)", t: ["compliance"] },
      { s: "HRIS / ATS tools", t: [] },
      { s: "Recruitment & onboarding basics", t: [] } ] },
    compliance: { label: "Compliance / Risk Analyst", needs: [
      { s: "Regulatory & rule knowledge", t: ["compliance"] },
      { s: "Audit trails & documentation", t: ["documentation", "finance"] },
      { s: "Risk frameworks (ISO 31000, COSO)", t: [] },
      { s: "Structured reporting", t: ["reporting"] },
      { s: "Corporate GRC tools", t: [] } ] },
    data: { label: "MIS / Data Analyst", needs: [
      { s: "Data cleaning & record accuracy", t: ["records", "documentation"] },
      { s: "Advanced Excel", t: ["reporting", "finance"] },
      { s: "SQL basics", t: [] },
      { s: "Dashboards (Power BI / Looker Studio)", t: [] },
      { s: "Business communication", t: ["communication"] } ] },
    pm: { label: "Project / Programme Coordinator", needs: [
      { s: "Planning & timelines", t: ["planning", "projects"] },
      { s: "Stakeholder management", t: ["stakeholder", "coordination"] },
      { s: "Budget tracking", t: ["finance"] },
      { s: "Agile & PM tools", t: [] },
      { s: "Status reporting", t: ["reporting"] } ] },
    learning: { label: "Training / L&D Specialist", needs: [
      { s: "Facilitation & presentation", t: ["training", "communication"] },
      { s: "Curriculum & session design", t: ["planning", "training"] },
      { s: "LMS & digital learning tools", t: [] },
      { s: "Training-needs analysis", t: [] },
      { s: "Measuring learning outcomes", t: ["reporting"] } ] },
    facilities: { label: "Facilities / Security / Admin Manager", needs: [
      { s: "Security & safety protocols", t: ["security", "procedures"] },
      { s: "Team leadership", t: ["leadership", "people-mgmt"] },
      { s: "Vendor & contract management", t: ["vendors", "logistics"] },
      { s: "Compliance & audits (corporate)", t: ["compliance"] },
      { s: "Facility-management software", t: [] } ] }
  };

  var STEPS = [
    "Convert your government experience into corporate resume language",
    "Close your top skill gaps with one focused course or tool each",
    "Build one proof project that mirrors a corporate task",
    "Rewrite LinkedIn and apply to 10 matched roles",
    "Practise 'Tell me about yourself' and 'Why leave government?'"
  ];

  /* ---------------- Helpers ---------------- */
  function $(sel) { return document.querySelector(sel); }
  function read(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ } }
  function esc(text) { var d = document.createElement("div"); d.textContent = String(text == null ? "" : text); return d.innerHTML; }
  function normEmail(v) { return String(v || "").trim().toLowerCase(); }

  function supabaseClient() {
    var c = window.SKILLGAP_SUPABASE;
    if (!c || !c.url || !c.anonKey || String(c.url).indexOf("PASTE_") > -1 || !window.supabase) return null;
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(c.url)) return null; // must be the project API URL, not the dashboard URL
    if (!window.skillgapSupabaseClient) window.skillgapSupabaseClient = window.supabase.createClient(c.url, c.anonKey);
    return window.skillgapSupabaseClient;
  }
  function saveRemote(record) {
    var client = supabaseClient();
    if (!client) return Promise.resolve({ ok: false });
    return client.from("second_inning_profiles").insert(record).then(function (r) { return { ok: !r.error }; }, function () { return { ok: false }; });
  }

  /* Build the personalised result from a profile */
  function buildPlan(profile) {
    var bg = BACKGROUNDS[profile.background], target = TARGETS[profile.target];
    if (!bg || !target) return null;
    var have = [], gaps = [];
    target.needs.forEach(function (n) {
      var covered = n.t.some(function (t) { return bg.tags.indexOf(t) > -1; });
      (covered ? have : gaps).push(n.s);
    });
    var score = Math.round((have.length / target.needs.length) * 100);
    var g = gaps.slice(0, 3);
    var weeks = [
      { w: "Week 1", t: "Translate your experience", d: "Rewrite your service record as outcomes: budgets handled, people led, files cleared, schemes delivered. Drop department jargon." },
      { w: "Weeks 2–3", t: "Close gap #1 and #2", d: (g[0] ? g[0] : "Core tools for the role") + (g[1] ? " and " + g[1] : "") + ". One short course or tutorial each, practised on real sample data." },
      { w: "Week 4", t: "Build one proof project", d: "Make one small, shareable piece of work for a " + target.label + " task (a process map, report, dashboard or training plan)." },
      { w: "Week 5", t: "Profile & applications", d: "Update LinkedIn, then apply to 10 roles that match. Talk to 3 people already working in this role." },
      { w: "Week 6", t: "Interview practice", d: "Prepare answers for 'Why leave government?' and 'How will you work at corporate pace?' using your proof project." }
    ];
    return { bg: bg, target: target, have: have, gaps: gaps, score: score, weeks: weeks };
  }

  /* ---------------- Page: select options ---------------- */
  function fillSelect(select, map) {
    if (!select) return;
    Object.keys(map).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = map[k].label; select.appendChild(o);
    });
  }
  fillSelect($("#siBackground"), BACKGROUNDS);
  fillSelect($("#siTarget"), TARGETS);

  /* ---------------- Page: signup (second-inning-login.html + landing form) ---------------- */
  var signup = $("#siSignup");
  if (signup) {
    signup.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(signup);
      var record = {
        name: String(f.get("name") || "").trim(),
        email: normEmail(f.get("email")),
        phone: String(f.get("phone") || "").trim(),
        background: String(f.get("background") || ""),
        target: String(f.get("target") || ""),
        years_service: String(f.get("years") || ""),
        status: String(f.get("status") || ""),
        source: "second-inning"
      };
      var status = $("#siSignupStatus");
      if (!record.name || !record.email || !BACKGROUNDS[record.background] || !TARGETS[record.target]) {
        if (status) status.textContent = "Please fill name, email, your current background and target role.";
        return;
      }
      var list = read(KEYS.profiles, []).filter(function (p) { return p.email !== record.email; });
      record.createdAt = new Date().toISOString();
      list.unshift(record);
      write(KEYS.profiles, list);
      write(KEYS.session, { email: record.email });
      if (status) status.textContent = "Profile created. Opening your dashboard…";
      var remote = { name: record.name, email: record.email, phone: record.phone, background: record.background, target: record.target, years_service: record.years_service, status: record.status, source: record.source };
      saveRemote(remote).then(function () { window.location.href = "second-inning-dashboard.html"; });
    });
  }

  var signin = $("#siSignin");
  if (signin) {
    signin.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = normEmail(new FormData(signin).get("email"));
      var found = read(KEYS.profiles, []).filter(function (p) { return p.email === email; })[0];
      var status = $("#siSigninStatus");
      if (!found) { if (status) status.textContent = "No profile for this email on this browser. Create one on the left."; return; }
      write(KEYS.session, { email: email });
      window.location.href = "second-inning-dashboard.html";
    });
  }

  /* ---------------- Page: dashboard ---------------- */
  var dash = $("#siDashboard");
  if (dash) {
    var session = read(KEYS.session, null);
    var profile = session && read(KEYS.profiles, []).filter(function (p) { return p.email === session.email; })[0];
    var empty = $("#siEmpty");
    if (!profile) {
      dash.hidden = true; if (empty) empty.hidden = false;
    } else {
      var plan = buildPlan(profile);
      if (empty) empty.hidden = true;
      dash.hidden = false;
      $("#siWelcome").textContent = "Welcome, " + profile.name.split(" ")[0] + ".";
      $("#siMeta").innerHTML = "<span>" + esc(plan.bg.label) + "</span><span>→ " + esc(plan.target.label) + "</span>" +
        (profile.years_service ? "<span>" + esc(profile.years_service) + " service</span>" : "") +
        (profile.status ? "<span>" + esc(profile.status) + "</span>" : "");
      $("#siScore").textContent = plan.score + "%";
      $("#siHaveCount").textContent = plan.have.length;
      $("#siGapCount").textContent = plan.gaps.length;
      $("#siStrengths").innerHTML = plan.bg.strengths.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
      $("#siHave").innerHTML = plan.have.length ? plan.have.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") : "<li class=\"empty\">No direct match yet. Your plan starts from the basics.</li>";
      $("#siGaps").innerHTML = plan.gaps.length ? plan.gaps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") : "<li class=\"empty\">No major gaps. Focus on proof and applications.</li>";
      $("#siWeeks").innerHTML = plan.weeks.map(function (w) {
        return "<div class=\"phase\"><div class=\"phase-when\"><strong>" + esc(w.w) + "</strong></div><div><h3>" + esc(w.t) + "</h3><p>" + esc(w.d) + "</p></div></div>";
      }).join("");

      var progKey = KEYS.progress + profile.email;
      var done = read(progKey, []);
      var box = $("#siChecklist");
      function paint() {
        box.innerHTML = STEPS.map(function (s, i) {
          return "<label class=\"check-row\"><input type=\"checkbox\" data-i=\"" + i + "\"" + (done.indexOf(i) > -1 ? " checked" : "") + " /><span>" + esc(s) + "</span></label>";
        }).join("");
        $("#siProgress").textContent = done.length + " of " + STEPS.length + " steps done";
        $("#siProgressBar").style.width = Math.round(done.length / STEPS.length * 100) + "%";
      }
      box.addEventListener("change", function (e) {
        var i = Number(e.target.getAttribute("data-i"));
        done = e.target.checked ? done.concat(i).filter(function (v, k, a) { return a.indexOf(v) === k; }) : done.filter(function (v) { return v !== i; });
        write(progKey, done); paint();
      });
      paint();

      var out = $("#siSignOut");
      if (out) out.addEventListener("click", function () { localStorage.removeItem(KEYS.session); window.location.href = "second-inning.html"; });
      var wa = $("#siWhatsApp");
      if (wa) wa.href = "https://wa.me/919818114438?text=" + encodeURIComponent("Hi SkillGapAI, I am " + profile.name + ". I want a Second Inning review: " + plan.bg.label + " to " + plan.target.label + ".");
    }
  }

  /* ---------------- Page: admin list (admin.html) ---------------- */
  var siList = $("#siList");
  function csvCell(v) { return "\"" + String(v == null ? "" : v).replace(/"/g, "\"\"") + "\""; }
  function renderAdmin() {
    if (!siList) return;
    var items = read(KEYS.profiles, []);
    siList.innerHTML = items.length ? "" : "<p class=\"empty-state\">No Second Inning profiles saved yet.</p>";
    items.forEach(function (p) {
      var a = document.createElement("article"), t = document.createElement("strong"), c = document.createElement("span"), d = document.createElement("span");
      a.className = "data-item";
      t.textContent = p.name || "Unknown";
      c.textContent = (p.email || "No email") + " | " + (p.phone || "No phone");
      d.textContent = (BACKGROUNDS[p.background] ? BACKGROUNDS[p.background].label : p.background) + " → " + (TARGETS[p.target] ? TARGETS[p.target].label : p.target);
      a.append(t, c, d); siList.appendChild(a);
    });
  }
  renderAdmin();
  var exp = $("#exportSi");
  if (exp) exp.addEventListener("click", function () {
    var rows = read(KEYS.profiles, []);
    if (!rows.length) { alert("No saved data found yet."); return; }
    var h = Object.keys(rows[0]);
    var csv = [h.join(",")].concat(rows.map(function (r) { return h.map(function (k) { return csvCell(r[k]); }).join(","); })).join("\n");
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "skillgapai-second-inning-profiles.csv"; link.click(); URL.revokeObjectURL(link.href);
  });
  var clr = $("#clearDemoData");
  if (clr && siList) clr.addEventListener("click", function () { localStorage.removeItem(KEYS.profiles); localStorage.removeItem(KEYS.session); renderAdmin(); });
})();
