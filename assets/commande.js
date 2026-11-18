/* Parcours de commande Melflore : /commande (informations), /commande/paiement (récapitulatif + Stripe), recommandation sur /merci. */
(function () {
  var d = document, M = window.MF;
  if (!M) return;
  var q = new URLSearchParams(location.search);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function track(path, title) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: path, title: title, event: true }); } catch (e) {} }
  var CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function prixHTML(o, grand) {
    var cls = grand ? "o-price o-price-l" : "o-price";
    var h = '<p class="' + cls + '">' + (o.prixBarre ? '<s>' + M.eur(o.prixBarre) + '</s> ' : "") + M.eur(o.prix) + (o.mensuel ? '<span> / mois</span>' : "") + "</p>";
    var sub = o.mensuel ? "TVA non applicable · sans engagement" : !o.tiers ? "TVA non applicable · paiement en une fois" : "TVA non applicable · ou 3 × " + M.eur(o.tiers[0]) + " sans frais";
    return h + '<p class="o-sub">' + sub + "</p>";
  }
  function listeHTML(o) {
    return '<ul class="o-list">' + o.inclus.map(function (x) { return "<li>" + CHECK + "<span>" + esc(x) + "</span></li>"; }).join("") +
      o.exclus.map(function (x) { return '<li class="no"><span>Sans ' + esc(x.charAt(0).toLowerCase() + x.slice(1)) + "</span></li>"; }).join("") + "</ul>";
  }

  /* ---------- Étape 1 : informations ---------- */
  var form = d.querySelector('form[name="commande"]');
  if (form) {
    var sel = form.querySelector('select[name="offre"]');
    var id = q.get("offre") || (M.store("mf_commande") || {}).offre || "rituel";
    if (!M.get(id)) id = "rituel";
    if (id === "lancement" && !M.lancementOuvert) id = "rituel";
    if (!M.lancementOuvert) { var opt = sel.querySelector('option[value="lancement"]'); if (opt) opt.remove(); }
    sel.value = id;

    var aside = d.getElementById("o-aside");
    function renderAside() {
      var o = M.get(sel.value);
      aside.innerHTML = '<p class="eyebrow">Votre offre</p><h2 class="o-name">' + esc(o.nom) + '</h2><p class="o-tag">' + esc(o.accroche) + "</p>" +
        prixHTML(o) + (o.condition ? '<p class="o-note">' + esc(o.condition) + "</p>" : "") + listeHTML(o) +
        (o.delai ? '<p class="o-delai">En ligne en ' + esc(o.delai) + " de travail, hors temps de validation de votre côté</p>" : "") +
        (o.garantie ? '<p class="o-gar">' + esc(o.garantie) + "</p>" : "");
      var b = form.querySelector('button[type="submit"] .lbl');
      if (b) b.textContent = "Continuer vers le paiement";
    }
    sel.addEventListener("change", renderAside);
    renderAside();

    // Pré-remplissage : commande précédente, sinon demande d'audit
    var prev = M.store("mf_commande") || M.store("mf_audit") || {};
    ["prenom", "nom", "email", "marque", "url", "telephone", "outil", "ca"].forEach(function (n) {
      var el = form.elements[n];
      if (el && prev[n] && !el.value) el.value = prev[n];
    });
    if (q.get("url") && form.elements.url) form.elements.url.value = q.get("url");

    form.addEventListener("invalid", function (e) {
      var el = e.target;
      if (el.validity.valueMissing) el.setCustomValidity(el.type === "checkbox" ? "Cochez cette case pour continuer." : "Ce champ est nécessaire pour préparer votre commande.");
      else if (el.validity.typeMismatch) el.setCustomValidity("Indiquez une adresse email valide, par exemple camille@votre-marque.fr.");
    }, true);
    form.addEventListener("input", function (e) { e.target.setCustomValidity(""); }, true);
    form.addEventListener("change", function (e) { e.target.setCustomValidity(""); }, true);

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (form.site_web && form.site_web.value) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.querySelector(".lbl").textContent = "Préparation du paiement…";
      var prevRef = (M.store("mf_commande") || {}).ref;
      var ref = prevRef || M.ref();
      form.elements.ref.value = ref;
      var data = {};
      ["offre", "prenom", "nom", "email", "marque", "url", "telephone", "outil", "ca", "message", "ref"].forEach(function (n) { if (form.elements[n]) data[n] = String(form.elements[n].value || "").trim().slice(0, 500); });
      M.store("mf_commande", data);
      track("commande-informations-" + data.offre, "Commande : informations envoyées");

      var o = M.get(data.offre);
      if (window.MF_kpost) {
        window.MF_kpost("events", { data: { type: "event", attributes: {
          properties: { offre: o.nom, montant: o.prix, reference: ref, marque: data.marque, boutique: data.url, ca_mensuel: data.ca, outil_email: data.outil, message: data.message },
          metric: { data: { type: "metric", attributes: { name: "Commande démarrée" } } },
          profile: { data: { type: "profile", attributes: { email: data.email, first_name: data.prenom, last_name: data.nom, organization: data.marque, properties: { boutique: data.url, ca_mensuel: data.ca, outil_email: data.outil } } } }
        } } });
      }
      var body = new URLSearchParams(new FormData(form)).toString();
      var go = function () { location.href = "/commande/paiement?offre=" + encodeURIComponent(data.offre); };
      var timer = setTimeout(go, 4000);
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
        .catch(function () {}).then(function () { clearTimeout(timer); go(); });
    });
  }

  /* ---------- Étape 2 : paiement ---------- */
  var payRoot = d.getElementById("pay-root");
  if (payRoot) {
    var oid = q.get("offre") || (M.store("mf_commande") || {}).offre || "rituel";
    var o = M.get(oid) || M.get("rituel");
    var c = M.store("mf_commande") || {};
    var a = M.store("mf_audit") || {};
    var cl = {
      prenom: c.prenom || a.prenom || "", nom: c.nom || "", email: c.email || a.email || "",
      marque: c.marque || "", url: c.url || a.url || "", ref: c.ref || ""
    };
    if (!cl.ref) { cl.ref = M.ref(); c.ref = cl.ref; c.offre = o.id; if (cl.email) { c.email = cl.email; c.prenom = cl.prenom; c.url = cl.url; } M.store("mf_commande", c); }
    if (c.offre !== o.id) { c.offre = o.id; M.store("mf_commande", c); }

    d.title = "Paiement : " + o.nom + " | Melflore";
    d.getElementById("pay-name").textContent = o.nom;
    d.getElementById("pay-tag").textContent = o.accroche;
    d.getElementById("pay-detail").innerHTML = prixHTML(o, true) + (o.condition ? '<p class="o-note">' + esc(o.condition) + "</p>" : "") + listeHTML(o) +
      (o.garantie ? '<p class="o-gar">' + esc(o.garantie) + "</p>" : "");

    var steps = [
      ["Paiement", "Reçu Stripe envoyé immédiatement par email. Facture sous 48 h."],
      ["Juste après", "Vous choisissez le créneau de votre appel de lancement (45 min) et la liste des accès à préparer s'affiche."],
      [o.mensuel ? "Chaque mois" : "En " + o.delai, o.mensuel ? "2 campagnes, l'optimisation des relances et le rapport mensuel." : "Vos relances sont en ligne, après validation de chaque texte par vous."],
      [o.mensuel ? "Sans engagement" : "À 30 jours", o.mensuel ? "Résiliation par simple email, avec un préavis de 30 jours." : "Le rapport chiffré du chiffre d'affaires généré, relance par relance."]
    ];
    d.getElementById("pay-next").innerHTML = steps.map(function (s, i) { return '<li><span class="n">0' + (i + 1) + "</span><div><p class=\"t\">" + esc(s[0]) + "</p><p>" + esc(s[1]) + "</p></div></li>"; }).join("");

    var who = d.getElementById("pay-who");
    if (cl.email) {
      who.innerHTML = '<p class="t">' + esc([cl.prenom, cl.nom].join(" ").trim() || cl.email) + (cl.marque ? " · " + esc(cl.marque) : "") + "</p><p>" + esc(cl.email) + (cl.url ? " · " + esc(cl.url) : "") + '</p><a href="/commande?offre=' + o.id + '">Modifier</a>';
    } else {
      who.innerHTML = '<p>Vous renseignerez votre nom, votre entreprise et votre adresse de facturation sur la page sécurisée de Stripe.</p><a href="/commande?offre=' + o.id + '">Ou compléter mes informations d\'abord</a>';
    }

    function stripeUrl(base) {
      var p = new URLSearchParams();
      if (cl.email) p.set("prefilled_email", cl.email);
      p.set("client_reference_id", cl.ref + "-" + o.id);
      return base + "?" + p.toString();
    }
    var modes = d.getElementById("pay-modes"), btn = d.getElementById("pay-btn"), help = d.getElementById("pay-help");
    d.getElementById("pay-ref").textContent = cl.ref;
    d.getElementById("pay-line").innerHTML = "<span>" + esc(o.nom) + "</span><span>" + M.eur(o.prix) + (o.mensuel ? " / mois" : "") + "</span>";
    d.getElementById("pay-total").innerHTML = "<span>Total" + (o.mensuel ? " mensuel" : "") + "</span><span>" + M.eur(o.prix) + "</span>";

    function setMode(m) {
      if (m === "3x") {
        btn.href = stripeUrl(M.stripeFacture);
        btn.querySelector(".lbl").textContent = "Payer le 1er tiers : " + M.eur(o.tiers[0]);
        help.innerHTML = "Sur la page Stripe, saisissez le montant <strong>" + M.eur(o.tiers[0]) + "</strong> et la référence <strong>" + esc(cl.ref) + "</strong>. Le 2e tiers (" + M.eur(o.tiers[1]) + ") est facturé à la mise en ligne, le 3e (" + M.eur(o.tiers[2]) + ") 30 jours après.";
        help.style.display = "block";
      } else {
        btn.href = stripeUrl(o.stripe);
        btn.querySelector(".lbl").textContent = o.mensuel ? (o.libre ? "Régler le 1er mois : " + M.eur(o.prix) : "Souscrire : " + M.eur(o.prix) + " / mois") : "Payer " + M.eur(o.prix) + " par carte";
        if (o.libre) { help.innerHTML = "Sur la page Stripe, saisissez le montant <strong>" + M.eur(o.prix) + "</strong> et la référence <strong>" + esc(cl.ref) + "</strong>." + (o.mensuel ? " Le lien de prélèvement des mois suivants vous est envoyé par email." : ""); help.style.display = "block"; }
        else help.style.display = "none";
      }
      btn.dataset.mode = m;
    }
    if (o.mensuel || !o.tiers) { modes.style.display = "none"; setMode("1x"); }
    else {
      modes.innerHTML = '<label class="mode"><input type="radio" name="mode" value="1x" checked><span><strong>En une fois</strong><em>' + M.eur(o.prix) + "</em></span></label>" +
        '<label class="mode"><input type="radio" name="mode" value="3x"><span><strong>En 3 fois sans frais</strong><em>3 × ' + M.eur(o.tiers[0]) + "</em></span></label>";
      modes.addEventListener("change", function (e) { if (e.target.name === "mode") setMode(e.target.value); });
      setMode("1x");
    }
    btn.addEventListener("click", function () { track("clic-paiement-" + o.id + "-" + btn.dataset.mode, "Clic paiement " + o.nom); });
    track("commande-paiement-vue-" + o.id, "Commande : page de paiement");
  }

  /* ---------- Après une demande d'audit : offre recommandée ---------- */
  var reco = d.getElementById("reco");
  if (reco) {
    var au = M.store("mf_audit");
    if (au && au.email) {
      var r = M.recommander(au.ca), ro = M.get(r.id), alt = M.get(r.alt);
      var intro = (au.prenom ? esc(au.prenom) + ", d" : "D") + "'après ce que vous nous avez indiqué" + (au.ca ? " (" + esc(au.ca.replace(/^Moins/, "moins").replace(/^Plus/, "plus")) + " par mois" + (au.outil ? ", " + esc(au.outil) : "") + ")" : "") + ", voici le pack que nous vous conseillons.";
      reco.innerHTML =
        '<div class="reco-head"><p class="eyebrow">Notre recommandation</p><h2>Pas besoin d\'attendre l\'audit pour démarrer</h2><p>' + intro + " Vous pouvez aussi attendre votre vidéo : l'offre reste la même.</p></div>" +
        '<div class="reco-grid"><div class="glass reco-card main"><span class="badge">Conseillé pour vous</span><h3>' + esc(ro.nom) + "</h3><p class=\"o-tag\">" + esc(ro.accroche) + "</p>" + prixHTML(ro, true) +
        (ro.condition ? '<p class="o-note">' + esc(ro.condition) + "</p>" : "") + '<p class="why">' + esc(r.pourquoi) + "</p>" + listeHTML(ro) +
        '<a class="btn" href="/commande/paiement?offre=' + ro.id + '" data-reco="' + ro.id + '">Payer et démarrer ' + esc(ro.article) + "</a></div>" +
        '<div class="reco-card alt"><h3>' + esc(alt.nom) + '</h3><p class="o-tag">' + esc(alt.accroche) + "</p>" + prixHTML(alt) + listeHTML(alt) +
        '<a class="btn-ghost" href="/commande/paiement?offre=' + alt.id + '" data-reco="' + alt.id + '">Choisir ' + esc(alt.article) + "</a></div></div>" +
        '<p class="reco-foot">Paiement sécurisé par Stripe · en une fois ou en 3 fois sans frais · <a href="/#tarifs">comparer toutes les offres</a></p>';
      reco.style.display = "flex";
      reco.addEventListener("click", function (e) { var x = e.target.closest && e.target.closest("a[data-reco]"); if (x) track("clic-reco-" + x.dataset.reco, "Clic offre recommandée"); });
      track("reco-vue-" + ro.id, "Offre recommandée affichée");
    }
  }
})();
