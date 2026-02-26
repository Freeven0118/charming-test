
import { Question, Category } from './types';

// ==========================================
// 系統設定
// ==========================================

// 請將此處替換為您 n8n Webhook 的 Production URL
export const N8N_WEBHOOK_URL = "https://linegpt.menspalais.com/webhook/charming-test";

// 用於 Email 模板的英文 Key 對照
export const CATEGORY_KEYS: Record<Category, string> = {
  '形象外表': 'skin',   
  '社群形象': 'social', 
  '行動與互動': 'hair', 
  '心態與習慣': 'style' 
};

// ==========================================
// 連結與資源設定
// ==========================================

export const SOCIAL_URLS = {
  line: 'https://lin.ee/3V3tOsx', // Updated
  instagram: 'https://instagram.com/freeven.menspalais',
  threads: 'https://www.threads.net/@freeven.menspalais'
};

export const ASSETS = {
  icon_ig: "https://d1yei2z3i6k35z.cloudfront.net/2452254/6965f9743b2f3_68bcafb31135a_ig.png",
  icon_threads: "https://d1yei2z3i6k35z.cloudfront.net/2452254/6965f97461c7f_695f34230d336_695f20025eaf2_icon2.png",
  // 新增 LINE 加好友按鈕圖片
  line_button: "https://d1yei2z3i6k35z.cloudfront.net/2452254/6965f974627f8_69565d2473a52_6956598909c11_zh-Hant.png"
};

// ==========================================
// 圖片設定區
// ==========================================

export const CATEGORY_IMAGES: Record<Category, string> = {
  '形象外表': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2787&auto=format&fit=crop',
  '社群形象': 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2800&auto=format&fit=crop',
  '行動與互動': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=2800&auto=format&fit=crop',
  '心態與習慣': 'https://images.unsplash.com/photo-1499209974431-2761e252375a?q=80&w=2800&auto=format&fit=crop',
};

// 2. 專家/教練資訊設定 (更新為 3天形象急救計畫)
export const EXPERT_CONFIG = {
  name: "形象教練 彭邦典",
  title: "自信魅力養成 / 脫單形象塑造",
  imageUrl: "https://d1yei2z3i6k35z.cloudfront.net/2452254/693980ce9054d_mobile2withsign.jpg", 
  
  // 第一段：Title: 從「知道」到「做到」
  step1_title: "從「知道」到「做到」",
  step1_text: "這份報告指出了你的盲點，但**「知道」不等於「做到」**。形象建立是你現在最有效的槓桿，因為它能在短時間內產生明顯的視覺反饋與外界評價。只要你願意在細節上投入，你的社交機會與心理強度將會產生**質的飛躍**。請從今天開始，把打理自己當作一場必要的戰鬥準備。",
  
  // 第二段：Title: 3天形象急救計畫
  step2_title: "你的「3天形象急救計畫」",
  step2_text: "單看報告不會讓你變帥。為了幫你把這份診斷轉化為實際的吸引力，我準備了連續三天的**「行動指南」**寄給你：\n\n🗓明天 (Day 1)：整體形象的\n**「止損第一步」**\n\n🗓後天 (Day 2)：理工男也能懂的\n**「萬用穿搭公式」**\n\n🗓最後 (Day 3)：從「路人照片」變身\n**「高配對形象」**",

  // 第三段：結尾 (Email Footer or Extra)
  closing_text: "⚠️ 請留意明天晚上的信件，這是你脫單的第一步。",

  // CTA 按鈕文字 (使用圖片後可能僅作為 alt 使用)
  ctaButtonText: "加入官方 LINE 領取",
  ctaButtonSubText: "（點擊加入好友，領取更多實用資源）"
};

// 3. 測驗題目設定
export const QUESTIONS: Question[] = [
  // A. 面容氣色 (原形象外表) -> 對應 Email: skin
  { id: 1, category: '形象外表', text: '「我有一套自己固定在用的洗臉與保養方式，能讓皮膚大致保持乾淨、氣色穩定，不會長痘痘或粉刺或其它皮膚問題」' },
  { id: 2, category: '形象外表', text: '「我知道自己適合哪一種長度和感覺的髮型，出門前也會花時間整理、吹整 or 抓造型，不會讓頭髮亂翹、油塌、看起來沒打理」' },
  { id: 3, category: '形象外表', text: '「我說得出自己適合的大致穿著風格，例如簡約、斯文、成熟，也知道哪些款式和版型特別不適合自己，買衣服時心裡有一把尺」' },
  { id: 4, category: '形象外表', text: '「我知道自己適合什麼樣風格的穿著，能夠很輕鬆地搭配出適合約會或其他重要場合的服裝，也大概知道去哪裡、要怎麼買衣服才不會踩雷」' },
  
  // B. 髮型駕馭 (原社群形象 - 暫借位置) -> 對應 Email: hair
  { id: 5, category: '社群形象', text: '「我的頭貼對女人是有吸引力的。比如清楚單人照，看得到我的臉，沒有厚重濾鏡，也不是團體照、背影照或看不出我是誰的照片」' },
  { id: 6, category: '社群形象', text: '「我放在社群或交友軟體的照片能讓女人對我產生好奇心，更想認識我」' },
  { id: 7, category: '社群形象', text: '「我用不同情境的照片去呈現自己；例如生活感、興趣、朋友互動，而不是只有一堆角度差不多的自拍或證件感照片」' },
  { id: 8, category: '社群形象', text: '「我避免放上拉低第一印象的照片，例如醉到失態、很邋遢、失言貼文，也有刻意刪掉、關掉或限縮可見範圍，不會全部攤在公開頁面」' },
  
  // C. 穿搭策略 (原行動與互動) -> 對應 Email: style
  { id: 9, category: '行動與互動', text: '「在過去一個月內，除了工作場合，我參加了至少兩場『有機會認識新朋友』的社交活動，並且實際上有和異性交換到個人聯絡方式。」' },
  { id: 10, category: '行動與互動', text: '「打開我的 LINE 或 IG 聊天列表，目前至少有兩位異性是處於『穩定互動中』（每週來回對話超過三天），而不是只有久久一次的貼圖或已讀。」' },
  { id: 11, category: '行動與互動', text: '「在過去三個月內，我有『主動發起』單獨約會邀請，並且對方『答應並實際出席』的次數，至少有一次。」' },
  { id: 12, category: '行動與互動', text: '「回顧最近的約會經驗，在約會結束回家後，對方通常會主動傳訊息延續話題，或者我提出下一次邀約時，對方是給予正面回應的。」' },
  
  // D. 社群形象 (原心態與習慣) -> 對應 Email: social
  { id: 13, category: '心態與習慣', text: '「當互動不如預期（如被已讀不回、約會氣氛冷掉）時，我能控制住『想傳訊息追問原因』或『討好對方』的衝動，並在當天就回歸原本的生活節奏。」' },
  { id: 14, category: '心態與習慣', text: '「回顧過去的感情挫折，我從未向朋友抱怨過『現在女生都很現實』或『只是緣分未到』，而是能明確列出自己當時『做錯了哪三個具體決定』。」' },
  { id: 15, category: '心態與習慣', text: '「在過去三個月內，即使工作壓力極大或心情低落，我也沒有以此為藉口而暫停過外表打理（如運動、穿搭、髮型），始終維持著『隨時能上場約會』的狀態。」' },
  { id: 16, category: '心態與習慣', text: '「如果發現自己在某個階段一直卡關（例如總是在聊天時被冷處理），我有主動去付費學習、請教專家或閱讀相關書籍，而不是用原本的方式『多試幾個人』碰運氣。」' },
];

export const OPTIONS = [
  { label: '我不確定', value: -1 },
  { label: '完全沒有', value: 0 },
  { label: '不太符合', value: 1 },
  { label: '有點符合', value: 2 },
  { label: '非常符合', value: 3 },
];

// 4. 人格結果設定
export const PERSONAS = [
  {
    id: 'charmer',
    title: '天生魅力家',
    subtitle: '外在與內在的完美平衡者',
    description: '你很清楚自己的優點在哪裡，也懂得在適當的時候展現出來。無論是穿著打扮還是跟人聊天的節奏，你都拿捏得很剛好。對你來說，吸引力不是刻意製造的，而是自然而然散發的。',
    tags: ['高質感', '社交達人', '心理強大', '行動力滿格'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9b7411b38_1.%E5%A4%A9%E7%94%9F%E9%AD%85%E5%8A%9B%E5%AE%B6.svg'
  },
  {
    id: 'statue',
    title: '精緻的沈默者',
    subtitle: '外型滿分，只差一點主動的勇氣',
    description: '你的外在條件其實很不錯，照片看起來也很有質感。但在真實互動時，你可能會因為怕說錯話、或太在意形象，反而變得被動。你現在需要的不是更多理論，而是跨出那一步，學會「主動一點」，就能打破僵局。',
    tags: ['外型優勢', '社群滿分', '行動遲疑', '偶像包袱'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9bf097ed8_2.%E7%B2%BE%E7%B7%BB%E7%9A%84%E6%B2%88%E9%BB%98%E8%80%85.svg'
  },
  {
    id: 'hustler',
    title: '隱形的努力家',
    subtitle: '實力很好，但還沒讓人看見',
    description: '你是個很認真生活、性格也很真誠的人。可惜的是，因為沒有特別經營外在形象或包裝自己，導致在第一眼印象上容易吃虧。其實只要稍微學會一點「視覺包裝」，你的機會就會大大增加。',
    tags: ['實力派', '行動大師', '視覺盲點', '待磨練的鑽石'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9de953752_3.%E9%9A%B1%E5%BD%A2%E7%9A%84%E5%8A%AA%E5%8A%9B%E5%AE%B6.svg'
  },
  {
    id: 'neighbor',
    title: '溫暖的鄰家男孩',
    subtitle: '給人感覺很舒服，但少了點火花',
    description: '你在朋友眼中是個好相處的人，個性隨和穩定。但在戀愛市場上，因為缺乏強烈的個人特色或風格，容易被女生歸類為「好朋友」。你需要試著展現更鮮明的個性或風格，讓自己更有記憶點。',
    tags: ['親和力', '狀態穩定', '缺乏特色', '好人卡常客'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9c2d8b687_4.%E6%BA%AB%E6%9A%96%E7%9A%84%E9%84%B0%E5%AE%B6%E7%94%B7%E5%AD%A9.svg'
  },
  {
    id: 'sage',
    title: '理論派大師',
    subtitle: '懂很多道理，但還沒開始行動',
    description: '你可能看了很多兩性文章、聽了很多建議，對戀愛有一套自己的看法。但因為生活圈比較固定，或者想得太多，導致這些知識沒有機會派上用場。你現在需要的不是更多理論，而是直接去認識人的機會。',
    tags: ['智商高', '心態成熟', '社交圈窄', '實戰缺乏'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9c9460f10_5.%E7%90%86%E8%AB%96%E6%B4%BE%E5%A4%A7%E5%B8%AB.svg'
  },
  {
    id: 'pioneer',
    title: '潛力無限的開拓者',
    subtitle: '正要開始蛻變，成長空間最大',
    description: '目前的你可能剛開始關注這些領域，各方面都還在摸索階段。這其實是好消息，代表你的進步空間非常大！只要開始一點點小改變（比如換個髮型、買件新衣服），你得到的正面回饋會非常明顯。',
    tags: ['新手村', '成長空間大', '亟需指引', '勇於嘗試'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9cbfc6cd8_6.%E6%BD%9B%E5%8A%9B%E7%84%A1%E9%99%90%E7%9A%84%E9%96%8B%E6%8B%93%E8%80%85.svg'
  }
];

export const CATEGORY_INFO: Record<Category, { description: string; suggestions: Record<'紅燈' | '黃燈' | '綠燈', string> }> = {
  '形象外表': {
    description: '第一眼的外在印象。髮型、膚況、穿搭是否讓人一看就知道你有在打理自己。',
    suggestions: {
      '紅燈': '現在的外在打理比較像『不要太邋遢就好』，對朋友來說可以，但對剛認識的女生來說，很容易第一眼就被刷掉。',
      '黃燈': '你已經有基本打理，但還不到『眼前一亮』的程度。只要在髮型、膚況或穿搭其中一兩項做升級，整體感覺會拉高很多。',
      '綠燈': '你的外在打理已經有一定水準，可以開始思考：怎麼把穿搭 and 氣質做出更清楚的風格感，讓人一眼記得你。'
    }
  },
  '社群形象': {
    description: '在網路上的第一印象。頭貼、照片組合、版面乾淨度，能不能讓人一點進來就知道你有在打理自己。',
    suggestions: {
      '紅燈': '現在的網路版面比較像『私人相簿』或『什麼都隨便丟』，女生點進來看不到重點，也很難分辨你是怎樣的人，很快就滑走。',
      '黃燈': '你已經有一些不錯的照片與內容，但整體還不夠聚焦，也夾雜幾張會拉低印象的東西。稍微整理頭貼與首頁可見內容，效果會直接提升。',
      '綠燈': '你的社群版面已經能幫你加分，女生只看照片與簡介就會滑走。接下來可以思考的是：怎麼讓版面講出更明確的故事與價值。'
    }
  },
  '行動與互動': {
    description: '你有沒有把機會往前推。從認識新朋友、開啟聊天、提出邀約，到約會現場的互動與收尾。',
    suggestions: {
      '紅燈': '問題不在你條件多差，而是你幾乎沒有在出手。很少主動開話題、少邀約、遇到機會容易退縮，讓很多本來可以發展的對象直接消失。',
      '黃燈': '你偶爾會主動，也有幾次成功約出來的經驗，但節奏不算穩定。有時聊太久不推進，有時約會後沒有好好收尾，導致關係停在模糊地帶。',
      '綠燈': '你願意主動，也大致懂得怎麼推進關係。接下來可以更細緻地調整約會品質與互動細節，讓對方更清楚感覺到『跟你在一起是舒服又有安全感的』。'
    }
  },
  '心態與習慣': {
    description: '你能不能長期投資自己，而不是一下衝高、一下躺平。遇到拒絕時的恢復力，以及願不願意調整做法。',
    suggestions: {
      '紅燈': '現在的狀態比較像『一受傷就全面關機』。一次拒絕就讓你停很久，很難維持基本自我打理與社交，久了會對自己越來越沒信心。',
      '黃燈': '你知道要進步，也偶爾會主動調整，但容易被工作、情緒 or 懶惰打斷。行動有一段一段的空窗期，讓成果很難累積起來。',
      '綠燈': '你已經有不錯的心理彈性，遇到挫折會難受，但仍能慢慢站起來、換方法再試。接下來要做的，是讓自己的成長計畫更有系統、更具體。'
    }
  }
};

// 5. 隱私權政策內容
export const PRIVACY_POLICY_TEXT = `
<div class="space-y-6 text-slate-700 text-justify">
    <p>歡迎您來到 Menspalais（以下簡稱「本網站」）。我們非常重視您的隱私權，並承諾依據中華民國《個人資料保護法》及相關法令規定，保護您的個人資料。為了讓您能夠安心使用本網站的各項服務與資訊，特此向您說明本網站的隱私權保護政策，以保障您的權益，請您詳閱下列內容：</p>

    <div>
        <h4 class="text-base md:text-lg font-bold text-slate-900 mb-2">一、 個人資料的蒐集目的與類別</h4>
        <p class="mb-2">當您造訪本網站或使用我們提供的服務（例如：訂閱電子報、填寫表單、預約會談）時，我們將視該服務功能性質，請您提供必要的個人資料。</p>
        <ul class="list-disc pl-5 space-y-1">
            <li><strong>蒐集目的：</strong>包含但不限於客戶管理與服務、行銷（包含寄送電子報及相關優惠資訊）、網站流量與使用者行為分析、以及提供各項優化服務。</li>
            <li><strong>蒐集類別：</strong>
                <ul class="list-[circle] pl-5 mt-1 space-y-1 text-slate-600">
                    <li>個人識別資訊：如姓名、電子郵件地址（Email）等。</li>
                    <li>網站使用數據：如 IP 位址、使用時間、使用的瀏覽器、瀏覽及點選資料紀錄、Cookie 等（此類資料主要用於網站流量分析與服務提升，不會和特定個人聯繫）。</li>
                </ul>
            </li>
        </ul>
    </div>

    <div>
        <h4 class="text-base md:text-lg font-bold text-slate-900 mb-2">二、 個人資料利用之期間、地區、對象及方式</h4>
        <ul class="list-disc pl-5 space-y-1">
            <li><strong>期間：</strong>本網站營運期間、特定目的存續期間，或依法令所訂之保存年限。當您要求刪除或取消訂閱時，我們將依規停止蒐集、處理或利用您的個人資料。</li>
            <li><strong>地區：</strong>您的個人資料將用於本網站營運地區及我們所使用的第三方服務平台（如 Systeme.io）伺服器所在地區。</li>
            <li><strong>對象：</strong>本網站及協助我們提供服務的第三方合作夥伴（如電子報發送系統、網站分析工具）。</li>
            <li><strong>方式：</strong>以自動化機器或其他非自動化之方式，進行資料的蒐集、處理與利用（包含電子郵件通知、行銷資訊發送等）。</li>
        </ul>
    </div>

    <div>
        <h4 class="text-base md:text-lg font-bold text-slate-900 mb-2">三、 資訊分享與揭露</h4>
        <p class="mb-2">我們承諾絕不將您的個人資料出售、交換或出租給任何其他團體、個人或私人企業。您的資料僅會在以下情況下進行必要處理：</p>
        <ul class="list-disc pl-5 space-y-1">
            <li><strong>使用第三方服務：</strong>為提供您完善的服務，您的資料將儲存並處理於 Systeme.io 等具備嚴格安全標準的第三方服務平台，該平台亦受嚴格的隱私權規範約束。</li>
            <li><strong>法規要求：</strong>配合司法單位合法的調查，或依法令相關規定需要揭露時。</li>
        </ul>
    </div>

    <div>
        <h4 class="text-base md:text-lg font-bold text-slate-900 mb-2">四、 您擁有的個資權利（個資法第 3 條）</h4>
        <p class="mb-2">針對您交付予本網站的個人資料，您依法可隨時向我們行使以下權利：</p>
        <ul class="list-disc pl-5 space-y-1">
            <li>查詢或請求閱覽。</li>
            <li>請求製給複製本。</li>
            <li>請求補充或更正。</li>
            <li>請求停止蒐集、處理或利用。</li>
            <li>請求刪除。</li>
            <li><strong>退訂機制：</strong>若您希望停止接收我們的電子報或行銷郵件，您可以隨時點擊信件底部的「取消訂閱（Unsubscribe）」連結，我們將立即從發送名單中移除您的信箱。</li>
        </ul>
        <p class="mt-2">若您欲行使上述其他權利，請隨時透過我們的客服信箱與我們聯繫，我們將盡速為您處理。</p>
    </div>

    <div>
        <h4 class="text-base md:text-lg font-bold text-slate-900 mb-2">五、 不提供個人資料所致權益之影響</h4>
        <p>您可自由選擇是否提供個人資料。若您拒絕提供特定服務所需的必要個人資料（例如未填寫正確的 Email），本網站將可能無法為您提供完整的服務（例如無法成功訂閱電子報或安排會談），敬請見諒。</p>
    </div>

    <div>
        <h4 class="text-base md:text-lg font-bold text-slate-900 mb-2">六、 Cookie 技術與使用</h4>
        <p class="mb-2">為了提供您最佳的服務，本網站會在您的電腦中放置並取用我們的 Cookie。Cookie 是網站伺服器用來和使用者瀏覽器進行溝通的一種技術，能為您提供更個人化的體驗。</p>
        <p><strong>您的選擇權：</strong>若您不願接受 Cookie 的寫入，您可在您使用的瀏覽器功能項中設定隱私權等級為高，即可拒絕 Cookie 的寫入，但這可能會導致網站某些功能無法正常執行。</p>
    </div>

    <div>
        <h4 class="text-base md:text-lg font-bold text-slate-900 mb-2">七、 未成年人保護</h4>
        <p>本網站之服務並非專為未成年人（未滿 18 歲）設計。我們不會在知情的情況下，主動蒐集未成年人的個人資料。若您是未成年人，請在您的法定代理人或監護人陪同與同意下，再使用本網站之服務。</p>
    </div>

    <div>
        <h4 class="text-base md:text-lg font-bold text-slate-900 mb-2">八、 隱私權政策之修改</h4>
        <p>本網站保留隨時修改本隱私權政策的權利，以因應社會環境及法令的變遷與科技的進步。政策修改後將直接發布於本網站上，重大變更時我們將透過網站公告或電子郵件通知您。建議您定期檢閱本政策，以確保了解我們最新的隱私權保護措施。</p>
    </div>

    <div>
        <h4 class="text-base md:text-lg font-bold text-slate-900 mb-2">九、 聯絡我們</h4>
        <p>如果您對本隱私權政策、您的個人資料處理方式，或有任何與隱私權相關的疑問，歡迎隨時透過以下電子郵件聯繫我們：<a href="mailto:freeven@menspalais.com" class="text-blue-600 hover:underline font-bold">freeven@menspalais.com</a></p>
    </div>
</div>
`;

