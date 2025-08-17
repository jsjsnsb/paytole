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
        
        tg.sendData(JSON.stringify(currentUser));
        initializeDashboard();
    } else {
        showToast("No Telegram user info available", "error");
    }
};

// ==================== Dashboard ==================== //
async function initializeDashboard() {
    try {
        updateUserInterface();
        await loadUserData();
        await loadTasks();
        await loadWithdrawalHistory();

        loadingScreen.classList.add('hidden');
        dashboard.classList.remove('hidden');

        setupEventListeners();
        checkAdCooldown();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast("Failed to load dashboard", "error");
    }
}

function updateUserInterface() {
    if (currentUser) {
        userAvatar.src = currentUser.photo || 'https://via.placeholder.com/60';
        userName.textContent = `${currentUser.first_name} ${currentUser.last_name}`.trim();
        profileUserId.textContent = currentUser.id;
        profileUsername.textContent = currentUser.username || 'Not set';
        profileLanguage.textContent = currentUser.lang.toUpperCase();
    }
}

// ==================== Ads ==================== //
async function watchAd() {
    try {
        watchAdBtn.disabled = true;
        watchAdBtn.innerHTML = '<span class="btn-icon">⏳</span>Loading Ad...';

        await showGigaAd(); // from ads.js

    } catch (error) {
        console.error('Ad watch error:', error);
        onAdFailed(error);
    }
}

function onAdCompleted() {
    addCoins(1);

    const currentAdsWatched = parseInt(localStorage.getItem('adsWatched') || '0') + 1;
    localStorage.setItem('adsWatched', currentAdsWatched.toString());
    adsWatched.textContent = currentAdsWatched;

    const now = new Date();
    localStorage.setItem('lastAdWatch', now.toISOString());

    watchAdBtn.disabled = false;
    watchAdBtn.innerHTML = '<span class="btn-icon">▶️</span>Watch Ad';

    startAdCooldown();

    showToast("Ad completed! +1 coin earned", "success");

    tg.sendData(JSON.stringify({
        action: 'ad_watched',
        userId: currentUser.id,
        timestamp: now.toISOString()
    }));
}

function onAdFailed(error) {
    console.error('Ad failed:', error);
    watchAdBtn.disabled = false;
    watchAdBtn.innerHTML = '<span class="btn-icon">▶️</span>Watch Ad';
    showToast("Ad failed. Please try again.", "error");
}

function checkAdCooldown() {
    const lastAdWatch = localStorage.getItem('lastAdWatch');
    if (lastAdWatch) {
        const lastWatch = new Date(lastAdWatch);
        const now = new Date();
        const cooldownDuration = 60 * 1000;
        const timePassed = now.getTime() - lastWatch.getTime();

        if (timePassed < cooldownDuration) {
            startAdCooldown(cooldownDuration - timePassed);
        }
    }
}

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
            cooldownTimer.textContent =
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// ==================== Daily Bonus ==================== //
async function claimDailyBonus() {
    try {
        const today = new Date().toDateString();
        const lastClaim = localStorage.getItem('lastDailyClaim');

        if (lastClaim === today) {
            showToast("Already claimed today", "warning");
            return;
        }

        let currentStreak = parseInt(localStorage.getItem('dailyStreak') || '0');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastClaim === yesterday.toDateString()) currentStreak++;
        else currentStreak = 1;

        const bonus = 5 + Math.min(currentStreak - 1, 10);

        localStorage.setItem('lastDailyClaim', today);
        localStorage.setItem('dailyStreak', currentStreak.toString());

        addCoins(bonus);

        dailyStreak.textContent = currentStreak;
        dailyClaimBtn.disabled = true;
        dailyClaimBtn.innerHTML = '<span class="btn-icon">✅</span>Already Claimed';

        showToast(`Daily bonus claimed! +${bonus} coins (${currentStreak} day streak)`, "success");

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

// ==================== Other functions (tasks, withdraw, utils) ==================== //
// (unchanged from your version — kept intact for brevity)
// keep: loadUserData, loadTasks, completeTask, loadWithdrawalHistory,
// requestWithdrawal, addCoins, subtractCoins, animateNumberChange, etc.
