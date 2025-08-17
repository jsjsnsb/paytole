// ads-fix.js

// Show Giga Ad
async function showGigaAd() {
    return new Promise((resolve, reject) => {
        try {
            if (typeof window.showGiga === 'undefined') {
                reject(new Error('Ad service not available'));
                return;
            }

            window.showGiga()
                .then(() => {
                    console.log('Ad completed successfully');
                    onAdCompleted();
                    resolve();
                })
                .catch((error) => {
                    console.error('Ad error:', error);
                    onAdFailed(error);
                    reject(error);
                });

        } catch (error) {
            console.error('Ad service error:', error);
            onAdFailed(error);
            reject(error);
        }
    });
}

// Ad completion handler
function onAdCompleted() {
    const adsWatchedElem = document.getElementById('adsWatched');
    let current = parseInt(localStorage.getItem('adsWatched') || '0');
    current += 1;
    localStorage.setItem('adsWatched', current.toString());
    if (adsWatchedElem) adsWatchedElem.textContent = current;

    // Update balance
    const balanceElem = document.getElementById('userBalance');
    let balance = parseInt(balanceElem.textContent || '0');
    balance += 1;
    balanceElem.textContent = balance.toString();

    // Reset button
    const btn = document.getElementById('watchAdBtn');
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">▶️</span>Watch Ad';

    showToast("Ad completed! +1 coin earned", "success");

    // Save last ad watch time for cooldown
    localStorage.setItem('lastAdWatch', new Date().toISOString());
}

// Ad failure handler
function onAdFailed(error) {
    console.error('Ad failed:', error);
    const btn = document.getElementById('watchAdBtn');
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">▶️</span>Watch Ad';
    showToast("Ad failed to load. Please try again.", "error");
}

// Simple toast function
function showToast(msg, type='info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = msg;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Detect ad blocker
function detectAdBlocker() {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    testAd.style.position = 'absolute';
    testAd.style.left = '-10000px';
    document.body.appendChild(testAd);

    const isBlocked = testAd.offsetHeight === 0;
    document.body.removeChild(testAd);
    return isBlocked;
}

// Initialize ad system
function initializeAdSystem() {
    if (detectAdBlocker()) {
        console.warn('Ad blocker detected');
        showToast('Please disable ad blocker to earn coins', 'warning');
        return false;
    }

    if (typeof window.showGiga === 'undefined') {
        console.warn('Ad service not loaded, retrying...');
        setTimeout(initializeAdSystem, 1000);
        return false;
    }

    console.log('Ad system initialized successfully');

    // Bind watch ad button
    const watchBtn = document.getElementById('watchAdBtn');
    if (watchBtn) {
        watchBtn.addEventListener('click', async () => {
            watchBtn.disabled = true;
            watchBtn.innerHTML = '<span class="btn-icon">⏳</span>Loading Ad...';
            try {
                await showGigaAd();
            } catch (err) {
                console.error(err);
            }
        });
    }

    return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeAdSystem, 2000); // wait for Giga script
});

// Export globally if needed
window.showGigaAd = showGigaAd;
