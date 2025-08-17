// Global variables
let currentUser = null;
let adCooldownTimer = null;

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// DOM elements
const loadingScreen = document.getElementById('loading');
const dashboard = document.getElementById('dashboard');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// User elements
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userLevel = document.getElementById('userLevel');
const userBalance = document.getElementById('userBalance');

// Earn tab
const watchAdBtn = document.getElementById('watchAdBtn');
const adCooldown = document.getElementById('adCooldown');
const cooldownTimer = document.getElementById('cooldownTimer');
const dailyClaimBtn = document.getElementById('dailyClaimBtn');
const dailyStreak = document.getElementById('dailyStreak');
const totalEarned = document.getElementById('totalEarned');
const adsWatched = document.getElementById('adsWatched');
const tasksCompleted = document.getElementById('tasksCompleted');

// Tasks tab
const tasksList = document.getElementById('tasksList');

// Withdraw tab
const binanceId = document.getElementById('binanceId');
const withdrawAmount = document.getElementById('withdrawAmount');
const withdrawBtn = document.getElementById('withdrawBtn');
const withdrawalHistory = document.getElementById('withdrawalHistory');

// Profile tab
const profileUserId = document.getElementById('profileUserId');
const profileUsername = document.getElementById('profileUsername');
const profileLanguage = document.getElementById('profileLanguage');
const profileJoinDate = document.getElementById('profileJoinDate');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// On load
window.onload = () => {
    // Try to get Telegram user
    const user = tg.initDataUnsafe?.user;

    if (user) {
        currentUser = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name || "",
            username: user.username || "",
            lang: user.language_code || "en",
            photo: user.photo_url || ""
        };
    } else {
        // Fallback user for testing
        currentUser = {
            id: 123456,
            first_name: "Test",
            last_name: "User",
            username: "testuser",
            lang: "en",
            photo: ""
        };
        showToast("Telegram user not found, using fallback user", "warning");
    }

    // Hide loading after 1s
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        dashboard.classList.remove('hidden');
    }, 1000);

    // Initialize dashboard
    initializeDashboard();
};

// Initialize dashboard
async function initializeDashboard() {
    try {
        updateUserInterface();
        await loadUserData();
        await loadTasks();
        await loadWithdrawalHistory();
        setupEventListeners();
        checkAdCooldown();
    } catch (error) {
        console.error('Dashboard error:', error);
        showToast("Failed to load dashboard", "error");
    }
}

// Update UI
function updateUserInterface() {
    if (currentUser) {
        userAvatar.src = currentUser.photo || 'https://via.placeholder.com/60';
        userName.textContent = `${currentUser.first_name} ${currentUser.last_name}`.trim();
        profileUserId.textContent = currentUser.id;
        profileUsername.textContent = currentUser.username || 'Not set';
        profileLanguage.textContent = currentUser.lang.toUpperCase();
    }
}

// Load user data
async function loadUserData() {
    const userData = {
        balance: parseInt(localStorage.getItem('userBalance') || '0'),
        totalEarned: parseInt(localStorage.getItem('totalEarned') || '0'),
        adsWatched: parseInt(localStorage.getItem('adsWatched') || '0'),
        tasksCompleted: parseInt(localStorage.getItem('tasksCompleted') || '0'),
        dailyStreak: parseInt(localStorage.getItem('dailyStreak') || '0'),
        lastAdWatch: localStorage.getItem('lastAdWatch'),
        joinDate: localStorage.getItem('joinDate') || new Date().toLocaleDateString()
    };

    userBalance.textContent = userData.balance;
    totalEarned.textContent = userData.totalEarned;
    adsWatched.textContent = userData.adsWatched;
    tasksCompleted.textContent = userData.tasksCompleted;
    dailyStreak.textContent = userData.dailyStreak;
    profileJoinDate.textContent = userData.joinDate;

    // Daily bonus button
    const lastClaim = localStorage.getItem('lastDailyClaim');
    const today = new Date().toDateString();

    if (lastClaim !== today) {
        dailyClaimBtn.disabled = false;
        dailyClaimBtn.innerHTML = '<span class="btn-icon">🎁</span>Claim Daily Bonus';
    } else {
        dailyClaimBtn.disabled = true;
        dailyClaimBtn.innerHTML = '<span class="btn-icon">✅</span>Already Claimed';
    }
}

// Load tasks
async function loadTasks() {
    const defaultTasks = [
        { id: 1, title: "Join Main Channel", description: "Join our main Telegram channel", reward: 10, type: "channel_join", channel: "@your_channel", completed: localStorage.getItem('task_1_completed') === 'true' },
        { id: 2, title: "Join News Channel", description: "Join our news channel", reward: 10, type: "channel_join", channel: "@your_news_channel", completed: localStorage.getItem('task_2_completed') === 'true' },
        { id: 3, title: "Follow on Twitter", description: "Follow our Twitter account", reward: 15, type: "social_follow", link: "https://twitter.com/your_account", completed: localStorage.getItem('task_3_completed') === 'true' }
    ];

    tasksList.innerHTML = '';
    defaultTasks.forEach(task => tasksList.appendChild(createTaskElement(task)));
}

// Create task element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'task-completed' : ''}`;
    taskDiv.innerHTML = `
        <div class="task-header">
            <span class="task-title">${task.title}</span>
            <span class="task-reward">+${task.reward} coins</span>
        </div>
        <div class="task-description">${task.description}</div>
        <button class="btn task-btn ${task.completed ? 'btn-success' : 'btn-primary'}" 
                onclick="${task.completed ? '' : `completeTask(${task.id}, '${task.type}', '${task.channel || task.link}')`}"
                ${task.completed ? 'disabled' : ''}>
            <span class="btn-icon">${task.completed ? '✅' : '🚀'}</span>
            ${task.completed ? 'Completed' : 'Complete Task'}
        </button>
    `;
    return taskDiv;
}

// Complete task
async function completeTask(taskId, taskType, link) {
    try {
        if (taskType === 'channel_join') window.open(`https://t.me/${link.replace('@','')}`, '_blank');
        else if (taskType === 'social_follow') window.open(link, '_blank');

        showToast("Please complete the task and wait a moment...", "warning");

        setTimeout(() => {
            localStorage.setItem(`task_${taskId}_completed`, 'true');
            const task = getTaskById(taskId);
            if(task) {
                addCoins(task.reward);
                updateTasksCompleted();
                showToast(`Task completed! +${task.reward} coins earned`, "success");
                tg.sendData(JSON.stringify({action:'task_completed',taskId,userId:currentUser.id}));
            }
            loadTasks();
        }, 3000);
    } catch (err) {
        console.error(err);
        showToast("Failed to complete task", "error");
    }
}

// Get task by ID
function getTaskById(taskId) {
    const tasks = [{id:1,reward:10},{id:2,reward:10},{id:3,reward:15}];
    return tasks.find(t=>t.id===taskId);
}

// Load withdrawal history
async function loadWithdrawalHistory() {
    const withdrawals = JSON.parse(localStorage.getItem('withdrawals')||'[]');
    withdrawalHistory.innerHTML = withdrawals.length === 0 ? '<p style="text-align:center;color:#6c757d;">No withdrawals yet</p>' : '';
    withdrawals.forEach(w => withdrawalHistory.appendChild(createWithdrawalElement(w)));
}

// Withdrawal element
function createWithdrawalElement(w) {
    const div = document.createElement('div');
    div.className = `withdrawal-item ${w.status}`;
    div.innerHTML = `
        <div class="withdrawal-header">
            <span class="withdrawal-amount">${w.amount} coins</span>
            <span class="withdrawal-status status-${w.status}">${w.status}</span>
        </div>
        <div class="withdrawal-date">${new Date(w.date).toLocaleDateString()}</div>
        <div style="font-size:12px;color:#6c757d;margin-top:5px;">Binance ID: ${w.binanceId}</div>
    `;
    return div;
}

// Event listeners
function setupEventListeners() {
    tabBtns.forEach(btn => btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));
    watchAdBtn.addEventListener('click',watchAd);
    dailyClaimBtn.addEventListener('click',claimDailyBonus);
    withdrawBtn.addEventListener('click',requestWithdrawal);
    binanceId.addEventListener('input',()=>localStorage.setItem('binanceId',binanceId.value));
    const saved = localStorage.getItem('binanceId'); if(saved) binanceId.value = saved;
}

// Switch tab
function switchTab(tabName) {
    tabBtns.forEach(b=>b.classList.remove('active'));
    tabContents.forEach(c=>c.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Watch ad
async function watchAd() {
    try {
        watchAdBtn.disabled=true;
        watchAdBtn.innerHTML='<span class="btn-icon">⏳</span>Loading Ad...';
        await showGigaAd(); // make sure showGigaAd() exists
    } catch(err){
        console.error(err);
        showToast("Failed to load ad", "error");
        watchAdBtn.disabled=false;
        watchAdBtn.innerHTML='<span class="btn-icon">▶️</span>Watch Ad';
    }
}

// Ad completed
function onAdCompleted() {
    addCoins(1);
    const ads=parseInt(localStorage.getItem('adsWatched')||'0')+1;
    localStorage.setItem('adsWatched',ads);
    adsWatched.textContent=ads;
    localStorage.setItem('lastAdWatch',new Date().toISOString());
    watchAdBtn.disabled=false; watchAdBtn.innerHTML='<span class="btn-icon">▶️</span>Watch Ad';
    startAdCooldown();
    showToast("Ad completed! +1 coin", "success");
    tg.sendData(JSON.stringify({action:'ad_watched',userId:currentUser.id,timestamp:new Date().toISOString()}));
}

// Check ad cooldown
function checkAdCooldown() {
    const last = localStorage.getItem('lastAdWatch');
    if(last){
        const diff = Date.now() - new Date(last).getTime();
        if(diff<60000) startAdCooldown(60000-diff);
    }
}

// Start cooldown
function startAdCooldown(ms=60000){
    watchAdBtn.disabled=true;
    watchAdBtn.innerHTML='<span class="btn-icon">⏰</span>Cooldown';
    adCooldown.classList.remove('hidden');
    const end=Date.now()+ms;
    adCooldownTimer=setInterval(()=>{
        const left=end-Date.now();
        if(left<=0){clearInterval(adCooldownTimer);watchAdBtn.disabled=false;watchAdBtn.innerHTML='<span class="btn-icon">▶️</span>Watch Ad';adCooldown.classList.add('hidden');}
        else{cooldownTimer.textContent=`${Math.floor(left/60000).toString().padStart(2,'0')}:${Math.floor((left%60000)/1000).toString().padStart(2,'0')}`;}
    },1000);
}

// Claim daily bonus
function claimDailyBonus(){
    const today=new Date().toDateString();
    const last=localStorage.getItem('lastDailyClaim');
    if(last===today){showToast("Already claimed today","warning");return;}
    let streak=parseInt(localStorage.getItem('dailyStreak')||'0');
    const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
    streak=last===yesterday.toDateString()?streak+1:1;
    const bonus=5+Math.min(streak-1,10);
    localStorage.setItem('lastDailyClaim',today);
    localStorage.setItem('dailyStreak',streak);
    addCoins(bonus);
    dailyStreak.textContent=streak;
    dailyClaimBtn.disabled=true;
    dailyClaimBtn.innerHTML='<span class="btn-icon">✅</span>Already Claimed';
    showToast(`Daily bonus claimed! +${bonus} coins (${streak} day streak)`,"success");
    tg.sendData(JSON.stringify({action:'daily_claim',userId:currentUser.id,streak,bonus}));
}

// Withdrawal
function requestWithdrawal(){
    const amount=parseInt(withdrawAmount.value);
    const bId=binanceId.value.trim();
    const balance=parseInt(localStorage.getItem('userBalance')||'0');
    if(!bId){showToast("Enter Binance ID","error");return;}
    if(!amount||amount<100){showToast("Minimum withdrawal 100","error");return;}
    if(amount>balance){showToast("Insufficient balance","error");return;}
    const w={id:Date.now(),amount,bId,binanceId:bId,status:'pending',date:new Date().toISOString()};
    const list=JSON.parse(localStorage.getItem('withdrawals')||'[]');
    list.unshift(w);
    localStorage.setItem('withdrawals',JSON.stringify(list));
    subtractCoins(amount);
    withdrawAmount.value='';
    loadWithdrawalHistory();
    showToast("Withdrawal request submitted! Processing 24-48h","success");
    tg.sendData(JSON.stringify({action:'withdrawal_request',userId:currentUser.id,amount,bId}));
}

// Coins
function addCoins(amount){
    const b=parseInt(localStorage.getItem('userBalance')||'0');
    const e=parseInt(localStorage.getItem('totalEarned')||'0');
    localStorage.setItem('userBalance',b+amount);
    localStorage.setItem('totalEarned',e+amount);
    animateNumberChange(userBalance,b,b+amount);
    animateNumberChange(totalEarned,e,e+amount);
}
function subtractCoins(amount){
    const b=parseInt(localStorage.getItem('userBalance')||'0');
    const newB=Math.max(0,b-amount);
    localStorage.setItem('userBalance',newB);
    animateNumberChange(userBalance,b,newB);
}

// Update tasks completed
function updateTasksCompleted(){
    const t=parseInt(localStorage.getItem('tasksCompleted')||'0')+1;
    localStorage.setItem('tasksCompleted',t);
    animateNumberChange(tasksCompleted,t-1,t);
}

// Animate number
function animateNumberChange(el,from,to){
    const duration=1000,steps=30,stepVal=(to-from)/steps,stepDuration=duration/steps;
    let current=from,step=0;
    const timer=setInterval(()=>{
        step++;current+=stepVal;
        if(step>=steps){el.textContent=to;clearInterval(timer);}
        else el.textContent=Math.round(current);
    },stepDuration);
}

// Toast
function showToast(msg,type='info'){
    toastMessage.textContent=msg;
    toast.className=`toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(()=>toast.classList.add('hidden'),3000);
}

// Init join date
if(!localStorage.getItem('joinDate')) localStorage.setItem('joinDate',new Date().toLocaleDateString());
