enableImgReplace = false;
imgReplaceProb = 0;
imgLib = [];
numImages = 0;

// asynchronously get the probability that was set in the options page
async function init() {
    var p = new Promise(function(resolve, reject){
        // get the options from Chrome storage. The default settings were loaded on installation.
        chrome.storage.sync.get(["settings"], function(data){
            enableImgReplace = data.settings.imageReplacement.enableImgReplace;
            imgReplaceProb = data.settings.imageReplacement.imgReplaceProb;
            imgLib = data.settings.imageReplacement.imgLibrary;
            resolve();
        })
    });
    // wait for the data to load
    await p;
    // now that we have the data we need from storage, run the replacement rules.
    if(enableImgReplace){
        main();
        // this will run main every three seconds to catch any images that are loaded after the initial page load (for scrolling feeds)
        setInterval(main, 3000);
    }    
}
// this is the entry point; init grabs the settings data from storage and then calls main()
init();

// main drives all the replacement logic
function main() {
    // get an array of all the image elements
    // var allImages = document.getElementsByTagName("img");
    var allImages = document.images;
    // loop though that array of image elements, skipping images that have already been considered
    for(var i = numImages; i < allImages.length; i++) {
        if(shouldReplaceImg()) {
            replaceImage(allImages[i]);
        }
    }
    numImages = allImages.length;
}

function replaceImage(image){
    // if the category is "censored" apply the CSS rules. Otherwise do normal image replacement
    if(imgLib == "censored"){
        censorImage(image);
    }else{
        newSrc = getRandomImage();
        // this line uses CSS to keep the old size of the image (this is important if the original image doesn't have existing height and width attributes)
        // it scales and crops the replacement image to fit, and also sets the image content to be the replacement image

        // note that image.height gets the native height of the image but image.clientHeight gets the height of the image as it's drawn on the screen. So this is the one I care about.
        // image.setAttribute("style", `height:${image.clientHeight}px !important; width:${image.clientWidth}px !important; object-fit:cover; content:url(${newSrc});`);
        // but it looks like it causes missing images on reddit sometimes. Hmm.
        // but if I don't use the client attributes, the subreddit icon is huge sometimes. Using the client attributes seemed to fix that problem.
        // I did come across a few instances where the clientHeight and clientWidth were 0 and the height/width were 256x256. So I'm not sure what to make of that.
        newHeight = 0;
        newWidth = 0;
        console.log("ch/cw:", image.clientHeight, image.clientWidth);
        console.log("c/w:", image.height, image.width);
        console.log(image);
        
        // if the image has the client sizes, use those.
        if(image.hasAttribute("clientHeight") && image.hasAttribute("clientWidth")){
            // but this never gets called
            console.log("using client attributes");
            newHeight = image.clientHeight;
            newWidth = image.clientWidth;
        }else{
            newHeight = image.height;
            newWidth = image.width;
        }
        image.setAttribute("style", `height:${newHeight}px !important; width:${newWidth}px !important; object-fit:cover; content:url(${newSrc});`);
        // also set the image src attribute for good measure (though it doesn't appear to be strictly necessary)
        image.src = newSrc;
    }
}

function censorImage(image){
    // this option doesn't work perfectly, but that's alright
    warnings = ["CENSORED", "REDACTED", "VIEWER DISCRETION ADVISED", "ADVISORY CONTENT", "CONTENT BLOCKED", "ADULT CONTENT", "RESTRICTED CONTENT"];
    scan = true;
    element = image;
    while(scan){
        // if the current element doesn't have a parent node
        if(element.parentNode == undefined) {
            break;
        }
        element = element.parentNode;
        // find the parent div of this image
        if(element.nodeName.toLowerCase() == "div"){
            // add the necessary elements and styling to make it look threatening
            element.classList.add("ncCensoredContainer");
            censoredText = document.createElement("DIV");
            // pick some threatening text at random
            randIndex = Math.floor(Math.random() * warnings.length);
            warning = warnings[randIndex];
            censoredText.innerHTML = warning;
            censoredText.classList.add("ncCensoredText");
            element.appendChild(censoredText);
            image.classList.add("ncCensoredContent");
            scan = false;
        }
    }
}

function getRandomImage(){
    // pick a random image url from the list
    randIndex = Math.floor(Math.random() * imgLib.length);
    return imgLib[randIndex];
}

function shouldReplaceImg(){
    // generate a random number from 0 to 1
    rand = Math.random();
    // replace the image according to the probability set in the options page
    return rand <= imgReplaceProb;
}
