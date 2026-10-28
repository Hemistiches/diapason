/* Diapason, par Hémistiches : tarifs, questionnaire et règles d'orientation, communs aux pages française et anglaise.
   Source unique : toute modification de prix, de question, de pondération ou de règle se fait ici, et nulle part ailleurs.
   Les textes affichés restent dans chaque page ; ce fichier ne contient que des clés, des nombres et des calculs. */
(function (g) {
  "use strict";

  /* ============================================================
     1. Tarifs (HT). Choix commerciaux du cabinet, arrêtés le 26 octobre 2026.
     ============================================================ */
  var TARIFS = {
    version: "2026-10-28",
    consultation: { prix: 350, minutes: 45, deductionJours: 30 },
    diagnostic: 1200,
    miseEnPlace: { simple: 2500, etendue: 4500 },      // « simple » : diagnostic compris, prix global
    etude: { simple: 2500, approfondie: 4500, paysSupp: 750 },
    dispositifIA: 3500,                                 // données d'un dispositif intégrant de l'IA, un modèle et une source (28 octobre 2026)
    dpo: [
      { cle: "limite",   prix: 490,  heures: 3,  report: 1, point: "trimestriel", aPartirDe: false },
      { cle: "regulier", prix: 990,  heures: 6,  report: 2, point: "mensuel",     aPartirDe: false },
      { cle: "renforce", prix: 1490, heures: 10, report: 3, point: "adapte",      aPartirDe: true }
    ],
    tauxDepassement: 180,
    revueDesignation: 1200,
    dureeInitialeMois: 6,
    preavisMois: 1
  };

  function palier(cle) { for (var i = 0; i < TARIFS.dpo.length; i++) if (TARIFS.dpo[i].cle === cle) return TARIFS.dpo[i]; return null; }

  /* Mise en place simple après un diagnostic déjà réglé : seul le complément du prix global est facturé. */
  function complementMiseEnPlace(diagnosticDejaRegle) {
    return diagnosticDejaRegle ? TARIFS.miseEnPlace.simple - TARIFS.diagnostic : TARIFS.miseEnPlace.simple;
  }
  /* Consultation imputable : déduite une seule fois d'un forfait engagé dans les trente jours, jamais au-delà du forfait. */
  function apresConsultation(prixForfait, joursDepuisConsultation, prepareLaMission) {
    var imputable = prepareLaMission && joursDepuisConsultation <= TARIFS.consultation.deductionJours;
    return imputable ? Math.max(0, prixForfait - TARIFS.consultation.prix) : prixForfait;
  }
  /* Illustration sur douze mois complets : jamais une durée d'engagement, jamais exigible à la signature. */
  function budget12(o) {
    var init = 0;
    if (o.miseEnPlace) init += TARIFS.miseEnPlace[o.miseEnPlace];
    if (o.diagnostic) init += TARIFS.diagnostic;
    (o.etudes || []).forEach(function (e) { init += TARIFS.etude[e.niveau] + (e.pays || 0) * TARIFS.etude.paysSupp; });
    var p = o.dpo ? palier(o.dpo) : null;
    return { initial: init, mensuel: p ? p.prix : 0, total: init + (p ? 12 * p.prix : 0) };
  }
  /* Report : au plus N heures, sur le mois suivant uniquement, utilisées en premier, jamais reportées deux fois. */
  function moisSuivant(cle, heuresNonUtilisees, heuresReporteesRecues) {
    var p = palier(cle);
    var reportables = Math.max(0, heuresNonUtilisees - Math.max(0, heuresReporteesRecues)); // les heures reçues en report ne repartent pas
    return { disponible: p.heures + Math.min(p.report, reportables), dontReport: Math.min(p.report, reportables) };
  }

  /* ============================================================
     2. Questionnaire. Chaque option porte une clé, des pondérations w sur trois indicateurs
        de situation (obl : obligation ; frag : fragilité du dispositif ; expo : exposition)
        et des drapeaux. Les textes sont dans chaque page, indexés par ces clés.
     ============================================================ */
  function O(k, w, flags) { return { k: k, w: w || {}, flags: flags || [] }; }

  var Q = {
    activite: { bloc: "situation", opts: [
      O("dm", { obl: 2 }, ["rech_possible", "fabricant"]),
      O("labo", { obl: 3 }, ["rech_possible"]),
      O("promoteur", { obl: 3 }, ["rech_possible"]),
      O("soins", { obl: 3 }, ["rech_possible"]),
      O("presta", { obl: 3 }, ["rech_possible", "presta"]),
      O("autre", { obl: 2 }, [])
    ]},
    /* L'échelle du traitement est le critère même de l'article 37, paragraphe 1, sous c. */
    echelle: { bloc: "situation", opts: [
      O("dizaines", { obl: 1 }),
      O("centaines", { obl: 2 }),
      O("milliers", { obl: 3 }, ["echelle_forte"]),
      O("nsp", { obl: 2, frag: 2 }, ["echelle_inconnue"])
    ]},
    entites: { bloc: "situation", opts: [
      O("fr", {}),
      O("ue", {}),
      O("deux_trois", { obl: 1 }, ["e_multi"]),
      O("groupe", { obl: 1 }, ["e_groupe"]),
      O("hors_ue_etab", {}, ["hors_ue_etab"]),
      O("hors_ue", { frag: 2, expo: 1 }, ["hors_ue", "pas_etab"])
    ]},
    /* Choix multiples : « aucune » est exclusive. Pondération plafonnée à 2 sur l'obligation. */
    flux: { bloc: "situation", multi: true, exclusive: "aucune", cap: { obl: 2 }, opts: [
      O("genetique", { obl: 1 }, ["flux"]),
      O("distance", { obl: 1 }, ["flux"]),
      O("ia", { obl: 1 }, ["flux"]),
      O("reutilisation", { obl: 1 }, ["flux"]),
      O("vulnerables", { obl: 1 }, ["flux"]),
      O("aucune", {})
    ]},
    designation: { bloc: "dispositif", opts: [
      O("salarie", {}, ["designe", "interne"]),
      O("cumul", { frag: 2 }, ["designe", "interne", "cumul"]),
      O("externe", {}, ["designe", "externe"]),
      O("groupe", {}, ["designe", "interne"]),
      O("non", { frag: 3, expo: 2 }, ["pas_designe"]),
      O("non_nsp", { frag: 3, expo: 1 }, ["pas_designe", "obl_inconnue"])
    ]},
    /* Conditionnelle : seulement si un cumul de fonctions est déclaré. */
    fonctions: { bloc: "dispositif", opts: [
      O("sans_lien", {}),
      O("dsi", { frag: 3 }, ["conflit"]),
      O("direction", { frag: 3 }, ["conflit"]),
      O("medical", { frag: 3 }, ["conflit"]),
      O("qualite", { frag: 2 }, ["conflit_possible"]),
      O("juridique", { frag: 1 }, ["conflit_possible"]),
      O("rh", { frag: 2 }, ["conflit_possible"])
    ]},
    /* Conditionnelle : seulement si une personne est désignée. */
    notif: { bloc: "dispositif", opts: [
      O("oui", {}),
      O("incertain", { frag: 2 }, ["notif"]),
      O("non", { frag: 3, expo: 1 }, ["notif"])
    ]},
    /* Conditionnelle : seulement si le délégué est interne (salarié ou groupe). */
    temps: { bloc: "dispositif", opts: [
      O("plein", {}),
      O("partiel", { frag: 1 }),
      O("heures", { frag: 2 }, ["moyens"]),
      O("aucun", { frag: 3 }, ["moyens"])
    ]},
    registre: { bloc: "dispositif", opts: [
      O("tenu", {}),
      O("ancien", { frag: 2 }, ["registre", "reg_ancien"]),
      O("construction", { frag: 2, expo: 1 }, ["registre", "reg_absent"]),
      O("absent", { frag: 3, expo: 2 }, ["registre", "reg_absent"])
    ]},
    aipd: { bloc: "dispositif", opts: [
      O("toutes", {}),
      O("certaines", { frag: 1 }, ["aipd"]),
      O("aucune_estime", { frag: 1 }, ["aipd"]),
      O("nsp", { frag: 3 }, ["aipd", "aipd_nsp"]),
      O("aucune", { frag: 2, expo: 2 }, ["aipd", "aipd_absent"])
    ]},
    hebergement: { bloc: "dispositif", opts: [
      O("certifie", {}),
      O("interne", { expo: 1 }, ["hds_interne"]),
      O("non_verifie", { frag: 2, expo: 2 }, ["hds"]),
      O("nsp", { frag: 2, expo: 2 }, ["hds"])
    ]},
    transferts: { bloc: "dispositif", opts: [
      O("aucun", {}),
      O("adequat", {}),
      O("cct_analyse", {}),
      O("cct_sans", { frag: 1, expo: 1 }, ["transferts", "transf_partiel"]),
      O("non_doc", { frag: 2, expo: 2 }, ["transferts", "transf_grave"]),
      O("nsp", { frag: 2, expo: 2 }, ["transferts", "transf_grave"])
    ]},
    violations: { bloc: "dispositif", opts: [
      O("aucune_proc", {}),
      O("notifiees", {}),
      O("non_notif_doc", {}),
      O("sans_analyse", { frag: 2, expo: 3 }, ["violation"]),
      O("pas_proc", { frag: 2, expo: 3 }, ["procedure"])
    ]},
    /* Conditionnelle : seulement si « algorithme ou IA » est coché dans les traitements à risque. */
    ia_donnees: { bloc: "situation", opts: [
      O("nos_donnees", { obl: 1 }, ["ia_entrainement", "ia_mission"]),
      O("partenaires", { obl: 1, frag: 1 }, ["ia_entrainement", "ia_partenaires", "ia_mission"]),
      O("fournisseur", {}, ["ia_fournisseur", "ia_mission"]),
      O("nsp", { frag: 1 }, ["ia_inconnu", "ia_mission"])
    ]},
    /* Études : seulement pour les profils susceptibles d'en mener. */
    recherches: { bloc: "etudes", opts: [
      O("aucune", {}),
      O("une", { obl: 1 }, ["rech", "n1"]),
      O("deux_trois", { obl: 2 }, ["rech", "n2"]),
      O("plus", { obl: 2 }, ["rech", "n4"])
    ]},
    regime: { bloc: "etudes", opts: [
      O("mr", {}),
      O("autorisation", {}),
      O("selon", {}),
      O("nsp", { frag: 3, expo: 2 }, ["regime"]),
      O("pas_pose", { frag: 2, expo: 1 }, ["regime"])
    ]},
    pays: { bloc: "etudes", opts: [
      O("france", {}),
      O("un", { obl: 1 }, ["multi_pays", "p1"]),
      O("deux_trois", { obl: 1 }, ["multi_pays", "p2"]),
      O("quatre", { obl: 1 }, ["multi_pays", "p4"]),
      O("hors_ue", { obl: 2, expo: 1 }, ["multi_pays", "p_hors_ue"])
    ]},
    pieces: { bloc: "etudes", opts: [
      O("standard", {}, ["et_simple"]),
      O("adapter", {}, ["et_adapter"]),
      O("construire", {}, ["et_construire"]),
      O("complexe", {}, ["et_complexe"]),
      O("lancee", {}, ["et_lancee"])
    ]},
    /* Suivi récurrent : ces questions mesurent la charge ; elles n'entrent pas dans les indicateurs de situation. */
    projets: { bloc: "suivi", opts: [ O("rare", {}), O("trimestre", {}), O("mois", {}), O("nsp", {}) ]},
    demandes: { bloc: "suivi", opts: [ O("aucune", {}), O("quelques", {}), O("plusieurs", {}) ]},
    relais: { bloc: "suivi", opts: [ O("oui", {}), O("peu", {}), O("non", {}, ["sans_relais"]) ]},
    declencheur: { bloc: "situation_ouverte", opts: [
      O("designer", {}, ["int_designer"]),
      O("remplacer", { frag: 2 }, ["int_remplacer"]),
      O("etude", {}, ["int_etude"]),
      O("verifier", {}, ["int_verifier"]),
      O("ponctuel", {}, ["int_ponctuel"]),
      O("externe", { expo: 2 }, ["int_externe"]),
      O("controle", { frag: 1, expo: 3 }, ["int_controle", "urgent"])
    ]}
  };
  Object.keys(Q).forEach(function (id) { Q[id].id = id; });

  var BASE = ["activite", "echelle", "entites", "flux", "designation", "registre", "aipd", "hebergement", "transferts", "violations", "projets", "demandes", "relais", "declencheur"];

  function optionsChoisies(id, a) {
    var q = Q[id], v = a[id];
    if (v === undefined || v === null) return [];
    if (q.multi) return (v || []).map(function (k) { return opt(id, k); }).filter(Boolean);
    var o = opt(id, v); return o ? [o] : [];
  }
  function opt(id, k) { var os = Q[id].opts; for (var i = 0; i < os.length; i++) if (os[i].k === k) return os[i]; return null; }

  function drapeaux(a, ids) {
    var f = {};
    (ids || Object.keys(Q)).forEach(function (id) { optionsChoisies(id, a).forEach(function (o) { o.flags.forEach(function (x) { f[x] = true; }); }); });
    f.flux_n = (a.flux || []).filter(function (k) { return k !== "aucune"; }).length;
    return f;
  }

  /* Liste des questions posées, recalculée à chaque réponse. */
  function parcours(a) {
    var f = drapeaux(a), list = [];
    BASE.forEach(function (id) {
      list.push(id);
      if (id === "flux" && (a.flux || []).indexOf("ia") > -1) list.push("ia_donnees");
      if (id === "designation") {
        if (f.cumul) list.push("fonctions");
        if (f.designe) list.push("notif");
        if (f.interne) list.push("temps");
      }
      if (id === "violations" && f.rech_possible) {
        list.push("recherches");
        if (f.rech) { list.push("regime"); list.push("pays"); list.push("pieces"); }
      }
    });
    return list;
  }

  /* ============================================================
     3. Indicateurs de situation (inchangés dans leur principe : trois axes, règle de plancher).
     ============================================================ */
  function indicateurs(a) {
    var ids = parcours(a), w = { obl: 0, frag: 0, expo: 0 }, max = { obl: 0, frag: 0, expo: 0 };
    ids.forEach(function (id) {
      var q = Q[id], mx = { obl: 0, frag: 0, expo: 0 };
      if (q.multi) {
        ["obl", "frag", "expo"].forEach(function (k) {
          var tot = 0; q.opts.forEach(function (o) { tot += o.w[k] || 0; });
          mx[k] = q.cap && q.cap[k] !== undefined ? Math.min(q.cap[k], tot) : tot;
        });
      } else {
        q.opts.forEach(function (o) { ["obl", "frag", "expo"].forEach(function (k) { if ((o.w[k] || 0) > mx[k]) mx[k] = o.w[k]; }); });
      }
      ["obl", "frag", "expo"].forEach(function (k) { max[k] += mx[k]; });
      var got = { obl: 0, frag: 0, expo: 0 };
      optionsChoisies(id, a).forEach(function (o) { ["obl", "frag", "expo"].forEach(function (k) { got[k] += o.w[k] || 0; }); });
      ["obl", "frag", "expo"].forEach(function (k) { w[k] += (q.cap && q.cap[k] !== undefined) ? Math.min(q.cap[k], got[k]) : got[k]; });
    });
    var norm = function (k) { if (!max[k]) return 15; return Math.max(15, Math.round(w[k] / max[k] * 100)); };
    var f = drapeaux(a, ids);
    /* Règle de plancher : un défaut isolé mais sérieux ne doit pas se diluer dans le dénominateur. */
    var GRAVE_FRAG = ["pas_designe", "conflit", "notif", "regime", "procedure", "violation"];
    var GRAVE_EXPO = ["urgent", "procedure", "violation", "regime"];
    var count = function (keys) { var n = 0; keys.forEach(function (k) { if (f[k]) n++; }); return n; };
    var floor = function (v, n) { if (n >= 3) return Math.max(v, 70); if (n >= 1) return Math.max(v, 45); return v; };
    return { obl: norm("obl"), frag: floor(norm("frag"), count(GRAVE_FRAG)), expo: floor(norm("expo"), count(GRAVE_EXPO)), flags: f };
  }
  function niveau(v) { return v >= 70 ? "eleve" : (v >= 40 ? "modere" : "limite"); }

  /* Points de vigilance, dans l'ordre d'affichage. */
  function vigilance(f) {
    var k = [];
    if (f.urgent) k.push("urgent");
    if (f.pas_designe) k.push("pas_designe");
    if (f.obl_inconnue) k.push("obl_inconnue");
    if (f.echelle_inconnue) k.push("echelle_inconnue");
    if (f.conflit) k.push("conflit"); else if (f.conflit_possible) k.push("conflit_possible");
    if (f.notif) k.push("notif");
    if (f.moyens) k.push("moyens");
    if (f.registre) k.push("registre");
    if (f.aipd) k.push("aipd");
    if (f.ia_mission) k.push("ia");
    if (f.regime) k.push("regime");
    if (f.multi_pays) k.push("multi_pays");
    if (f.hds) k.push("hds"); else if (f.hds_interne) k.push("hds_interne");
    if (f.transferts) k.push("transferts");
    if (f.procedure) k.push("procedure"); else if (f.violation) k.push("violation");
    if (f.hors_ue) k.push("hors_ue");
    if (f.int_externe) k.push("int_externe");
    if (f.int_remplacer) k.push("int_remplacer");
    if (k.length === 0) k.push("maitrise");
    k.push("reserve");
    return k;
  }

  /* ============================================================
     4. Orientation commerciale, distincte des indicateurs.
        Quatre questions séparées : 1) situation ouverte ? 2) travaux initiaux nécessaires ?
        3) mission par étude ? 4) suivi récurrent et son intensité.
        Aucun passage obligé : une étude peut être confiée seule, un abonnement peut démarrer
        directement sur un dispositif exploitable, la consultation n'est jamais exigée.
     ============================================================ */
  var POIDS_CHARGE = {
    projets: { rare: 0, trimestre: 1, mois: 2, nsp: 1 },
    demandes: { aucune: 0, quelques: 0.5, plusieurs: 2 },
    etudes: { n1: 1, n2: 2, n4: 3 },
    pays: { p1: 0.5, p2: 1, p4: 1, p_hors_ue: 1 },
    piecesLourdes: 1,       // documents à construire ou schéma complexe
    fluxMultiples: 1,       // deux situations à risque ou plus
    iaEntrainement: 0.5,    // modèle entraîné ou réentraîné sur des données de patients
    entites: { e_multi: 1, hors_ue_etab: 1 },
    relais: { oui: 0, peu: 1, non: 2 },
    incident: 1,            // violation sans analyse ou absence de procédure
    echelleForte: 0.5
  };
  var SEUILS_CHARGE = { limite: 2, regulier: 5, renforce: 8.5 };   // au-delà de « renforce » : dimensionnement sur proposition

  function charge(a, f) {
    var c = 0, src = [];
    function add(cle, v) { if (v) { c += v; src.push({ cle: cle, v: v }); } }
    add("projets", POIDS_CHARGE.projets[a.projets] || 0);
    add("demandes", POIDS_CHARGE.demandes[a.demandes] || 0);
    if (f.rech) {
      add("etudes", f.n4 ? POIDS_CHARGE.etudes.n4 : (f.n2 ? POIDS_CHARGE.etudes.n2 : POIDS_CHARGE.etudes.n1));
      ["p1", "p2", "p4", "p_hors_ue"].forEach(function (p) { if (f[p]) add("pays", POIDS_CHARGE.pays[p]); });
      if (f.et_construire || f.et_complexe) add("pieces", POIDS_CHARGE.piecesLourdes);
    }
    if (f.flux_n >= 2) add("flux", POIDS_CHARGE.fluxMultiples);
    if (f.ia_entrainement) add("ia", POIDS_CHARGE.iaEntrainement);
    if (f.e_multi) add("entites", POIDS_CHARGE.entites.e_multi);
    if (f.hors_ue_etab) add("entites", POIDS_CHARGE.entites.hors_ue_etab);
    add("relais", POIDS_CHARGE.relais[a.relais] || 0);
    if (f.violation || f.procedure) add("incident", POIDS_CHARGE.incident);
    if (f.echelle_forte) add("echelle", POIDS_CHARGE.echelleForte);
    src.sort(function (x, y) { return y.v - x.v; });
    return { valeur: Math.round(c * 10) / 10, sources: src };
  }

  function orienter(a) {
    var ids = parcours(a), f = drapeaux(a, ids);
    var r = { prioritaire: false, etat: null, initial: null, revue: false, etudes: null, ia: null, dpo: null,
              consultation: "option", devis: [], raisons: [], ponctuel: false };

    /* 1. Situation ouverte : échange prioritaire, contrôle ou incident sur devis. */
    if (f.urgent || f.violation) { r.prioritaire = true; r.raisons.push(f.urgent ? "urgent" : "violation"); }

    /* 2. État du dispositif et travaux initiaux éventuels. */
    var majeurs = ["reg_absent", "procedure", "aipd_absent", "hds", "transf_grave", "violation"].filter(function (k) { return f[k]; }).length;
    var mineurs = ["reg_ancien", "aipd", "transf_partiel", "notif", "echelle_inconnue", "aipd_nsp"].filter(function (k) { return f[k]; }).length;
    r.etat = (f.reg_absent || majeurs >= 1) ? "a_construire" : (mineurs >= 1 ? "a_verifier" : "exploitable");
    if (f.e_groupe || f.pas_etab) { r.devis.push(f.e_groupe ? "groupe" : "hors_ue"); }
    if (r.etat === "a_construire") {
      if (f.e_groupe) r.initial = "devis";
      else if (f.e_multi || f.hors_ue_etab || f.flux_n >= 2 || majeurs >= 3) r.initial = "etendue";
      else r.initial = "simple";
    } else if (r.etat === "a_verifier") {
      r.initial = f.e_groupe ? "devis" : "diagnostic";
    } else if (f.int_verifier && !f.designe) {
      r.initial = "diagnostic";
    } else if (f.int_verifier && f.designe && !f.int_designer && !f.int_remplacer) {
      r.initial = "diagnostic";
    }

    /* 3. Revue de la désignation d'un délégué interne. */
    if (f.interne && (f.conflit || f.conflit_possible || f.notif || f.moyens)) r.revue = true;

    /* 4. Mission par étude, indépendante de l'abonnement. */
    if (f.rech && (!f.et_lancee || f.int_etude)) {
      var niv;
      if (f.et_complexe && (f.p_hors_ue || f.n4)) niv = "devis";
      else if (f.et_adapter || f.et_construire || f.et_complexe || f.regime || f.flux_n >= 2) niv = "approfondie";
      else niv = "simple";
      var pays = f.p1 ? 1 : (f.p2 ? 2 : (f.p4 ? 4 : 0));
      r.etudes = { niveau: niv, pays: pays, paysAuMoins: !!(f.p2 || f.p4), horsUE: !!f.p_hors_ue, plusieurs: !!(f.n2 || f.n4) };
      if (niv === "devis") r.devis.push("etude");
    }

    /* 4 bis. Données d'un dispositif ou d'un projet intégrant de l'IA, indépendant de l'abonnement. */
    /* Proposé si le modèle est entraîné sur des données de patients, si on l'ignore, ou si l'organisation fabrique le dispositif. */
    if (f.ia_mission && (f.ia_entrainement || f.ia_inconnu || f.fabricant)) {
      var lourd = f.ia_partenaires && (f.multi_pays || f.e_multi || f.e_groupe || f.transf_grave || f.transf_partiel);
      r.ia = { niveau: lourd ? "devis" : "forfait", fabricant: !!f.fabricant };
      if (lourd) r.devis.push("ia");
    }

    /* 5. Suivi récurrent : besoin d'un délégué, puis intensité. */
    /* Un délégué interne fragile relève d'abord de la revue de sa désignation, non d'un abonnement. */
    var besoinDpo = f.pas_designe || f.int_designer || f.int_remplacer;
    if (f.int_ponctuel && !f.int_designer && !f.int_remplacer) besoinDpo = false;
    if (besoinDpo) {
      var ch = charge(a, f), p;
      if (ch.valeur <= SEUILS_CHARGE.limite) p = "limite";
      else if (ch.valeur <= SEUILS_CHARGE.regulier) p = "regulier";
      else if (ch.valeur <= SEUILS_CHARGE.renforce) p = "renforce";
      else p = "devis";
      /* Une seule étude lourde, ou l'absence de relais interne, rend le suivi limité inadapté. */
      var plancher = f.sans_relais || f.et_complexe || (f.rech && (f.p2 || f.p4 || f.p_hors_ue) && (f.et_adapter || f.et_construire || f.et_complexe));
      if (p === "limite" && plancher) p = "regulier";
      if (f.e_groupe) p = "devis";
      r.dpo = { palier: p, charge: ch, priseDeFonction: r.etat === "exploitable", designationAExaminer: !!(f.pas_designe && !f.int_designer && !f.int_remplacer) };
      if (p === "devis") r.devis.push("dpo");
    }

    /* 6. Consultation : orientation principale seulement si rien d'autre ne s'impose, ou si la question est ponctuelle. */
    var rien = !r.prioritaire && !r.initial && !r.revue && !r.etudes && !r.dpo && !r.ia;
    if (f.int_ponctuel || rien) { r.consultation = "principale"; r.ponctuel = true; }
    if (!r.dpo && (r.initial || r.etudes || r.revue || r.ia)) r.ponctuel = true;   // mission ponctuelle sans abonnement
    return r;
  }

  /* Clés transmises dans le résumé du formulaire (champ offres_suggerees), sans aucune réponse détaillée. */
  function cles(r) {
    var k = [];
    if (r.prioritaire) k.push("prioritaire");
    if (r.initial) k.push("initial:" + r.initial);
    if (r.revue) k.push("revue");
    if (r.ia) k.push("ia:" + r.ia.niveau);
    if (r.etudes) k.push("etude:" + r.etudes.niveau + (r.etudes.pays ? "+" + r.etudes.pays + "pays" : "") + (r.etudes.horsUE ? "+horsUE" : ""));
    if (r.dpo) k.push("dpo:" + r.dpo.palier + (r.dpo.priseDeFonction ? ":prise" : ""));
    k.push("consultation:" + r.consultation);
    return k;
  }

  g.DIAPASON = {
    TARIFS: TARIFS, Q: Q, BASE: BASE, palier: palier, complementMiseEnPlace: complementMiseEnPlace,
    apresConsultation: apresConsultation, budget12: budget12, moisSuivant: moisSuivant,
    parcours: parcours, drapeaux: drapeaux, indicateurs: indicateurs, niveau: niveau, vigilance: vigilance,
    charge: charge, orienter: orienter, cles: cles, SEUILS_CHARGE: SEUILS_CHARGE, POIDS_CHARGE: POIDS_CHARGE
  };
})(typeof window !== "undefined" ? window : globalThis);
