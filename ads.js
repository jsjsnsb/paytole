// Ad integration for Giga Pub
// This file handles the ad display and completion callbacks

// Show Giga Ad
async function showGigaAd() {
    return new Promise((resolve, reject) => {
        try {
            // Check if Giga ad script is loaded
            if (typeof window.showGiga === 'undefined') {
                reject(new Error('Ad service not available'));
                return;
            }
            
            // Show the ad
            window.showGiga()
                .then(() => {
                    // Ad completed successfully
                    console.log('Ad completed successfully');
                    onAdCompleted();
                    resolve();
                })
                .catch((error) => {
                    // Ad failed or was closed
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

// Alternative ad providers (backup)
const adProviders = {
    giga: {
        name: 'Giga Pub',
        show: showGigaAd
    },
    // Add more ad providers here if needed
};

// Main ad display function with fallback
async function showAd(provider = 'giga') {
    try {
        const adProvider = adProviders[provider];
        if (!adProvider) {
            throw new Error('Invalid ad provider');
        }
        
        await adProvider.show();
        
    } catch (error) {
        console.error('Failed to show ad:', error);
        
        // Try fallback options
        if (provider === 'giga') {
            // Could implement other ad networks as fallback
            showToast('Ad service temporarily unavailable', 'error');
        }
        
        throw error;
    }
}

// Ad completion handler (called from script.js)
// This is already defined in script.js, but including here for reference
/*
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
*/

// Ad failure handler (called from script.js)
// This is already defined in script.js, but including here for reference
/*
function onAdFailed(error) {
    console.error('Ad failed:', error);
    watchAdBtn.disabled = false;
    watchAdBtn.innerHTML = '<span class="btn-icon">▶️</span>Watch Ad';
    showToast("Ad failed to load. Please try again.", "error");
}
*/

// Check if ad blocker is present
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
    // Check for ad blocker
    if (detectAdBlocker()) {
        console.warn('Ad blocker detected');
        showToast('Please disable ad blocker to earn coins', 'warning');
        return false;
    }
    
    // Check if Giga ad script is loaded
    if (typeof window.showGiga === 'undefined') {
        console.warn('Ad service not loaded');
        setTimeout(initializeAdSystem, 1000); // Retry after 1 second
        return false;
    }
    
    console.log('Ad system initialized successfully');
    return true;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeAdSystem, 2000); // Wait 2 seconds for ad script to load
});

// Export functions for use in other scripts
window.showGigaAd = showGigaAd;
window.showAd = showAd;