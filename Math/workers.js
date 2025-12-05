// --- 配置区域 (请在此处填入您的 Telegram 信息) ---
// 注意：为了安全，生产环境通常建议放在 Cloudflare 的环境变量中，
// 但为了您部署方便，直接填在这里也是可以的 (只要不公开此代码)。
const TELEGRAM_BOT_TOKEN = "8364525636:AAEfU-elrDljmI-Ma-TBJrQKyeYKaYXYk_0"; // 例如 "8364525636:AAEfU-elrDljmI-Ma-TBJrQKyeYKaYXYk_0"
const TELEGRAM_CHAT_ID = "7931324657";     // 例如 "987654321"

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. 处理 POST 请求 (学生点击打卡)
    if (request.method === "POST") {
      try {
        const data = await request.json();
        const studentName = data.name;

        if (studentName) {
          // 发送 Telegram 通知
          const result = await sendTelegramMessage(studentName, request);
          
          // 如果发送成功
          if (result.ok) {
             return new Response(JSON.stringify({ success: true }), {
               headers: { "Content-Type": "application/json" },
             });
          } else {
             // 记录错误详情
             const errText = await result.text();
             console.error("Telegram API Error:", errText);
             return new Response(JSON.stringify({ success: false, error: errText }), { status: 500 });
          }
        }
        return new Response("Missing name", { status: 400 });
      } catch (err) {
        return new Response("Server Error: " + err.message, { status: 500 });
      }
    }

    // 2. 处理 GET 请求 (返回网页)
    // 这里嵌入了您最新的 index.html 内容
    return new Response(HTML_CONTENT, {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  },
};

// --- 辅助函数：发送 Telegram 消息 ---
async function sendTelegramMessage(name, request) {
  // 获取当前时间 (北京/台湾时间)
  const date = new Date();
  // 简单的时区调整 (UTC+8)
  const timeString = new Date(date.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);

  // 获取学生 IP (Cloudflare 提供的头信息)
  const ip = request.headers.get("CF-Connecting-IP") || "未知IP";
  
  // 消息内容 (支持 Markdown 语法)
  const text = `
🎉 *微积分打卡通知*

👤 **学生姓名**: ${name}
🕒 **打卡时间**: ${timeString}
📍 **来源 IP**: ${ip}
`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}

// --- 您的网页 HTML 代码 ---
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>三角函数图像生成器</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        canvas { touch-action: none; }
        .math-font { font-family: 'Times New Roman', serif; }
        .modal-enter { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    </style>
</head>
<body class="bg-gray-50 text-slate-800 min-h-screen flex flex-col items-center justify-center p-4">

    <div class="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        <!-- Header -->
        <div class="bg-slate-900 text-white p-6 flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold tracking-tight">三角函数图像生成器</h1>
                <p class="text-slate-400 text-sm mt-1">可视化学习助手 - 观察角度与函数值的变化</p>
            </div>
            <div id="formula-display" class="text-3xl math-font text-blue-400 opacity-90">
                <i>y</i> = sin(<i>x</i>)
            </div>
        </div>

        <!-- Controls -->
        <div class="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <div class="flex gap-2">
                <button onclick="setFunc('sin')" id="btn-sin" class="px-6 py-2 rounded-lg font-medium transition-all bg-blue-600 text-white shadow-md shadow-blue-200 scale-105">
                    y = sin x
                </button>
                <button onclick="setFunc('cos')" id="btn-cos" class="px-6 py-2 rounded-lg font-medium transition-all bg-white text-slate-600 hover:bg-slate-100 border border-slate-200">
                    y = cos x
                </button>
                <button onclick="setFunc('tan')" id="btn-tan" class="px-6 py-2 rounded-lg font-medium transition-all bg-white text-slate-600 hover:bg-slate-100 border border-slate-200">
                    y = tan x
                </button>
            </div>

            <div class="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                <button onclick="togglePlay()" id="btn-play" class="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors" title="暂停/播放">
                    <i data-lucide="pause" id="icon-play-pause"></i>
                </button>
                <button onclick="replay()" class="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors" title="重播">
                    <i data-lucide="rotate-ccw"></i>
                </button>
                <div class="h-6 w-px bg-slate-200 mx-1"></div>
                <span class="text-xs text-slate-500 font-medium">速度</span>
                <input type="range" min="1" max="10" value="2" oninput="updateSpeed(this.value)" class="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900">
            </div>
        </div>

        <!-- Canvas Area -->
        <div class="p-4 overflow-hidden relative" id="canvas-container">
            <canvas id="trigCanvas" class="w-full h-[400px] cursor-crosshair"></canvas>
            <div id="degree-display" class="absolute top-6 right-6 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-slate-100 text-sm font-mono text-slate-600 pointer-events-none">
                x: -360°
            </div>
        </div>

        <!-- Educational Info Footer -->
        <div class="bg-blue-50 p-6 border-t border-blue-100 flex items-start gap-4">
            <div class="bg-blue-100 p-2 rounded-full text-blue-600 mt-1 shrink-0">
                <i data-lucide="info"></i>
            </div>
            <div>
                <h3 class="font-semibold text-blue-900 mb-1">图像特征学习</h3>
                <p id="desc-display" class="text-blue-800 leading-relaxed">
                    正弦函数 (Sine)：周期为 360°。经过原点 (0,0)，在 90° 达到最大值 1。值域为 [-1, 1]。
                </p>
            </div>
        </div>

        <!-- Integrated Footer / Credits Section -->
        <div class="bg-slate-50 p-6 border-t border-slate-200 flex flex-col items-center justify-center gap-4">
            <div class="text-slate-400 text-xs text-center">
                推荐横屏浏览以获得最佳体验 • 支持触摸操作
            </div>
            
            <div class="flex flex-wrap items-center justify-center gap-4">
                <!-- Logo Pill -->
                <div class="bg-white border border-gray-200 rounded-full px-5 py-2 flex items-center shadow-sm gap-3 hover:shadow-md transition-shadow duration-300">
                    <img 
                        src="https://img.calcgospel.top/PicList/202512/c9ba5099657621ce60b55f0cfb0e7457.png" 
                        alt="Logo" 
                        class="w-6 h-6 object-contain rounded-full"
                    >
                    <span class="text-xs text-gray-500 font-medium tracking-wide">
                        微积分福音 卓永鸿老师制作
                    </span>
                </div>

                <!-- Check-in Button -->
                <button onclick="openCheckinModal()" class="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-full px-5 py-2 flex items-center shadow-sm gap-2 hover:shadow-md transition-all duration-300 transform active:scale-95 group">
                    <i data-lucide="send" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
                    <span class="text-xs font-medium tracking-wide">学习打卡</span>
                </button>
            </div>
        </div>

    </div>

    <!-- Modal Overlay -->
    <div id="checkin-modal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 modal-enter">
            <h3 class="text-lg font-bold text-slate-900 mb-2">学习打卡</h3>
            <p class="text-slate-500 text-sm mb-4">请输入您的姓名，系统将自动通知老师。</p>
            
            <div class="mb-4">
                <label for="student-name" class="block text-xs font-medium text-slate-700 mb-1">学生姓名</label>
                <input type="text" id="student-name" placeholder="例如：张小明" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800">
            </div>

            <div class="flex gap-3 justify-end">
                <button onclick="closeCheckinModal()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    取消
                </button>
                <button id="btn-confirm-send" onclick="submitCheckin()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2">
                    <i data-lucide="send"></i>
                    <span>确认打卡</span>
                </button>
            </div>
        </div>
    </div>

    <script>
        const state = { funcType: 'sin', isAnimating: true, animationSpeed: 2, progress: -360, xMin: -360, xMax: 360, yLimit: 2.5 };
        const canvas = document.getElementById('trigCanvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('canvas-container');
        const degreeDisplay = document.getElementById('degree-display');
        const formulaDisplay = document.getElementById('formula-display');
        const descDisplay = document.getElementById('desc-display');
        const playBtnIcon = document.getElementById('icon-play-pause');

        window.addEventListener('load', () => { lucide.createIcons(); resizeCanvas(); animate(); });
        window.addEventListener('resize', () => { resizeCanvas(); draw(); });

        function openCheckinModal() {
            const modal = document.getElementById('checkin-modal');
            const input = document.getElementById('student-name');
            modal.classList.remove('hidden');
            setTimeout(() => input.focus(), 100);
        }

        function closeCheckinModal() {
            document.getElementById('checkin-modal').classList.add('hidden');
        }

        async function submitCheckin() {
            const nameInput = document.getElementById('student-name');
            const sendBtn = document.getElementById('btn-confirm-send');
            const name = nameInput.value.trim();

            if (!name) { alert('请先输入姓名'); return; }

            const originalBtnText = sendBtn.innerHTML;
            sendBtn.disabled = true;
            sendBtn.innerHTML = \`<i data-lucide="loader-2" class="animate-spin"></i><span>发送中...</span>\`;
            lucide.createIcons();

            try {
                // 修改点：直接请求当前路径，无需写绝对路径，Worker 会拦截
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name })
                });

                if (response.ok) {
                    alert(\`打卡成功！已通知老师。\\n学生：\${name}\`);
                    nameInput.value = '';
                    closeCheckinModal();
                } else {
                    alert('打卡失败，请稍后重试。');
                }
            } catch (error) {
                console.error('Check-in error:', error);
                alert('网络连接异常，无法打卡。');
            } finally {
                sendBtn.disabled = false;
                sendBtn.innerHTML = originalBtnText;
                lucide.createIcons();
            }
        }

        function resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = 400 * dpr;
            ctx.scale(dpr, dpr);
            state.width = rect.width;
            state.height = 400;
        }

        function mapX(deg) { const range = state.xMax - state.xMin; return (deg - state.xMin) / range * state.width; }
        function mapY(val) { const unitPixels = (state.height / 2) / state.yLimit; return (state.height / 2) - (val * unitPixels); }

        function animate() {
            if (state.isAnimating) {
                state.progress += state.animationSpeed;
                if (state.progress >= state.xMax) { state.progress = state.xMax; state.isAnimating = false; updatePlayButtonIcon(); }
                degreeDisplay.textContent = \`x: \${Math.round(state.progress)}°\`;
            }
            draw();
            requestAnimationFrame(animate);
        }

        function draw() {
            const { width, height, xMin, xMax, yLimit, funcType, progress } = state;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, width, height);
            ctx.lineWidth = 1; ctx.strokeStyle = '#e2e8f0';

            ctx.beginPath();
            for (let d = xMin; d <= xMax; d += 30) { const x = mapX(d); ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            ctx.stroke();

            ctx.beginPath();
            for (let v = -Math.floor(yLimit); v <= Math.floor(yLimit); v += 0.5) {
                if (v === 0) continue;
                const y = mapY(v); ctx.moveTo(0, y); ctx.lineTo(width, y);
            }
            ctx.stroke();

            ctx.save(); ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
            if (funcType === 'tan') {
                ctx.strokeStyle = '#94a3b8';
                [-270, -90, 90, 270].forEach(deg => {
                    const x = mapX(deg);
                    if (x >= 0 && x <= width) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
                });
            } else {
                ctx.strokeStyle = '#cbd5e1';
                [1, -1].forEach(val => { const y = mapY(val); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); });
            }
            ctx.restore();

            ctx.lineWidth = 2; ctx.strokeStyle = '#475569'; ctx.beginPath();
            const yOrigin = mapY(0); ctx.moveTo(0, yOrigin); ctx.lineTo(width, yOrigin);
            const xOrigin = mapX(0); ctx.moveTo(xOrigin, 0); ctx.lineTo(xOrigin, height); ctx.stroke();

            ctx.fillStyle = '#334155'; ctx.font = '14px Inter, sans-serif'; ctx.textAlign = 'center';
            [-360, -270, -180, -90, 0, 90, 180, 270, 360].forEach(deg => {
                const x = mapX(deg); ctx.beginPath(); ctx.moveTo(x, yOrigin - 5); ctx.lineTo(x, yOrigin + 5); ctx.stroke();
                if (deg !== 0) ctx.fillText(\`\${deg}°\`, x, yOrigin + 20);
            });

            ctx.textAlign = 'right';
            [-2, -1, 1, 2].forEach(val => {
                const y = mapY(val); ctx.beginPath(); ctx.moveTo(xOrigin - 5, y); ctx.lineTo(xOrigin + 5, y); ctx.stroke();
                ctx.fillText(val, xOrigin - 8, y + 5);
            });
            ctx.fillText("0", xOrigin - 8, yOrigin + 20);

            ctx.lineWidth = 3;
            if (funcType === 'sin') ctx.strokeStyle = '#3b82f6';
            else if (funcType === 'cos') ctx.strokeStyle = '#10b981';
            else if (funcType === 'tan') ctx.strokeStyle = '#f59e0b';

            ctx.beginPath(); let firstPoint = true;
            for (let d = xMin; d <= progress; d += 1) {
                const rad = (d * Math.PI) / 180; let val = 0;
                if (funcType === 'sin') val = Math.sin(rad);
                else if (funcType === 'cos') val = Math.cos(rad);
                else if (funcType === 'tan') val = Math.tan(rad);
                if (funcType === 'tan' && Math.abs(val) > yLimit * 1.5) { firstPoint = true; continue; }
                const px = mapX(d); const py = mapY(val);
                if (firstPoint) { ctx.moveTo(px, py); firstPoint = false; } else { ctx.lineTo(px, py); }
            }
            ctx.stroke();

            const currentRad = (progress * Math.PI) / 180; let currentVal = 0;
            if (funcType === 'sin') currentVal = Math.sin(currentRad);
            else if (funcType === 'cos') currentVal = Math.cos(currentRad);
            else if (funcType === 'tan') currentVal = Math.tan(currentRad);

            if (Math.abs(currentVal) < yLimit * 1.5) {
                const tracerX = mapX(progress); const tracerY = mapY(currentVal);
                ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(tracerX, tracerY, 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(tracerX, tracerY, 3, 0, Math.PI * 2); ctx.fill();
            }
        }

        function setFunc(type) { state.funcType = type; state.progress = state.xMin; state.isAnimating = true; updatePlayButtonIcon(); updateUI(); }
        function togglePlay() { state.isAnimating = !state.isAnimating; if (state.isAnimating && state.progress >= state.xMax) { state.progress = state.xMin; } updatePlayButtonIcon(); }
        function replay() { state.progress = state.xMin; state.isAnimating = true; updatePlayButtonIcon(); }
        function updateSpeed(val) { state.animationSpeed = Number(val); }
        function updatePlayButtonIcon() { playBtnIcon.setAttribute('data-lucide', state.isAnimating ? 'pause' : 'play'); lucide.createIcons(); }
        function updateUI() {
            const buttons = { 'sin': document.getElementById('btn-sin'), 'cos': document.getElementById('btn-cos'), 'tan': document.getElementById('btn-tan') };
            Object.values(buttons).forEach(btn => { btn.className = "px-6 py-2 rounded-lg font-medium transition-all bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"; });
            const activeBtn = buttons[state.funcType];
            let activeClass = "px-6 py-2 rounded-lg font-medium transition-all text-white shadow-md scale-105 ";
            if (state.funcType === 'sin') activeClass += "bg-blue-600 shadow-blue-200";
            if (state.funcType === 'cos') activeClass += "bg-emerald-600 shadow-emerald-200";
            if (state.funcType === 'tan') activeClass += "bg-amber-500 shadow-amber-200";
            activeBtn.className = activeClass;
            if (state.funcType === 'sin') { formulaDisplay.innerHTML = "<i>y</i> = sin(<i>x</i>)"; descDisplay.innerText = "正弦函数 (Sine)：周期为 360°。经过原点 (0,0)，在 90° 达到最大值 1。值域为 [-1, 1]。"; }
            else if (state.funcType === 'cos') { formulaDisplay.innerHTML = "<i>y</i> = cos(<i>x</i>)"; descDisplay.innerText = "余弦函数 (Cosine)：周期为 360°。值域为 [-1, 1]。在 0° 时为最大值 1，图像仿佛是正弦函数左移了 90°。"; }
            else if (state.funcType === 'tan') { formulaDisplay.innerHTML = "<i>y</i> = tan(<i>x</i>)"; descDisplay.innerText = "正切函数 (Tangent)：周期为 180°。在 -90° 和 90° 处存在垂直渐近线（已用虚线标出），函数值趋向无穷大。"; }
        }
    </script>
</body>
</html>
`;