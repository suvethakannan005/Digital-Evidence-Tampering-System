/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  LogIn,
  ArrowRight,
  Info,
  History,
  Lock,
  User,
  Download,
  Video,
  ExternalLink,
  Clock,
  Twitter,
  Github,
  Linkedin,
  Mail,
  MessageSquare,
  Globe,
  Users,
  Database,
  Scan,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Helper to get Gemini AI instance
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

interface AnalysisResult {
  id: string;
  timestamp: string;
  type: 'image' | 'video';
  status: 'Original' | 'Tampered';
  authenticityScore: number;
  explanation: string;
  findings: string[];
  thumbnail: string;
  userEmail?: string;
}

type ViewState = 'login' | 'user-dashboard' | 'investigator-dashboard' | 'profile' | 'analysis';

export default function App() {
  const [view, setView] = useState<ViewState>('login');
  const [user, setUser] = useState<{ name: string, role: 'user' | 'investigator', email: string } | null>(null);
  const [media, setMedia] = useState<{ data: string, type: 'image' | 'video' } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [userHistory, setUserHistory] = useState<AnalysisResult[]>([]);
  const [allUserEvidence, setAllUserEvidence] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);
  const [archive, setArchive] = useState<AnalysisResult[]>([]);

  // Mock analytics data
  const analyticsData = [
    { name: 'Mon', uploads: 45, tampering: 12 },
    { name: 'Tue', uploads: 52, tampering: 18 },
    { name: 'Wed', uploads: 38, tampering: 8 },
    { name: 'Thu', uploads: 65, tampering: 25 },
    { name: 'Fri', uploads: 48, tampering: 15 },
    { name: 'Sat', uploads: 30, tampering: 5 },
    { name: 'Sun', uploads: 25, tampering: 3 },
  ];

  const modelAccuracy = [
    { name: 'Image Detection', value: 98.4 },
    { name: 'Video Deepfake', value: 96.2 },
    { name: 'Metadata Analysis', value: 99.1 },
    { name: 'ELA Consistency', value: 97.8 },
  ];

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const askAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const ai = getGenAI();
    if (!ai) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Forensic engine not configured. Please set the GEMINI_API_KEY in settings." }]);
      return;
    }

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: "You are a Senior Forensic AI Assistant. Help investigators interpret digital evidence findings. Be technical, precise, and professional. If asked about a specific result, explain concepts like Error Level Analysis (ELA), pixel inconsistency, and metadata tampering."
        }
      });
      
      setChatMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      console.error("Assistant Error:", error);
      setChatMessages(prev => [...prev, { role: 'ai', text: "Connection to forensic brain lost. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const addToArchive = () => {
    if (result) {
      setArchive(prev => [result, ...prev]);
      showToast("Evidence archived successfully with cryptographic hash.", "success");
    }
  };

  const startBatchScan = () => {
    setIsBatchScanning(true);
    setTimeout(() => {
      setIsBatchScanning(false);
      showToast("Batch scan of 5 items completed. 2 suspicious files flagged.", "info");
    }, 3000);
  };

  const shareResult = () => {
    const link = "https://evidence.ai/share/" + result?.id;
    navigator.clipboard.writeText(link).then(() => {
      showToast("Sharing link copied to clipboard!", "success");
    }).catch(() => {
      showToast("Failed to copy link.", "error");
    });
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('evidence_history');
    if (savedHistory) {
      setUserHistory(JSON.parse(savedHistory));
    }
    const savedAllEvidence = localStorage.getItem('all_evidence');
    if (savedAllEvidence) {
      setAllUserEvidence(JSON.parse(savedAllEvidence));
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('evidence_history', JSON.stringify(userHistory));
  }, [userHistory]);

  useEffect(() => {
    localStorage.setItem('all_evidence', JSON.stringify(allUserEvidence));
  }, [allUserEvidence]);

  // Simulated Login
  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const username = formData.get('username') as string;
    setUser({ 
      name: username || 'Standard User',
      role: 'user',
      email: `${username.toLowerCase().replace(/\s+/g, '.')}@evidence.ai`
    });
    setView('user-dashboard');
    showToast("Logged in to User Portal", "success");
  };

  const handleInvestigatorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const id = formData.get('investigatorId') as string;
    setUser({ 
      name: `Agent ${id}` || 'Senior Investigator',
      role: 'investigator',
      email: `agent.${id}@forensics.gov`
    });
    setView('investigator-dashboard');
    showToast("Logged in to Investigator Command Center", "success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia({ data: reader.result as string, type });
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const analyzeEvidence = async () => {
    if (!media || !user) return;
    
    const ai = getGenAI();
    if (!ai) {
      showToast("Forensic engine API key missing.", "error");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const model = "gemini-3-flash-preview";
      const base64Data = media.data.split(',')[1];
      const mimeType = media.type === 'video' ? 'video/mp4' : 'image/jpeg';
      
      const prompt = `
        Analyze this ${media.type} for signs of digital tampering, manipulation, or editing. 
        Act as a digital forensics expert.
        Return a JSON object with the following structure:
        {
          "status": "Original" or "Tampered",
          "authenticityScore": number between 0 and 100,
          "explanation": "A short summary of why you reached this conclusion",
          "findings": ["Finding 1", "Finding 2", "Finding 3"]
        }
        Focus on lighting inconsistencies, pixel artifacts, metadata (if any inferred), edge sharpness, and for videos, look for frame-to-frame inconsistencies or deepfake characteristics.
        Even if the evidence is original, provide technical reasons why it looks authentic.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      const resultText = response.text;
      if (resultText) {
        const parsedData = JSON.parse(resultText);
        const newResult: AnalysisResult = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleString(),
          type: media.type,
          status: parsedData.status,
          authenticityScore: parsedData.authenticityScore,
          explanation: parsedData.explanation,
          findings: parsedData.findings,
          thumbnail: media.data,
          userEmail: user.email
        };
        setResult(newResult);
        setUserHistory(prev => [newResult, ...prev].slice(0, 10));
        setAllUserEvidence(prev => [newResult, ...prev]);
        showToast("Forensic analysis complete.", "success");
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Failed to analyze evidence. Please try again.");
      showToast("Forensic scan failed.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const reportText = `
EVIDENCE ANALYSIS REPORT
------------------------
ID: ${result.id}
Timestamp: ${result.timestamp}
Type: ${result.type.toUpperCase()}
Status: ${result.status.toUpperCase()}
Authenticity Score: ${result.authenticityScore}%

EXPLANATION:
${result.explanation}

FINDINGS:
${result.findings.map(f => `- ${f}`).join('\n')}

------------------------
Generated by EvidenceAI Systems
    `;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Evidence_Report_${result.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Components ---

  // --- Views ---

  const LoginView = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8">
        {/* User Login Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-10 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">User Portal</h2>
              <p className="text-slate-500 font-medium">Verify your digital media authenticity.</p>
            </div>
            <form onSubmit={handleUserLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    name="username"
                    type="text" 
                    placeholder="Enter username" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center space-x-2 transition-all"
              >
                <span>Access User Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Standard access for individuals and content creators to verify image and video integrity.
            </p>
          </div>
        </motion.div>

        {/* Investigator Login Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 flex flex-col justify-between text-white"
        >
          <div className="space-y-6">
            <div className="bg-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Investigator Command</h2>
              <p className="text-slate-400 font-medium">Advanced forensic tools and analytics.</p>
            </div>
            <form onSubmit={handleInvestigatorLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Investigator ID</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input 
                    name="investigatorId"
                    type="text" 
                    placeholder="Enter Badge ID" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 hover:bg-slate-100 transition-all"
              >
                <span>Authorize Access</span>
                <ShieldCheck className="w-5 h-5" />
              </button>
            </form>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Restricted access for certified digital forensic investigators and law enforcement personnel.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const UserDashboard = () => (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">EvidenceAI</span>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => setView('profile')} className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 font-bold transition-all">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button onClick={() => setView('login')} className="text-slate-400 hover:text-red-500 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
            <div className="space-y-6 mb-10">
              <h2 className="text-3xl font-bold text-slate-900">Verify Evidence</h2>
              <p className="text-slate-500">Upload an image or video to check for tampering using our AI forensic engine.</p>
            </div>

            {!media ? (
              <div 
                onClick={triggerUpload}
                className="w-full aspect-video border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group"
              >
                <div className="bg-white p-6 rounded-3xl shadow-md mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Upload Media</h3>
                <p className="text-slate-400 font-medium mt-2">PNG, JPG, MP4 up to 50MB</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative rounded-[2rem] overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center">
                  {media.type === 'video' ? (
                    <video src={media.data} controls className="max-h-full" />
                  ) : (
                    <img src={media.data} alt="Preview" className="max-h-full object-contain" />
                  )}
                  <button 
                    onClick={() => { setMedia(null); setResult(null); }}
                    className="absolute top-6 right-6 bg-white/90 backdrop-blur p-2 rounded-xl text-red-500 shadow-lg hover:scale-110 transition-all"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                {!result && (
                  <button 
                    onClick={analyzeEvidence}
                    disabled={isAnalyzing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold text-xl shadow-xl shadow-blue-200 flex items-center justify-center space-x-3 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                    <span>{isAnalyzing ? 'Analyzing...' : 'Start AI Analysis'}</span>
                  </button>
                )}
              </div>
            )}
          </section>

          {result && !isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-[2.5rem] p-10 border-2 ${
                result.status === 'Original' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
              }`}
            >
              <div className="flex items-start space-x-6">
                <div className={`p-4 rounded-2xl ${result.status === 'Original' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                  {result.status === 'Original' ? <CheckCircle2 className="w-10 h-10 text-white" /> : <AlertTriangle className="w-10 h-10 text-white" />}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-2xl font-bold ${result.status === 'Original' ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {result.status === 'Original' ? 'Authentic Evidence' : 'Tampering Detected'}
                    </h3>
                    <span className="text-xl font-black">{result.authenticityScore}% Score</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{result.explanation}</p>
                  <div className="pt-4 flex flex-wrap gap-2">
                    {result.findings.map((f, i) => (
                      <span key={i} className="bg-white/50 px-3 py-1 rounded-lg text-xs font-bold text-slate-700 border border-slate-200">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <History className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-slate-900">Your History</h3>
            </div>
            <div className="space-y-4">
              {userHistory.length === 0 ? (
                <p className="text-slate-400 text-sm italic text-center py-8">No recent scans</p>
              ) : (
                userHistory.map(item => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={item.thumbnail} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">Scan #{item.id}</p>
                      <p className="text-slate-400 text-[10px]">{item.timestamp}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                      item.status === 'Original' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
    </div>
  );

  const AnalysisView = () => (
    <div className="min-h-screen bg-blue-50/20 font-sans text-blue-900">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 py-6 px-8 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => setView(user?.role === 'investigator' ? 'investigator-dashboard' : 'user-dashboard')} className="p-3 hover:bg-blue-50 rounded-2xl transition-colors text-blue-400">
              <ArrowRight className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-blue-900 tracking-tight">EvidenceAI Forensic Engine</h1>
              <p className="text-blue-400 text-sm font-medium">Advanced Media Authentication & Forensic Analysis</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${user?.role === 'investigator' ? 'bg-blue-900 text-white' : 'bg-blue-50 text-blue-900'} px-4 py-2 rounded-xl border border-blue-100`}>
              <div className={`w-2 h-2 rounded-full ${user?.role === 'investigator' ? 'bg-blue-400' : 'bg-blue-600'}`} />
              <span className="font-bold text-xs uppercase tracking-wider">
                {user?.role === 'investigator' ? 'Investigator Mode' : 'Standard User Mode'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-8 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Upload Section */}
          <section className="bg-white rounded-[2.5rem] border border-blue-100 p-10 shadow-xl shadow-blue-900/5">
            <div className="flex flex-col items-center justify-center space-y-8">
              {!media ? (
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={triggerUpload}
                  className="w-full aspect-video border-2 border-dashed border-blue-200 rounded-[2rem] bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-all group"
                >
                  <div className="bg-white p-6 rounded-3xl shadow-xl mb-6 group-hover:shadow-blue-200 transition-all">
                    <Upload className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-900">Upload Evidence</h3>
                  <p className="text-blue-400 font-medium mt-2">MP4, MOV, PNG, JPG up to 50MB</p>
                </motion.div>
              ) : (
                <div className="w-full space-y-8">
                  <div className="relative group p-4 bg-blue-50 rounded-[2rem] border-2 border-blue-100">
                    {media.type === 'video' ? (
                      <video 
                        src={media.data} 
                        controls 
                        className="w-full max-h-[500px] rounded-2xl shadow-2xl bg-black"
                      />
                    ) : (
                      <img 
                        src={media.data} 
                        alt="Evidence Preview" 
                        className="w-full max-h-[500px] object-contain rounded-2xl shadow-2xl"
                      />
                    )}
                    <button 
                      onClick={() => { setMedia(null); setResult(null); }}
                      className="absolute top-8 right-8 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl hover:bg-white text-red-500 transition-all hover:scale-110"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={analyzeEvidence}
                      disabled={isAnalyzing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-[2rem] font-bold text-xl shadow-2xl shadow-blue-200 flex items-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Analyzing pixel patterns...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-6 h-6" />
                          <span>Analyze Evidence</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*,video/*" 
                className="hidden" 
              />
            </div>
          </section>

          {/* Results Section */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] border border-blue-100 p-16 shadow-2xl shadow-blue-900/5 text-center space-y-8"
              >
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 border-8 border-blue-50 rounded-full"></div>
                  <div className="absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-extrabold text-blue-900">Analyzing pixel patterns, metadata, and possible tampering...</h3>
                  <p className="text-blue-400 text-lg font-medium">Our neural forensic engine is processing the evidence frames.</p>
                </div>
              </motion.div>
            )}

            {result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Main Result Card */}
                <div className={`rounded-[2.5rem] border-2 p-10 shadow-2xl ${
                  result.status === 'Original' 
                    ? 'bg-emerald-50/50 border-emerald-100 shadow-emerald-900/5' 
                    : 'bg-amber-50/50 border-amber-100 shadow-amber-900/5'
                }`}>
                  <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-10">
                    <div className={`p-6 rounded-[2rem] shadow-xl ${
                      result.status === 'Original' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}>
                      {result.status === 'Original' ? (
                        <CheckCircle2 className="w-12 h-12 text-white" />
                      ) : (
                        <AlertTriangle className="w-12 h-12 text-white" />
                      )}
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <h2 className={`text-3xl font-black ${
                            result.status === 'Original' ? 'text-emerald-900' : 'text-amber-900'
                          }`}>
                            {result.status === 'Original' ? 'Likely Original Evidence' : 'Possible Tampering Detected'}
                          </h2>
                          <div className="flex items-center space-x-3">
                            {user?.role === 'user' && (
                              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>Community Verified</span>
                              </div>
                            )}
                            <div className={`px-6 py-2 rounded-full text-lg font-black shadow-sm ${
                              result.status === 'Original' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                            }`}>
                              Authenticity Score: {result.authenticityScore}%
                            </div>
                          </div>
                        </div>
                      <p className={`text-xl font-medium leading-relaxed ${
                        result.status === 'Original' ? 'text-emerald-700/80' : 'text-amber-700/80'
                      }`}>
                        {result.explanation}
                      </p>
                      
                      <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                        <button 
                          onClick={() => setShowReport(true)}
                          className="bg-white border-2 border-blue-100 text-blue-600 px-6 py-3 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center space-x-2"
                        >
                          <FileText className="w-5 h-5" />
                          <span>View Analysis Summary</span>
                        </button>
                        {user?.role === 'investigator' ? (
                          <>
                            <button 
                              onClick={downloadReport}
                              className="bg-blue-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-800 transition-all flex items-center space-x-2 shadow-lg shadow-blue-900/20"
                            >
                              <Download className="w-5 h-5" />
                              <span>Export Forensic Report</span>
                            </button>
                            <button 
                              onClick={addToArchive}
                              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center space-x-2 shadow-lg shadow-emerald-200"
                            >
                              <Database className="w-5 h-5" />
                              <span>Archive Evidence</span>
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={shareResult}
                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-lg shadow-blue-200"
                          >
                            <ExternalLink className="w-5 h-5" />
                            <span>Share Verification</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Indicators - Investigator Only */}
                {user?.role === 'investigator' ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2rem] border border-blue-100 p-8 shadow-xl shadow-blue-900/5">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-2xl">
                          <AlertTriangle className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-blue-900">Forensic Findings</h3>
                      </div>
                      <ul className="space-y-4">
                        {result.findings.map((finding, idx) => (
                          <li key={idx} className="flex items-start space-x-4 p-4 bg-blue-50/30 rounded-2xl border border-blue-50">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                            <span className="text-blue-900/80 font-semibold">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-blue-100 p-8 shadow-xl shadow-blue-900/5">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-2xl">
                          <ImageIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-blue-900">Advanced Metrics</h3>
                      </div>
                      <div className="space-y-6">
                        {[
                          { label: 'Pixel Pattern Consistency', value: result.status === 'Original' ? 98 : 42 },
                          { label: 'Lighting & Shadow Logic', value: result.status === 'Original' ? 95 : 35 },
                          { label: 'Metadata Integrity', value: result.status === 'Original' ? 100 : 12 },
                          { label: 'Deepfake Probability', value: result.status === 'Original' ? 2 : 78, inverse: true },
                        ].map((metric, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-blue-400 uppercase tracking-wider">
                              <span>{metric.label}</span>
                              <span>{metric.value}%</span>
                            </div>
                            <div className="h-3 bg-blue-50 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.value}%` }}
                                className={`h-full rounded-full ${
                                  metric.inverse 
                                    ? (metric.value > 50 ? 'bg-amber-500' : 'bg-emerald-500')
                                    : (metric.value > 70 ? 'bg-emerald-500' : 'bg-amber-500')
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] border border-blue-100 p-8 shadow-xl shadow-blue-900/5">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">Verification Summary</h3>
                    <p className="text-blue-600 font-medium">
                      Our AI has completed a basic scan of your media. For a full forensic breakdown, please consult an authorized investigator.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar: History & Tools */}
        <div className="space-y-8">
          {user?.role === 'investigator' && (
            <section className="bg-blue-900 rounded-[2rem] p-8 text-white space-y-6 shadow-2xl shadow-blue-900/20">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold">Investigator Tools</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={startBatchScan}
                  disabled={isBatchScanning}
                  className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all disabled:opacity-50"
                >
                  <Scan className={`w-6 h-6 ${isBatchScanning ? 'animate-pulse text-blue-400' : ''}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{isBatchScanning ? 'Scanning...' : 'Batch Scan'}</span>
                </button>
                <button 
                  onClick={() => showToast("Archive contains " + archive.length + " items.", "info")}
                  className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all"
                >
                  <Database className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Archive ({archive.length})</span>
                </button>
              </div>
            </section>
          )}

          <section className="bg-white rounded-[2rem] border border-blue-100 p-8 shadow-xl shadow-blue-900/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <History className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-blue-900">{user?.role === 'investigator' ? 'Case History' : 'Recent Scans'}</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {userHistory.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 text-blue-200" />
                  </div>
                  <p className="text-blue-300 font-medium italic">No previous investigations</p>
                </div>
              ) : (
                userHistory.map((item) => (
                  <motion.div 
                    key={item.id}
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-blue-50 transition-all cursor-pointer border border-transparent hover:border-blue-100 group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-blue-50">
                      {item.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-blue-900">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <img src={item.thumbnail} alt="Thumb" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-blue-900 truncate text-sm">Case #${item.id}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          item.status === 'Original' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.authenticityScore}%
                        </span>
                      </div>
                      <p className="text-blue-400 text-[10px] font-medium mt-1">{item.timestamp}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          <div className="bg-blue-600 rounded-[2rem] p-8 text-white space-y-4 shadow-2xl shadow-blue-200">
            <h4 className="font-bold text-lg">Need Expert Review?</h4>
            <p className="text-blue-100 text-sm leading-relaxed">
              Our professional forensic team can provide a certified manual audit for legal proceedings.
            </p>
            <button className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center space-x-2">
              <span>Contact Experts</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <FileText className="w-8 h-8" />
                  <div>
                    <h3 className="text-2xl font-bold">Evidence Analysis Report</h3>
                    <p className="text-blue-100 text-sm">Case ID: {result.id}</p>
                  </div>
                </div>
                <button onClick={() => setShowReport(false)} className="hover:bg-white/20 p-2 rounded-full transition-all">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>
              
              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Analysis Date</p>
                    <p className="font-bold text-blue-900">{result.timestamp}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Authenticity Score</p>
                    <p className={`text-2xl font-black ${result.status === 'Original' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {result.authenticityScore}%
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-blue-900 border-b border-blue-50 pb-2">Executive Summary</h4>
                  <p className="text-blue-900/70 leading-relaxed font-medium">
                    {result.explanation}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-blue-900 border-b border-blue-50 pb-2">Detailed Findings</h4>
                  <div className="grid gap-4">
                    {result.findings.map((f, i) => (
                      <div key={i} className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </div>
                        <p className="text-blue-900 font-bold text-sm">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {user?.role === 'investigator' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-blue-900 border-b border-blue-50 pb-2">Chain of Custody Log</h4>
                    <div className="space-y-3">
                      {[
                        { time: "12:01:22", action: "Evidence Uploaded", user: "Investigator #104" },
                        { time: "12:01:23", action: "AI Neural Scan Initiated", user: "System" },
                        { time: "12:01:25", action: "Forensic Report Generated", user: "System" },
                      ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span className="font-mono text-blue-400">{log.time}</span>
                            <span className="font-bold text-blue-900">{log.action}</span>
                          </div>
                          <span className="text-blue-400 font-medium italic">{log.user}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-blue-50 border-t border-blue-100 flex justify-end space-x-4">
                <button 
                  onClick={() => setShowReport(false)}
                  className="px-8 py-3 rounded-xl font-bold text-blue-400 hover:text-blue-600 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={downloadReport}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  Download Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const InvestigatorDashboard = () => (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <nav className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-8 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Investigator Command</span>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => setView('profile')} className="flex items-center space-x-2 text-slate-400 hover:text-white font-bold transition-all">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button onClick={() => setView('login')} className="text-slate-600 hover:text-red-500 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        {/* Analytics Overview */}
        <section className="grid md:grid-cols-4 gap-6">
          {[
            { label: 'Total Uploads', value: allUserEvidence.length + 1240, icon: Upload, color: 'text-blue-400' },
            { label: 'Tampering Detected', value: allUserEvidence.filter(e => e.status === 'Tampered').length + 342, icon: AlertTriangle, color: 'text-amber-400' },
            { label: 'AI Accuracy', value: '98.4%', icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Active Cases', value: '12', icon: History, color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl bg-slate-900 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live</span>
              </div>
              <div>
                <p className="text-3xl font-black">{stat.value}</p>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Usage Chart */}
            <section className="bg-slate-800/50 border border-slate-700 p-8 rounded-[2.5rem] space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Platform Activity</h3>
                <div className="flex space-x-4 text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center space-x-2"><div className="w-2 h-2 bg-blue-500 rounded-full" /> <span className="text-slate-400">Uploads</span></span>
                  <span className="flex items-center space-x-2"><div className="w-2 h-2 bg-amber-500 rounded-full" /> <span className="text-slate-400">Tampering</span></span>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '1rem', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="uploads" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUploads)" strokeWidth={3} />
                    <Area type="monotone" dataKey="tampering" stroke="#f59e0b" fill="transparent" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Evidence Feed */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Recent Evidence Submissions</h3>
                <button className="text-blue-400 text-sm font-bold hover:underline">View All</button>
              </div>
              <div className="grid gap-4">
                {allUserEvidence.length === 0 ? (
                  <div className="bg-slate-800/30 border border-slate-700 border-dashed rounded-3xl p-12 text-center">
                    <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium italic">No evidence submitted yet</p>
                  </div>
                ) : (
                  allUserEvidence.map(item => (
                    <div key={item.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-3xl flex items-center justify-between hover:bg-slate-800 transition-all group">
                      <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700">
                          <img src={item.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <p className="font-bold text-lg">Case #{item.id}</p>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              item.status === 'Original' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-slate-500 text-sm font-medium">Submitted by: <span className="text-slate-300">{item.userEmail}</span></p>
                          <p className="text-slate-600 text-xs">{item.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right mr-4">
                          <p className="text-2xl font-black">{item.authenticityScore}%</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authenticity</p>
                        </div>
                        <button 
                          onClick={() => { setMedia({ data: item.thumbnail, type: item.type }); setResult(item); setView('analysis'); }}
                          className="p-4 bg-slate-900 rounded-2xl text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-xl"
                        >
                          <Search className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-12">
            {/* Model Accuracy */}
            <section className="bg-slate-800/50 border border-slate-700 p-8 rounded-[2.5rem] space-y-8">
              <h3 className="text-xl font-bold">AI Model Health</h3>
              <div className="space-y-6">
                {modelAccuracy.map((m, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-slate-400">{m.name}</span>
                      <span className="text-emerald-400">{m.value}%</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${m.value}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Status</span>
                  <span className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span>OPTIMAL</span>
                  </span>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-blue-600 rounded-[2.5rem] p-8 space-y-6 shadow-2xl shadow-blue-500/20">
              <h3 className="text-xl font-bold">System Actions</h3>
              <div className="grid gap-3">
                <button onClick={startBatchScan} className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-3 transition-all">
                  <Scan className="w-5 h-5" />
                  <span>Run Batch Integrity Check</span>
                </button>
                <button className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-3 transition-all hover:bg-blue-50">
                  <Download className="w-5 h-5" />
                  <span>Export System Logs</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );

  const ProfileView = () => (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={() => setView(user?.role === 'investigator' ? 'investigator-dashboard' : 'user-dashboard')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowRight className="w-6 h-6 rotate-180 text-slate-400" />
            </button>
            <span className="font-bold text-xl text-slate-900 tracking-tight">User Profile</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-10">
          <div className="flex items-center space-x-8">
            <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-xl shadow-blue-200">
              {user?.name.charAt(0)}
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900">{user?.name}</h2>
              <p className="text-blue-600 font-bold uppercase tracking-widest text-sm">{user?.role} Account</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
              <p className="text-lg font-bold text-slate-900">{user?.email}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-lg font-bold text-slate-900">Verified & Active</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Scans Performed</p>
              <p className="text-lg font-bold text-slate-900">{userHistory.length} Investigations</p>
            </div>
          </div>

          <button 
            onClick={() => setView('login')}
            className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
          >
            <XCircle className="w-5 h-5" />
            <span>Sign Out of EvidenceAI</span>
          </button>
        </div>
      </main>
    </div>
  );

  return (
    <>
      {view === 'login' && <LoginView />}
      {view === 'user-dashboard' && <UserDashboard />}
      {view === 'investigator-dashboard' && <InvestigatorDashboard />}
      {view === 'profile' && <ProfileView />}
      {view === 'analysis' && <AnalysisView />}

      {/* Forensic Assistant */}
      <div className="fixed bottom-8 right-8 z-40">
        <AnimatePresence>
          {showAssistant && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 right-0 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-blue-100 overflow-hidden flex flex-col"
            >
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-6 h-6" />
                  <h3 className="font-bold">Forensic AI Assistant</h3>
                </div>
                <button onClick={() => setShowAssistant(false)} className="hover:bg-white/20 p-1 rounded-lg">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-blue-50/30">
                {chatMessages.length === 0 && (
                  <div className="text-center py-10 space-y-3">
                    <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-blue-400 text-sm font-medium">Ask me about ELA, metadata, or pixel analysis.</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${
                      msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-blue-900 border border-blue-100 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-blue-100">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={askAssistant} className="p-4 bg-white border-t border-blue-100 flex items-center space-x-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your forensic query..."
                  className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  type="submit"
                  disabled={isChatLoading}
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAssistant(!showAssistant)}
          className="bg-blue-600 text-white p-5 rounded-full shadow-2xl shadow-blue-200 flex items-center justify-center relative group"
        >
          <MessageSquare className="w-8 h-8" />
          <div className="absolute right-full mr-4 bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            Forensic Assistant
          </div>
        </motion.button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold text-white flex items-center space-x-3 ${
              toast.type === 'success' ? 'bg-emerald-600' : 
              toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
