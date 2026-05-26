import { EcoFact, EcoTip, EcoNews } from "../types";

export const ECO_FACTS: EcoFact[] = [
  {
    id: 1,
    question: "Quelle est la durée de vie d'une bouteille en plastique ?",
    fact: "Une bouteille en plastique met environ 450 ans à se décomposer dans la nature. Si elle est recyclée, elle peut renaître sous forme de veste polaire ou de nouvelle bouteille !",
    source: "ADEME"
  },
  {
    id: 2,
    question: "Combien de fois peut-on recycler le verre ?",
    fact: "Le verre est recyclable à l'infini ! Le recycler permet d'économiser du sable silicieux et de réduire considérablement l'énergie nécessaire à la fabrication de nouveaux contenants.",
    source: "Citeo"
  },
  {
    id: 3,
    question: "Qu'est-ce que l'impact d'une tonne de carton recyclé ?",
    fact: "Recycler une tonne de carton permet d'épargner environ 2,5 tonnes de bois brut, 50 000 litres d'eau et de diminuer l'empreinte carbone industrielle de près de 75 % !",
    source: "Fédération Nationale du Recyclage"
  },
  {
    id: 4,
    question: "Où vont nos canettes d'aluminium usagées ?",
    fact: "Les canettes en aluminium sont triées, fondues et réutilisées. 60 jours seulement après son tri, votre canette peut revenir dans les rayons sous la forme d'une nouvelle canette, d'un cadre de vélo ou d'un moteur !",
    source: "AluRecycle"
  },
  {
    id: 5,
    question: "Saviez-vous que recycler recycle aussi de l'énergie ?",
    fact: "Fabriquer de l'aluminium à partir de matières recyclées consomme 95 % d'énergie en moins que de le produire à partir de minerai brut de bauxite.",
    source: "International Aluminium Institute"
  },
  {
    id: 6,
    question: "Qu'en est-il du compostage ménager ?",
    fact: "Les biodéchets représentent un tiers de nos poubelles résiduelles. Les composter permet d'obtenir un engrais organique haut de gamme tout en allégeant massivement la collecte des déchets municipaux.",
    source: "ADEME"
  }
];

export const ECO_TIPS: EcoTip[] = [
  {
    id: 1,
    title: "La règle d'or du tri du papier",
    content: "Il n'est pas nécessaire de déchirer vos enveloppes à fenêtre plastique ou de retirer les agrafes des cahiers : les centres de tri modernes s'en chargent au lavage. L'important est de ne pas froisser le papier pour faciliter l'identification optique des tapis roulants !",
    icon: "FileText",
    difficulty: "Facile",
    impact: "Élevé"
  },
  {
    id: 2,
    title: "Bouchons vissés ou séparés ?",
    content: "Laissez les bouchons vissés sur vos bouteilles en plastique vides avant de les jeter. Cela évite que ces petits opercules ne se perdent dans l'environnement ou ne bloquent les machines de tri.",
    icon: "RotateCcw",
    difficulty: "Facile",
    impact: "Modéré"
  },
  {
    id: 3,
    title: "Attention aux faux-amis du verre",
    content: "Les verres de table, vaisselle en Pyrex, assiettes en céramique ou miroirs ne doivent JAMAIS aller dans le bac à verre. Ils ont une température de fusion différente du verre d'emballage et gâchent des tonnes de calcin recyclable !",
    icon: "Flame",
    difficulty: "Moyen",
    impact: "Excellent"
  },
  {
    id: 4,
    title: "Le compostage en appartement",
    content: "Même sans jardin, vous pouvez trier vos biodéchets avec un lombricomposteur d'appartement ou en utilisant le bac de compostage partagé de votre quartier. C'est l'activité idéale pour réduire vos déchets ménagers de 30 % !",
    icon: "Leaf",
    difficulty: "Expert",
    impact: "Excellent"
  },
  {
    id: 5,
    title: "Acheter en vrac",
    content: "Apportez vos propres contenants rechargeables dans les commerces. Cela élimine d'emblée l'emballage jetable à la source et vous permet de doser précisément vos achats alimentaires pour éviter le gaspillage.",
    icon: "ShoppingBag",
    difficulty: "Facile",
    impact: "Élevé"
  }
];

export const ECO_NEWS: EcoNews[] = [
  {
    id: 1,
    title: "Généralisation du tri à la source des biodéchets",
    summary: "Depuis le 1er janvier 2024, le tri des biodéchets est obligatoire pour tous les particuliers et professionnels en France. Communes et collectivités installent des bacs de collecte spécifiques et des points d'apport volontaire.",
    date: "Mai 2026",
    readTime: "3 min",
    author: "Ministère Écologie",
    tag: "Réglementation"
  },
  {
    id: 2,
    title: "Innovation : Des micro-organismes mangeurs de plastique PET",
    summary: "Des chercheurs européens ont perfectionné une enzyme bactérienne capable de dépolymériser 90% des plastiques PET ménagers en moins de 10 heures, ouvrant la voie à un recyclage moléculaire infini sans perte de qualité matérielle.",
    date: "Avril 2026",
    readTime: "4 min",
    author: "Science Éco",
    tag: "Technologie"
  },
  {
    id: 3,
    title: "Consigne de verre : Le grand retour en supermarché !",
    summary: "Plusieurs réseaux de distribution français testent à nouveau la consigne des bouteilles en verre pour réemploi. Laver une bouteille utilise 4 fois moins d'énergie et 75% d'eau en moins que d'en fabriquer une nouvelle par recyclage thermique.",
    date: "Mars 2026",
    readTime: "3 min",
    author: "Alliance Réemploi",
    tag: "Logistique"
  },
  {
    id: 4,
    title: "Lutte anti-déchets : La charte du numérique responsable",
    summary: "Les géants de la high-tech signent de nouveaux protocols pour la modularité des pièces détachées et rallongent la garantie des batteries pour freiner l'expansion fulgurante des déchets d'équipements électriques et électroniques (DEEE).",
    date: "Février 2026",
    readTime: "5 min",
    author: "GreenTech Europe",
    tag: "Numérique"
  }
];
