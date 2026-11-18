/* Prise de rendez-vous Melflore : la personne choisit jusqu'à 3 créneaux, Melflore confirme par email.
   Pour changer les horaires proposés, modifier CRENEAUX ci-dessous (heure de Paris). */
(function () {
  var CRENEAUX = {
    1: ["12:30", "18:30"], // lundi
    2: ["12:30", "18:30"], // mardi
    3: ["12:30", "18:30"], // mercredi
    4: ["12:30", "18:30"], // jeudi
    5: ["12:30", "18:30"], // vendredi
    6: ["10:00", "11:30"]  // samedi
  };
  var JOURS_AFFICHES = 10;     // nombre de jours proposés
  var MAX_CHOIX = 3;
  var FERIES = ["2026-12-25", "2027-01-01", "2027-03-29", "2027-05-01", "2027-05-06", "2027-05-08", "2027-05-17", "2027-07-14", "2027-08-15", "2027-11-01", "2027-11-11", "2027-12-25"];

  var d = document;
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function iso(x) { return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function jours() {
    var out = [], x = new Date();
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() + 1); // au plus tôt le lendemain
    while (out.length < JOURS_AFFICHES) {
      var h = CRENEAUX[x.getDay()];
      if (h && h.length && FERIES.indexOf(iso(x)) === -1) out.push({ date: new Date(x), heures: h });
      x.setDate(x.getDate() + 1);
    }
    return out;
  }

  function init() {
    var form = d.getElementById("rdv-form");
    if (!form) return;
    var box = d.getElementById("rdv-slots"), count = d.getElementById("rdv-count"), err = d.getElementById("rdv-err");

    box.innerHTML = jours().map(function (j) {
      var label = JOURS[j.date.getDay()] + " " + j.date.getDate() + " " + MOIS[j.date.getMonth()];
      return '<div class="slot-day"><p class="slot-d">' + esc(label.charAt(0).toUpperCase() + label.slice(1)) + '</p><div class="slot-h">' +
        j.heures.map(function (h) {
          var v = label + " à " + h.replace(":", "h");
          return '<label class="slot"><input type="checkbox" value="' + esc(v) + '"><span>' + esc(h.replace(":", "h")) + "</span></label>";
        }).join("") + "</div></div>";
    }).join("");

    function choisis() { return Array.prototype.slice.call(box.querySelectorAll("input:checked")).map(function (i) { return i.value; }); }
    box.addEventListener("change", function (e) {
      var c = choisis();
      if (c.length > MAX_CHOIX) { e.target.checked = false; c = choisis(); }
      Array.prototype.forEach.call(box.querySelectorAll("input"), function (i) { i.disabled = !i.checked && c.length >= MAX_CHOIX; });
      count.textContent = c.length ? c.length + " créneau" + (c.length > 1 ? "x" : "") + " choisi" + (c.length > 1 ? "s" : "") + " sur " + MAX_CHOIX : "Choisissez jusqu'à " + MAX_CHOIX + " créneaux qui vous conviennent.";
      err.textContent = "";
    });

    // Pré-remplissage depuis la commande en cours
    try {
      var M = window.MF, c = (M && M.store("mf_commande")) || {}, a = (M && M.store("mf_audit")) || {};
      var q = new URLSearchParams(location.search);
      var set = function (n, v) { var el = form.elements[n]; if (el && v && !el.value) el.value = v; };
      set("prenom", c.prenom || a.prenom); set("email", c.email || a.email); set("marque", c.marque || a.marque); set("site", c.url || a.url);
      set("ref", c.ref); set("offre", q.get("offre") || c.offre); set("session", q.get("session"));
    } catch (e) {}

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var c = choisis();
      if (!c.length) { err.textContent = "Choisissez au moins un créneau."; box.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
      if (!form.elements.email.value || !/.+@.+\..+/.test(form.elements.email.value)) { err.textContent = "Indiquez une adresse email valide pour recevoir la confirmation."; form.elements.email.focus(); return; }
      form.elements.creneaux_choisis.value = c.join(" | ");
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Envoi…";
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () {
          form.hidden = true;
          var ok = d.getElementById("rdv-ok");
          ok.querySelector(".rdv-list").innerHTML = c.map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("");
          ok.querySelector(".rdv-mail").textContent = form.elements.email.value;
          ok.hidden = false;
          ok.scrollIntoView({ block: "center", behavior: "smooth" });
          if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "rdv-demande-" + (form.elements.contexte.value || ""), title: "Demande de rendez-vous", event: true });
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = "Envoyer mes disponibilités";
          err.innerHTML = "L'envoi n'a pas abouti. Réessayez, ou écrivez-nous vos créneaux à <a href=\"mailto:contact@melflore.com\">contact@melflore.com</a>.";
        });
    });
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init); else init();
})();
