import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as tf from "@tensorflow/tfjs";
import {
  Camera,
  Settings,
  X,
  Volume2,
  VolumeX,
  FileText,
  RotateCcw,
  Flame,
  Leaf,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Info,
  User,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  Clock,
  Instagram,
  Twitter,
  Globe,
  CameraOff,
  Briefcase,
  Newspaper,
  Lock,
  Mail,
  LogOut,
  Key,
  ShieldAlert
} from "lucide-react";
import { ECO_FACTS, ECO_TIPS, ECO_NEWS } from "./data/ecology";
import { WasteAnalysis } from "./types";
// @ts-ignore
import appLogo from "./assets/images/trashcanapp_logo_1779671863797.png";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";

export default function App() {
  // User Profile
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("eco_user_name") || "Éco-Citoyen";
  });

  // Theme configuration (vert or blanc)
  const [theme, setTheme] = useState<"vert" | "blanc">(() => {
    return (localStorage.getItem("eco_theme") as "vert" | "blanc") || "vert";
  });

  // Voice activation parameter
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    return localStorage.getItem("eco_voice_enabled") === "true";
  });

  // Recent Scans History (stored locally)
  const [recentScans, setRecentScans] = useState<WasteAnalysis[]>(() => {
    const saved = localStorage.getItem("eco_scans");
    return saved ? JSON.parse(saved) : [];
  });

  // Firebase Auth states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [signupUserName, setSignupUserName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);

  // Sync state & retrieve data when authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      setAuthError(null);
      if (user) {
        // Fetch User Profile from Firestore to get userName
        const userDocPath = `users/${user.uid}`;
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.userName || "Éco-Citoyen");
            setRegisteredAt(data.registeredAt || null);
          } else {
            const defaultName = user.email?.split("@")[0] || "Éco-Citoyen";
            const newRegAt = new Date().toISOString();
            await setDoc(doc(db, "users", user.uid), {
              userName: defaultName,
              email: user.email || "",
              registeredAt: newRegAt,
            });
            setUserName(defaultName);
            setRegisteredAt(newRegAt);
          }
        } catch (err: any) {
          console.error("Erreur lors de la récupération du profil:", err);
          handleFirestoreError(err, OperationType.GET, userDocPath);
        }

        // Fetch Recent Scans from Firestore
        const scansPath = `users/${user.uid}/scans`;
        try {
          const scansRef = collection(db, "users", user.uid, "scans");
          const querySnapshot = await getDocs(scansRef);
          const scans: WasteAnalysis[] = [];
          querySnapshot.forEach((docSnap) => {
            const d = docSnap.data();
            scans.push({
              name: d.name,
              category: d.category,
              ecoScore: d.ecoScore,
              binColor: d.binColor,
              binColorHex: d.binColorHex,
              recyclingMethod: d.recyclingMethod,
              preparatorySteps: d.preparatorySteps || [],
              environmentalImpact: d.environmentalImpact,
              estimatedBiodegradation: d.estimatedBiodegradation,
            });
          });
          setRecentScans(scans);
        } catch (err: any) {
          console.error("Erreur lors du chargement des scans:", err);
          handleFirestoreError(err, OperationType.LIST, scansPath);
        }
      } else {
        setRecentScans([]);
        setUserName("Éco-Citoyen");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!authEmail || !authPassword) {
      setAuthError("Veuillez remplir tous les champs requis.");
      return;
    }

    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setAuthSuccess("Connexion réussie !");
      } else {
        if (!signupUserName) {
          setAuthError("Veuillez renseigner un nom d'utilisateur.");
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          authEmail,
          authPassword
        );
        const user = userCredential.user;

        // Save UserProfile immediately in Firestore
        const userDocPath = `users/${user.uid}`;
        try {
          const newRegAt = new Date().toISOString();
          await setDoc(doc(db, "users", user.uid), {
            userName: signupUserName,
            email: authEmail,
            registeredAt: newRegAt,
          });
          setUserName(signupUserName);
          setRegisteredAt(newRegAt);
          setAuthSuccess("Compte éco-citoyen créé avec succès !");
        } catch (fsErr: any) {
          console.error("Erreur Firestore lors de la création du profil:", fsErr);
          handleFirestoreError(fsErr, OperationType.CREATE, userDocPath);
        }
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      let frenchError = "Une erreur est survenue lors de l'authentification.";
      if (err.code === "auth/invalid-credential") {
        frenchError = "E-mail ou mot de passe incorrect. Veuillez réessayer.";
      } else if (err.code === "auth/email-already-in-use") {
        frenchError = "Cette adresse e-mail est déjà associée à un compte.";
      } else if (err.code === "auth/weak-password") {
        frenchError = "Le mot de passe doit contenir au moins 6 caractères.";
      } else if (err.code === "auth/invalid-email") {
        frenchError = "L'adresse e-mail saisie est invalide.";
      } else if (err.code === "auth/operation-not-allowed") {
        frenchError =
          "La connexion par e-mail/mot de passe n'est pas activée dans votre console Firebase. Veuillez l'activer sous l'onglet Authentication > Sign-in method.";
      } else if (err.message) {
        frenchError = err.message;
      }
      setAuthError(frenchError);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthSuccess("Déconnexion réussie.");
      setAuthEmail("");
      setAuthPassword("");
      setSignupUserName("");
    } catch (err: any) {
      setAuthError("Erreur lors de la déconnexion.");
    }
  };

  // Settings active overlay state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // App tabs: "dashboard" | "tips" | "news"
  const [activeTab, setActiveTab] = useState<"dashboard" | "tips" | "news">("dashboard");

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<WasteAnalysis | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Random environmental fact
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Active Tip overlay state
  const [selectedTipId, setSelectedTipId] = useState<number | null>(null);

  // References for live camera feed
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const offlineModelRef = useRef<any>(null);

  // Initialize TFLite model
  useEffect(() => {
    const loadTFLiteModel = async () => {
      try {
        const tflite = await import('@tensorflow/tfjs-tflite');
        tflite.setWasmPath('/tflite/');
        const model = await tflite.loadTFLiteModel('/EcogreenAI.tflite');
        offlineModelRef.current = model;
        console.log("✅ TFLite Model loaded successfully");
      } catch (err) {
        console.error("❌ Failed to load TFLite model:", err);
      }
    };
    loadTFLiteModel();
  }, []);

  // Persist key state variables on change
  useEffect(() => {
    localStorage.setItem("eco_user_name", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("eco_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("eco_voice_enabled", String(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem("eco_scans", JSON.stringify(recentScans));
  }, [recentScans]);

  // Rotate facts automatically or manually
  const rotateFact = () => {
    setCurrentFactIndex((prev) => (prev + 1) % ECO_FACTS.length);
  };

  // Speaks French text aloud using Web Speech API synthesis
  const speakVoice = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Trigger voice feedback upon receiving analysis results
  useEffect(() => {
    if (analysisResult && voiceEnabled) {
      const speechText = `Déchet identifié : ${analysisResult.name}. Catégorie : ${analysisResult.category}. À jeter dans le bac ${analysisResult.binColor}. Consigne : ${analysisResult.preparatorySteps.join(", ")}.`;
      speakVoice(speechText);
    }
  }, [analysisResult, voiceEnabled]);

  // Cycle environmental messages during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Start standard webcam video stream
  const startWebcam = async () => {
    setCameraError(null);
    setCameraActive(true);
    setCapturedImage(null);
    setAnalysisResult(null);

    // Give iframe a brief delay to populate container
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn("Camera access denied or unavailable, switching to file mode", err);
        setCameraError(
          "Impossible d'accéder à la webcam en direct. Veuillez utiliser l'importateur de fichier pour photographier ou sélectionner votre déchet."
        );
      }
    }, 100);
  };

  // Turn off active camera streams
  const stopWebcam = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  // Clear current results and redirect back to the home view
  const resetAppFlow = () => {
    stopWebcam();
    setCapturedImage(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Snap photo frame from the live video feed
  const captureWebcamSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Match canvas frame to active video input dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert captured raster image to base64 string
        const base64Data = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(base64Data);
        stopWebcam();
        analyzePhotoViaAI(base64Data);
      }
    }
  };

  // Handle uploaded or taken picture file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        setCapturedImage(base64Data);
        stopWebcam();
        analyzePhotoViaAI(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  // Local AI inference function
  const analyzePhotoViaLocalModel = async (base64Image: string): Promise<WasteAnalysis> => {
    if (!offlineModelRef.current) {
      throw new Error("Le modèle local n'est pas encore prêt. Veuillez patienter.");
    }

    return new Promise((resolve, reject) => {
      const imgElement = document.createElement('img');
      imgElement.src = base64Image;
      imgElement.onload = async () => {
        try {
          const tensor = tf.browser.fromPixels(imgElement)
            .resizeNearestNeighbor([224, 224])
            .toFloat()
            .expandDims();

          const outputTensor = offlineModelRef.current.predict(tensor) as tf.Tensor;
          const predictions = Array.from(outputTensor.dataSync());
          
          const highestProbabilityIndex = predictions.indexOf(Math.max(...predictions));
          
          // Map based on your model's categories (assuming 4 output units based on model architecture)
          const categories = [
            { name: "Bouteille Plastique", category: "Plastique", ecoScore: "B", binColor: "Jaune", binColorHex: "yellow", recyclingMethod: "Broyage et transformation en paillettes pour nouveaux plastiques ou fibres textiles.", preparatorySteps: ["Vider entièrement", "Aplatir dans le sens de la longueur", "Laisser le bouchon vissé"], environmentalImpact: "Une tonne de plastique recyclé = 830 litres de pétrole brut économisés.", estimatedBiodegradation: "450 ans" },
            { name: "Déchet Organique", category: "Organique", ecoScore: "A", binColor: "Marron", binColorHex: "brown", recyclingMethod: "Compostage naturel pour retourner à la terre et enrichir les sols agricoles.", preparatorySteps: ["Éviter les sacs plastiques non compostables", "Ne pas y mettre de gros os"], environmentalImpact: "1 tonne de compost = 1 tonne de CO2 séquestrée dans le sol.", estimatedBiodegradation: "3 semaines à 6 mois" },
            { name: "Bouteille en Verre", category: "Verre", ecoScore: "A", binColor: "Vert", binColorHex: "green", recyclingMethod: "Le verre est recyclable à 100% et à l'infini. Il est fondu à 1500°C pour recréer des emballages.", preparatorySteps: ["Vider entièrement", "Retirer les bouchons/couvercles", "Ne pas laver"], environmentalImpact: "Une tonne de verre recyclé = 1.2 tonnes de matières premières vierges économisées.", estimatedBiodegradation: "4000 ans" },
            { name: "Déchet Non Recyclable", category: "Non Recyclable", ecoScore: "E", binColor: "Gris", binColorHex: "gray", recyclingMethod: "Enfouissement ou incinération avec valorisation énergétique.", preparatorySteps: ["Mettre dans un sac poubelle bien fermé"], environmentalImpact: "L'incinération rejette du CO2 mais permet de produire un peu d'énergie locale.", estimatedBiodegradation: "100 à 500 ans" }
          ];
          
          const mappedResult = categories[highestProbabilityIndex] || categories[3];
          resolve(mappedResult as WasteAnalysis);
        } catch (err) {
          reject(err);
        }
      };
      imgElement.onerror = (err) => reject(new Error("Erreur lors du chargement de l'image locale."));
    });
  };

  // Post base64 payload to backend API for Gemini processing or fallback to local AI
  const analyzePhotoViaAI = async (base64Image: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      let data: WasteAnalysis;
      
      if (!navigator.onLine) {
        console.log("📱 Hors ligne détecté : Utilisation de l'IA locale EcogreenAI");
        data = await analyzePhotoViaLocalModel(base64Image);
      } else {

      try {
        const response = await fetch("/api/analyze-waste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Échec de l'analyse backend.");
        }

        data = await response.json();
      } catch (backendErr: any) {
        console.warn("Backend API failed, trying direct client-side Gemini fallback...", backendErr);
        
        // Retrieve client-side VITE env key or localStorage
        // @ts-ignore
        const clientKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("VITE_GEMINI_API_KEY");
        if (!clientKey || clientKey === "MY_GEMINI_API_KEY") {
          throw new Error(backendErr.message || "La clé d'API client-side Gemini est manquante.");
        }

        // Clean base64 image prefix
        let cleanBase64 = base64Image;
        let mimeType = "image/jpeg";
        if (base64Image.startsWith("data:")) {
          const match = base64Image.match(/^data:([^;]+);base64,(.*)$/);
          if (match) {
            mimeType = match[1];
            cleanBase64 = match[2];
          }
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientKey}`;
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: "Analyse cette photo de déchet/objet à recycler. Identifie précisément ce que c'est, détermine sa catégorie écologique, son éco-score de recyclabilité (A à E), son bac de tri adéquat en France/Europe, sa méthode complète de traitement et de recyclage d'un point de vue éco-responsable, ainsi que sa durée de vie estimée dans la nature (biodégradation). Réponds fidèlement en français en respectant scrupuleusement le schéma JSON exigé.",
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  name: {
                    type: "STRING",
                    description: "Nom exact en français du déchet identifié (ex: Canette de soda, Bouteille de lait)"
                  },
                  category: {
                    type: "STRING",
                    description: "Catégorie principale parmi: 'Plastique', 'Verre', 'Papier / Carton', 'Métal', 'Organique', 'Électronique', 'Dangereux', 'Non Recyclable'"
                  },
                  ecoScore: {
                    type: "STRING",
                    description: "Une seule lettre éco-recylabilité de A (parfait recyclable) à E (très néfaste/non recyclable)"
                  },
                  binColor: {
                    type: "STRING",
                    description: "Couleur du bac de tri officielle en France (Jaune, Vert, Bleu, Marron, Gris, Rouge)"
                  },
                  binColorHex: {
                    type: "STRING",
                    description: "Nom de couleur css compatible Tailwind: 'yellow', 'green', 'blue', 'amber', 'gray', 'red'"
                  },
                  recyclingMethod: {
                    type: "STRING",
                    description: "Explication claire et détaillée des bénéfices du recyclage de ce produit et de la manière dont la matière sera reconditionnée."
                  },
                  preparatorySteps: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "Liste des 2 ou 3 étapes pratiques à faire chez soi (ex: ['Vider entièrement sans rincer inutilement', 'Laisser le bouchon en plastique vissé dessus', 'Ne pas froisser ou plier'])"
                  },
                  environmentalImpact: {
                    type: "STRING",
                    description: "Statistique ou phrase percutante montrant pourquoi trier cet objet protège notre planète."
                  },
                  estimatedBiodegradation: {
                    type: "STRING",
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
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || "Échec de l'appel Gemini client-side.");
        }

        const resData = await response.json();
        const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
          throw new Error("L'IA Gemini en direct n'a retourné aucun contenu.");
        }

        data = JSON.parse(textResponse.trim());
      }
      }

      setAnalysisResult(data);

      if (auth.currentUser) {
        const scanId = "scan_" + Date.now();
        const scanPath = `users/${auth.currentUser.uid}/scans/${scanId}`;
        try {
          await setDoc(doc(db, "users", auth.currentUser.uid, "scans", scanId), {
            name: data.name,
            category: data.category,
            ecoScore: data.ecoScore,
            binColor: data.binColor,
            binColorHex: data.binColorHex,
            recyclingMethod: data.recyclingMethod,
            preparatorySteps: data.preparatorySteps || [],
            environmentalImpact: data.environmentalImpact,
            estimatedBiodegradation: data.estimatedBiodegradation,
            scannedAt: new Date().toISOString(),
          });
          setRecentScans((prev) => [data, ...prev]);
        } catch (dbErr: any) {
          console.error("Failed to save scan in Firestore:", dbErr);
          handleFirestoreError(dbErr, OperationType.WRITE, scanPath);
        }
      } else {
        // Append scan into local persistence history
        setRecentScans((prev) => [data, ...prev.slice(0, 9)]);
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Une erreur de communication avec le modèle IA est survenue.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Map bin colors to corresponding visual styles
  const getBinStyle = (colorHex: string) => {
    switch (colorHex.toLowerCase()) {
      case "yellow":
        return {
          bg: "bg-yellow-50 text-yellow-800 border-yellow-300",
          accent: "bg-yellow-500",
          text: "text-yellow-600",
          badge: "BOUCHON & FLACONNAGE - JAUNE"
        };
      case "green":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-300",
          accent: "bg-emerald-500",
          text: "text-emerald-600",
          badge: "CONTENEUR DE VERRE - VERT"
        };
      case "blue":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-400",
          accent: "bg-blue-600",
          text: "text-blue-600",
          badge: "PAPIERS & CARTONNAGES - BLEU"
        };
      case "amber":
      case "brown":
        return {
          bg: "bg-amber-50 text-amber-900 border-amber-400",
          accent: "bg-amber-700",
          text: "text-amber-800",
          badge: "COMPOST & NATURE - MARRON"
        };
      case "gray":
        return {
          bg: "bg-slate-100 text-slate-800 border-slate-300",
          accent: "bg-slate-500",
          text: "text-slate-600",
          badge: "BAC RÉSIDUEL COMMINGÉ - GRIS"
        };
      case "red":
        return {
          bg: "bg-red-50 text-red-800 border-red-300",
          accent: "bg-red-500",
          text: "text-red-600",
          badge: "DÉCHETS DANGEREUX - ROUGE"
        };
      default:
        return {
          bg: "bg-gray-100 text-gray-800 border-gray-300",
          accent: "bg-gray-600",
          text: "text-gray-600",
          badge: "TRI SPÉCIFIQUE EN CONSEIL"
        };
    }
  };

  // Environmental loading step messages
  const LOADING_MESSAGES = [
    "Analyse de la matière plastique ou organique...",
    "Identification de la filière de recyclage adaptée...",
    "Calcul de l'éco-score de préservation...",
    "Recherche des astuces de démantèlement de l'objet..."
  ];

  // Render static icon mapped to tips
  const getTipIcon = (iconName: string) => {
    switch (iconName) {
      case "FileText":
        return <FileText className="w-6 h-6 text-emerald-600" />;
      case "RotateCcw":
        return <RotateCcw className="w-6 h-6 text-emerald-600" />;
      case "Flame":
        return <Flame className="w-6 h-6 text-emerald-600" />;
      case "Leaf":
        return <Leaf className="w-6 h-6 text-emerald-600" />;
      case "ShoppingBag":
        return <ShoppingBag className="w-6 h-6 text-emerald-600" />;
      default:
        return <Info className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div
      className={`min-h-screen py-6 px-4 transition-colors duration-500 flex flex-col items-center justify-start ${
        theme === "vert"
          ? "bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 text-emerald-50"
          : "bg-slate-50 text-slate-800"
      }`}
    >
      {/* Draggable Settings Trigger (Floating parameters in top or left) */}
      <motion.div
        drag
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 15 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95, cursor: "grabbing" }}
        className={`fixed z-50 p-3 rounded-full shadow-2xl cursor-grab border flex items-center gap-2 ${
          theme === "vert"
            ? "bg-emerald-800 text-emerald-100 border-emerald-500 hover:bg-emerald-700"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
        }`}
        style={{ top: "1.5rem", left: "1.5rem" }}
      >
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center gap-1 font-display font-medium text-xs tracking-wider"
          id="btn-settings-draggable"
        >
          <Settings className="w-5 h-5 animate-spin-slow text-green-400" />
          <span className="hidden md:inline pr-1 select-none">⚙️ PARAMÈTRES</span>
        </button>
      </motion.div>

      {/* Main Container / Application Wrapper ("Grand cadre") */}
      <div
        className={`w-full max-w-2xl rounded-3xl shadow-3xl overflow-hidden mt-16 mb-20 flex flex-col min-h-[580px] border transition-all duration-300 ${
          theme === "vert"
            ? "bg-emerald-900/60 backdrop-blur-md border-emerald-800 text-emerald-55"
            : "bg-white border-slate-100 text-slate-800 shadow-xl"
        }`}
        id="frame-primary-applet"
      >
        {/* Applet header inside the card frame */}
        <header
          className={`px-6 py-4 border-b flex items-center justify-between ${
            theme === "vert" ? "border-emerald-800/80" : "border-slate-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-emerald-500/20 overflow-hidden flex items-center justify-center bg-white shrink-0 shadow-sm">
              <img
                src={appLogo}
                alt="TrashCanApp Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight text-emerald-500">
                TrashCanApp
              </h1>
              <p className="text-[10px] font-mono tracking-widest uppercase opacity-75">
                Révolution du tri intelligent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                theme === "vert" ? "bg-emerald-950 text-emerald-400" : "bg-emerald-50 text-emerald-800"
              }`}
            >
              Mode Prototype
            </span>
          </div>
        </header>

        {/* Inner Panel Content */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[500px]">
          <AnimatePresence mode="wait">
            {authLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                key="auth-loading"
              >
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs font-mono opacity-80">Initialisation de la session éco-citoyenne...</p>
              </motion.div>
            ) : !currentUser ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 py-2"
                key="auth-gateway"
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 rounded-full border border-emerald-500/20 overflow-hidden bg-white shadow-md p-0.5">
                    <img
                      src={appLogo}
                      alt="TrashCanApp Logo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <h2 className="text-md font-bold font-display text-emerald-500 uppercase tracking-wide">
                      {authMode === "login" ? "Connexion TrashCanApp" : "Créer un Éco-Compte"}
                    </h2>
                    <p className="text-xs opacity-70">
                      {authMode === "login"
                        ? "Accédez à vos statistiques de tri et conservez vos scans dans le cloud."
                        : "Rejoignez la révolution verte et sauvegardez l'historique de vos tris."}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4 max-w-sm mx-auto">
                  {authError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-left">Erreur</p>
                        <p className="leading-tight text-left">{authError}</p>
                      </div>
                    </div>
                  )}

                  {authSuccess && (
                     <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                       <span>{authSuccess}</span>
                     </div>
                  )}

                  {authMode === "register" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase font-mono tracking-wider opacity-85 flex items-center gap-1.5 flex-row">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        Nom d'utilisateur écologique *
                      </label>
                      <input
                        type="text"
                        required
                        value={signupUserName}
                        onChange={(e) => setSignupUserName(e.target.value)}
                        className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 ${
                          theme === "vert"
                            ? "bg-emerald-950/60 border-emerald-800 focus:ring-emerald-500 text-emerald-100 placeholder-emerald-707"
                            : "bg-slate-50 border-slate-300 focus:ring-emerald-400 text-slate-800 placeholder-slate-400"
                        }`}
                        placeholder="Ex: Éco-Guerrier"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase font-mono tracking-wider opacity-85 flex items-center gap-1.5 flex-row">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      Adresse E-Mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 ${
                        theme === "vert"
                          ? "bg-emerald-950/60 border-emerald-800 focus:ring-emerald-500 text-emerald-100 placeholder-emerald-707"
                          : "bg-slate-50 border-slate-300 focus:ring-emerald-400 text-slate-800 placeholder-slate-400"
                      }`}
                      placeholder="votre.nom@exemple.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase font-mono tracking-wider opacity-85 flex items-center gap-1.5 flex-row">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 ${
                        theme === "vert"
                          ? "bg-emerald-950/60 border-emerald-800 focus:ring-emerald-500 text-emerald-100 placeholder-emerald-707"
                          : "bg-slate-50 border-slate-300 focus:ring-emerald-400 text-slate-800 placeholder-slate-400"
                      }`}
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 text-xs font-semibold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {authMode === "login" ? "Se Connecter" : "S'Inscrire"}
                  </button>
                </form>

                <div className="text-center font-display">
                  <button
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "register" : "login");
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                  >
                    {authMode === "login"
                      ? "Pas encore de compte ? Inscrivez-vous ici !"
                      : "Déjà un compte ? Connectez-vous !"}
                  </button>
                </div>


              </motion.div>
            ) : (
              <>
                {/* 1. CAMERA VIEW */}
            {cameraActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
                key="camera-view"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-md font-bold font-display text-emerald-500">
                    Appareil Photo de Tri en Direct
                  </h2>
                  <button
                    onClick={stopWebcam}
                    className={`p-1.5 rounded-full border ${
                      theme === "vert"
                        ? "bg-emerald-950/80 border-emerald-800 hover:bg-emerald-800"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {cameraError ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <CameraOff className="w-5 h-5 text-red-400" />
                      <span className="font-semibold">{cameraError}</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-emerald-800/40">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-emerald-400/50 m-6 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0" />
                      <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0" />
                    </div>
                  </div>
                )}

                {/* Hidden canvas for snapshotting */}
                <canvas ref={canvasRef} className="hidden" />

                <div className="flex flex-col gap-2">
                  {!cameraError && (
                    <button
                      onClick={captureWebcamSnapshot}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 animate-pulse"
                      id="btn-take-picture"
                    >
                      <Camera className="w-5 h-5" />
                      Déclencher et Analyser
                    </button>
                  )}

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-dashed opacity-25"></div>
                    <span className="flex-shrink mx-4 text-xs font-mono opacity-50">OU</span>
                    <div className="flex-grow border-t border-dashed opacity-25"></div>
                  </div>

                  {/* Standard file input trigger as robust desktop/mobile fallback */}
                  <div className="flex items-center justify-center w-full">
                    <label
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        theme === "vert"
                          ? "border-emerald-700 bg-emerald-900/40 hover:bg-emerald-950/60 text-emerald-300"
                          : "border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-500"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="w-8 h-8 mb-2 opacity-80" />
                        <p className="text-xs font-semibold px-4 text-center">
                          Sélectionner un fichier ou prendre une photo mobile
                        </p>
                        <p className="text-[10px] opacity-70 mt-1">JPEG, PNG ou WEBP</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. LOADING STATE WITH ENVIRONMENT ROTATING TIPS */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 text-center space-y-6"
                key="loading-view"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-20 h-20 border-4 border-emerald-400 border-t-transparent rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-emerald-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-display text-emerald-500 animate-pulse">
                    Traitement de l'Image par l'IA...
                  </h3>
                  <div className="h-6 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadingStep}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-xs font-mono opacity-80 text-center text-emerald-300"
                      >
                        {LOADING_MESSAGES[loadingStep]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                <div className={`p-4 rounded-xl text-left max-w-sm border ${
                  theme === "vert" ? "bg-emerald-950/65 border-emerald-800" : "bg-slate-50 border-slate-100"
                }`}>
                  <p className="text-xs italic opacity-90 text-emerald-200">
                    "Trier nos biodéchets permet d'extraire près de 30 % du tonnage de nos poubelles ordinaires sauvées de l'incinération."
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3. AI ANALYSIS CRITICAL ERROR */}
            {analysisError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 py-6 text-center"
                key="error-view"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-md font-bold text-red-400 font-display">Échec de l'Analyse</h3>
                <p className="text-xs opacity-80 max-w-md mx-auto">{analysisError}</p>

                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={startWebcam}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-xs"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={resetAppFlow}
                    className="px-4 py-2 bg-neutral-600 text-white rounded-lg font-bold text-xs"
                  >
                    Retour à l'accueil
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. RESULTS VIEW (Photo + Identified Waste Info + Recycling rules) */}
            {analysisResult && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                key="results-view"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-bold font-display text-emerald-500">
                    Déchet Identifié avec Succès 🎉
                  </h3>
                  <button
                    onClick={resetAppFlow}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                      theme === "vert"
                        ? "bg-emerald-950/80 border-emerald-800 hover:bg-emerald-800"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    Nouveau Scan
                  </button>
                </div>

                {/* Image and quick bio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {capturedImage && (
                    <div className="relative rounded-2xl overflow-hidden border border-emerald-800/20 aspect-video md:aspect-square bg-slate-900 shadow-inner">
                      <img
                        src={capturedImage}
                        alt="Déchet scan"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wider text-green-400">
                        MATÉRIAU PHOTO
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-semibold">
                        {analysisResult.category}
                      </span>
                      <h4 className="text-xl font-bold font-display tracking-tight leading-tight">
                        {analysisResult.name}
                      </h4>
                    </div>

                    {/* Meta stats badges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center ${
                        theme === "vert" ? "bg-emerald-950/60 border-emerald-800" : "bg-slate-50 border-slate-100"
                      }`}>
                        <span className="text-[9px] uppercase opacity-75 font-mono">Éco-Score</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Award className="w-4 h-4 text-yellow-400" />
                          <span className="text-lg font-bold font-display">{analysisResult.ecoScore}</span>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center ${
                        theme === "vert" ? "bg-emerald-950/60 border-emerald-800" : "bg-slate-50 border-slate-100"
                      }`}>
                        <span className="text-[9px] uppercase opacity-75 font-mono">Dégradation</span>
                        <span className="text-xs font-bold font-mono mt-0.5 text-emerald-400">
                          {analysisResult.estimatedBiodegradation}
                        </span>
                      </div>
                    </div>

                    {/* Speaks AI Voice text button */}
                    <button
                      onClick={() => {
                        const speechText = `Déchet identifié : ${analysisResult.name}. À jeter dans le bac ${analysisResult.binColor}. Consigne de tri : ${analysisResult.preparatorySteps.join(", ")}.`;
                        speakVoice(speechText);
                      }}
                      className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4 text-green-400 animate-pulse" />
                      Faire parler la voix IA de l'App
                    </button>
                  </div>
                </div>

                {/* Sorting and recycling box */}
                <div
                  className={`p-4 rounded-xl border ${
                    getBinStyle(analysisResult.binColorHex).bg
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className={`w-5 h-5 rounded-full ${
                        getBinStyle(analysisResult.binColorHex).accent
                      } border border-white/50 shadow-sm`}
                    />
                    <span className="text-xs font-bold uppercase font-mono tracking-widest opacity-90">
                      BAC DE COLLECTE RECOMMANDÉ :{" "}
                      {getBinStyle(analysisResult.binColorHex).badge}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed opacity-95">
                    {analysisResult.recyclingMethod}
                  </p>
                </div>

                {/* Steps needed */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase font-mono tracking-wider opacity-85">
                    Geste Préalable Recommandé
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {analysisResult.preparatorySteps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl flex items-start gap-2 border text-xs ${
                          theme === "vert"
                            ? "bg-emerald-950/40 border-emerald-800"
                            : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="opacity-95">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Educational outcome */}
                <div
                  className={`p-4 rounded-xl border border-dashed text-xs flex items-start gap-3 ${
                    theme === "vert"
                      ? "bg-teal-950/45 border-teal-800 text-teal-200"
                      : "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <Leaf className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5 font-display text-emerald-555">Pourquoi trier cet objet aide la Terre ?</span>
                    <span className="opacity-90">{analysisResult.environmentalImpact}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={resetAppFlow}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    Fermer et recommencer
                  </button>
                </div>
              </motion.div>
            )}

            {/* 5. GENERAL TAB: DEFAULT DASHBOARD */}
            {!cameraActive && !capturedImage && !isAnalyzing && activeTab === "dashboard" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
                key="dashboard-view"
              >
                {/* Greeting section */}
                <header className="space-y-1">
                  <h2 className="text-lg font-bold font-display leading-tight flex items-center gap-1.5">
                    <span>Hé</span>
                    <span className="text-emerald-500 underline decoration-dashed decoration-green-450/60 font-semibold">
                      {userName}
                    </span>
                    <span>!</span>
                  </h2>
                  <p className="text-xs opacity-80">
                    Bénéficiez du pouvoir de l'I.A. pour trier chaque déchet de manière responsable.
                  </p>
                </header>

                {/* Le saviez vous widget */}
                <div
                  className={`p-5 rounded-2xl border relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                    theme === "vert"
                      ? "bg-emerald-950/50 border-emerald-800"
                      : "bg-slate-50 border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="p-1 bg-yellow-400/20 rounded-lg text-yellow-500">💡</span>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 font-bold">
                          Le saviez-vous ?
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold mt-1">
                        {ECO_FACTS[currentFactIndex].question}
                      </h4>
                      <p className="text-xs opacity-90 leading-relaxed mt-1">
                        {ECO_FACTS[currentFactIndex].fact}
                      </p>
                    </div>

                    <button
                      onClick={rotateFact}
                      className={`p-2 rounded-xl transition-colors shrink-0 ${
                        theme === "vert" ? "hover:bg-emerald-800 bg-emerald-900" : "hover:bg-slate-200 bg-slate-100"
                      }`}
                      title="Nouveau fait"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-500" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] opacity-75">
                    <span>Source : {ECO_FACTS[currentFactIndex].source}</span>
                    <span className="font-mono">Fait écologique #{currentFactIndex + 1}</span>
                  </div>
                </div>

                {/* Quick actions tracker / Recent scans */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase font-bold tracking-widest opacity-80">
                    <span>Historique de vos Scans</span>
                    <span>{recentScans.length} Objets identifiés</span>
                  </div>

                  {recentScans.length === 0 ? (
                    <div
                      className={`p-6 text-center rounded-xl border border-dashed ${
                        theme === "vert" ? "border-emerald-800/60" : "border-slate-300"
                      }`}
                    >
                      <Camera className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                      <p className="text-xs opacity-75">Aucun scan récent.</p>
                      <p className="text-[10px] opacity-60 mt-0.5">
                        Cliquez sur l'appareil photo en bas pour démarrer !
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-hide">
                      {recentScans.map((scan, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer ${
                            theme === "vert"
                              ? "bg-zinc-900/30 border-emerald-850 hover:bg-emerald-950/20"
                              : "bg-white border-slate-100 shadow-sm hover:bg-slate-50"
                          }`}
                          onClick={() => {
                            setAnalysisResult(scan);
                            setCapturedImage(null); // File is offline
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3.5 h-3.5 rounded-full ${
                                getBinStyle(scan.binColorHex).accent
                              }`}
                            />
                            <div>
                              <span className="font-semibold block">{scan.name}</span>
                              <span className="text-[10px] opacity-70">
                                {scan.category} • Bac {scan.binColor}
                              </span>
                            </div>
                          </div>

                          <span className="font-display font-medium text-emerald-500 text-[10px]">
                            Consulter {">"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 6. GENERAL TAB: TRASH TIPS */}
            {!cameraActive && !capturedImage && !isAnalyzing && activeTab === "tips" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
                key="tips-view"
              >
                <div>
                  <h3 className="text-md font-bold font-display text-emerald-500">Astuces de Recyclage</h3>
                  <p className="text-xs opacity-85 font-display">Gagnez en efficacité grâce à nos règles de tri d'experts.</p>
                </div>

                <div className="space-y-3">
                  {ECO_TIPS.map((tip) => (
                    <div
                      key={tip.id}
                      onClick={() => setSelectedTipId(selectedTipId === tip.id ? null : tip.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        theme === "vert"
                          ? "bg-emerald-950/40 border-emerald-850 hover:bg-emerald-900/50"
                          : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                            {getTipIcon(tip.icon)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold">{tip.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 font-medium rounded">
                                Difficulté : {tip.difficulty}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 bg-teal-500/15 text-teal-300 font-medium rounded">
                                Impact : {tip.impact}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 text-emerald-500 transition-transform ${
                            selectedTipId === tip.id ? "rotate-90" : ""
                          }`}
                        />
                      </div>

                      <AnimatePresence>
                        {selectedTipId === tip.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs opacity-90 leading-relaxed border-t border-dashed border-emerald-800/30 pt-3 mt-3">
                              {tip.content}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 7. GENERAL TAB: ECO NEWS */}
            {!cameraActive && !capturedImage && !isAnalyzing && activeTab === "news" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
                key="news-view"
              >
                <div>
                  <h3 className="text-md font-bold font-display text-emerald-500">Actualités du Climat</h3>
                  <p className="text-xs opacity-85">Informations et initiatives législatives sur notre environnement.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {ECO_NEWS.map((news) => (
                    <article
                      key={news.id}
                      className={`p-4 rounded-xl border space-y-2.5 ${
                        theme === "vert" ? "bg-emerald-950/40 border-emerald-855" : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono opacity-85">
                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md font-semibold font-display">
                          {news.tag}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {news.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {news.readTime}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold leading-tight">{news.title}</h4>
                      <p className="text-xs opacity-90 leading-relaxed">{news.summary}</p>

                      <div className="flex items-center justify-between border-t border-dashed border-emerald-800/20 pt-2 text-[10px] opacity-75">
                        <span>Écrit par : {news.author}</span>
                        <a
                          href="https://www.ademe.fr"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                          Visiter source <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </motion.div>
            )}
              </>
            )}
          </AnimatePresence>
        </main>

        {/* Persistent Bottom Nav Bar Banner ("Banderole") */}
        <footer
          className={`px-4 py-4 border-t relative ${
            theme === "vert" ? "bg-emerald-950/90 border-emerald-855" : "bg-slate-50 border-slate-200"
          }`}
        >
          {/* Centered Appareil Photo Button inside the Bottom banner */}
          <div className="absolute left-1/2 -top-6 transform -translate-x-1/2 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={startWebcam}
              className={`p-5 rounded-full shadow-2xl transition-transform border-4 flex items-center justify-center cursor-pointer ${
                theme === "vert"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-950 shadow-emerald-500/25 animate-pulse"
                  : "bg-emerald-500 hover:bg-emerald-400 text-white border-white shadow-emerald-700/25"
              }`}
              style={{ width: "64px", height: "64px" }}
              title="Prendre un déchet en photo"
              id="footer-camera-action-btn"
            >
              <Camera className="w-8 h-8 shrink-0" />
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tips button on the left of Camera */}
            <button
              onClick={() => {
                setActiveTab("tips");
                resetAppFlow();
              }}
              className={`flex flex-col items-center justify-center gap-1 relative py-1 rounded-xl transition-colors ${
                activeTab === "tips" && !cameraActive && !capturedImage
                  ? "text-emerald-400 font-bold font-display"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
              id="footer-tips-tab"
            >
              <FileText className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-mono uppercase font-semibold">Conseils Tri</span>
              {activeTab === "tips" && !cameraActive && !capturedImage && (
                <div className="absolute bottom-0 w-8 h-1 bg-emerald-500 rounded-full" />
              )}
            </button>

            {/* News button on the right of Camera */}
            <button
              onClick={() => {
                setActiveTab("news");
                resetAppFlow();
              }}
              className={`flex flex-col items-center justify-center gap-1 relative py-1 rounded-xl transition-colors ${
                activeTab === "news" && !cameraActive && !capturedImage
                  ? "text-emerald-400 font-bold font-display"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
              id="footer-news-tab"
            >
              <Newspaper className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-mono uppercase font-semibold">Actus Climat</span>
              {activeTab === "news" && !cameraActive && !capturedImage && (
                <div className="absolute bottom-0 w-8 h-1 bg-emerald-500 rounded-full" />
              )}
            </button>
          </div>
        </footer>
      </div>

      {/* Slide out or absolute popup for parameters (Settings Open) */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-2xl p-6 relative shadow-2xl border ${
                theme === "vert" ? "bg-emerald-950 border-emerald-800 text-emerald-50" : "bg-white text-slate-800"
              }`}
            >
              <button
                onClick={() => setSettingsOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full opacity-70 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-6 border-b pb-3 border-dashed border-emerald-800/30">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="text-md font-bold font-display uppercase tracking-wide">
                  Configuration de l'Application
                </h3>
              </div>

              <div className="space-y-5">
                {/* 1. UserName setup */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase font-mono tracking-wider opacity-80 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Nom d'utilisateur écologique
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-1 ${
                      theme === "vert"
                        ? "bg-emerald-900/60 border-emerald-800 focus:ring-emerald-500 text-emerald-100"
                        : "bg-slate-50 border-slate-300 focus:ring-emerald-400 text-slate-800"
                    }`}
                    placeholder="Éco-Guerrier"
                  />
                </div>

                {/* Account Credentials / Sign Out block */}
                {currentUser && (
                  <div className={`p-3 rounded-xl border border-dashed flex flex-col gap-2 ${
                    theme === "vert" ? "bg-emerald-900/40 border-emerald-800/60" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] uppercase font-mono tracking-wider opacity-70 block">
                          Compte Connecté
                        </span>
                        <span className="text-xs font-semibold truncate max-w-[200px] block font-mono">
                          {currentUser.email}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          await handleSignOut();
                          setSettingsOpen(false);
                        }}
                        className="px-2.5 py-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" /> Se Déconnecter
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Contrast configuration (VERT OR BLANC) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase font-mono tracking-wider opacity-80 block text-left">
                    Contraste et Thème de Couleur
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTheme("vert")}
                      className={`py-2 px-3 text-xs rounded-xl font-bold border transition-colors ${
                        theme === "vert"
                          ? "bg-emerald-400 text-white border-emerald-300"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      🌿 Éco-Vert Contrasté
                    </button>
                    <button
                      onClick={() => setTheme("blanc")}
                      className={`py-2 px-3 text-xs rounded-xl font-bold border transition-colors ${
                        theme === "blanc"
                          ? "bg-slate-800 text-white border-slate-700"
                          : "bg-slate-50 text-slate-700 hover:bg-emerald-50"
                      }`}
                    >
                      ⚪ Clinique / Blanc épuré
                    </button>
                  </div>
                </div>

                {/* 3. AI voice toggle switch */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-emerald-800/30">
                  <div className="space-y-0.5 max-w-[240px] text-left">
                    <span className="text-xs font-bold font-display uppercase block tracking-wider">
                      Voix de Synthèse IA
                    </span>
                    <span className="text-[10px] opacity-80 block">
                      Lit l'analyse et la méthode de tri vocalement dès que le déchet est analysé.
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const updated = !voiceEnabled;
                      setVoiceEnabled(updated);
                      if (updated) {
                        speakVoice("Voix de l'intelligence artificielle activée.");
                      }
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      voiceEnabled
                        ? "bg-emerald-500 text-white"
                        : "bg-neutral-600 text-neutral-300"
                    }`}
                    title={voiceEnabled ? "Désactiver la voix" : "Activer la voix"}
                  >
                    {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                </div>

                {/* 4. Follow us / Nous suivre section */}
                <div className="pt-3 border-t border-dashed border-emerald-800/30 space-y-2">
                  <span className="text-[11px] font-bold font-mono tracking-wider uppercase block opacity-80 text-center">
                    🌿 Nous Suivre - Activisme Écologique
                  </span>
                  {settingsFeedback && (
                    <p className="text-[10px] text-center text-emerald-400 font-semibold animate-pulse">
                      {settingsFeedback}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSettingsFeedback("Merci de nous suivre sur Instagram pour plus d'astuces de tri !");
                      }}
                      className="p-2 bg-emerald-900/40 hover:bg-emerald-800 rounded-full border border-emerald-800 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    >
                      <Instagram className="w-4 h-4 text-pink-400" />
                      <span className="hidden sm:inline">Instagram</span>
                    </button>
                    <button
                      onClick={() => {
                        setSettingsFeedback("Suivez notre activité sur Twitter/X pour réduire votre empreinte carbone !");
                      }}
                      className="p-2 bg-emerald-900/40 hover:bg-emerald-800 rounded-full border border-emerald-800 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    >
                      <Twitter className="w-4 h-4 text-sky-400" />
                      <span className="hidden sm:inline">Twitter / X</span>
                    </button>
                    <a
                      href="https://www.ademe.fr"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-emerald-900/40 hover:bg-emerald-800 rounded-full border border-emerald-800 flex items-center gap-1.5 text-xs font-medium text-emerald-400"
                    >
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>ADEME</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={async () => {
                    if (currentUser) {
                      const userDocPath = `users/${currentUser.uid}`;
                      try {
                        let finalRegAt = registeredAt;
                        if (!finalRegAt) {
                          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                          if (userDoc.exists()) {
                            finalRegAt = userDoc.data().registeredAt || null;
                          }
                        }
                        if (!finalRegAt) {
                          finalRegAt = new Date().toISOString();
                        }

                        await setDoc(doc(db, "users", currentUser.uid), {
                          userName: userName,
                          email: currentUser.email || "",
                          registeredAt: finalRegAt
                        }, { merge: true });
                        setRegisteredAt(finalRegAt);
                      } catch (err: any) {
                        console.error("Failed to update profile name:", err);
                        handleFirestoreError(err, OperationType.UPDATE, userDocPath);
                      }
                    }
                    setSettingsOpen(false);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auxiliary link to default home or dashboard tabs (allows switching easily directly) */}
      {!cameraActive && !capturedImage && !isAnalyzing && activeTab !== "dashboard" && (
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 hover:scale-105 transition-transform ${
            theme === "vert"
              ? "bg-emerald-900/40 border-emerald-800 text-emerald-400"
              : "bg-white border-slate-200 text-slate-700 shadow-sm"
          }`}
        >
          <Compass className="w-4 h-4" /> Voir le Tableau de Bord Éco
        </button>
      )}
    </div>
  );
}

// Simple fallback helper if custom animations or icons need standalone items
function Compass(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
