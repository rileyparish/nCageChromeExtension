// init from chrome storage on page load, updated when changes are made to the textarea, but only saved to storage when the save button is clicked
var curSessionCustomImages = [];

// Saves options to chrome.storage
async function saveImageOptions() {
    // get the current settings in storage
    let settingsToSave = {};
    var p = new Promise(function(resolve, reject){
        chrome.storage.sync.get(['settings'], function(data){
            settingsToSave = data.settings.imageReplacement;
            resolve();
        })
    });
    // wait for the data to load
    await p;

    // update the settings based on the contents of the UI
    settingsToSave.enableImgReplace = document.getElementById('enableImageReplacement').checked;
    settingsToSave.imgReplaceProb = document.getElementById('imgReplaceProb').value / 100;
    settingsToSave.imgLibraryName = document.getElementById('imageLibrarySelection').value;
    settingsToSave.incrementValue = document.getElementById('incrementValue').value / 100;
    settingsToSave.incrementInterval = document.getElementById('incrementInterval').value;
    settingsToSave.lastUpdate = new Date().getTime();

    // if you're adding a new image library, make sure to add it to options.html as well so options.js can see it
    switch(settingsToSave.imgLibraryName){
        case "nCage":
            settingsToSave.imgLibrary = ncageImages;
            break;
        case "rubberDucks":
            settingsToSave.imgLibrary = rubberDuckImages;
            break;
        case "animeGirls":
            settingsToSave.imgLibrary = animeGirlImages;
            break;
        case "censored":
            settingsToSave.imgLibrary = "censored";
            break;
        case "spinInPlace":
            settingsToSave.imgLibrary = "spinInPlace";
            break;
        case "custom":
            settingsToSave.imgLibrary = curSessionCustomImages;
            // this way the custom list always gets preserved in settings
            settingsToSave.customImageLibrary = curSessionCustomImages;
            break;
        default:
            settingsToSave.imgLibrary = ncageImages;
            break;
    }

    // save the new settings in storage
    chrome.storage.sync.set({
        settings: {
            imageReplacement: settingsToSave
        }
    }, function() {
        // display a message to let the user know that the options were saved
        var status = document.getElementById('ncStatus');
        status.textContent = 'Options saved!';
        setTimeout(function() {
            status.textContent = '';
        }, 3000);
    });
}

// updates the selection description and
function updateSelectionNotice(){
    let imgLibOption = document.getElementById('imageLibrarySelection').value;
    let noticeText = "";
    switch(imgLibOption){
        case "nCage":
            noticeText = "The finest selection of Nicolas Cage images on the interwebs!";
            break;
        case "rubberDucks":
            noticeText = "Replace native images with (mostly) friendly rubber ducks!";
            break;
        case "animeGirls":
            noticeText = "Cutesy-wootsy non-lewd waifus (✿^‿^)";
            break;
        case "censored":
            noticeText = "Blurs webpage images and overlays a foreboding notice (this one's a little hit-and-miss :P ).";
            break;
        case "spinInPlace":
            noticeText = "Retains native images but adds a spin animation with a randomized speed and direction.";
            break;
        case "custom":
            noticeText = "Create your own library using whatever images you want!";
            populateTextArea(curSessionCustomImages);
    }
    document.getElementById("ncLibNotice").textContent = noticeText;
    // hide the text area unless the "custom" option is selected
    document.getElementById("ncUrlInputContainer").style.display = imgLibOption === "custom" ? "block" : "none";
}

function closeTab(){
    window.close();
}

function parseTextarea(){
    // get the text and remove newlines and whitespace
    let textareaContent = document.getElementById("ncTextareaContent").value.replace(/\n/g, "").trim();
    const urlCandidates = textareaContent.split(',');

    const urlRegex = /^(https?:\/\/)?((([a-zA-Z\d]([a-zA-Z\d-]{0,61}[a-zA-Z\d])?)\.)+[a-zA-Z]{2,}|((\d{1,3}\.){3}\d{1,3})|(\[[0-9a-fA-F:]+\]))(:\d+)?(\/[-a-zA-Z\d%_.~+]*)*(\?[;&a-zA-Z\d%_.~+=-]*)?(#[-a-zA-Z\d_]*)?$/;

    // filter out items that don't match a URL regex
    curSessionCustomImages = urlCandidates.filter(url => urlRegex.test(url));

    document.getElementById("ncTextAreaNotice").style.color = curSessionCustomImages.length > 0 ? "green" : "red";
    document.getElementById("ncTextAreaNotice").textContent = `${curSessionCustomImages.length} valid urls extracted.`;
}
  
// Restores settings state using the preferences stored in chrome.storage.
async function restoreOptions() {
    var loadSettings = new Promise(function(resolve, reject){
        chrome.storage.sync.get(["settings"], function(data) {
            document.getElementById("enableImageReplacement").checked = data.settings.imageReplacement.enableImgReplace;
            let imgLibName = data.settings.imageReplacement.imgLibraryName; 
            document.getElementById("imageLibrarySelection").value = imgLibName;
            // set the session's custom image library on page load
            curSessionCustomImages = data.settings.imageReplacement.customImageLibrary;            
            replacementRate = data.settings.imageReplacement.imgReplaceProb;
            // round to 4 decimal places and drop the extra zeros at the end
            document.getElementById("imgReplaceProb").value = +(replacementRate * 100).toFixed(4);
            document.getElementById("incrementValue").value = data.settings.imageReplacement.incrementValue * 100;
            document.getElementById("incrementInterval").value = data.settings.imageReplacement.incrementInterval;
            resolve();
        })
    });
    await loadSettings;
    // update the UI appearance based on the state of current settings
    updateSelectionNotice();
}

function populateTextArea(urlList){
    let text = "";
    urlList.forEach(url => {
        text = text.concat(url + ",\n");
    });
    document.getElementById("ncTextareaContent").textContent = text;
    parseTextarea();
}
// populate UI with the settings stored in chrome on page load
document.addEventListener('DOMContentLoaded', restoreOptions);
// listen for when the save button in settings is clicked.
document.getElementById('saveImageOptions').addEventListener('click', saveImageOptions);
// update library selection description
document.getElementById('imageLibrarySelection').addEventListener('change', updateSelectionNotice);
document.getElementById('ncCloseTabButton').addEventListener('click', closeTab);
// parse textarea and store valid URLs in curSessionCustomImages
document.getElementById('ncTextareaContent').addEventListener('input', parseTextarea);

// TODO: test to make sure nothing breaks on installation!!