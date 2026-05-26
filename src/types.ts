export interface WasteAnalysis {
  name: string;
  category: "Plastique" | "Verre" | "Papier / Carton" | "Métal" | "Organique" | "Électronique" | "Dangereux" | "Non Recyclable" | string;
  ecoScore: string; // A, B, C, D, E
  binColor: "Jaune" | "Vert" | "Bleu" | "Marron" | "Gris" | "Rouge" | string;
  binColorHex: string; // Tailwind bg color class or hex code
  recyclingMethod: string; // Step-by-step instructions
  preparatorySteps: string[]; // e.g. ["Rincer le récipient", "Ne pas froisser", "Retirer le bouchon"]
  environmentalImpact: string; // Why recycling this helps the planet
  estimatedBiodegradation: string; // e.g. "450 ans"
}

export interface EcoFact {
  id: number;
  question: string;
  fact: string;
  source?: string;
}

export interface EcoTip {
  id: number;
  title: string;
  content: string;
  icon: string;
  difficulty: "Facile" | "Moyen" | "Expert";
  impact: "Élevé" | "Modéré" | "Excellent";
}

export interface EcoNews {
  id: number;
  title: string;
  summary: string;
  date: string;
  readTime: string;
  author: string;
  tag: string;
}
