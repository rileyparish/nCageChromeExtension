let enableImgReplace = false;
let imgReplaceProb = 0;
let imgLib = [];
let numImages = 0;

// asynchronously get the probability that was set in the options page
async function init() {
    var p = new Promise(function (resolve, reject) {
        // get the options from Chrome storage. The default settings were loaded on installation.
        chrome.storage.sync.get(["settings"], function (data) {
            enableImgReplace = data.settings.imageReplacement.enableImgReplace;
            imgReplaceProb = data.settings.imageReplacement.imgReplaceProb;
            imgLib = data.settings.imageReplacement.imgLibrary;
            resolve();
        })
    });
    // wait for the data to load
    await p;
    // now that we have the data we need from storage, run the replacement rules.
    if (enableImgReplace) {
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
    for (var i = numImages; i < allImages.length; i++) {
        if (shouldReplaceImg()) {
            replaceImage(allImages[i]);
        }
    }
    numImages = allImages.length;
}

function replaceImage(image) {
    // if the category is "censored" apply the CSS rules
    if (imgLib === "censored") {
        censorImage(image);
    } if (imgLib === "spinInPlace") {
        // generate a random animation duration between .5s and 20s:
        const animDuration = Math.random() * (20 - 0.5) + 0.5;
        const animDirection = Math.random() > .5 ? "normal" : "reverse";
        // <name of CSS function> <duration to complete in seconds> <progression type> <number of times to run> <clockwise/counterclockwise>
        image.style.animation = `ncRotate ${animDuration}s linear infinite ${animDirection}`;
    } else {
        newSrc = getRandomImage();
        // this line uses CSS to keep the old size of the image (this is important if the original image doesn't have existing height and width attributes)
        // it scales and crops the replacement image to fit, and also sets the image content to be the replacement image
        // object-position:center;
        image.setAttribute("style", `height:${image.height}px; width:${image.width}px; object-fit:cover; object-position:50% 35%; content:url(${newSrc});`);
        // `object-fit:cover` specifies how an image should be resized to fit its container and prevents image distortion
        // `object-position: horizontal vertical` specifies how the image should be centered if the replacement image is larger than the target image. 35% from the top is a decent average for the image sets.
        // also set the image src attribute for good measure (though it doesn't appear to be strictly necessary)
        image.src = newSrc;
    }
}

function censorImage(image) {
    warnings = ["CENSORED", "REDACTED", "VIEWER DISCRETION ADVISED", "ADVISORY CONTENT", "CONTENT BLOCKED", "ADULT CONTENT", "RESTRICTED CONTENT", "NSFW"];
    scan = true;
    element = image;
    while (scan) {
        // if the current element doesn't have a parent node
        if (element.parentNode == undefined) {
            break;
        }
        element = element.parentNode;
        // find the parent div of this image
        if (element.nodeName.toLowerCase() == "div") {
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

function getRandomImage() {
    // pick a random image url from the list
    randIndex = Math.floor(Math.random() * imgLib.length);
    return imgLib[randIndex];
}

function shouldReplaceImg() {
    // generate a random number from 0 to 1
    rand = Math.random();
    // replace the image according to the probability set in the options page
    return rand <= imgReplaceProb;
}
