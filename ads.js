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
                    console.log('Ad completed successfully');
                    if (typeof onAdCompleted === 'function') {
                        onAdCompleted();
                    }
                    resolve();
                })
                .catch((error) => {
                    console.error('Ad error:', error);
                    if (typeof onAdFailed === 'function') {
                        onAdFailed(error);
                    }
                    reject(error);
                });

        } catch (error) {
            console.error('Ad service error:', error);
            if (typeof onAdFailed === 'function') {
                onAdFailed(error);
            }
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

        if (provider === 'giga') {
            if (typeof showToast === 'function') {
                showToast('Ad service temporarily unavailable', 'error');
            }
        }

        throw error;
    }
}

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
    if (detectAdBlocker()) {
        console.warn('Ad blocker detected');
        if (typeof showToast === 'function') {
            showToast('Please disable ad blocker to earn coins', 'warning');
        }
        return false;
    }

    if (typeof window.showGiga === 'undefined') {
        console.warn('Ad service not loaded yet...');
        setTimeout(initializeAdSystem, 1000);
        return false;
    }

    console.log('Ad system initialized successfully');
    return true;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeAdSystem, 2000);
});

// Export functions
window.showGigaAd = showGigaAd;
window.showAd = showAd;
