// init from chrome storage on page load, updated when changes are made to the textarea, but only saved to storage when the save button is clicked
var curSessionCustomImages = [];
var testImgSrcIndex = -1;
const TEST_IMAGE_REF = "/images/replacementTester.jpg";

// Saves options to chrome.storage
async function saveImageOptions() {
    // get the current settings in storage
    let settingsToSave = {};
    var p = new Promise(function (resolve, reject) {
        chrome.storage.sync.get(['settings'], function (data) {
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
    settingsToSave.messageForVictim = document.getElementById('ncMessageInput').value || "";
    settingsToSave.lastUpdate = new Date().getTime();

    // if you're adding a new image library, make sure to add it to options.html as well so options.js can see it
    switch (settingsToSave.imgLibraryName) {
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
    }, function () {
        // display a message to let the user know that the options were saved
        var status = document.getElementById('ncStatus');
        status.textContent = 'Options saved!';
        setTimeout(function () {
            status.textContent = '';
        }, 3000);
    });
}

// updates the selection description and
function updateSelectionNotice() {
    let imgLibOption = document.getElementById('imageLibrarySelection').value;
    let noticeText = "";
    switch (imgLibOption) {
        case "nCage":
            noticeText = "The finest selection of Nicolas Cage compositions on the interwebs!";
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
            noticeText = "Create your own library using any images you like!";
            populateTextArea(curSessionCustomImages);
    }
    document.getElementById("ncLibNotice").textContent = noticeText;
    // hide the textarea unless the "custom" option is selected
    document.getElementById("ncUrlInputContainer").style.display = imgLibOption === "custom" ? "flex" : "none";
}

function closeTab() {
    window.close();
}

function parseTextarea() {
    // get the text and remove newlines and whitespace
    let textareaContent = document.getElementById("ncTextareaContent").value.replace(/\n/g, "");
    const urlCandidates = textareaContent.split(',').map(url => url.trim());

    const urlRegex = /^(https?:\/\/)?((([a-zA-Z\d]([a-zA-Z\d-]{0,61}[a-zA-Z\d])?)\.)+[a-zA-Z]{2,}|((\d{1,3}\.){3}\d{1,3})|(\[[0-9a-fA-F:]+\]))(:\d+)?(\/[-a-zA-Z\d%_.~+]*)*(\?[;&a-zA-Z\d%_.~+=-]*)?(#[-a-zA-Z\d_]*)?$/;

    // filter out items that don't match a URL regex
    curSessionCustomImages = urlCandidates.filter(url => urlRegex.test(url));

    document.getElementById("ncTextAreaNotice").style.color = curSessionCustomImages.length > 0 ? "green" : "red";
    document.getElementById("ncTextAreaNotice").textContent = `${curSessionCustomImages.length} valid urls extracted.`;

    if (curSessionCustomImages.length > 0) {
        // update the image to the last URL in the list
        testImgSrcIndex = curSessionCustomImages.length - 1;
        updateTestImage(curSessionCustomImages[testImgSrcIndex]);
    } else {
        updateTestImage(TEST_IMAGE_REF);
    }
    updateImageControls();
}

// change the test image src to verify that an image can be retrieved from the custom url
function updateTestImage(newSrc) {
    let testImage = document.getElementById("ncTestImg");
    // this is the same replacement logic used in imageReplacer.js
    testImage.setAttribute("style", `height:${testImage.height}px; width:${testImage.width}px; object-fit:cover; object-position:50% 35%; content:url(${newSrc});`);
}

function showNextTestImage() {
    if (curSessionCustomImages.length === 0) {
        return;
    }
    testImgSrcIndex = testImgSrcIndex + 1;
    if (testImgSrcIndex >= curSessionCustomImages.length) {
        // wrap to first image in list
        testImgSrcIndex = 0;
    }
    updateTestImage(curSessionCustomImages[testImgSrcIndex]);
    updateImageControls();
}

function showPrevTestImage() {
    if (curSessionCustomImages.length === 0) {
        return;
    }
    testImgSrcIndex = testImgSrcIndex - 1;
    if (testImgSrcIndex < 0) {
        // wrap to last image in list
        testImgSrcIndex = curSessionCustomImages.length - 1;
    }
    updateTestImage(curSessionCustomImages[testImgSrcIndex]);
    updateImageControls();
}

function updateImageControls() {
    if (curSessionCustomImages.length > 0) {
        document.getElementById("ncCurIndex").textContent = testImgSrcIndex + 1;
        document.getElementById("ncSrcListLength").textContent = curSessionCustomImages.length;
    } else {
        document.getElementById("ncCurIndex").textContent = 0;
        document.getElementById("ncSrcListLength").textContent = 0;
    }
}

// Restores settings state using the preferences stored in chrome.storage.
async function restoreOptions() {
    let curSettings;
    var loadSettings = new Promise(function (resolve, reject) {
        chrome.storage.sync.get(["settings"], function (data) {
            curSettings = data.settings.imageReplacement;
            resolve();
        })
    });
    await loadSettings;

    document.getElementById("enableImageReplacement").checked = curSettings.enableImgReplace;
    let imgLibName = curSettings.imgLibraryName;
    document.getElementById("imageLibrarySelection").value = imgLibName;
    // set the session's custom image library on page load
    curSessionCustomImages = curSettings.customImageLibrary || [];
    replacementRate = curSettings.imgReplaceProb;
    // round to 4 decimal places
    document.getElementById("imgReplaceProb").value = +(replacementRate * 100).toFixed(4);
    document.getElementById("incrementValue").value = curSettings.incrementValue * 100;
    document.getElementById("incrementInterval").value = curSettings.incrementInterval;
    // update the UI appearance based on the state of current settings
    updateSelectionNotice();
    if (curSessionCustomImages.length > 0) {
        // update the image to the last URL in the list
        testImgSrcIndex = curSessionCustomImages.length - 1;
        updateTestImage(curSessionCustomImages[testImgSrcIndex]);
    } else {
        updateTestImage(TEST_IMAGE_REF);
    }
    updateImageControls();

    if (curSettings.messageForVictim) {
        alert(`You've been pranked! The perpetrator has left you the following message:\n${curSettings.messageForVictim}`)
        document.getElementById('ncMessageInput').value = curSettings.messageForVictim;
    }
}

function populateTextArea(urlList) {
    let text = "";
    urlList.forEach(url => {
        text = text.concat(url + ",\n");
    });
    document.getElementById("ncTextareaContent").textContent = text;
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

document.getElementById('ncNextImage').addEventListener('click', showNextTestImage);
document.getElementById('ncPrevImage').addEventListener('click', showPrevTestImage);
