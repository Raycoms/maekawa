let express = require('express');
let app = express();
let port = process.env.PORT || 3000;
let bodyParser = require('body-parser');
let routes = require('./api/routes/routes');

//Unique Id of the server.
let id = port - 3000;
//Vector clock taking care of the order of the events.
let vectorClock = [0, 0, 0];

console.log('RESTful API server ' + id + ' started on: ' + port);
console.log(vectorClock);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//Middleware to increase clock on each get event.
app.get('/*', function (req, res, next) {
    vectorClock[id] += 1;
    console.log(vectorClock);
    next();
});

//Middleware, called each time we get a post message. we update the vector clock and let it continue.
app.post('/*', function (req, res, next) {
    updateVectorClock(vectorClock, req);
    next();
});

//register the route
routes(app, id, vectorClock, process.env.PPORT);
app.listen(port);


// Middleware to catch non-valid URLs.
app.use(function (req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});

/**
 * Function to update the vector clock.
 * @param vectorClock the vector clock of this process.
 * @param req the request containing the other vector clock.
 */
function updateVectorClock(vectorClock, req) {
    vectorClock[id] += 1;
    console.log('Incoming post from: ' + req.body.id);
    incomingClock = req.body.vector;
    for (i = 0; i < incomingClock.length; i++) {
        entry = incomingClock[i];
        if (entry > vectorClock[i]) {
            vectorClock[i] = parseInt(entry);
        }
    }
    console.log(vectorClock);
}