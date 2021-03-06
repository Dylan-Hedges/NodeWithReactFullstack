//On the back end we use a module system called common JS modules (a system in node js that allows code to be shared between files), on the front end (React) we use "import" a different module system called ES2015 modules (node JS does not have support for this hence the different syntax)
const express = require('express');
const mongoose = require('mongoose');
//Gives us access to Cookies
const cookieSession = require('cookie-session');
const passport = require('passport');
const bodyParser = require('body-parser');

const keys = require('./config/keys');
//Creates model/schema for users - (i.e when a user first signs up to our app a record of their googleId is created) - must come before "require('./services/passport');" as we define the schema/model first then call it in passport.js
require('./models/User');
require('./models/Survey');
//Uses model to capture and save data to our Mongo DB (i.e capture and save the user id provide by google to our Mongo DB) - We dont assign the require statement to a variable because nothing is returned, we just want the code inside to be executed
require('./services/passport');

mongoose.connect(keys.mongoURI);
//Creates a new express app (object) - defines config that listens to incoming requests from Node and send them to different route handlers
const app = express();

//----Middleware---- - applied before request is sent to request handlers
//Parses incoming requests - parses the body of requests and assigns it to the req.body property, our handlers will be able to use this parsed object (e.g post/put/patch requests that come into our app)
app.use(bodyParser.json());
//Tells Express to use cookies in our app (Cookie middleware)
app.use(
	cookieSession({
		//Sets cookie expiration
		maxAge: 30 * 24 * 60 * 60 * 1000,
		//Encrypts cookie - Prevents user id being changed, people cant pretend to be users
		keys: [keys.cookieKey]
	})
);
//Tells passport to use cookies for authentication (Passport middleware)
app.use(passport.initialize());
app.use(passport.session());

//--------IMPORTS ROUTES--------
//Import authentication route function into our app - When we import authRoutes it returns a function (as defined in authRoutes), "(app)" - we then immediately call this function and pass in the "app" object
require('./routes/authRoutes')(app);
//Import billing route function into our app - Imports in the function from billingRoutes.js and immediately exports it to our express "(app)" object
require('./routes/billingRoutes')(app);
require('./routes/surveyRoutes')(app);

//If in the production/Heroku
if (process.env.NODE_ENV === 'production') {
	//Check to see if there is a specific file in 'client/build' folder that matches the request - Searches for the main JS/CSS file in the 'client/build' folder
	app.use(express.static('client/build'));
	//Requires in the 'path' module
	const path = require('path');
	//If its not one of our specified routes AND its not in 'client/build' send back the 'index.html' file - Sends "index.html" for any routes we dont understand - sends the request over to the client side, some of our routes are only specified in our client side
	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
	});
}

//"const PORT = process.env.PORT" - Allows Heroku (AWS etc.) to dynamically define which port number Node listens to when we deploy our app, looks in the underlying runtime below node and finds the correct port to listen on, "|| 5000" - Development port, if we are on our local machine we hard code the port we want node to listen
const PORT = process.env.PORT || 5000;
//Tells Express to tell Node to listen to traffic on the number assigned in the PORT variable
app.listen(PORT);
