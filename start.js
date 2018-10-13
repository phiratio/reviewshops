const helpers = require('./helpers');
const mongoose = require('mongoose');

// Make sure we are running node 7.6+
const [major, minor] = process.versions.node.split('.').map(parseFloat);
if (major < 7 || (major === 7 && minor <= 5)) {
    process.exit();
}

// import environmental variables from our variables.env file
require('dotenv').config({path: 'variables.env'});

// Connect to our Database and handle any bad connections
mongoose.connect(process.env.DATABASE, {useNewUrlParser: true});
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
    console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

//import all of our models
//mongoose uses Singleton concept, once we import the model it becomes available everywhere via mongoose variable
//example: otherfile.js >> const Store = mongoose.model('Store');
require('./models/Store');
require('./models/User');
require('./models/Review');

// Start our app!
const app = require('./app');
app.set('port', process.env.PORT || 7777);
const server = app.listen(app.get('port'), 'localhost', () => {
    console.log(`${helpers.moment().format('DD/MM/YYYY||hh:mm:ss')} Express running → ${JSON.stringify(server.address())} on PORT ${server.address().port}`);
});


// TEMP send email
require('./handlers/mail');
