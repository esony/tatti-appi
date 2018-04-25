// Require and create the Express framework
var express = require('express');
var fileUpload = require('express-fileupload');
var fs = require('fs');
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
require('dotenv').load();

const API_URL = "https://gateway-a.watsonplatform.net/visual-recognition/api/v3/classify";
const API_KEY = process.env.API_KEY;
const API_VERSION = "2016-05-20";
var COUNTER = 0;

var app = express();
app.use(fileUpload());

// Determine port to listen on
var port = (process.env.PORT || process.env.VCAP_APP_PORT || 3000);

// Enable reverse proxy support in Express. This causes the
// the "X-Forwarded-Proto" header field to be trusted so its
// value can be used to determine the protocol. See 
// http://expressjs.com/api#app-settings for more details.
app.enable('trust proxy');

// Add a handler to inspect the req.secure flag (see 
// http://expressjs.com/api#req.secure). This allows us 
// to know whether the request was via http or https.
if (process.env.NODE_ENV === 'production') {
	app.use (function (req, res, next) {
		if (req.secure) {
			// request was via https, so do no special handling
			next();
		} else {
			// request was via http, so redirect to https
			res.redirect('https://' + req.headers.host + req.url);
		}
	});
}

app.post('/upload', function(req, res) {

  if (!req.files)
    return res.status(400).send('No files were uploaded.');
		
	// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
	var file = req.files.image;
	
	if (file.mimetype !== 'image/jpeg') return res.status(415).send('Wrong filetype')
	
	// Use the mv() method to place the file somewhere on your server
	if (COUNTER > 20) COUNTER = 0;
	var filePath = `./img/${COUNTER}.jpg`
	file.mv(filePath, function(err) {
		if (err)
			return res.status(500).send(err);
			
		COUNTER++;

		var visualRecognition = new VisualRecognitionV3({
			version_date: API_VERSION,
			api_key: API_KEY,
			headers: {
					'X-Watson-Learning-Opt-Out': 'true'
			}
		});
		var images_file= fs.createReadStream(filePath);
		
		var params = {
			images_file: images_file,
		};

		visualRecognition.classify(params, function(err, response) {
			if (err) {
				console.log(err);
				res.status(err.code).send('Sorry, Watson has a problum')
			}
			else {
				response = response.images[0].classifiers[0].classes;
				res.send(response);
				console.log(JSON.stringify(response, null, 2))
			};
		});
	});
	
});

// Allow static files in /views and /img to be served
app.use(express.static(__dirname + '/views'));
app.use('/img', express.static(__dirname + '/img'));

// Start listening on the port
var server = app.listen(port, function() {
	console.log('Listening on port %d', server.address().port);
});

