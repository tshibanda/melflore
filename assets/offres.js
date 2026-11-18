/* Offres Melflore : source unique des prix, contenus et liens de paiement Stripe.
   Quand les 2 places de l'offre de lancement sont prises, passer LANCEMENT_OUVERT à false. */
(function () {
  var LANCEMENT_OUVERT = true;
  var STRIPE_FACTURE = "https://buy.stripe.com/00w5kC0Hm2O0aXreNV3Ru05";
  /* Grille du 18/11/2026 : les anciens liens Stripe à prix fixe (990, 1 990, 3 490, 990, 690 €/mois) ne correspondent plus.
     En attendant les nouveaux liens, toutes les offres passent par le lien à montant libre (libre: true).
     Une fois les liens créés dans Stripe, remplacer STRIPE_FACTURE par le lien de l'offre et retirer libre: true. */

  var O = {
    essentiel: {
      id: "essentiel",
      nom: "Essentiel",
      article: "l'Essentiel",
      accroche: "Pour démarrer l'email simplement",
      prix: 590,
      tiers: [197, 197, 196],
      delai: "3 jours ouvrés",
      inclus: [
        "3 relances : bienvenue, panier abandonné, post-achat",
        "~6 emails écrits dans votre ton",
        "Pop-up d'inscription simple",
        "Délivrabilité configurée",
        "Rapport à 30 jours"
      ],
      exclus: ["Personnalisation selon la peau", "Garantie résultat"],
      garantie: "",
      libre: true,
      stripe: STRIPE_FACTURE
    },
    rituel: {
      id: "rituel",
      nom: "Rituel",
      article: "le Rituel",
      accroche: "Votre conseillère beauté complète",
      prix: 990,
      tiers: [330, 330, 330],
      delai: "5 jours ouvrés",
      inclus: [
        "5 relances : bienvenue, navigation abandonnée, panier abandonné, post-achat, reconquête",
        "~12 emails personnalisés selon la peau",
        "Pop-up avec la question de peau",
        "Segmentation par préoccupation",
        "Rapport chiffré à 30 jours"
      ],
      exclus: [],
      garantie: "Garantie résultat : pas de commande générée à 30 jours, on continue gratuitement jusqu'à 60 jours de plus.",
      libre: true,
      stripe: STRIPE_FACTURE
    },
    rituelplus: {
      id: "rituelplus",
      nom: "Rituel+",
      article: "le Rituel+",
      accroche: "Pour les marques qui veulent aller plus loin",
      prix: 1790,
      tiers: [597, 597, 596],
      delai: "8 jours ouvrés",
      inclus: [
        "Tout le Rituel : 5 relances personnalisées selon la peau",
        "4 relances avancées : abandon au paiement, réachat par produit, demande d'avis, clientes VIP",
        "~22 emails au total, design d'email sur mesure",
        "Segmentation selon l'historique d'achat",
        "Tests A/B sur 2 relances",
        "Rapports à 30 et 90 jours",
        "2 mois de Suivi mensuel inclus (980 € au tarif normal)"
      ],
      exclus: [],
      garantie: "Garantie résultat prolongée : le suivi continue jusqu'au résultat.",
      libre: true,
      stripe: STRIPE_FACTURE
    },
    lancement: {
      id: "lancement",
      nom: "Rituel · offre de lancement",
      article: "le Rituel en offre de lancement",
      accroche: "Le Rituel complet, au prix de l'Essentiel",
      prix: 590,
      prixBarre: 990,
      tiers: [197, 197, 196],
      delai: "5 jours ouvrés",
      inclus: [
        "Tout le Rituel : 5 relances personnalisées selon la peau",
        "~12 emails personnalisés selon la peau",
        "Pop-up avec la question de peau",
        "Segmentation par préoccupation",
        "Rapport chiffré à 30 jours"
      ],
      exclus: [],
      condition: "Réservée aux 2 premières marques, en échange d'une étude de cas que vous validez avant publication.",
      garantie: "Garantie résultat : pas de commande générée à 30 jours, on continue gratuitement jusqu'à 60 jours de plus.",
      libre: true,
      stripe: STRIPE_FACTURE,
      ouvert: LANCEMENT_OUVERT
    },
    pilote: {
      id: "pilote",
      nom: "Relance panier 48 h",
      article: "la relance panier en 48 h",
      accroche: "Une seule relance, celle qui rapporte le plus vite",
      prix: 290,
      tiers: null,
      libre: true,
      delai: "48 h ouvrées",
      inclus: [
        "Relance de panier abandonné en 3 emails (1 h, 24 h, 72 h), écrits dans votre ton",
        "Aucun envoi la nuit : un panier laissé après 22 h est relancé à 9 h",
        "Installée dans votre Klaviyo, Brevo ou Shopify Email",
        "Test complet avant mise en ligne",
        "Rapport chiffré à 30 jours",
        "Déduite du prix si vous passez à un pack dans les 60 jours"
      ],
      exclus: [],
      garantie: "Pas de vente récupérée à 30 jours : remboursée.",
      stripe: STRIPE_FACTURE
    },
    suivi: {
      id: "suivi",
      nom: "Suivi mensuel",
      article: "le Suivi mensuel",
      accroche: "Vos relances optimisées chaque mois",
      prix: 490,
      mensuel: true,
      tiers: null,
      delai: "",
      inclus: [
        "2 campagnes email par mois",
        "Optimisation continue de vos relances",
        "Rapport mensuel du chiffre d'affaires généré",
        "Disponible avec tous les packs"
      ],
      exclus: [],
      garantie: "Sans engagement : résiliation par simple email, avec un préavis de 30 jours.",
      libre: true,
      stripe: STRIPE_FACTURE
    }
  };

  function eur(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €"; }

  function get(id) {
    var o = O[id];
    if (!o) return null;
    if (o.id === "lancement" && !o.ouvert) return O.rituel;
    return o;
  }

  function ref() {
    var t = Date.now().toString(36).toUpperCase().slice(-5);
    var r = Math.random().toString(36).slice(2, 5).toUpperCase();
    return "MF-" + t + r;
  }

  function store(key, val) {
    try { if (val === undefined) { var v = sessionStorage.getItem(key) || localStorage.getItem(key); return v ? JSON.parse(v) : null; }
      sessionStorage.setItem(key, JSON.stringify(val)); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; }
  }

  // Recommandation après une demande d'audit, selon le chiffre d'affaires indiqué
  function recommander(ca) {
    ca = String(ca || "");
    if (/Moins de 10/.test(ca)) return { id: "essentiel", alt: LANCEMENT_OUVERT ? "lancement" : "rituel",
      pourquoi: "À votre stade, les 3 relances de base sont celles qui rapportent le plus vite : elles accueillent chaque inscrite et rappellent chaque panier." };
    if (/Plus de 150/.test(ca)) return { id: "rituelplus", alt: LANCEMENT_OUVERT ? "lancement" : "rituel",
      pourquoi: "Avec votre volume, chaque relance compte : les relances avancées, les tests A/B et deux mois de suivi font la différence sur un large catalogue." };
    return { id: LANCEMENT_OUVERT ? "lancement" : "rituel", alt: "essentiel",
      pourquoi: "Avec votre trafic, la personnalisation selon la peau et la garantie résultat font la différence. C'est le pack que nous recommandons le plus souvent." };
  }

  window.MF = { offres: O, get: get, eur: eur, ref: ref, store: store, recommander: recommander, stripeFacture: STRIPE_FACTURE, lancementOuvert: LANCEMENT_OUVERT };
})();
