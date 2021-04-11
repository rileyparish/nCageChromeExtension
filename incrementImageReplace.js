// this is a background script. It gets run ONCE when the extension is installed/updated
// here we set an alarm to check back in every n minutes
// so every n minutes I check if it's time to update image replacement yet.



chrome.runtime.onInstalled.addListener(() => {
    console.log("Creating alarm");
    // create alarm after extension is installed / upgraded
    // TODO: will existing alarms be destroyed upon upgrade?
    chrome.alarms.create('updateImageReplace', { periodInMinutes: 1 });
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    // console.log(alarm.name);
    updateImageReplace();
  });
  
  async function updateImageReplace() {
    console.log("Checking if it's time to increment image replacement");
    incrementValue = 0;
    incrementInterval = 0;
    lastUpdate = 0;


    // chrome.storage.sync.get({"settings": defaultOptions.settings}, function(data){
    //     incrementValue = data.settings.imageReplacement.incrementValue;
    // });

    var p = new Promise(function(resolve, reject){
        // if nothing is set in storage yet, it will use the default options declared in defaultOptions.js
        // ...which is out of scope here. Hmm

        // the settings are empty until the options page is accessed and saved.
        // and when they are saved, not all parameters are guaranteed to be filled out
        // TODO: this all feels backwards to me...I should see if I can load the default data here first when the extension is first installed
        // TODO: make default.js a background script
        chrome.storage.sync.get(['settings'], function(data){
            // console.log(`Retrieved data:`);
            // console.log(data);
            if(data != null){
                incrementValue = data.settings.imageReplacement.incrementValue;
                incrementInterval = data.settings.imageReplacement.incrementInterval;
                lastUpdate = data.settings.imageReplacement.lastUpdate;
            }
            resolve();
        })
    });
    // wait for the data to load
    await p;

    // console.log("does this get run?");
    // console.log(`incrementValue: ${incrementValue}`);

    // if the difference between the current time and the last update is greater than the increment interval, update the value
    if(new Date().getTime() - lastUpdate > incrementInterval){
        //chrome.storage.sync.set
        console.log("time to update the replacement probability");
    }else{
        console.log("not updating the replacement prob")
    }

    // access storage
    // get the time of last update
    // if the elapsed time > the user-specified interval, increment the replacement value

    // TODO: should I increment by the number of intervals that have elapsed? 
    // There's a potential bug if, say, I update 1% every hour. What happens when they close the computer for the night?
    // this code won't get called
  }