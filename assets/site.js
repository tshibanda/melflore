/* Melflore : comportements communs (en-tête, animations, newsletter) */
(function () {
  // Renseigner ici les identifiants Klaviyo (clé publique « Site ID » et ID de la liste Newsletter).
  // Tant qu'ils sont vides, les inscriptions arrivent dans Netlify Forms (formulaire « newsletter »).
  var KLAVIYO = { companyId: "", listId: "" };

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
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 24);
    if (mcta) {
      var past = hero ? y > hero.offsetTop + hero.offsetHeight - 120 : y > 520;
      var nearEnd = footer && footer.getBoundingClientRect().top < window.innerHeight + 40;
      mcta.classList.toggle("show", past && !nearEnd);
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
          msg.textContent = "C'est noté. La prochaine Lettre arrive dans votre boîte mail.";
          if (window.gtag) window.gtag("event", "newsletter_signup");
        } else {
          msg.classList.add("err");
          msg.textContent = "L'inscription n'a pas abouti. Réessayez, ou écrivez à contact@melflore.com.";
        }
      });
    });
  });
})();
