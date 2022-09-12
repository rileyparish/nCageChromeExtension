// this is a background script. It gets run ONCE when the extension is installed/updated
// here we set an alarm to check back in every n minutes
// so every n minutes I check if it's time to update image replacement yet.
// also the default options are loaded into Chrome storage when the extension is first installed

importScripts("defaultOptions.js");

chrome.runtime.onInstalled.addListener((object) => {
    // clear all previous alarms (so we don't have multiple instances running at once)
    chrome.alarms.clearAll();
    
    // load the default options into Chrome storage. Only if this is the first time though, so we don't overwrite users' existing settings
    if(object.reason === 'install'){
        loadDefaultOptions();
    }
    
    // create alarm after extension is installed/upgraded
    chrome.alarms.create('updateImageReplace', { periodInMinutes: 5 });
});

function loadDefaultOptions(){
    chrome.storage.sync.set({"settings": defaultOptions.settings}, function() {});
}
  
chrome.alarms.onAlarm.addListener((alarm) => {
    // console.log(alarm.name);
    updateImageReplace();
});
  
async function updateImageReplace() {
    incrementValue = 0;
    incrementInterval = 0;
    lastUpdate = 0;
    replacementProb = 0;
    isEnabled = false;
    curSettings = {};
    
    // grab the most recent settings from Chrome storage
    var p = new Promise(function(resolve, reject){
        chrome.storage.sync.get(['settings'], function(data){
            curSettings = data;
            isEnabled = data.settings.imageReplacement.enableImgReplace;
            incrementValue = data.settings.imageReplacement.incrementValue;
            incrementInterval = data.settings.imageReplacement.incrementInterval;
            lastUpdate = data.settings.imageReplacement.lastUpdate;
            replacementProb = data.settings.imageReplacement.imgReplaceProb;
            resolve();
        })
    });
    // wait for the data to load
    await p;

    // if the difference between the current time and the last update is greater than the increment interval, update the value
    if(isEnabled && new Date().getTime() - lastUpdate > incrementInterval){
        // this approach isn't perfect, but it's a good balance between real time (increasing by incrementValue for every incrementInterval that passes), and active time (increasing by one incrementValue for every incrementInterval that the device is in use)

        // calculate the new replacement probability and update the time (and cap the probability at 1)
        newProb = replacementProb + incrementValue;
        if(newProb > 1){
            newProb = 1;
        }

        console.log(`Updating replacement probability from ${replacementProb} to ${newProb} [${new Date()}]`);
        curSettings.settings.imageReplacement.imgReplaceProb = newProb;
        curSettings.settings.imageReplacement.lastUpdate = new Date().getTime();

        // I can't save a specific item in an object, so just save the whole thing again
        chrome.storage.sync.set({settings : curSettings.settings});
    }
}