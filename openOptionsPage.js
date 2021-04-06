chrome.runtime.onInstalled.addListener(function (object) {
    if(object.reason === 'install'){
        // if the extension was just installed, open the options page for them
        chrome.tabs.create({url: "chrome-extension://blenoallcdijagcfhdbidjiimoandabh/options.html"}, function (tab) {});
    }
});
