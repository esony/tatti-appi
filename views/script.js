"use strict";
var video = document.getElementById("video");
var img = document.getElementById("img");
var videoStream = null;
var preLog = document.getElementById("preLog");
var cameraButton = document.getElementById("cameraButton");
var buttonBar = document.getElementById("button-bar");
var canvas = document.getElementById("canvas");
var imageCapture = null;
var image = null;
var loadingSpinner = document.getElementById("loader");

function log(text)
{
	if (preLog) preLog.textContent += ('\n' + text);
	else alert(text);
}

function clearCanvas() {
  video.style.display = 'block';
  img.style.display = 'none';
  cameraButton.style.display = 'block';
  buttonBar.style.display = 'none';
}

// Stop video
// video.srcObject.getVideoTracks().forEach(track => track.stop());

function gotMedia() {
  const mediaStreamTrack = videoStream.getVideoTracks()[0];

  video.srcObject = videoStream;
  video.onloadedmetadata = function(e) {
    video.play();
  };
  cameraButton.style.display = "block";
  document.getElementById("startScreen").style.display = "none";

  if (typeof(ImageCapture) !== "undefined") {
    imageCapture = new ImageCapture(mediaStreamTrack);
  }
}

function takePhoto() {
  const parameters = {
    imageHeight: window.innerHeight,
    imageWidth: window.innerWidth
  }
  
  if (!imageCapture) capturePhoto()
  else {
  imageCapture.takePhoto()
    .then(blob => {
      image = blob;
      img.src = URL.createObjectURL(blob);
      img.style.display = 'block';
      video.style.display = 'none';
      cameraButton.style.display = 'none';
      buttonBar.style.display = 'block';
    })
    .catch(error => console.error('takePhoto() error:', error));
  }
}

function capturePhoto() {
  var context = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  context.drawImage(video, 0, 0, window.innerWidth, window.innerHeight);

  canvas.toBlob(function(blob) {
    image = blob;
    img.src = URL.createObjectURL(blob);
  }, "image/jpeg");

  img.style.display = 'block';
  video.style.display = 'none';
  cameraButton.style.display = 'none';
  buttonBar.style.display = 'block';
}

function sendPhoto() {
  loadingSpinner.style.display = "block";
  var formData = new FormData();
  formData.append("image", image);
  $.ajax({
    url: `${location.origin}/upload`,
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: function(response) {
      loadingSpinner.style.display = "none";
      showResponse(response);
    },
    error: function(jqXHR, textStatus, errorMessage) {
      loadingSpinner.style.display = "none";        
      console.log(errorMessage); // Optional
      alert(`Photo NOT sent to Cloud! \n${textStatus}`);
      }
  });
}

function showInfo() {
  var infoButton = document.getElementById("info");
  infoButton.classList.toggle("info-fadeOut");
  infoButton.classList.toggle("info-fadeIn");
}

function showResponse(response) {
  var responseText = document.getElementById("responseText");
  var classes = ''
  response.forEach(function(current) {
    classes += 
      `<div class="responseClass">
        <div class="responseClassName">${current.class}</div>
        <div class="responseClassScore">Score: ${current.score}</div>
      </div>`
  })
  
  responseText.innerHTML = classes;
  toggleResponse();
}

function toggleResponse() {
  var responseBox = document.getElementById("responseBox");  
  responseBox.classList.toggle("info-fadeOut");
  responseBox.classList.toggle("info-fadeIn");
}

function start()
{
	if ((typeof window === 'undefined') || (typeof navigator === 'undefined')) log('This page needs a Web browser with the objects window.* and navigator.*!');
	else if (!(video)) log('HTML context error!');
	else {
    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
     navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        // First get ahold of the legacy getUserMedia, if present
        var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        
        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function(resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      }
    }

    if (navigator.mediaDevices.getUserMedia) {
    var constraints = { video: {facingMode: "environment"} };
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => videoStream = stream)
      .catch(error => alert('getUserMedia() error: ' + error.message));
    }
    cameraButton.addEventListener("mouseup", function() {
      takePhoto();
    });
	}
}

start();