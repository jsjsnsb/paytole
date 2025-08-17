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

// Earn tab elements
const watchAdBtn = document.getElementById('watchAdBtn');
const adCooldown = document.getElementById('adCooldown');
const cooldownTimer = document.getElementById('cooldownTimer');
const dailyClaimBtn = document.getElementById('dailyClaimBtn');
const dailyStreak = document.getElementById('dailyStreak');
const totalEarned = document.getElementById('totalEarned');
const adsWatched = document.getElementById('adsWatched');
const tasksCompleted = document.getElementById('tasksCompleted');

// Tasks tab elements
const tasksList = document.getElementById('tasksList');

// Withdraw tab elements
const binanceId = document.getElementById('binanceId');
const withdrawAmount = document.getElementById('withdrawAmount');
const withdrawBtn = document.getElementById('withdrawBtn');
const withdrawalHistory = document.getElementById('withdrawalHistory');

// Profile tab elements
const profileUserId = document.getElementById('profileUserId');
const profileUsername = document.getElementById('profileUsername');
const profileLanguage = document.getElementById('profileLanguage');
const profileJoinDate = document.getElementById('profileJoinDate');

// Toast element
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Initialize app
window.onload = () => {
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
        
        // Auto send user data to bot for registration
        tg.sendData(JSON.stringify(currentUser));
        
        // Initialize dashboard
        initializeDashboard();
    } else {
        showToast("No Telegram user info available", "error");
    }
};

// Initialize dashboard
async function initializeDashboard() {
    try {
        // Show user info
        updateUserInterface();
        
        // Load user data
        await loadUserData();
        
        // Load tasks
        await loadTasks();
        
        // Load withdrawal history
        await loadWithdrawalHistory();
        
        // Hide loading screen
        loadingScreen.classList.add('hidden');
        dashboard.classList.remove('hidden');
        
        // Setup event listeners
        setupEventListeners();
        
        // Check ad cooldown
        checkAdCooldown();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast("Failed to load dashboard", "error");
    }
}

// Update user interface
function updateUserInterface() {
    if (currentUser) {
        userAvatar.src = currentUser.photo || 'https://via.placeholder.com/60';
        userName.textContent = `${currentUser.first_name} ${currentUser.last_name}`.trim();
        profileUserId.textContent = currentUser.id;
        profileUsername.textContent = currentUser.username || 'Not set';
        profileLanguage.textContent = currentUser.lang.toUpperCase();
    }
}

// Load user data from local storage (simulated)
async function loadUserData() {
    // In a real app, this would fetch from your backend API
    const userData = {
        balance: parseInt(localStorage.getItem('userBalance') || '0'),
        totalEarned: parseInt(localStorage.getItem('totalEarned') || '0'),
        adsWatched: parseInt(localStorage.getItem('adsWatched') || '0'),
        tasksCompleted: parseInt(localStorage.getItem('tasksCompleted') || '0'),
        dailyStreak: parseInt(localStorage.getItem('dailyStreak') || '0'),
        lastAdWatch: localStorage.getItem('lastAdWatch'),
        joinDate: localStorage.getItem('joinDate') || new Date().toLocaleDateString()
    };
    
    // Update UI
    userBalance.textContent = userData.balance;
    totalEarned.textContent = userData.totalEarned;
    adsWatched.textContent = userData.adsWatched;
    tasksCompleted.textContent = userData.tasksCompleted;
    dailyStreak.textContent = userData.dailyStreak;
    profileJoinDate.textContent = userData.joinDate;
    
    // Check if user can claim daily bonus
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
        {
            id: 1,
            title: "Join Main Channel",
            description: "Join our main Telegram channel",
            reward: 10,
            type: "channel_join",
            channel: "@your_channel",
            completed: localStorage.getItem('task_1_completed') === 'true'
        },
        {
            id: 2,
            title: "Join News Channel",
            description: "Join our news channel for updates",
            reward: 10,
            type: "channel_join",
            channel: "@your_news_channel",
            completed: localStorage.getItem('task_2_completed') === 'true'
        },
        {
            id: 3,
            title: "Follow on Twitter",
            description: "Follow our Twitter account",
            reward: 15,
            type: "social_follow",
            link: "https://twitter.com/your_account",
            completed: localStorage.getItem('task_3_completed') === 'true'
        }
    ];
    
    tasksList.innerHTML = '';
    
    defaultTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
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
        if (taskType === 'channel_join') {
            // Open Telegram channel
            window.open(`https://t.me/${link.replace('@', '')}`, '_blank');
        } else if (taskType === 'social_follow') {
            // Open social link
            window.open(link, '_blank');
        }
        
        // Simulate task completion after a delay
        setTimeout(() => {
            // Mark task as completed
            localStorage.setItem(`task_${taskId}_completed`, 'true');
            
            // Get task reward
            const task = getTaskById(taskId);
            if (task) {
                addCoins(task.reward);
                updateTasksCompleted();
                showToast(`Task completed! +${task.reward} coins earned`, "success");
                
                // Send completion to bot
                tg.sendData(JSON.stringify({
                    action: 'task_completed',
                    taskId: taskId,
                    userId: currentUser.id
                }));
            }
            
            // Reload tasks
            loadTasks();
        }, 3000);
        
        showToast("Please complete the task and wait a moment...", "warning");
        
    } catch (error) {
        console.error('Task completion error:', error);
        showToast("Failed to complete task", "error");
    }
}

// Get task by ID
function getTaskById(taskId) {
    const tasks = [
        { id: 1, reward: 10 },
        { id: 2, reward: 10 },
        { id: 3, reward: 15 }
    ];
    return tasks.find(task => task.id === taskId);
}

// Load withdrawal history
async function loadWithdrawalHistory() {
    const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
    
    withdrawalHistory.innerHTML = '';
    
    if (withdrawals.length === 0) {
        withdrawalHistory.innerHTML = '<p style="text-align: center; color: #6c757d;">No withdrawals yet</p>';
        return;
    }
    
    withdrawals.forEach(withdrawal => {
        const withdrawalElement = createWithdrawalElement(withdrawal);
        withdrawalHistory.appendChild(withdrawalElement);
    });
}

// Create withdrawal element
function createWithdrawalElement(withdrawal) {
    const withdrawalDiv = document.createElement('div');
    withdrawalDiv.className = `withdrawal-item ${withdrawal.status}`;
    
    withdrawalDiv.innerHTML = `
        <div class="withdrawal-header">
            <span class="withdrawal-amount">${withdrawal.amount} coins</span>
            <span class="withdrawal-status status-${withdrawal.status}">${withdrawal.status}</span>
        </div>
        <div class="withdrawal-date">${new Date(withdrawal.date).toLocaleDateString()}</div>
        <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
            Binance ID: ${withdrawal.binanceId}
        </div>
    `;
    
    return withdrawalDiv;
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Watch ad button
    watchAdBtn.addEventListener('click', watchAd);
    
    // Daily claim button
    dailyClaimBtn.addEventListener('click', claimDailyBonus);
    
    // Withdrawal button
    withdrawBtn.addEventListener('click', requestWithdrawal);
    
    // Auto-save Binance ID
    binanceId.addEventListener('input', () => {
        localStorage.setItem('binanceId', binanceId.value);
    });
    
    // Load saved Binance ID
    const savedBinanceId = localStorage.getItem('binanceId');
    if (savedBinanceId) {
        binanceId.value = savedBinanceId;
    }
}

// Switch tab
function switchTab(tabName) {
    // Remove active class from all tabs and contents
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Watch ad function
async function watchAd() {
    try {
        watchAdBtn.disabled = true;
        watchAdBtn.innerHTML = '<span class="btn-icon">⏳</span>Loading Ad...';
        
        // Show ad using the ad service
        await showGigaAd();
        
    } catch (error) {
        console.error('Ad watch error:', error);
        showToast("Failed to load ad. Please try again.", "error");
        watchAdBtn.disabled = false;
        watchAdBtn.innerHTML = '<span class="btn-icon">▶️</span>Watch Ad';
    }
}

// Ad completion callback (called from ads.js)
function onAdCompleted() {
    // Add coins
    addCoins(1);
    
    // Update ads watched count
    const currentAdsWatched = parseInt(localStorage.getItem('adsWatched') || '0');
    localStorage.setItem('adsWatched', (currentAdsWatched + 1).toString());
    adsWatched.textContent = currentAdsWatched + 1;
    
    // Set cooldown
    const now = new Date();
    localStorage.setItem('lastAdWatch', now.toISOString());
    
    // Update UI
    watchAdBtn.disabled = false;
    watchAdBtn.innerHTML = '<span class="btn-icon">▶️</span>Watch Ad';
    
    // Start cooldown timer
    startAdCooldown();
    
    showToast("Ad completed! +1 coin earned", "success");
    
    // Send to bot
    tg.sendData(JSON.stringify({
        action: 'ad_watched',
        userId: currentUser.id,
        timestamp: now.toISOString()
    }));
}

// Ad failed callback
function onAdFailed(error) {
    console.error('Ad failed:', error);
    watchAdBtn.disabled = false;
    watchAdBtn.innerHTML = '<span class="btn-icon">▶️</span>Watch Ad';
    showToast("Ad failed to load. Please try again.", "error");
}

// Check ad cooldown
function checkAdCooldown() {
    const lastAdWatch = localStorage.getItem('lastAdWatch');
    if (lastAdWatch) {
        const lastWatch = new Date(lastAdWatch);
        const now = new Date();
        const cooldownDuration = 60 * 1000; // 1 minute cooldown
        const timePassed = now.getTime() - lastWatch.getTime();
        
        if (timePassed < cooldownDuration) {
            const remainingTime = cooldownDuration - timePassed;
            startAdCooldown(remainingTime);
        }
    }
}

// Start ad cooldown timer
function startAdCooldown(remainingTime = 60000) {
    watchAdBtn.disabled = true;
    watchAdBtn.innerHTML = '<span class="btn-icon">⏰</span>Cooldown';
    adCooldown.classList.remove('hidden');
    
    const endTime = Date.now() + remainingTime;
    
    adCooldownTimer = setInterval(() => {
        const now = Date.now();
        const timeLeft = endTime - now;
        
        if (timeLeft <= 0) {
            clearInterval(adCooldownTimer);
            watchAdBtn.disabled = false;
            watchAdBtn.innerHTML = '<span class="btn-icon">▶️</span>Watch Ad';
            adCooldown.classList.add('hidden');
        } else {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            cooldownTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Claim daily bonus
async function claimDailyBonus() {
    try {
        const today = new Date().toDateString();
        const lastClaim = localStorage.getItem('lastDailyClaim');
        
        if (lastClaim === today) {
            showToast("Already claimed today", "warning");
            return;
        }
        
        // Calculate streak
        let currentStreak = parseInt(localStorage.getItem('dailyStreak') || '0');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastClaim === yesterday.toDateString()) {
            currentStreak += 1;
        } else if (lastClaim !== today) {
            currentStreak = 1;
        }
        
        // Calculate bonus (base 5 + streak bonus)
        const bonus = 5 + Math.min(currentStreak - 1, 10); // Max 15 coins
        
        // Update storage
        localStorage.setItem('lastDailyClaim', today);
        localStorage.setItem('dailyStreak', currentStreak.toString());
        
        // Add coins
        addCoins(bonus);
        
        // Update UI
        dailyStreak.textContent = currentStreak;
        dailyClaimBtn.disabled = true;
        dailyClaimBtn.innerHTML = '<span class="btn-icon">✅</span>Already Claimed';
        
        showToast(`Daily bonus claimed! +${bonus} coins (${currentStreak} day streak)`, "success");
        
        // Send to bot
        tg.sendData(JSON.stringify({
            action: 'daily_claim',
            userId: currentUser.id,
            streak: currentStreak,
            bonus: bonus
        }));
        
    } catch (error) {
        console.error('Daily claim error:', error);
        showToast("Failed to claim daily bonus", "error");
    }
}

// Request withdrawal
async function requestWithdrawal() {
    try {
        const amount = parseInt(withdrawAmount.value);
        const binanceIdValue = binanceId.value.trim();
        const currentBalance = parseInt(localStorage.getItem('userBalance') || '0');
        
        // Validation
        if (!binanceIdValue) {
            showToast("Please enter your Binance Pay ID", "error");
            return;
        }
        
        if (!amount || amount < 100) {
            showToast("Minimum withdrawal amount is 100 coins", "error");
            return;
        }
        
        if (amount > currentBalance) {
            showToast("Insufficient balance", "error");
            return;
        }
        
        // Create withdrawal request
        const withdrawal = {
            id: Date.now(),
            amount: amount,
            binanceId: binanceIdValue,
            status: 'pending',
            date: new Date().toISOString()
        };
        
        // Save to local storage
        const withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
        withdrawals.unshift(withdrawal);
        localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
        
        // Subtract coins from balance
        subtractCoins(amount);
        
        // Reset form
        withdrawAmount.value = '';
        
        // Reload withdrawal history
        await loadWithdrawalHistory();
        
        showToast(`Withdrawal request submitted! Processing time: 24-48 hours`, "success");
        
        // Send to bot
        tg.sendData(JSON.stringify({
            action: 'withdrawal_request',
            userId: currentUser.id,
            amount: amount,
            binanceId: binanceIdValue
        }));
        
    } catch (error) {
        console.error('Withdrawal error:', error);
        showToast("Failed to process withdrawal request", "error");
    }
}

// Add coins to balance
function addCoins(amount) {
    const currentBalance = parseInt(localStorage.getItem('userBalance') || '0');
    const currentEarned = parseInt(localStorage.getItem('totalEarned') || '0');
    
    const newBalance = currentBalance + amount;
    const newEarned = currentEarned + amount;
    
    localStorage.setItem('userBalance', newBalance.toString());
    localStorage.setItem('totalEarned', newEarned.toString());
    
    // Update UI with animation
    animateNumberChange(userBalance, currentBalance, newBalance);
    animateNumberChange(totalEarned, currentEarned, newEarned);
}

// Subtract coins from balance
function subtractCoins(amount) {
    const currentBalance = parseInt(localStorage.getItem('userBalance') || '0');
    const newBalance = Math.max(0, currentBalance - amount);
    
    localStorage.setItem('userBalance', newBalance.toString());
    
    // Update UI
    animateNumberChange(userBalance, currentBalance, newBalance);
}

// Update tasks completed count
function updateTasksCompleted() {
    const currentTasks = parseInt(localStorage.getItem('tasksCompleted') || '0');
    const newTasks = currentTasks + 1;
    
    localStorage.setItem('tasksCompleted', newTasks.toString());
    animateNumberChange(tasksCompleted, currentTasks, newTasks);
}

// Animate number change
function animateNumberChange(element, from, to) {
    const duration = 1000;
    const steps = 30;
    const stepValue = (to - from) / steps;
    const stepDuration = duration / steps;
    
    let current = from;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        current += stepValue;
        
        if (step >= steps) {
            element.textContent = to;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, stepDuration);
}

// Show toast notification
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString();
}

// Initialize join date on first visit
if (!localStorage.getItem('joinDate')) {
    localStorage.setItem('joinDate', new Date().toLocaleDateString());
}
