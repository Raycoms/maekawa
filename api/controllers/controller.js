'use strict';
let querystring = require('querystring');
let http = require('http');
let express = require("express");
let path = require("path");

//Set this process id.
let id = 0;
//Set the process this process communicates with.
let votingSet = [];
//Current state.
let state = "RELEASED";
//If already voted.
let voted = false;
//Amount of replies received.
let repliesReceived = 0;
//Queue of requests.
let queue = [];



//On update, send post to certain server (Manually triggered).
exports.update = function (req, res, id, vectorClock) {
    res.end();
    sendPost(req.params.id, "/", id, vectorClock)
};

//On post request (message of other server). (Manually triggered)
exports.post = function (req, res) {
    console.log("Posted here!");
    res.end();
};

/**
 * Called when the client requests the resource. (Manually triggered)
 * @param req the request.
 * @param res the response.
 * @param id the id of this server.
 * @param vectorClock the vector block of this server.
 */
exports.clientRequest = function (req, res, id, vectorClock) {
    console.log(id + " client requesting mutual exclusion!");
    state = "WANTED";
    votingSet.forEach(function (port) {
        console.log("Sending request to: " + port);
        sendPost(port, "/ms/request", id, vectorClock);
    });
};


/**
 * Called when the client releases the resource. (Manually triggered)
 * @param req the request.
 * @param res the response.
 * @param id the id of this server.
 * @param vectorClock the vector block of this server.
 */
exports.clientRelease = function (req, res, id, vectorClock) {
    console.log(id + " client releasing mutual exclusion!");
    state = "RELEASED";
    votingSet.forEach(function (port) {
        console.log("Sending request to: " + port);
        sendPost(port, "/ms/release", id, vectorClock);
    });
};

/**
 * Called when the server gets an answer for the request.
 * @param req the request.
 * @param res the response.
 * @param id the id of this server.
 * @param vectorClock the vector block of this server.
 */
exports.requestReturn = function (req, res, id, vectorClock) {
    repliesReceived++;
    console.log(id + " received answer #" + repliesReceived + " of server regarding mutual exclusion!");
    if (repliesReceived >= votingSet.length) {
        repliesReceived = 0;
        state = "HELD";
    }
};

/**
 * Called when the server receives a request of another server.
 * @param req the request.
 * @param res the response.
 * @param id the id of this server.
 * @param vectorClock the vector block of this server.
 */
exports.request = function (req, res, id, vectorClock) {
    console.log(id + " received request of other server for mutual exclusion!");
    let i = req.body.id;
    if (state !== "HELD" && !voted) {
        if (state === "RELEASED" || (state === "WANTED" && vectorClock[i] < vectorClock[id])) {
            sendPost(i, "/ms/requestReturn", id, vectorClock);
            voted = true;
        }
        else {
            queue.push(i);
        }
    }
    else {
        queue.push(i);
    }
};

/**
 * Received release message of other server.
 * @param req the request.
 * @param res the response.
 * @param id the id of this server.
 * @param vectorClock the vector block of this server.
 */
exports.release = function (req, res, id, vectorClock) {
    console.log(id + " received release message!");
    if (queue.empty()) {
        voted = false;
    }
    else {
        let pK = queue.pop();
        sendPost(pk, "/ms/requestReturn", id, vectorClock);
        voted = true;
    }
};

/**
 * Function to send a post request to a server.
 * @param port the port of the server.
 * @param type the type of the message.
 * @param id the id of this server.
 * @param vectorClock the vector clock of this server.
 */
function sendPost(port, type, id, vectorClock) {
    // Build the post string from an object
    const postData = querystring.stringify({
        id: id,
        vector: vectorClock
    });

    const options = {
        hostname: 'localhost',
        port: port,
        path: type,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const request = http.request(options, (resource) => {
    });

    request.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    // write data to request body
    request.write(postData);
    request.end();
}

exports.setup = function(ownVotingSet, ownId){
    id = ownVotingSet;
    votingSet = ownId;
};