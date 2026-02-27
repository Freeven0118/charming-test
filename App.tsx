
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { QUESTIONS, OPTIONS, CATEGORY_INFO, PERSONAS, EXPERT_CONFIG, N8N_WEBHOOK_URL, CATEGORY_KEYS, SOCIAL_URLS, ASSETS, PRIVACY_POLICY_TEXT } from './constants';
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
  const [isUnlocked, setIsUnlocked] = useState(false); // 控制結果頁是否解鎖

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isIntroMode, setIsIntroMode] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // 使用者資料
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  
  // Email/Webhook 寄送狀態
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const [aiAnalysis, setAiAnalysis] = useState<AiReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // 進度條狀態
  const [fakeProgress, setFakeProgress] = useState(0);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // === 魅力小知識 (Waiting Tips) ===
  const [currentTipIdx, setCurrentTipIdx] = useState(0);
  const CHARISMA_TIPS = [
    "💡 女人不會愛上「討好她」的男人，她們愛上的是「有原則」的男人。",
    "💡 你的價值不取決於她的回應，而取決於你如何看待自己。",
    "💡 真正的自信，是「我知道我很好，即使妳不喜歡我也沒關係」。",
    "💡 投資自己永遠是回報率最高的選擇，無論是外表還是腦袋。",
    "💡 不要把生活的重心全部放在女人身上，專注於你的使命感會讓你更有魅力。",
    "💡 接受拒絕是強者的特權，因為這代表你敢於爭取。",
    "💡 眼神接觸時，不要先移開視線，這是一種無聲的主導權測試。",
    "💡 乾淨的儀容是對自己的尊重，而不是為了取悅誰。",
    "💡 真正的獎品是你自己，別讓自己像個爭取獎品的參賽者。",
    "💡 你的時間與注意力是有限資源，只投資在值得的人事物上。",
    "💡 專注於你的使命，女人會希望加入強者的旅程，而不是成為旅程的終點。",
    "💡 過度的解釋是缺乏自信的表現，強者用行動說話。",
    "💡 保持神秘感，不要在認識初期就全盤托出，讓她對你保持好奇。",
    "💡 只有當你隨時有能力轉身離開時，你在這段關係中才擁有真正的尊嚴。",
    "💡 你的情緒穩定度，決定了你能承載多大的吸引力。",
    "💡 不要試圖用邏輯去解決她的情緒問題，她需要的是你的同理與帶領。",
    "💡 稀缺性創造價值，不要讓自己成為隨傳隨到的便利貼。",
    "💡 讚美要像鹽巴一樣，適量是調味，過量會讓人反胃。",
    "💡 測試（Shit Test）不是刁難，而是她潛意識在確認你是否足夠強大。",
    "💡 弱者等待機會，強者創造機會。",
    "💡 你的快樂必須自給自足，而不是依附於她的情緒起伏。",
    "💡 學會設立界線，這會讓她更尊重你，而不是更討厭你。",
    "💡 真正的溫柔來自於強大，軟弱的人那叫討好，不叫溫柔。",
    "💡 永遠不要為了取悅女人而犧牲你的原則，那只會讓她看輕你。"
  ];

  // 錯誤處理與手動 Key
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Refs
  const aiFetchingRef = useRef(false); 
  const lastFetchTimeRef = useRef<number>(0);
  const radarChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);
  const isAnsweringRef = useRef(false); // 防止重複點擊

  const [lastError, setLastError] = useState<string>('');

  // 渲染格式化文字
  const renderFormattedText = (text: string, highlightClass: string = 'text-[#edae26]') => {
    if (!text) return null;
    
    if (text.includes('<b>')) {
        const parts = text.split(/(<b>.*?<\/b>)/g);
        return parts.map((part, index) => {
            if (part.startsWith('<b>') && part.endsWith('</b>')) {
                const content = part.replace(/<\/?b>/g, '');
                return <span key={index} className={`${highlightClass} font-black`}>{content}</span>;
            }
            return part;
        });
    }

    return text.split('**').map((part, index) => 
      index % 2 === 1 ? (
        <span key={index} className={`${highlightClass} font-black`}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleRestart = () => {
    setStep('hero');
    setIsUnlocked(false);
    setCurrentIdx(0);
    setIsIntroMode(true);
    setAnswers({});
    setAiAnalysis(null);
    setFakeProgress(0);
    setLastError('');
    setShowKeyInput(false);
    setUserData({ name: '', email: '' });
    setEmailStatus('idle');
    
    // 重置 Tip
    setCurrentTipIdx(0);
    
    aiFetchingRef.current = false;
    lastFetchTimeRef.current = 0;
    isAnsweringRef.current = false;
  };

  const handleStartQuiz = () => {
    setStep('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const localSummary = useMemo(() => {
    if (step === 'hero' || step === 'quiz') return null;
    
    try {
        const categories: Category[] = ['形象外表', '社群形象', '行動與互動', '心態與習慣'];
        const summary = categories.map(cat => {
          const catQuestions = QUESTIONS.filter(q => q.category === cat);
          const score = catQuestions.reduce((acc, q) => {
              // Try accessing with number key first, then string key
              let val = answers[q.id];
              if (val === undefined) {
                  // @ts-ignore
                  val = answers[q.id.toString()];
              }
              
              return acc + (val === -1 ? 0 : (val || 0));
          }, 0);
          
          let level: '紅燈' | '黃燈' | '綠燈' = '紅燈';
          if (score >= 9) { level = '綠燈'; }
          else if (score >= 5) { level = '黃燈'; }
          
          const info = CATEGORY_INFO[cat] || { description: '', suggestions: { '紅燈': '', '黃燈': '', '綠燈': '' } };

          return { 
            category: cat, 
            score, 
            level, 
            description: info.description, 
            suggestion: info.suggestions[level] 
          };
        });

        const totalScore = summary.reduce((acc, curr) => acc + curr.score, 0);
        console.log('Calculated Summary:', summary);
        console.log('Total Score:', totalScore);
        return { summary, totalScore };
    } catch (e) {
        console.error("Error calculating summary", e);
        return null;
    }
  }, [step, answers]);

  const generateRadarChartUrl = () => {
    if (!localSummary) return '';
    const labels = localSummary.summary.map(s => s.category);
    const data = localSummary.summary.map(s => s.score);
    
    const chartConfig = {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: '魅力值',
          data: data,
          backgroundColor: 'rgba(37, 99, 235, 0.2)', 
          borderColor: 'rgba(37, 99, 235, 1)',
          pointBackgroundColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 2
        }]
      },
      options: {
        scale: {
          ticks: { beginAtZero: true, max: 12, stepSize: 3, display: false },
          pointLabels: { fontSize: 20, fontStyle: 'bold', fontColor: '#0f172a' },
          gridLines: { color: '#cbd5e1' }
        },
        legend: { display: false }
      }
    };
    
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=400&bkg=white`;
  };

  const getPersonaPngUrl = (svgUrl: string) => {
      const cleanUrl = svgUrl.replace(/^https?:\/\//, '');
      return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&output=png`;
  };

  const processTextForEmail = (text: string, highlightColor: string = '#edae26') => {
    if (!text) return '';
    let processed = text.replace(/\*\*\s?([^*]+?)\s?\*\*/g, `<span style="color:${highlightColor}; font-weight:bold;">$1</span>`);
    processed = processed.replace(/<b>(.*?)<\/b>/g, `<span style="color:${highlightColor}; font-weight:bold;">$1</span>`);
    processed = processed.replace(/\n/g, '<br>');
    return processed;
  };

  const sendToWebhook = async (finalReport: AiReport) => {
    if (!localSummary) return;
    setEmailStatus('sending');

    const persona = PERSONAS.find(p => p.id === finalReport.selectedPersonaId) || PERSONAS[5];
    const totalScore100 = Math.round((localSummary.totalScore / 48) * 100);

    const dimensionsHtml = localSummary.summary.map(item => {
        let colorCode = '#ef4444'; 
        let bgCode = '#fef2f2';
        let textCode = '#b91c1c';
        
        if (item.level === '黃燈') {
            colorCode = '#f97316'; bgCode = '#ffedd5'; textCode = '#c2410c';
        } else if (item.level === '綠燈') {
            colorCode = '#22c55e'; bgCode = '#dcfce7'; textCode = '#15803d';
        }

        const adviceText = getAiAnalysisForCategory(item.category);
        const processedAdvice = processTextForEmail(adviceText);

        return `
        <div class="dimension-card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 8px solid ${colorCode}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="left" style="padding-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a;">${item.category}</h4>
                    </td>
                    <td align="right" style="padding-bottom: 12px;">
                        <span style="background-color: ${bgCode}; color: ${textCode}; padding: 4px 10px; border-radius: 99px; font-size: 13px; font-weight: bold; white-space: nowrap;">
                            ${item.level} (${item.score}分)
                        </span>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <p style="margin: 0; font-size: 16px; color: #334155; line-height: 1.6; text-align: justify;">
                            ${processedAdvice}
                        </p>
                    </td>
                </tr>
            </table>
        </div>
        `;
    }).join('');

    const coachAdviceHtml = processTextForEmail(finalReport.coachGeneralAdvice, '#edae26');
    const step1TextHtml = processTextForEmail(EXPERT_CONFIG.step1_text, '#edae26');
    const step2TextHtml = processTextForEmail(EXPERT_CONFIG.step2_text, '#edae26');

    const coachSectionHtml = `
    <div class="coach-section" style="background-color: #0f172a; border-radius: 20px; overflow: hidden; margin-top: 30px;">
        <img src="${EXPERT_CONFIG.imageUrl}" alt="Coach" style="width: 100%; height: auto; display: block;" />
        <div class="coach-content" style="padding: 30px 20px;">
            <div style="margin-bottom: 25px;">
                <h3 style="color: #edae26; font-size: 22px; font-weight: 900; margin: 0 0 5px 0;">教練總結</h3>
                <p style="color: #cbd5e1; font-size: 15px; font-weight: 500; margin: 0;">針對你的現況，最重要的下一步</p>
            </div>
            <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <div style="color: #e2e8f0; font-size: 16px; line-height: 1.8; text-align: justify;">
                    ${coachAdviceHtml}
                </div>
            </div>
            <div style="text-align: center; margin-bottom: 30px;">
                <span style="color: #edae26; font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; border: 1px solid rgba(237, 174, 38, 0.3); padding: 6px 12px; border-radius: 99px; background-color: rgba(237, 174, 38, 0.05); display: inline-block; white-space: nowrap;">Your Next Step</span>
            </div>
            <div style="margin-bottom: 35px; text-align: center;">
                <h4 style="color: #ffffff; font-size: 20px; font-weight: 900; margin: 0 0 15px 0;">${EXPERT_CONFIG.step1_title}</h4>
                <div style="color: #cbd5e1; font-size: 16px; line-height: 1.7; margin-bottom: 25px; text-align: justify;">
                    ${step1TextHtml}
                </div>
                <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center;">
                    <h4 style="color: #edae26; font-size: 18px; font-weight: 900; margin: 0 0 15px 0;">${EXPERT_CONFIG.step2_title}</h4>
                    <div style="color: #e2e8f0; font-size: 16px; line-height: 1.8; white-space: pre-line; font-weight: 500;">
                        ${step2TextHtml}
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; margin: 20px 0 0 0; font-style: italic; border-top: 1px solid #334155; padding-top: 15px;">
                        ${EXPERT_CONFIG.closing_text}
                    </p>
                </div>
            </div>
            <div style="text-align: center;">
                <a href="${SOCIAL_URLS.line}" target="_blank" style="display: block; width: 100%; max-width: 250px; margin: 0 auto; text-decoration: none;">
                    <img src="${ASSETS.line_button}" style="width: 100%; height: auto; display: block;" alt="${EXPERT_CONFIG.ctaButtonText}" />
                </a>
                <p style="color: #64748b; font-size: 12px; font-weight: bold; margin: 15px 0 0 0;">${EXPERT_CONFIG.ctaButtonSubText}</p>
            </div>
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <table border="0" cellspacing="0" cellpadding="0" align="center">
                  <tr>
                    <td style="padding: 0 15px;">
                        <a href="${SOCIAL_URLS.instagram}" target="_blank" style="text-decoration: none;">
                            <img src="${ASSETS.icon_ig}" width="38" style="display: block; opacity: 0.9;" alt="Instagram" />
                        </a>
                    </td>
                    <td style="padding: 0 15px;">
                        <a href="${SOCIAL_URLS.threads}" target="_blank" style="text-decoration: none;">
                            <img src="${ASSETS.icon_threads}" width="38" style="display: block; opacity: 0.9;" alt="Threads" />
                        </a>
                    </td>
                  </tr>
                </table>
            </div>
        </div>
    </div>
    `;

    const tagsHtml = persona.tags.map(t => 
        `<span style="display:inline-block; background-color:#f1f5f9; color:#475569; padding:4px 10px; border-radius:99px; font-size:12px; font-weight:bold; margin-right:5px; margin-bottom:5px; border:1px solid #cbd5e1;">#${t}</span>`
    ).join('');

    const dynamicChartUrl = generateRadarChartUrl();
    const personaPngUrl = getPersonaPngUrl(persona.imageUrl);

    const payload = {
        quiz_source: 'charming-test', 
        submittedAt: new Date().toISOString(),
        name: userData.name,
        email: userData.email,
        total_score: totalScore100,
        
        quiz_result: {
            persona_id: persona.id,
            persona_title: persona.title,
            persona_subtitle: persona.subtitle,
            persona_image_png: personaPngUrl,
            chart_image_url: dynamicChartUrl,
            tags_html: tagsHtml,
        },
        
        ai_analysis: {
            overview: finalReport.personaOverview || persona.subtitle,
            explanation: processTextForEmail(finalReport.personaExplanation, '#edae26'),
        },

        html_components: {
            dimensions_grid: dimensionsHtml,
            coach_section: coachSectionHtml
        }
    };

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
             throw new Error(`Webhook failed with status: ${response.status}`);
        }
        
        setEmailStatus('success');
    } catch (e) {
        console.error("Webhook failed - N8N may be offline or unreachable", e);
        setEmailStatus('success'); 
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.name || !userData.email) return;

    setIsFormSubmitting(true);

    try {
        const formData = new FormData();
        formData.append('first_name', userData.name);
        formData.append('email', userData.email);

        await fetch('https://systeme.io/embedded/37702026/subscription', {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
        
        await new Promise(resolve => setTimeout(resolve, 600));

        if (aiAnalysis) {
             await sendToWebhook(aiAnalysis);
        }

    } catch (err) {
        console.error("Systeme.io submission failed", err);
    } finally {
        setIsFormSubmitting(false);
        setIsUnlocked(true); 

        setTimeout(() => {
            const detailedReport = document.getElementById('detailed-report');
            if (detailedReport) {
                detailedReport.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
  };

  const handleRetryEmail = () => {
    if (aiAnalysis) sendToWebhook(aiAnalysis);
  };

  const runDiagnosis = async (forceFallback: boolean = false, overrideKey: string = '') => {
    if (!localSummary) return;
    
    const now = Date.now();
    if (aiFetchingRef.current && !forceFallback && !overrideKey) return;
    if (!forceFallback && !overrideKey && now - lastFetchTimeRef.current < 2000) return;

    aiFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    setIsAiLoading(true);
    setLastError('');
    setShowKeyInput(false);

    const totalScore100 = Math.round((localSummary.totalScore / 48) * 100);

    const fallbackAnalysis: AiReport = {
      selectedPersonaId: localSummary.totalScore > 36 ? 'charmer' : 'neighbor',
      personaExplanation: forceFallback 
        ? "⚠️ 這是「基礎分析模式」的報告。因目前 AI 連線異常，系統直接根據您的分數區間進行診斷。" 
        : "⚠️ AI 連線忙碌中，這是根據您的分數生成的基礎報告。",
      personaOverview: "您的潛力巨大，建議重新整理頁面再次進行深度分析。",
      appearanceAnalysis: "保持整潔，找出適合自己的風格是第一步。",
      socialAnalysis: "社群媒體是您的名片，試著多展現生活感。",
      interactionAnalysis: "主動一點，故事就會開始。",
      mindsetAnalysis: "心態決定高度，保持自信。",
      coachGeneralAdvice: "這是一份基礎戰略報告。請參考上方的雷達圖與維度分析，這依然是你提升魅力的重要起點。若需 **完整的 AI 深度解析**，建議稍後再試。"
    };

    if (forceFallback) {
        setTimeout(() => {
            setAiAnalysis(fallbackAnalysis);
            setIsAiLoading(false);
            aiFetchingRef.current = false;
        }, 800);
        return;
    }

    // 優先順序：
    // 1. URL 參數 overrideKey
    // 2. 手動輸入 customApiKey
    // 3. 標準 Vite 環境變數 (import.meta.env.VITE_GEMINI_API_KEY) - 這是最推薦的 Vercel 設定方式
    // 4. Vercel 環境變數 (透過 vite.config.ts define 注入的 process.env.GEMINI_API_KEY)
    const apiKeyToUse = overrideKey || customApiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKeyToUse) {
      setLastError("系統設定：請輸入 API Key");
      setShowKeyInput(true);
      setIsAiLoading(false);
      aiFetchingRef.current = false;
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      const detailedData = QUESTIONS.map(q => ({
        category: q.category,
        question: q.text,
        answer: OPTIONS.find(o => o.value === answers[q.id])?.label || '未答'
      }));

      const prompt = `
        你現在是專業形象教練「彭邦典」。這是一位 25-35 歲男性的「脫單力檢核」測驗結果深度報告。
        數據：總分 ${localSummary.totalScore}/48 (換算百分制約 ${totalScore100}分)。
        各維度：${JSON.stringify(localSummary.summary.map(s => ({ cat: s.category, score: s.score })))}
        具體作答：${JSON.stringify(detailedData)}
        
        任務指令：請嚴格依照 JSON 格式回傳報告。
        回傳 JSON 結構：
        {
          "selectedPersonaId": "charmer, statue, hustler, neighbor, sage, pioneer 其中之一",
          "personaExplanation": "深度分析為什麼【你】符合這個人格原型 (請使用第二人稱)",
          "personaOverview": "一句話總結現狀",
          "appearanceAnalysis": "針對 形象外表 的分析建議 (請使用第二人稱)",
          "socialAnalysis": "針對 社群形象 的分析建議 (請使用第二人稱)",
          "interactionAnalysis": "針對 行動與互動 的分析建議 (請使用第二人稱)",
          "mindsetAnalysis": "針對 心態與習慣 的分析建議 (請使用第二人稱)",
          "coachGeneralAdvice": "深度教練總結 (重點)"
        }
                任務指令：
        請分析以上數據，並嚴格依照下方的 JSON 格式回傳報告。

        **重要寫作格式要求 (嚴格執行)：**
        1. **人稱限制**：直接對著使用者說話，**全程使用「你」來稱呼，絕對禁止使用「他」或第三人稱視角**。這是一份給當事人的私人報告。
        2. **關鍵字標註(重要)**：請使用 HTML 標籤 <b>你的關鍵字</b> 來標註重點。**不要使用 Markdown 的雙星號 (**) 符號**，因為這會導致 Email 顯示異常。
        3. **段落分明**：請在不同觀點或段落間，使用 \`\\n\` 進行明確的換行。

        **針對「coachGeneralAdvice (教練總結)」的特殊要求：**
        1. **字數要求**：請控制在 **300-350字左右**。這需要是一份完整、有深度的教練建議，不要太短。
        2. **排版要求(關鍵)**：請務必分出 **3-4 個段落**。段落之間請使用明顯的換行。視覺上要舒適，不要擠成一大塊。
        3. **語氣禁語(嚴格執行)**：**絕對禁止**使用「這不是...而是...」或是「問題不在...而是...」這種對比句型。請直接切入重點，給予肯定的行動方向。
        4. **用語規範**：請將「請記住」這類語句一律替換為「一定要記得」，展現更堅定的教練語氣。
        5. **內容核心**：點出他目前最大的盲點，並客觀解釋為什麼**「形象建立」**是他目前最有效的槓桿。告訴他改變外在如何能增強他的自信與機會。

      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");

      const parsedData = JSON.parse(text) as AiReport;
      setAiAnalysis(parsedData);

    } catch (e: any) {
      console.error("AI Analysis Error:", e);
      let errorMsg = "連線忙碌中";
      const errString = e.toString();
      if (errString.includes("400") && errString.includes("API key")) {
          errorMsg = "⚠️ API Key 無效";
          setShowKeyInput(true);
      } else if (errString.includes("429")) {
          errorMsg = "⚠️ 請求次數過多";
          setShowKeyInput(true);
      } else {
          errorMsg = `⚠️ 發生錯誤: ${errString.slice(0, 30)}...`;
      }
      setLastError(errorMsg);
      aiFetchingRef.current = false;
    } finally {
      setIsAiLoading(false);
    }
  };

  // 1. 進度條獨立邏輯：確保穩定 90 秒跑完 99% (放慢一倍)
  useEffect(() => {
    if (step === 'diagnosing' && !lastError) {
      setFakeProgress(1);
      const timer = setInterval(() => {
        setFakeProgress(prev => {
           if (prev >= 99) return 99;
           return prev + 0.11;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [step, lastError]);

  // 2. Charisma Tips Rotation Logic
  useEffect(() => {
     let interval: number;
     if (step === 'diagnosing') {
         interval = window.setInterval(() => {
             setCurrentTipIdx(prev => (prev + 1) % CHARISMA_TIPS.length);
         }, 7000); // 每 7 秒換一句 (放慢一倍)
     }
     return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === 'diagnosing' && aiAnalysis) {
      setFakeProgress(100);
      const timer = setTimeout(() => {
        setStep('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [step, aiAnalysis]);

  useEffect(() => {
    if (step === 'diagnosing' && localSummary && !aiFetchingRef.current && !lastError && !aiAnalysis && !showKeyInput) {
        runDiagnosis(false);
    }
  }, [step, localSummary]);

  useEffect(() => {
    if (step === 'result' && localSummary && radarChartRef.current) {
      const ctx = radarChartRef.current.getContext('2d');
      const isMobile = window.innerWidth < 768;
      const labelFontSize = isMobile ? 22 : 24;

      if (ctx) {
        if (chartInstance.current) chartInstance.current.destroy();
        // @ts-ignore
        chartInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: localSummary.summary.map(r => r.category),
            datasets: [{
              label: '脫單力',
              data: localSummary.summary.map(r => r.score),
              backgroundColor: 'rgba(37, 99, 235, 0.2)', // Blue-600
              borderColor: 'rgba(37, 99, 235, 1)',
              borderWidth: 3,
              pointBackgroundColor: 'rgba(37, 99, 235, 1)',
              pointBorderColor: '#fff',
            }]
          },
          options: {
            layout: {
               padding: 20
            },
            scales: { 
              r: { 
                min: 0, max: 12, ticks: { display: false, stepSize: 3 },
                pointLabels: { 
                    font: { size: labelFontSize, weight: 'bold', family: "'Helvetica Neue', 'Noto Sans TC', sans-serif" }, 
                    color: '#0f172a' 
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
    if (isAnsweringRef.current) return;
    isAnsweringRef.current = true;

    setAnswers(prev => ({ ...prev, [QUESTIONS[currentIdx].id]: val }));
    
    setTimeout(() => {
        nextStep();
        isAnsweringRef.current = false;
    }, 250); 
  };
  
  const nextStep = () => {
    if (isIntroMode) { setIsIntroMode(false); return; }
    if (currentIdx < QUESTIONS.length - 1) {
      const nextIdx = currentIdx + 1;
      if (nextIdx % 4 === 0) setIsIntroMode(true);
      setCurrentIdx(nextIdx);
    } else {
      // 測驗結束後 -> 診斷
      setStep('diagnosing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (isIntroMode) {
      if (currentIdx > 0) { setIsIntroMode(false); setCurrentIdx(currentIdx - 1); } 
      else { setStep('hero'); }
      return;
    }
    if (currentIdx % 4 === 0) setIsIntroMode(true);
    else setCurrentIdx(prev => prev - 1);
  };

  const activePersona = useMemo(() => {
    if (!aiAnalysis) return PERSONAS[5];
    const normalizedId = aiAnalysis.selectedPersonaId.toLowerCase().trim();
    return PERSONAS.find(p => p.id === normalizedId) || PERSONAS[5];
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
    <div className="min-h-screen max-w-2xl mx-auto flex flex-col items-center px-0 md:px-8 py-0 md:py-8 font-sans">
      {/* 解決瀏覽器自動填入背景色問題的 CSS Hack */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #0f172a !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {step === 'hero' && (
        <div className="flex-1 flex flex-col justify-start md:justify-center w-full animate-fade-in py-6 md:py-10 space-y-4 md:space-y-12 px-4 md:px-0">
          <div className="text-center space-y-2 md:space-y-4 relative z-20">
            <h1 className="text-3xl md:text-7xl font-black text-[#0f172a] tracking-tighter leading-normal py-1">脫單力檢核分析</h1>
            <div className="space-y-1 md:space-y-2">
                <p className="text-lg md:text-3xl text-slate-500 font-bold">專為 25-35 歲男性設計</p>
                <p className="text-lg md:text-3xl text-slate-500 font-bold">快速找到你的脫單阻礙</p>
            </div>
          </div>

          <div className="relative w-full aspect-[16/9] flex items-center justify-center animate-float overflow-visible">
             <img src="https://d1yei2z3i6k35z.cloudfront.net/2452254/694caa69f0eb6_main.svg" className="object-contain w-full h-full drop-shadow-2xl" />
          </div>

          {/* Hero Button Section - Simplified */}
          <div className="px-2 md:px-4 w-full relative z-20">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-4 animate-slide-up">
                <div className="text-center space-y-1 mb-2">
                    <h3 className="text-xl md:text-2xl font-black text-[#0f172a]">準備好了嗎？</h3>
                    <p className="text-sm md:text-base text-slate-500 font-bold">只需要 3 分鐘，找出你的魅力盲點</p>
                </div>
                 <button onClick={handleStartQuiz} className={`w-full relative overflow-hidden bg-[#0f172a] hover:bg-black text-white font-black py-4 md:py-6 rounded-2xl text-xl md:text-2xl shadow-xl transition transform active:scale-95 text-center flex items-center justify-center`}>
                     <span>開始檢測 👉</span>
                 </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-4 md:gap-6 px-2 md:px-4">
            {[
              { icon: '✨', title: '魅力原型', desc: '分析你在戀愛市場中的真實定位', color: 'rgba(244, 63, 94, 0.4)' },
              { icon: '📊', title: '多維雷達', desc: '將外型、社交、心態數據化呈現', color: 'rgba(59, 130, 246, 0.4)' },
              { icon: '🌱', title: '進化指南', desc: '獲得個人深度報告與建議', color: 'rgba(16, 185, 129, 0.4)' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center space-x-4 md:space-x-6 bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-default">
                <div className="text-4xl md:text-6xl transition-transform duration-300 group-hover:scale-110" style={{ filter: `drop-shadow(0 4px 6px ${feature.color})` }}>{feature.icon}</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-[#0f172a]">{feature.title}</h3>
                  <p className="text-sm md:text-lg text-slate-400 font-medium">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'quiz' && (
        <div className="w-full space-y-4 md:space-y-6 py-6 md:py-4 px-4 md:px-0">
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
              <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 text-center flex flex-col items-center">
                <div className="mb-4 md:mb-6 text-5xl md:text-7xl animate-bounce">
                  {currentIdx === 0 ? '👔' : currentIdx === 4 ? '📸' : currentIdx === 8 ? '💬' : '🔥'}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-[#0f172a] mb-2 md:mb-4">{QUESTIONS[currentIdx].category}</h2>
                <p className="text-lg md:text-2xl text-slate-500 leading-relaxed mb-6 md:mb-10">{CATEGORY_INFO[QUESTIONS[currentIdx].category].description}</p>
                <div className="w-full space-y-3 md:space-y-4">
                  <button onClick={nextStep} className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-4 md:py-6 rounded-2xl text-xl md:text-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95">進入測驗</button>
                  <button onClick={prevStep} className="w-full py-2 md:py-4 text-base md:text-lg text-slate-400 font-bold hover:text-slate-600 transition-colors">回到上一題</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 min-h-[160px] md:min-h-[200px] flex items-center justify-center">
                  <h2 className="text-xl md:text-3xl font-black text-[#0f172a] text-center leading-relaxed px-1 md:px-4">{QUESTIONS[currentIdx].text}</h2>
                </div>
                <div className="space-y-2.5 md:space-y-3">
                  {OPTIONS.map((opt, idx) => {
                    const isSelected = answers[QUESTIONS[currentIdx].id] === opt.value;
                    return (
                      <button key={opt.value} onClick={() => handleAnswer(opt.value)} className={`group w-full p-3.5 md:p-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between animate-pop-in ${isSelected ? 'border-blue-600 bg-blue-50 shadow-md scale-[0.98]' : 'border-slate-50 bg-white hover:border-blue-200 hover:bg-slate-50 hover:-translate-y-1 hover:shadow-md'}`} style={{ animationDelay: `${idx * 70}ms` }}>
                        <span className={`font-bold text-lg md:text-2xl transition-colors ${isSelected ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>{opt.label}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-200 group-hover:border-blue-400'}`}>
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
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[60vh] space-y-6 animate-fade-in text-center px-6 md:px-0">
          {!localSummary ? (
              <div className="text-center space-y-4">
                  <div className="text-4xl">⚠️</div>
                  <h3 className="text-xl font-bold text-[#0f172a]">分數計算錯誤</h3>
                  <button onClick={handleRestart} className="px-6 py-2 bg-[#0f172a] text-white rounded-xl">重試</button>
              </div>
          ) : !lastError ? (
            <>
              {/* Progress Bar (System Loading) */}
              <div className="w-full max-w-md space-y-2">
                 <div className="flex justify-between items-end">
                    <span className="text-blue-600 font-bold text-lg animate-pulse">● 系統運算中...</span>
                    <span className="text-3xl font-black text-[#0f172a]">{Math.floor(fakeProgress)}%</span>
                 </div>
                 <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-blue-600 transition-all duration-200 ease-linear" style={{ width: `${fakeProgress}%` }}></div>
                 </div>
              </div>

              {/* === System Scanning / Tips Area === */}
              <div className="w-full max-w-md bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative p-8 space-y-6">
                 
                 {/* Scanning Animation */}
                 <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-2 bg-blue-50 rounded-full animate-pulse"></div>
                    <div className="relative z-10 text-6xl">
                        {fakeProgress < 30 ? '🔍' : fakeProgress < 60 ? '🧠' : fakeProgress < 90 ? '📊' : '✨'}
                    </div>
                 </div>

                 {/* Status Text */}
                 <div className="text-center space-y-2">
                     <h3 className="text-xl font-black text-[#0f172a]">
                        {fakeProgress < 30 ? '正在分析作答數據...' : 
                         fakeProgress < 60 ? '正在評估四大魅力維度...' : 
                         fakeProgress < 90 ? '正在生成專屬教練建議...' : 
                         '報告準備就緒！'}
                     </h3>
                     <p className="text-slate-400 font-medium text-sm">AI 正在為您量身打造脫單策略</p>
                 </div>

                 {/* Charisma Tips Carousel */}
                 <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 min-h-[120px] flex items-center justify-center transition-all duration-500 overflow-hidden relative">
                     <p key={currentTipIdx} className="text-slate-700 font-bold text-lg text-center leading-relaxed animate-slide-up">
                         {CHARISMA_TIPS[currentTipIdx]}
                     </p>
                 </div>
              </div>
            </>
          ) : (
            <div className="space-y-6 bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-slate-200 max-w-md w-full animate-fade-in">
                <div className="text-6xl animate-bounce">🔐</div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-[#0f172a]">{showKeyInput ? "系統設定未完成" : "連線發生問題"}</h3>
                    <p className="text-slate-500 font-medium text-lg">{showKeyInput ? "此網站尚未配置 Gemini API Key。" : lastError}</p>
                </div>
                {showKeyInput ? (
                   <div className="space-y-4 pt-4">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2">
                          <p className="text-sm font-bold text-slate-700">【臨時測試通道】</p>
                          <input type="text" value={customApiKey} onChange={(e) => setCustomApiKey(e.target.value)} placeholder="貼上您的 Gemini API Key (AIza...)" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                       </div>
                       <button onClick={() => runDiagnosis(false)} disabled={!customApiKey} className={`w-full py-4 rounded-2xl font-bold transition-colors shadow-lg ${customApiKey ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>確認並開始分析</button>
                   </div>
                ) : (
                   <button onClick={() => runDiagnosis(false)} className="w-full py-4 bg-[#0f172a] text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-lg shadow-slate-200">重試連線</button>
                )}
                <button onClick={() => runDiagnosis(true)} className="w-full py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-colors">跳過 AI，直接查看基礎報告</button>
            </div>
          )}
        </div>
      )}

      {step === 'result' && localSummary && aiAnalysis && (
        <div className="w-full space-y-10 animate-fade-in pb-12">
          {/* Persona Card (Top Part - Visible) */}
          <div className="bg-white rounded-b-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden border-b md:border border-slate-100 animate-slide-up" style={{ animationDelay: '0ms' }}>
            {/* Image Container */}
            <div className="relative aspect-[3/4] md:aspect-[21/9] flex items-end justify-center bg-[#0f172a]">
              <img src={activePersona.imageUrl} alt={activePersona.title} className="w-full h-full object-cover object-top" />
              <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white bg-gradient-to-t from-[#0f172a]/95 via-[#0f172a]/70 to-transparent w-full pt-24 md:pt-32">
                <div className="flex flex-col items-start space-y-1 mb-2">
                   <div className="flex items-center space-x-3 mb-2">
                       <span className="bg-blue-600 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full uppercase tracking-wider">Persona Analysis</span>
                       {emailStatus === 'success' && (
                         <span className="flex items-center text-xs md:text-sm font-bold text-green-400">
                           <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                           報告已寄出
                         </span>
                       )}
                   </div>
                </div>
                <h2 className="text-3xl md:text-6xl font-black tracking-tight mb-2 leading-tight">{activePersona.title}</h2>
                <p className="text-lg md:text-3xl font-medium italic leading-snug text-[#edae26]">{renderFormattedText(aiAnalysis.personaOverview || activePersona.subtitle, 'text-[#edae26]')}</p>
              </div>
            </div>
            
            <div className="p-8 md:p-10 space-y-8">
              <div className="flex flex-wrap gap-3">
                {activePersona.tags.map((tag, i) => (
                  <span key={tag} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-full text-xl font-bold border border-slate-200 animate-pop-in" style={{ animationDelay: `${i * 100 + 300}ms` }}># {tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full md:px-0 space-y-10">
            {/* Radar Chart (Visible) - 8px margin */}
            <div className="mx-2 md:mx-0 bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-slate-50 text-center animate-slide-up relative overflow-hidden" style={{ animationDelay: '200ms' }}>
                <div className="text-3xl md:text-5xl font-black text-[#0f172a] mb-6 md:mb-8">
                    總體魅力：<span className="text-[#edae26]">{Math.round((localSummary.totalScore / 48) * 100)}</span> <span className="text-slate-300 text-xl">/ 100</span>
                </div>
                <div className="h-[20rem] md:h-[24rem] mb-6 flex items-center justify-center relative">
                    <canvas ref={radarChartRef}></canvas>
                </div>
            </div>

            {/* Persona Detailed Explanation (Now UNLOCKED / VISIBLE) - 8px margin */}
            <div className="mx-2 md:mx-0 bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm animate-slide-up">
                <h5 className="text-[#edae26] font-black text-xl uppercase tracking-widest mb-6">人格診斷報告</h5>
                <div className="space-y-6">
                    {aiAnalysis.personaExplanation.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                        <p key={idx} className="text-[#0f172a] text-lg md:text-xl leading-relaxed font-bold">{renderFormattedText(line, 'text-[#edae26]')}</p>
                    ))}
                </div>
            </div>

            {/* ====== Locked Content Section Start (Dimensions & Coach) ====== */}
            <div className="relative transition-all duration-700 ease-in-out" id="detailed-report">
                
                {/* Content Container */}
                <div className="space-y-10">
                    
                    {/* Analysis Grid */}
                    <div className="grid grid-cols-1 gap-6 mx-2 md:mx-0">
                        {/* Header is Visible */}
                        <div className="text-center py-4 animate-slide-up">
                            <h3 className="text-3xl font-black text-[#0f172a] tracking-tighter">四大屬性深度剖析</h3>
                        </div>
                        
                        {/* Grid Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {localSummary.summary.map((item, idx) => (
                            <div key={item.category} className="bg-white p-5 md:p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col space-y-4 relative overflow-hidden group hover:shadow-xl transition-all animate-slide-up">
                                <div className={`absolute top-0 left-0 w-2 h-full ${item.level === '綠燈' ? 'bg-green-500' : item.level === '黃燈' ? 'bg-orange-400' : 'bg-red-500'}`}></div>
                                <div className="flex items-center justify-between pl-4">
                                    <h4 className="text-2xl font-black text-[#0f172a]">{item.category}</h4>
                                    <span className={`px-4 py-1.5 rounded-full text-base font-black ${item.level === '綠燈' ? 'bg-green-100 text-green-700' : item.level === '黃燈' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                    {item.level} ({item.score}分)
                                    </span>
                                </div>
                                {/* BLURRED TEXT IF LOCKED */}
                                <div className="relative">
                                    <p className={`text-lg md:text-xl text-[#1e293b] leading-relaxed pl-1 md:pl-4 text-justify font-medium transition-all duration-700 break-words whitespace-normal ${!isUnlocked ? 'filter blur-md select-none opacity-50' : ''}`}>{renderFormattedText(getAiAnalysisForCategory(item.category), 'text-[#edae26]')}</p>
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="bg-slate-100/80 backdrop-blur-sm px-6 py-3 rounded-full text-xl font-bold text-slate-500 shadow-sm border border-slate-200">
                                                🔒 請往下滑動解鎖完整建議
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>

                    {/* Coach Summary / Expert Section - 4px margin (1/3 of previous) */}
                    <div className="mx-1 md:mx-0 bg-[#0f172a] rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up relative">
                         {/* 1. Full Width Image (Visible) - EXACTLY LIKE EMAIL HEADER */}
                         <div className="w-full relative">
                             <img src={EXPERT_CONFIG.imageUrl} alt="Coach" className="w-full h-auto object-cover block" />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent opacity-20"></div>
                         </div>
                         
                         {/* 2. Content Container - Reduced padding to allow inner cards to expand */}
                         <div className="p-2 md:p-12 relative">
                             
                             {/* Coach Title (Visible) */}
                             <div className="mb-8 px-2 md:px-0">
                                 <h3 className="text-[#edae26] text-3xl font-black mb-2">教練總結 {isUnlocked && '(解鎖完成)'}</h3>
                                 <p className="text-slate-300 font-medium text-lg">針對你的現況，最重要的下一步</p>
                             </div>

                             {/* Advice Text & CTA (Blurred if locked) */}
                             {/* Added min-h when locked to ensure form fits without covering title */}
                             <div className={`relative transition-all duration-700 ${!isUnlocked ? 'min-h-[600px]' : ''}`}>
                                 
                                 {/* AI Generated Advice (Modified: 鎖定時不再模糊，而是使用漸層遮罩) */}
                                 <div className={`bg-[#1e293b] p-5 md:p-8 rounded-[2rem] border border-slate-700 mb-8 transition-all duration-700 relative overflow-hidden ${!isUnlocked ? 'max-h-[280px]' : ''}`}>
                                    <div className="space-y-12 text-justify">
                                        {aiAnalysis.coachGeneralAdvice.split('\n').map((paragraph, idx) => {
                                            const trimmed = paragraph.trim();
                                            if (!trimmed) return null;
                                            return (
                                                <p key={idx} className="text-lg md:text-xl leading-relaxed font-medium text-slate-200">
                                                    {renderFormattedText(trimmed, 'text-[#edae26]')}
                                                </p>
                                            );
                                        })}
                                    </div>
                                    {/* 鎖定時的漸層遮罩：透明 -> 深藍色，模擬文字漸隱 */}
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent from-20% via-[#1e293b]/90 to-[#1e293b]"></div>
                                    )}
                                 </div>

                                 {/* Separator: Your Next Step (Structure Restored) */}
                                 <div className={`py-8 transition-all duration-700 ${!isUnlocked ? 'filter blur-md select-none opacity-40' : ''}`}>
                                     <div className="flex items-center justify-center space-x-4">
                                         <div className="h-[1px] bg-slate-700 w-1/4"></div>
                                         <span className="text-[#edae26] text-xs font-black tracking-[0.2em] uppercase border border-[#edae26]/30 px-4 py-2 rounded-full bg-[#edae26]/5 whitespace-nowrap">Your Next Step</span>
                                         <div className="h-[1px] bg-slate-700 w-1/4"></div>
                                     </div>
                                 </div>

                                 {/* 3-Day Plan Content (Replaces Course Info) */}
                                 <div className={`space-y-8 mb-12 transition-all duration-700 ${!isUnlocked ? 'filter blur-md select-none opacity-40' : ''}`}>
                                     {/* Knowing != Doing */}
                                     <div className="text-center space-y-4 px-2 md:px-0">
                                         <h4 className="text-white text-2xl md:text-3xl font-black">{EXPERT_CONFIG.step1_title}</h4>
                                         <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                                            {renderFormattedText(EXPERT_CONFIG.step1_text, 'text-[#edae26]')}
                                         </p>
                                     </div>

                                     {/* The 3-Day Plan Detail */}
                                     <div className="bg-[#1e293b] p-5 md:p-8 rounded-[2rem] border border-slate-700 text-center space-y-4">
                                         <h4 className="text-[#edae26] text-2xl font-black mb-4">{EXPERT_CONFIG.step2_title}</h4>
                                         <div className="text-slate-200 text-lg leading-loose whitespace-pre-line font-medium">
                                             {renderFormattedText(EXPERT_CONFIG.step2_text, 'text-[#edae26]')}
                                         </div>
                                         <p className="text-slate-400 text-sm mt-4 italic border-t border-slate-700 pt-4">{EXPERT_CONFIG.closing_text}</p>
                                     </div>
                                 </div>
                                 
                                 <div className={`text-center transition-all duration-700 ${!isUnlocked ? 'filter blur-md select-none opacity-40' : ''}`}>
                                     <a href={SOCIAL_URLS.line} target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-105 transition-transform">
                                         <img src={ASSETS.line_button} className="w-auto h-16 md:h-20" alt={EXPERT_CONFIG.ctaButtonText} />
                                     </a>
                                     <p className="mt-3 text-sm text-slate-500 font-bold">{EXPERT_CONFIG.ctaButtonSubText}</p>
                                 </div>

                                 {/* Social Links (Web Version - Added below CTA) */}
                                 <div className={`text-center mt-8 pt-6 border-t border-slate-700/50 transition-all duration-700 flex justify-center space-x-6 ${!isUnlocked ? 'filter blur-md select-none opacity-40' : ''}`}>
                                     <a href={SOCIAL_URLS.instagram} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 hover:scale-105 transition-all">
                                         <img src={ASSETS.icon_ig} className="w-8 h-8 md:w-10 md:h-10" alt="Instagram" />
                                     </a>
                                     <a href={SOCIAL_URLS.threads} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 hover:scale-105 transition-all">
                                         <img src={ASSETS.icon_threads} className="w-8 h-8 md:w-10 md:h-10" alt="Threads" />
                                     </a>
                                 </div>

                                 {/* Unlock Form Overlay - Positioned absolutely OVER the blurred text area */}
                                 {!isUnlocked && (
                                    // 修正：增加 pt-32 md:pt-48 讓表單往下移，露出上方的文字
                                    <div className="absolute inset-0 z-20 flex items-start justify-center pt-32 md:pt-48 px-2 md:px-0">
                                         <div className="bg-white/95 backdrop-blur-sm p-8 md:p-10 rounded-[2.5rem] shadow-2xl border-2 border-slate-100 max-w-lg w-full animate-pop-in space-y-6">
                                             <div className="text-center space-y-3">
                                                 <div className="text-5xl animate-bounce mb-2">🔐</div>
                                                 <h3 className="text-2xl md:text-3xl font-black text-[#0f172a]">解鎖完整行動建議</h3>
                                                 <p className="text-slate-500 font-bold leading-relaxed">
                                                     想知道如何突破現狀？<br/>輸入稱呼與 Email，立即解鎖教練的深度分析與<span className="text-[#0f172a]">「3天形象急救計畫」</span>。
                                                 </p>
                                             </div>
                                             
                                             <form onSubmit={handleUnlockSubmit} className="space-y-4">
                                                  <input type="text" placeholder="您的稱呼" required value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#0f172a] focus:ring-0 outline-none transition-all font-bold text-[#0f172a] placeholder:text-slate-400 text-lg shadow-sm" />
                                                  <input type="email" placeholder="您的 Email" required value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#0f172a] focus:ring-0 outline-none transition-all font-bold text-[#0f172a] placeholder:text-slate-400 text-lg shadow-sm" />
                                                  <button type="submit" disabled={isFormSubmitting} className={`w-full relative overflow-hidden bg-[#0f172a] hover:bg-black text-white font-black py-5 rounded-2xl text-xl shadow-xl transition transform active:scale-95 text-center flex items-center justify-center ${isFormSubmitting ? 'cursor-wait opacity-80' : ''}`}>
                                                    {isFormSubmitting ? (
                                                        <span>處理中...</span>
                                                    ) : (
                                                        <span>立即解鎖並看結果 👉</span>
                                                    )}
                                                  </button>
                                             </form>
                                             <p className="text-center text-xs text-slate-400 font-medium">
                                                 我們和您一樣討厭垃圾信！您只會收到相關資訊，且隨時可以取消接收，請同意
                                                 <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-slate-500 underline hover:text-slate-700 mx-1">
                                                     [隱私權政策]
                                                 </button>
                                                 後再點擊送出
                                             </p>
                                         </div>
                                    </div>
                                 )}
                             </div>
                         </div>
                    </div>

                </div>

            </div>
            {/* ====== Locked Content Section End ====== */}

            
            {/* Resend Email Button */}
            {isUnlocked && (
                <div className="mb-6 text-center">
                    <button
                        onClick={handleRetryEmail}
                        disabled={emailStatus === 'sending'}
                        className={`
                            px-6 py-3 rounded-xl font-bold text-sm md:text-base transition-all 
                            flex items-center justify-center mx-auto space-x-2 border-2
                            ${emailStatus === 'sending' 
                                ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-wait' 
                                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:shadow-md active:scale-95'
                            }
                        `}
                    >
                        {emailStatus === 'sending' ? (
                            <>
                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>發送中...</span>
                            </>
                        ) : (
                            <>
                                <span>📩 再次發送診斷報告</span>
                            </>
                        )}
                    </button>
                    {emailStatus === 'success' && !isFormSubmitting && (
                        <p className="text-green-600 text-xs font-bold mt-2 animate-fade-in">✓ 報告已寄出，請檢查您的收件匣 (含垃圾郵件)</p>
                    )}
                </div>
            )}
            <div className="text-center pb-8"><button onClick={handleRestart} className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors text-lg">重新進行測試</button></div>
          </div>
        </div>
      )}

      <footer className="w-full text-center py-10 text-slate-400 text-sm px-6 border-t border-slate-200 mt-auto space-y-2 bg-white">
        <p className="font-bold">© 版權所有 男性形象教練 彭邦典</p>
        <p>本測驗由 AI 輔助生成 ，不涉及任何心理治療或精神診斷，測驗結果僅供參考。</p>
        <button onClick={() => setShowPrivacyModal(true)} className="text-slate-400 hover:text-slate-600 underline text-xs mt-2">
            隱私權政策
        </button>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-pop-in">
                <div className="p-4 border-b border-slate-100 relative flex items-center justify-center bg-white">
                    <h3 className="text-xl font-bold text-slate-900">隱私權政策</h3>
                    <button 
                        onClick={() => setShowPrivacyModal(false)}
                        className="absolute right-4 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: PRIVACY_POLICY_TEXT }} />
                </div>
                <div className="p-4 border-t border-slate-100 bg-white text-center">
                    <button 
                        onClick={() => setShowPrivacyModal(false)}
                        className="px-8 py-3 bg-[#0f172a] text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                    >
                        我已了解
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
