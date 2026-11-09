/* Melflore : comportements communs (en-tête, animations, newsletter) */
(function () {
  // Klaviyo : clé publique (Site ID) et liste « Lettre Melflore » (double opt-in).
  // Chaque inscription est aussi enregistrée dans Netlify Forms (formulaire « newsletter »), en secours.
  var KLAVIYO = { companyId: "VTL8z3", listId: "Tk8FMS" };

  var d = document, root = d.documentElement;
  root.classList.add("js");

  // En-tête collant
  var header = d.querySelector("header.wrap");
  if (header) header.classList.add("site-header");
  var mcta = d.querySelector(".mcta");
  var hero = d.getElementById("top");
  var footer = d.querySelector("footer");
  var readbar = d.querySelector(".readbar");
  var art = d.querySelector("article.art");
  var ticking = false;
  var inlineForms = d.querySelectorAll("form.inputbar, form.nl-form");
  var spyLinks = header ? Array.prototype.filter.call(header.querySelectorAll('nav a[href^="#"]'), function (a) { return a.getAttribute("href").length > 1 && d.getElementById(a.getAttribute("href").slice(1)); }) : [];
  function formVisible() {
    for (var i = 0; i < inlineForms.length; i++) {
      var r = inlineForms[i].getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) return true;
    }
    return false;
  }
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 24);
    if (mcta) {
      var past = hero ? y > hero.offsetTop + hero.offsetHeight - 120 : y > 520;
      var nearEnd = footer && footer.getBoundingClientRect().top < window.innerHeight + 40;
      mcta.classList.toggle("show", past && !nearEnd && !formVisible() && !root.classList.contains("menu-open"));
    }
    if (spyLinks.length) {
      var current = null;
      spyLinks.forEach(function (a) {
        var s = d.getElementById(a.getAttribute("href").slice(1));
        if (s.getBoundingClientRect().top < window.innerHeight * 0.35) current = a;
      });
      spyLinks.forEach(function (a) { a.classList.toggle("active", a === current); });
    }
    if (readbar && art) {
      var r = art.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      readbar.style.width = (p * 100).toFixed(1) + "%";
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Menu mobile : reprend les liens masqués sur petit écran
  var nav = header && header.querySelector("nav");
  var hidden = nav ? nav.querySelectorAll("a.hide-sm") : [];
  if (hidden.length) {
    var burger = d.createElement("button");
    burger.type = "button";
    burger.className = "burger";
    burger.setAttribute("aria-label", "Ouvrir le menu");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-controls", "menu-mobile");
    burger.innerHTML = "<span></span><span></span>";
    var panel = d.createElement("div");
    panel.id = "menu-mobile";
    panel.className = "mmenu";
    panel.hidden = true;
    var links = "";
    hidden.forEach(function (a) { links += '<a href="' + a.getAttribute("href") + '">' + a.textContent + '</a>'; });
    links += '<a href="/newsletter">Newsletter</a>';
    panel.innerHTML = '<nav aria-label="Menu principal">' + links + '</nav><a class="btn" href="/audit">Recevoir mon audit offert</a><p>Vidéo de 3 minutes et estimation chiffrée, sous 4 jours ouvrés.</p>';
    nav.appendChild(burger);
    header.appendChild(panel);
    var setMenu = function (open) {
      panel.hidden = !open;
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      root.classList.toggle("menu-open", open);
      onScroll();
    };
    burger.addEventListener("click", function () { setMenu(panel.hidden); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { setMenu(false); burger.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 640 && !panel.hidden) setMenu(false); });
  }

  // Sommaire automatique des articles
  if (art) {
    var h2s = art.querySelectorAll(":scope > h2");
    var meta = art.querySelector(".meta");
    if (h2s.length >= 3 && meta) {
      var toc = d.createElement("nav");
      toc.className = "toc-box";
      toc.setAttribute("aria-label", "Sommaire");
      var items = "";
      h2s.forEach(function (h, i) {
        if (!h.id) h.id = "s" + (i + 1) + "-" + h.textContent.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
        items += '<li><a href="#' + h.id + '">' + h.textContent.replace(/^\d+\.\s*/, "") + "</a></li>";
      });
      toc.innerHTML = '<p class="eyebrow">Sommaire</p><ol>' + items + "</ol>";
      meta.insertAdjacentElement("afterend", toc);
    }
  }

  // Formulaire d'audit : erreurs lisibles et état d'envoi
  d.querySelectorAll('form[name="audit"]').forEach(function (f) {
    f.addEventListener("submit", function () {
      var b = f.querySelector('button[type="submit"]');
      if (b && f.checkValidity()) { b.disabled = true; b.dataset.label = b.innerHTML; b.textContent = "Envoi en cours…"; }
    });
    f.addEventListener("invalid", function (e) {
      var el = e.target;
      el.classList.add("touched");
      if (el.validity.valueMissing) el.setCustomValidity(el.type === "checkbox" ? "Cochez cette case pour que l'on puisse réaliser votre audit." : "Ce champ est nécessaire pour préparer votre audit.");
      else if (el.validity.typeMismatch) el.setCustomValidity("Indiquez une adresse email valide, par exemple camille@votre-marque.fr.");
    }, true);
    f.addEventListener("input", function (e) { e.target.setCustomValidity(""); }, true);
    f.addEventListener("change", function (e) { e.target.setCustomValidity(""); }, true);
  });

  // Apparition au défilement
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var targets = d.querySelectorAll("section.wrap:not(#top) > *, .g4 > *, .g3 > *, .cards > *, .nl, .art > h2");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (el) {
      if (el.closest(".rv")) return;
      var parent = el.parentElement;
      if (parent && /\b(g3|g4|cards)\b/.test(parent.className)) {
        el.style.setProperty("--d", (Array.prototype.indexOf.call(parent.children, el) % 4) * 0.08 + "s");
      }
      el.classList.add("rv");
      io.observe(el);
    });
  }

  // Newsletter
  function post(url, body, headers) {
    return fetch(url, { method: "POST", headers: headers, body: body }).then(function (r) {
      if (!r.ok && r.status !== 202) throw new Error(r.status);
    });
  }
  d.querySelectorAll("form.nl-form").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var msg = form.querySelector(".nl-msg");
      var btn = form.querySelector("button");
      var email = (form.email.value || "").trim();
      if (form.site_web && form.site_web.value) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = "Cette adresse email ne semble pas valide.";
        msg.classList.add("err");
        form.email.focus();
        return;
      }
      msg.classList.remove("err");
      msg.textContent = "Inscription en cours…";
      btn.disabled = true;
      var fd = new URLSearchParams(new FormData(form));
      fd.set("page", location.pathname);
      var jobs = [post("/", fd.toString(), { "Content-Type": "application/x-www-form-urlencoded" })];
      if (KLAVIYO.companyId && KLAVIYO.listId) {
        jobs.push(post("https://a.klaviyo.com/client/subscriptions/?company_id=" + encodeURIComponent(KLAVIYO.companyId),
          JSON.stringify({ data: { type: "subscription", attributes: {
            custom_source: "melflore.com " + location.pathname,
            profile: { data: { type: "profile", attributes: { email: email, properties: { source_page: location.pathname } } } }
          }, relationships: { list: { data: { type: "list", id: KLAVIYO.listId } } } } }),
          { "Content-Type": "application/json", revision: "2024-10-15" }));
      }
      Promise.allSettled(jobs).then(function (res) {
        var ok = res.some(function (r) { return r.status === "fulfilled"; });
        btn.disabled = false;
        if (ok) {
          form.reset();
          msg.textContent = "Merci ! Confirmez votre inscription dans l'email que vous venez de recevoir.";
          if (window.gtag) window.gtag("event", "newsletter_signup");
        } else {
          msg.classList.add("err");
          msg.textContent = "L'inscription n'a pas abouti. Réessayez, ou écrivez à contact@melflore.com.";
        }
      });
    });
  });
})();
