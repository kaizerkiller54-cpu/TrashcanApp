import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers with generous limits due to base64 image transfers
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Lazy initializer for Google Gen AI client to prevent crash if key is loaded late
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("La clé d'API GEMINI_API_KEY est manquante dans la configuration du serveur.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for analyzing waste photos
app.post("/api/analyze-waste", async (req, res) => {
  try {
    const { image } = req.body; // base64 encoded image string (without the prefix metadata usually, or handled)
    if (!image) {
      return res.status(400).json({ error: "Aucune image reçue pour l'analyse." });
    }

    // Strip the "data:image/jpeg;base64," prefix if present
    let cleanBase64 = image;
    let mimeType = "image/jpeg";
    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        cleanBase64 = match[2];
      }
    }

    const ai = getGeminiClient();

    // Prepare content parts for multimodel input
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Analyse cette photo de déchet/objet à recycler. Identifie précisément ce que c'est, détermine sa catégorie écologique, son éco-score de recyclabilité (A à E), son bac de tri adéquat en France/Europe, sa méthode complète de traitement et de recyclage d'un point de vue éco-responsable, ainsi que sa durée de vie estimée dans la nature (biodégradation). Réponds fidèlement en français en respectant scrupuleusement le schéma JSON exigé.`,
    };

    // Query Gemini 3.5 Flash for multimodal analysis using structured JSON responseSchema
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, textPart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Nom exact en français du déchet identifié (ex: Canette de soda, Bouteille de lait)"
            },
            category: {
              type: Type.STRING,
              description: "Catégorie principale parmi: 'Plastique', 'Verre', 'Papier / Carton', 'Métal', 'Organique', 'Électronique', 'Dangereux', 'Non Recyclable'"
            },
            ecoScore: {
              type: Type.STRING,
              description: "Une seule lettre éco-recylabilité de A (parfait recyclable) à E (très néfaste/non recyclable)"
            },
            binColor: {
              type: Type.STRING,
              description: "Couleur du bac de tri officielle en France (Jaune, Vert, Bleu, Marron, Gris, Rouge)"
            },
            binColorHex: {
              type: Type.STRING,
              description: "Nom de couleur css compatible Tailwind: 'yellow' (jaune pour plastique/carton/métal), 'green' (vert pour verre), 'blue' (bleu pour papiers), 'amber' (marron pour compost), 'gray' (gris pour reste), 'red' (rouge pour dangereux)"
            },
            recyclingMethod: {
              type: Type.STRING,
              description: "Explication claire et détaillée des bénéfices du recyclage de ce produit et de la manière dont la matière sera reconditionnée."
            },
            preparatorySteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Liste des 2 ou 3 étapes pratiques à faire chez soi (ex: ['Vider entièrement sans rincer inutilement', 'Laisser le bouchon en plastique vissé dessus', 'Ne pas froisser ou plier'])"
            },
            environmentalImpact: {
              type: Type.STRING,
              description: "Statistique ou phrase percutante montrant pourquoi trier cet objet protège notre planète."
            },
            estimatedBiodegradation: {
              type: Type.STRING,
              description: "Temps estimé de décomposition naturelle s'il était abandonné dehors (ex: '450 ans', '100 ans', '3 semaines')"
            }
          },
          required: [
            "name",
            "category",
            "ecoScore",
            "binColor",
            "binColorHex",
            "recyclingMethod",
            "preparatorySteps",
            "environmentalImpact",
            "estimatedBiodegradation"
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("L'IA n'a retourné aucun contenu pour cette image.");
    }

    // Try parsing the JSON block back to client
    const analysisResult = JSON.parse(resultText.trim());
    return res.json(analysisResult);

  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    return res.status(500).json({
      error: error.message || "Une erreur est survenue lors de l'identification par l'IA."
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Eco-Trieur] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
