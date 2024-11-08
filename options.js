let customImageLib = [];

// Saves options to chrome.storage
function saveImageOptions() {
    var enableImageReplacement = document.getElementById('enableImageReplacement').checked;
    // retrieve the replacement percentage and convert it into a probability
    var imgReplaceProbability = document.getElementById('imgReplaceProb').value / 100;
    var imgIncrementValue = document.getElementById('incrementValue').value / 100;
    var imgIncrementInterveral = document.getElementById('incrementInterval').value;

    var imgLibOption = document.getElementById('imageLibrarySelection').value;
    imgLib = [];
    // if you're adding a new image library, make sure to add it to options.html as well so options.js can see it
    switch(imgLibOption){
        case "nCage":
            imgLib = ncageImages;
            break;
        case "rubberDucks":
            imgLib = rubberDuckImages;
            break;
        case "animeGirls":
            imgLib = animeGirlImages;
            break;
        case "censored":
            imgLib = "censored";
            break;
        case "spinInPlace":
            imgLib = "spinInPlace";
            break;
        case "custom":
            imgLib = customImageLib;
            break;
        default:
            imgLib = ncageImages;
            break;
    }

    // the settings for the extension are stored as a json object
    chrome.storage.sync.set({
        settings: {
            imageReplacement: {
                "enableImgReplace": enableImageReplacement,
                "imgReplaceProb": imgReplaceProbability,
                "imgLibraryName": imgLibOption,
                "imgLibrary": imgLib,
                "incrementValue": imgIncrementValue,
                "incrementInterval": imgIncrementInterveral,
                "lastUpdate": new Date().getTime()
            }
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

function updateSelectionNotice(){
    var imgLibOption = document.getElementById('imageLibrarySelection').value;
    switch(imgLibOption){
        case "nCage":
            document.getElementById("ncLibNotice").textContent = "The finest selection of Nicolas Cage images on the interwebs!";
            break;
        case "rubberDucks":
            document.getElementById("ncLibNotice").textContent = "Replace native images with (mostly) friendly rubber ducks!";
            break;
        case "animeGirls":
            document.getElementById("ncLibNotice").textContent = "Cutesy-wootsy non-lewd waifus (✿^‿^)";
            break;
        case "censored":
            document.getElementById("ncLibNotice").textContent = "Blurs webpage images and overlays a foreboding notice (this one's a little hit-and-miss :P ).";
            break;
        case "spinInPlace":
            document.getElementById("ncLibNotice").textContent = "Retains native images but adds a spin animation with a randomized speed and direction.";
            break;
    }
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
    customImageLib = urlCandidates.filter(url => urlRegex.test(url));

    if(customImageLib.length > 0){
        document.getElementById("ncTextAreaNotice").style.color = "green";
    }else{
        document.getElementById("ncTextAreaNotice").style.color = "red";
    }
    document.getElementById("ncTextAreaNotice").textContent = `${customImageLib.length} valid urls extracted.`;
}
  
// Restores settings state using the preferences stored in chrome.storage.
async function restoreOptions() {
    var loadSettings = new Promise(function(resolve, reject){
        chrome.storage.sync.get(["settings"], function(data) {
            document.getElementById("enableImageReplacement").checked = data.settings.imageReplacement.enableImgReplace;
            document.getElementById("imageLibrarySelection").value = data.settings.imageReplacement.imgLibraryName;
            replacementRate = data.settings.imageReplacement.imgReplaceProb;
            // round to 4 decimal places and drop the extra zeros at the end
            document.getElementById("imgReplaceProb").value = +(replacementRate * 100).toFixed(4);
            document.getElementById("incrementValue").value = data.settings.imageReplacement.incrementValue * 100;
            document.getElementById("incrementInterval").value = data.settings.imageReplacement.incrementInterval;
            resolve();
        })
    });
    await loadSettings;
    updateSelectionNotice();
}

document.addEventListener('DOMContentLoaded', restoreOptions);
// listen for when the save button in settings is clicked.
document.getElementById('saveImageOptions').addEventListener('click', saveImageOptions);
// update library selection description
document.getElementById('imageLibrarySelection').addEventListener('change', updateSelectionNotice);
document.getElementById('ncCloseTabButton').addEventListener('click', closeTab);
document.getElementById('ncTextareaContent').addEventListener('input', parseTextarea);

