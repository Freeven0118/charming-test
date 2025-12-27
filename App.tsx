
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { QUESTIONS, OPTIONS, CATEGORY_INFO, PERSONAS, EXPERT_CONFIG, CATEGORY_IMAGES } from './constants';
import { Category } from './types';
import Chart from 'chart.js/auto';

// 定義 AI 回傳的報告結構
interface AiReport {
  selectedPersonaId: string; 
  personaExplanation: string; 
  personaOverview: string; 
  appearanceAnalysis: string; 
  socialAnalysis: string;
  interactionAnalysis: string;
  mindsetAnalysis: string; 
  coachGeneralAdvice: string; 
}

const App: React.FC = () => {
  // 狀態管理
  const [step, setStep] = useState<'hero' | 'quiz' | 'diagnosing' | 'result'>('hero');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isIntroMode, setIsIntroMode] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  const [aiAnalysis, setAiAnalysis] = useState<AiReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [fakeProgress, setFakeProgress] = useState(0);

  // 用於錯誤處理與手動 Key
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Refs
  const aiFetchingRef = useRef(false); // 防止重複呼叫 AI
  const lastFetchTimeRef = useRef<number>(0); // 防止 React StrictMode 導致的瞬間雙重請求
  const radarChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);

  // 用於邏輯的狀態 (不顯示於 UI)
  const [lastError, setLastError] = useState<string>('');

  const handleStart = () => {
    setStep('quiz');
    setCurrentIdx(0);
    setIsIntroMode(true);
    setAnswers({});
    setAiAnalysis(null);
    setFakeProgress(0);
    setLastError('');
    setShowKeyInput(false);
    aiFetchingRef.current = false;
    lastFetchTimeRef.current = 0;
  };

  useEffect(() => {
    let timer: number;
    if (step === 'diagnosing' && !lastError) {
      setFakeProgress(1);
      timer = window.setInterval(() => {
        setFakeProgress(prev => {
          if (prev >= 98) return prev;
          return prev + 0.8; 
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [step, lastError]);

  useEffect(() => {
    if (step === 'diagnosing' && aiAnalysis) {
      setFakeProgress(100);
      const timer = setTimeout(() => {
        setStep('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, aiAnalysis]);

  const localSummary = useMemo(() => {
    if (step !== 'result' && step !== 'diagnosing') return null;
    const categories: Category[] = ['形象外表', '社群形象', '行動與互動', '心態與習慣'];
    const summary = categories.map(cat => {
      const catQuestions = QUESTIONS.filter(q => q.category === cat);
      // 計算分數時，將 -1 (我不確定) 視為 0 分處理，但在傳給 AI 時會保留 "我不確定" 的語意
      const score = catQuestions.reduce((acc, q) => {
          const val = answers[q.id];
          return acc + (val === -1 ? 0 : (val || 0));
      }, 0);
      
      let level: '紅燈' | '黃燈' | '綠燈' = '紅燈';
      let color = '#ef4444'; 
      if (score >= 9) { level = '綠燈'; color = '#22c55e'; }
      else if (score >= 5) { level = '黃燈'; color = '#f97316'; }
      return { category: cat, score, level, color, description: CATEGORY_INFO[cat].description, suggestion: CATEGORY_INFO[cat].suggestions[level] };
    });

    const totalScore = summary.reduce((acc, curr) => acc + curr.score, 0);
    return { summary, totalScore };
  }, [step, answers]);

  // 獨立出的分析函數
  const runDiagnosis = async (forceFallback: boolean = false, overrideKey: string = '') => {
    if (!localSummary) return;
    
    // 強制防止短時間內重複呼叫 (如果不是重試模式)
    const now = Date.now();
    if (aiFetchingRef.current && !forceFallback && !overrideKey) return;
    
    if (!forceFallback && !overrideKey && now - lastFetchTimeRef.current < 2000) {
        console.log("Request blocked by debounce");
        return;
    }

    aiFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    setIsAiLoading(true);
    setLastError('');
    setShowKeyInput(false);

    // 備用資料 (Fallback)
    const fallbackAnalysis: AiReport = {
      selectedPersonaId: localSummary.totalScore > 36 ? 'charmer' : 'neighbor',
      personaExplanation: forceFallback 
        ? "⚠️ 這是「基礎分析模式」的報告。因目前 AI 連線異常，系統直接根據您的分數區間進行診斷。" 
        : "⚠️ AI 連線忙碌中，這是根據您的分數生成的基礎報告。",
      personaOverview: "您的魅力潛力巨大，建議重新整理頁面再次進行深度分析。",
      appearanceAnalysis: "保持整潔，找出適合自己的風格是第一步。",
      socialAnalysis: "社群媒體是您的名片，試著多展現生活感。",
      interactionAnalysis: "主動一點，故事就會開始。",
      mindsetAnalysis: "心態決定高度，保持自信。",
      coachGeneralAdvice: "這是一份基礎戰略報告。請參考上方的雷達圖與維度分析，這依然是你提升魅力的重要起點。若需完整的 AI 深度解析，建議稍後再試。"
    };

    if (forceFallback) {
        setTimeout(() => {
            setAiAnalysis(fallbackAnalysis);
            setIsAiLoading(false);
            aiFetchingRef.current = false;
        }, 800);
        return;
    }

    // 優先使用手動輸入的 Key，否則使用環境變數
    // process.env.API_KEY 會在 build time 被 vite 替換為字串
    const apiKeyToUse = overrideKey || customApiKey || process.env.API_KEY;

    if (!apiKeyToUse) {
      console.error("API Key is missing.");
      setLastError("系統設定：請輸入 API Key"); // 修改錯誤訊息為引導訊息
      setShowKeyInput(true);
      setIsAiLoading(false);
      aiFetchingRef.current = false;
      return;
    }

    try {
      console.log("Initializing Google GenAI...");
      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      
      const detailedData = QUESTIONS.map(q => ({
        category: q.category,
        question: q.text,
        answer: OPTIONS.find(o => o.value === answers[q.id])?.label || '未答'
      }));

      const prompt = `
        你現在是專業形象教練「彭邦典」。這是一位 25-35 歲男性的「脫單力檢核」測驗結果深度報告。
        
        數據：
        1. 總分：${localSummary.totalScore}/48
        2. 各維度分數：${JSON.stringify(localSummary.summary.map(s => ({ cat: s.category, score: s.score })))}
        3. 具體作答：${JSON.stringify(detailedData)}

        任務指令：
        請分析以上數據，並嚴格依照下方的 JSON 格式回傳報告。不要包含任何 Markdown 格式標記（如 \`\`\`json）。

        **核心分析邏輯（非常重要，請務必遵守）：**
        1. **「行動與互動」的多維歸因**：
           - 若使用者在「行動與互動」分數低（很少社交、沒有穩定聊天對象），**絕對不要**只單純批評他「不夠努力」或「太被動」。
           - **必須考量「環境因素」**：很有可能他的生活圈全是男性（如工程師），根本沒有異性可以互動。
           - 在分析時請使用具同理心的判斷，例如：「這分數偏低，除了可能是不敢主動，更有可能是你的生活圈本身就『極度缺乏異性』，導致你有力無處使。」
        
        2. **處理「我不確定」的選項**：
           - 若使用者選擇「我不確定」，代表他對該領域缺乏認知（例如不知道自己適合什麼髮型），而非單純做得不好。建議方向應是「尋找專業諮詢」或「開始嘗試」，而非批評他懶惰。

        必須回傳的 JSON 結構範本：
        {
          "selectedPersonaId": "從 [charmer, statue, hustler, neighbor, sage, pioneer] 中選一個最貼切的 ID",
          "personaExplanation": "根據他的具體作答內容，深度分析為什麼他符合這個人格原型 (約 150-200 字，必須客製化分析，嚴禁只抄寫人格定義。請務必將內容分為兩至三段，並在段落間使用 \\n 換行)",
          "personaOverview": "一句話總結他的現狀",
          "appearanceAnalysis": "針對形象外表的具體分析與建議 (約 50 字)",
          "socialAnalysis": "針對社群形象的具體分析與建議 (約 50 字)",
          "interactionAnalysis": "針對行動與互動的具體分析與建議。請務必區分是『環境問題(沒魚)』還是『技巧問題(不會釣)』的可能性。(約 50 字)",
          "mindsetAnalysis": "針對心態與習慣的具體分析與建議 (約 50 字)",
          "coachGeneralAdvice": "教練的總結戰略建議 (約 250-350 字，請務必分段，適度換行)"
        }

        關於「coachGeneralAdvice」（教練總結）的撰寫風格嚴格要求：
        1. **戰略大於執行**：嚴格禁止提供瑣碎的「具體執行事項」（如：去剪頭髮、買保養品）。這些細節留給課程。你要給的是「宏觀戰略」。
        2. **語氣口吻**：
           - 像一位**有經驗且溫暖的兄長**，語氣**平穩、堅定但帶有溫度**。
           - **不要過度攻擊**，重點在於「引導」與「建設性」。
           - **排版要求**：請在不同觀點或段落間，使用 \`\\n\` 進行明確的換行。我們會在前端將每一段分開顯示，所以請確保段落之間有清楚的邏輯區隔。
        3. **【關鍵】：結尾的導流鋪陳**
           - 在建議的最後一段，你必須明確指出：**「知道問題在哪裡」跟「能夠解決問題」是兩回事**。
           - 告訴他，如果缺乏一套有系統的計畫，憑感覺摸索很容易重蹈覆轍。
           - 用一句話引導他去看下方的教練計畫（不要直接說點按鈕，而是說『我為像你這樣想改變的人準備了一套系統，詳情在下方』）。

        關於 Persona 選擇規則：
        - 若總分 > 38 且各維度均衡，selectedPersonaId 必須是 'charmer'。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");

      const parsedData = JSON.parse(text) as AiReport;
      setAiAnalysis(parsedData);

    } catch (e: any) {
      console.error("AI Analysis Error:", e);
      let errorMsg = "連線忙碌中";
      
      const errString = e.toString();
      // 處理常見錯誤
      if (errString.includes("400") && errString.includes("API key")) {
          errorMsg = "⚠️ API Key 無效";
          setShowKeyInput(true);
      } else if (errString.includes("429")) {
          errorMsg = "⚠️ 請求次數過多 (Quota Exceeded)";
          setShowKeyInput(true);
      } else if (errString.includes("500") || errString.includes("503")) {
          errorMsg = "⚠️ 伺服器繁忙";
      } else {
          errorMsg = `⚠️ 發生錯誤: ${errString.slice(0, 30)}...`;
      }
      setLastError(errorMsg);
      aiFetchingRef.current = false;
    } finally {
      setIsAiLoading(false);
    }
  };

  // 初始觸發
  useEffect(() => {
    if (step === 'diagnosing' && localSummary && !aiFetchingRef.current && !lastError && !aiAnalysis && !showKeyInput) {
        runDiagnosis(false);
    }
  }, [step, localSummary]);

  useEffect(() => {
    if (step === 'result' && localSummary && radarChartRef.current) {
      const ctx = radarChartRef.current.getContext('2d');
      // 判斷是否為手機尺寸 (小於 768px)
      const isMobile = window.innerWidth < 768;
      // 設定字體大小：手機 16px，電腦 20px
      const labelFontSize = isMobile ? 16 : 20;

      if (ctx) {
        if (chartInstance.current) chartInstance.current.destroy();
        // @ts-ignore
        chartInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: localSummary.summary.map(r => r.category),
            datasets: [{
              label: '魅力值',
              data: localSummary.summary.map(r => r.score),
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 3,
              pointBackgroundColor: 'rgba(59, 130, 246, 1)',
              pointBorderColor: '#fff',
            }]
          },
          options: {
            scales: { 
              r: { 
                min: 0, max: 12, ticks: { display: false, stepSize: 3 },
                // 調整 pointLabels 設定：放大字體，加深顏色
                pointLabels: { 
                    font: { size: labelFontSize, weight: 'bold', family: "'Noto Sans TC', sans-serif" }, 
                    color: '#334155' // 使用更深的 Slate-700/800 色調提升閱讀性
                }
              } 
            },
            plugins: { legend: { display: false } },
            maintainAspectRatio: false
          }
        });
      }
    }
  }, [step, localSummary]);

  const handleAnswer = (val: number) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentIdx].id]: val }));
    setTimeout(() => {
        nextStep();
    }, 250); 
  };
  
  const nextStep = () => {
    if (isIntroMode) { setIsIntroMode(false); return; }
    if (currentIdx < QUESTIONS.length - 1) {
      const nextIdx = currentIdx + 1;
      if (nextIdx % 4 === 0) setIsIntroMode(true);
      setCurrentIdx(nextIdx);
    } else {
      setStep('diagnosing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (isIntroMode) {
      if (currentIdx > 0) { 
        setIsIntroMode(false); 
        setCurrentIdx(currentIdx - 1); 
      } else {
        setStep('hero');
      }
      return;
    }
    if (currentIdx % 4 === 0) setIsIntroMode(true);
    else setCurrentIdx(prev => prev - 1);
  };

  const activePersona = useMemo(() => {
    if (!aiAnalysis) return PERSONAS[5];
    const normalizedId = aiAnalysis.selectedPersonaId.toLowerCase().trim();
    const found = PERSONAS.find(p => p.id === normalizedId);
    return found || PERSONAS[5];
  }, [aiAnalysis]);

  const getAiAnalysisForCategory = (category: Category) => {
    if (!aiAnalysis) return "分析中...";
    switch(category) {
      case '形象外表': return aiAnalysis.appearanceAnalysis;
      case '社群形象': return aiAnalysis.socialAnalysis;
      case '行動與互動': return aiAnalysis.interactionAnalysis;
      case '心態與習慣': return aiAnalysis.mindsetAnalysis;
      default: return "";
    }
  };

  return (
    // 修改：移除手機版頂部留白 (py-0)，確保結果頁圖片可以置頂
    <div className="min-h-screen max-w-2xl mx-auto flex flex-col items-center px-0 md:px-8 py-0 md:py-8">
      {step === 'hero' && (
        // 調整：縮減手機版 padding (py-6) 與間距 (space-y-4)，對齊方式改為 justify-start
        <div className="flex-1 flex flex-col justify-start md:justify-center w-full animate-fade-in py-6 md:py-10 space-y-4 md:space-y-12 px-4 md:px-0">
          <div className="text-center space-y-2 md:space-y-4">
            {/* 調整：縮小手機版標題 (text-3xl) */}
            <h1 className="text-3xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight">脫單力檢核分析</h1>
            <div className="space-y-1 md:space-y-2">
                {/* 調整：縮小手機版副標題 (text-lg) */}
                <p className="text-lg md:text-3xl text-slate-500 font-bold">專為 25-35 歲男性設計</p>
                <p className="text-lg md:text-3xl text-slate-500 font-bold">快速找到你的脫單阻礙</p>
            </div>
          </div>

          {/* 調整：縮小手機版圖片高度 (h-[140px]) */}
          <div className="relative w-full h-[140px] md:h-auto md:aspect-[4/3] flex items-center justify-center animate-float overflow-hidden">
             {/* 修正：使用用戶指定的 JPG 圖片 */}
             <img src="https://d1yei2z3i6k35z.cloudfront.net/2452254/694fa4aa1af69_694caa69f0eb6_main.jpg" className="object-contain h-full w-auto" />
          </div>

          <div className="px-2 md:px-4 w-full">
            {/* 調整：縮小手機版按鈕 padding (py-4) */}
            <button 
              onClick={handleStart} 
              className="w-full relative overflow-hidden bg-slate-900 hover:bg-black text-white font-black py-4 md:py-7 rounded-[2rem] md:rounded-[2.5rem] text-2xl md:text-3xl shadow-2xl transition transform active:scale-95 text-center group animate-shimmer"
            >
              <span className="relative z-10">啟動深度分析</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-6 px-2 md:px-4">
            {[
              { icon: '✨', title: '魅力原型', desc: '分析你在戀愛市場中的真實定位', color: 'rgba(244, 63, 94, 0.4)' },
              { icon: '📊', title: '多維雷達', desc: '將外型、社交、心態數據化呈現', color: 'rgba(59, 130, 246, 0.4)' },
              { icon: '🌱', title: '進化指南', desc: '獲得個人深度報告與建議', color: 'rgba(16, 185, 129, 0.4)' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center space-x-4 md:space-x-6 bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-default">
                <div className="text-4xl md:text-6xl transition-transform duration-300 group-hover:scale-110" style={{ filter: `drop-shadow(0 4px 6px ${feature.color})` }}>{feature.icon}</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800">{feature.title}</h3>
                  <p className="text-sm md:text-lg text-slate-400 font-medium">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'quiz' && (
        // 補回 quiz 的頂部留白
        <div className="w-full space-y-4 md:space-y-6 py-6 md:py-4 px-4 md:px-0">
          {/* 進度條 */}
          <div className="w-full px-2">
            <div className="flex justify-between text-sm text-slate-400 mb-2 font-black uppercase tracking-widest">
              <span>{QUESTIONS[currentIdx].category}</span>
              <span>Question {currentIdx + 1} / {QUESTIONS.length}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${((currentIdx + (isIntroMode ? 0 : 1)) / QUESTIONS.length) * 100}%` }}></div>
            </div>
          </div>

          <div key={isIntroMode ? `intro-${currentIdx}` : `q-${currentIdx}`} className="animate-slide-up">
            {isIntroMode ? (
              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center flex flex-col items-center">
                <div className="mb-6 text-7xl animate-bounce">
                  {currentIdx === 0 ? '👔' : currentIdx === 4 ? '📸' : currentIdx === 8 ? '💬' : '🔥'}
                </div>
                <h2 className="text-5xl font-black text-slate-800 mb-4">{QUESTIONS[currentIdx].category}</h2>
                <p className="text-2xl text-slate-500 leading-relaxed mb-10">{CATEGORY_INFO[QUESTIONS[currentIdx].category].description}</p>
                <div className="w-full space-y-4">
                  <button onClick={nextStep} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-2xl text-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95">進入測驗</button>
                  <button onClick={prevStep} className="w-full py-4 text-lg text-slate-400 font-bold hover:text-slate-600 transition-colors">回到上一題</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 min-h-[160px] md:min-h-[200px] flex items-center justify-center">
                  <h2 className="text-xl md:text-3xl font-black text-slate-800 text-center leading-relaxed px-1 md:px-4">{QUESTIONS[currentIdx].text}</h2>
                </div>
                
                <div className="space-y-2.5 md:space-y-3">
                  {OPTIONS.map((opt, idx) => {
                    const isSelected = answers[QUESTIONS[currentIdx].id] === opt.value;
                    return (
                      <button 
                        key={opt.value} 
                        onClick={() => handleAnswer(opt.value)} 
                        className={`group w-full p-3.5 md:p-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between animate-pop-in
                          ${isSelected 
                            ? 'border-blue-600 bg-blue-50 shadow-md scale-[0.98]' 
                            : 'border-slate-50 bg-white hover:border-blue-200 hover:bg-slate-50 hover:-translate-y-1 hover:shadow-md'
                          }
                        `}
                        style={{ animationDelay: `${idx * 70}ms` }}
                      >
                        <span className={`font-bold text-lg md:text-2xl transition-colors ${isSelected ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>
                          {opt.label}
                        </span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                           ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-200 group-hover:border-blue-400'}
                        `}>
                          <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform duration-200 ${isSelected ? 'scale-100' : 'scale-0'}`}></div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center px-2 pt-2 md:pt-4">
                  <button onClick={prevStep} className="w-full py-3 md:py-4 rounded-2xl font-bold text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">回到上一題</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'diagnosing' && (
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[60vh] space-y-12 animate-fade-in text-center px-6 md:px-0">
          {!lastError ? (
            <>
              <div className="relative">
                <div className="w-32 h-32 border-8 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-slate-800">{Math.floor(fakeProgress)}%</div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">診斷引擎正在啟動 </h2>
                <div className="flex flex-col space-y-2 text-xl text-slate-500 font-bold">
                  <span className={`transition-all duration-500 ${fakeProgress > 15 ? 'text-blue-600 translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>● 正在分析你的作答細節...</span>
                  <span className={`transition-all duration-500 ${fakeProgress > 45 ? 'text-blue-600 translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>● 比對 社交成功案例...</span>
                  <span className={`transition-all duration-500 ${fakeProgress > 80 ? 'text-blue-600 translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>● 正在生成專屬建議...</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${fakeProgress}%` }}></div>
              </div>
            </>
          ) : (
            <div className="space-y-6 bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-slate-200 max-w-md w-full animate-fade-in">
                <div className="text-6xl animate-bounce">🔐</div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800">
                      {showKeyInput ? "系統設定未完成" : "連線發生問題"}
                    </h3>
                    <p className="text-slate-500 font-medium text-lg">
                        {showKeyInput 
                          ? "此網站尚未配置 Gemini API Key。請網站管理員至 Vercel 後台完成設定。" 
                          : lastError}
                    </p>
                </div>
                {showKeyInput ? (
                   <div className="space-y-4 pt-4">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2">
                          <p className="text-sm font-bold text-slate-700">【臨時測試通道】</p>
                          <p className="text-xs text-slate-500">若您是管理員，可在此臨時輸入 Key 進行測試 (不會儲存，重新整理後需再次輸入)。</p>
                          <input 
                            type="text" 
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            placeholder="貼上您的 Gemini API Key (AIza...)"
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                          />
                       </div>
                       <button 
                         onClick={() => runDiagnosis(false)} 
                         disabled={!customApiKey}
                         className={`w-full py-4 rounded-2xl font-bold transition-colors shadow-lg
                           ${customApiKey 
                             ? 'bg-blue-600 text-white hover:bg-blue-700' 
                             : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                           }`}
                       >
                           確認並開始分析
                       </button>
                   </div>
                ) : (
                   <button onClick={() => runDiagnosis(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-lg shadow-slate-200">
                       重試連線
                   </button>
                )}
                <button onClick={() => runDiagnosis(true)} className="w-full py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                    跳過 AI，直接查看基礎報告
                </button>
            </div>
          )}
          <p className="text-slate-400 font-medium italic">「魅力不是天生，而是可以學習的技能」</p>
        </div>
      )}

      {step === 'result' && localSummary && aiAnalysis && (
        // 結果頁不需要額外的 padding，確保圖片置頂
        <div className="w-full space-y-10 animate-fade-in pb-12">
          {/* 1. 人格卡片區塊 - 優化圖片比例與文字大小 */}
          <div className="bg-white rounded-b-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden border-b md:border border-slate-100 animate-slide-up" style={{ animationDelay: '0ms' }}>
            {/* 修改：aspect-[3/4] 為直式比例，確保臉部露出，object-top 確保頭部對齊 */}
            <div className="relative aspect-[3/4] md:aspect-[21/9] flex items-end justify-center bg-gray-900">
              <img src={activePersona.imageUrl} alt={activePersona.title} className="w-full h-full object-cover object-top" />
              {/* 漸層與文字：文字縮小，避免遮擋 */}
              <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white bg-gradient-to-t from-black/90 via-black/50 to-transparent w-full pt-24 md:pt-32">
                <div className="flex flex-col items-start space-y-1 mb-2">
                   <span className="bg-blue-600 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full uppercase tracking-wider">Persona</span>
                </div>
                {/* 標題縮小：text-3xl (手機) */}
                <h2 className="text-3xl md:text-6xl font-black tracking-tight mb-2 leading-tight">{activePersona.title}</h2>
                {/* 副標題縮小：text-lg (手機) */}
                <p className="text-lg md:text-3xl font-medium text-white/90 italic leading-snug">{aiAnalysis.personaOverview || activePersona.subtitle}</p>
              </div>
            </div>
            <div className="p-8 md:p-10 space-y-8">
              <div className="flex flex-wrap gap-3">
                {activePersona.tags.map((tag, i) => (
                  <span key={tag} className="px-6 py-3 bg-slate-100 text-slate-800 rounded-full text-xl font-black border border-slate-200 animate-pop-in" style={{ animationDelay: `${i * 100 + 300}ms` }}># {tag}</span>
                ))}
              </div>
              <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                 <h5 className="text-blue-600 font-black text-2xl uppercase tracking-widest mb-3">人格診斷分析</h5>
                 <div className="space-y-6">
                    {aiAnalysis.personaExplanation.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                        <p key={idx} className="text-slate-800 text-lg md:text-xl leading-relaxed font-bold">
                            {line}
                        </p>
                    ))}
                 </div>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-0 space-y-10">
            <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-slate-50 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="text-4xl md:text-5xl font-black text-slate-800 mb-8">總體魅力：<span className="text-blue-600">{localSummary.totalScore}</span> <span className="text-slate-300 text-xl">/ 48</span></div>
                <div className="h-[20rem] md:h-[24rem] mb-6"><canvas ref={radarChartRef}></canvas></div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="text-center py-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">四大屬性深度剖析</h3>
                    <p className="text-xl text-slate-400 font-bold"> 針對你的回答細節產生的專屬建議</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {localSummary.summary.map((item, idx) => (
                    <div key={item.category} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col space-y-4 relative overflow-hidden group hover:shadow-xl transition-all animate-slide-up" style={{ animationDelay: `${idx * 100 + 400}ms` }}>
                        <div className={`absolute top-0 left-0 w-2 h-full ${item.level === '綠燈' ? 'bg-green-500' : item.level === '黃燈' ? 'bg-orange-400' : 'bg-red-500'}`}></div>
                        <div className="flex items-center justify-between pl-4">
                            <h4 className="text-2xl font-black text-slate-800">{item.category}</h4>
                            <span className={`px-4 py-1.5 rounded-full text-base font-black ${item.level === '綠燈' ? 'bg-green-100 text-green-700' : item.level === '黃燈' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                            {item.level} ({item.score}分)
                            </span>
                        </div>
                        <p className="text-lg md:text-xl text-slate-600 leading-relaxed pl-4 text-justify font-medium">
                        {getAiAnalysisForCategory(item.category)}
                        </p>
                    </div>
                    ))}
                </div>
            </div>

            {activePersona.id === 'charmer' ? (
                <div className="bg-gradient-to-br from-slate-900 to-black rounded-[3.5rem] shadow-2xl p-10 md:p-14 text-center space-y-8 animate-fade-in border border-slate-800">
                <div className="text-6xl md:text-8xl">🏆</div>
                <h4 className="text-3xl md:text-4xl font-black text-white">你已是頂級魅力家</h4>
                <p className="text-slate-300 text-xl md:text-2xl font-bold">教練對你唯一的建議是：好好善用這份天賦。祝你一帆風順！</p>
                </div>
            ) : (
                <div className="rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col bg-white animate-slide-up" style={{ animationDelay: '600ms' }}>
                <div className="w-full relative">
                    <img src={EXPERT_CONFIG.imageUrl} alt="Expert Coach" className="w-full h-auto block object-cover" />
                </div>
                <div className="bg-slate-900 p-8 md:p-12 space-y-8 flex-1">
                    <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">💡</span>
                        <h3 className="text-3xl font-black text-amber-400 tracking-tight">教練總結</h3>
                    </div>
                    <div className="space-y-10">
                        {/* 修正：分隔線上方的字放大 (text-lg md:text-xl) */}
                        {aiAnalysis.coachGeneralAdvice.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                        <p key={idx} className="text-lg md:text-xl leading-relaxed font-medium text-white text-justify">
                            {line}
                        </p>
                        ))}
                    </div>
                    
                    <div className="py-8">
                         <div className="flex items-center space-x-4 mb-4">
                             <div className="h-px bg-slate-700 flex-1"></div>
                             <span className="text-amber-400 font-black tracking-widest uppercase text-base border border-amber-400/30 px-4 py-1.5 rounded-full bg-amber-400/10">
                                Your Next Step
                             </span>
                             <div className="h-px bg-slate-700 flex-1"></div>
                         </div>
                         {/* 修正：標題放大 (text-4xl md:text-5xl) */}
                         <h4 className="text-center text-white font-bold text-4xl md:text-5xl tracking-tight mb-8">從「知道」到「做到」</h4>
                    </div>

                    <div className="space-y-6">
                        {/* 修正：分隔線下方的字放大 (text-xl md:text-2xl) */}
                        {EXPERT_CONFIG.description.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="text-xl md:text-2xl leading-relaxed font-medium text-white text-justify">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    </div>
                    <button onClick={() => window.open('https://www.menspalais.com', '_blank')} className="group w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-4 md:py-6 rounded-[2rem] text-2xl md:text-3xl shadow-xl shadow-amber-900/20 flex items-center justify-center space-x-2 md:space-x-3 transition-all transform active:scale-95 mt-4 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
                       <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12"></span>
                       
                       <div className="flex flex-col items-center justify-center leading-none py-1">
                           <span className="text-xl md:text-3xl font-black tracking-tight">查看 5 週變身計畫</span>
                           <span className="text-sm md:text-lg font-bold opacity-90 mt-1 tracking-wide">(每月僅收 3 人)</span>
                       </div>

                       <svg className="w-8 h-8 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </button>
                    <p className="text-center text-slate-500 text-white font-bold text-lg">⚠️ 名額有限，優先卡位</p>
                </div>
                </div>
            )}
            
            <div className="text-center pb-8"><button onClick={handleStart} className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors text-lg">重新進行測試</button></div>
          </div>
        </div>
      )}

      <footer className="w-full text-center py-10 text-slate-400 text-sm px-6 border-t border-slate-100 mt-auto space-y-2 bg-slate-50">
        <p className="font-bold">© 版權所有 男性形象教練 彭邦典</p>
        <p>本測驗由 AI 輔助生成 ，不涉及任何心理治療或精神診斷，測驗結果僅供參考。</p>
      </footer>
    </div>
  );
};

export default App;
