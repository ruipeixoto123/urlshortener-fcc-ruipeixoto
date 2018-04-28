// requirements
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const shortUrl = require('./shortUrl');
const urlRegex = require('url-regex');

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));


// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


// url to shorten the url
app.get('/new/:urlToShorten(*)', function(req, res){
	var urlToShorten = req.params.urlToShorten;
	// check if url is valid
	if(urlRegex({exact: true, strict: true}).test(urlToShorten)){
		// create random number to use as shorter url
		var short = Math.floor(Math.random() * 100000).toString();
		// create instance to save to database
		var data = new shortUrl(
			{
				originalUrl: urlToShorten,
				shorterUrl: short
			}
		);
		// save to database
		data.save(err => {
			if(err) {
				return res.send('Error saving to database...!');
			}
			console.log(data.originalUrl);
			return res.json(data);
		});
	} else {
		//if url is not valid
		// create new instance and return
		var data = new shortUrl(
			{
				originalUrl:'url does not match standard format',
				shorterUrl: 'invalid url'
			}
		);
		return res.json(data);
	}
});

// query database and forward to original url
app.get('/:urlToForward', function(req, res){
	var shorterUrl = req.params.urlToForward;

	shortUrl.findOne({'shorterUrl': shorterUrl}, (err, data) => {
		if(err)
			return res.send("Error reading database...");
		 
    var re = new RegExp("^(http|https)://", "i");
    var strToCheck = data.originalUrl;
    if(re.test(strToCheck)){
        res.redirect(301, data.originalUrl);
    } else {
        res.redirect(301, 'http://' + data.originalUrl);
    }
    
	});
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
