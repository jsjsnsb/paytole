// GigaPub ကြော်ငြာ Integration

// ▶ Giga Ad ပြဖို့ Function
async function runGigaAd() {
    return new Promise((resolve, reject) => {
        try {
            if (typeof window.showGiga === "undefined") {
                reject(new Error("Ad service မရရှိသေးပါ"));
                return;
            }

            // GigaPub SDK ထဲက showGiga ကို ခေါ်
            window.showGiga()
                .then(() => {
                    console.log("Ad ပြီးပါပြီ ✅");
                    if (typeof onAdCompleted === "function") {
                        onAdCompleted();
                    }
                    resolve();
                })
                .catch((error) => {
                    console.error("Ad error:", error);
                    if (typeof onAdFailed === "function") {
                        onAdFailed(error);
                    }
                    reject(error);
                });
        } catch (error) {
            console.error("Ad service error:", error);
            if (typeof onAdFailed === "function") {
                onAdFailed(error);
            }
            reject(error);
        }
    });
}

// ▶ ကြော်ငြာ Provider များ (fallback အတွက် ပြင်ဆင်ထား)
const adProviders = {
    giga: {
        name: "Giga Pub",
        show: runGigaAd,
    },
    // နောက်ထပ် Provider တို့ ထပ်ထည့်လို့ရမယ်
};

// ▶ ကြော်ငြာ ပြဖို့ Main Function
async function showAd(provider = "giga") {
    try {
        const adProvider = adProviders[provider];
        if (!adProvider) {
            throw new Error("မမှန်တဲ့ provider သုံးထားတယ်");
        }

        await adProvider.show();
    } catch (error) {
        console.error("Ad ပြမရပါ ❌:", error);

        // Fail ဖြစ်ရင် UI Reset
        if (typeof onAdFailed === "function") {
            onAdFailed(error);
        }

        // Fallback
        if (provider === "giga") {
            showToast("Ad service မရရှိသေးပါ", "error");
        }

        throw error;
    }
}

// ▶ Ad Blocker ရှိမရှိ စစ်
function detectAdBlocker() {
    const testAd = document.createElement("div");
    testAd.innerHTML = "&nbsp;";
    testAd.className = "adsbox";
    testAd.style.position = "absolute";
    testAd.style.left = "-10000px";
    document.body.appendChild(testAd);

    const isBlocked = testAd.offsetHeight === 0;
    document.body.removeChild(testAd);

    return isBlocked;
}

// ▶ Ad System Initialize
function initializeAdSystem(retries = 0) {
    if (detectAdBlocker()) {
        console.warn("Ad blocker ရှိတယ် ❌");
        showToast("Coin ဝင်ချင်ရင် Ad blocker ပိတ်ပါ", "warning");
        return false;
    }

    if (typeof window.showGiga === "undefined") {
        if (retries < 10) { // အများဆုံး 10 ကြိမ်ပဲ retry လုပ်မယ်
            console.warn("Ad service မ load ရသေး… ပြန်စမ်းမယ်");
            setTimeout(() => initializeAdSystem(retries + 1), 1000);
        } else {
            console.error("Ad service မ load ရတာ 10 ကြိမ်ကျော်သွားပြီ ❌");
        }
        return false;
    }

    console.log("Ad system စတင်ဖို့ အောင်မြင် ✅");
    return true;
}

// ▶ Page load အပြီး initialize
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => initializeAdSystem(), 2000);
});

// ▶ Export (SDK နဲ့ မတိုက်ဖို့ အမည်သစ်သုံး)
window.runGigaAd = runGigaAd;
window.showAd = showAd;
