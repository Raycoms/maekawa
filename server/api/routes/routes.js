'use strict';
module.exports = function (app, id, vectorClock, otherServer, socket) {
    let controller = require('../controllers/controller');
    controller.setup(id, [3000 + id, otherServer], socket);

    //Different routes
    //This first route is to send an artificial post to a certain server.
    app.route('/send/:id')
        .get((res, req) => {return controller.update(res, req, id, vectorClock)});
    //This second is for post requests triggered by the above.
    app.route('/')
        .post(controller.post);
    app.route('/ms/request')
        .post((res, req) => {return controller.request(res, req, id, vectorClock)});
    app.route('/ms/requestReturn')
        .post((res, req) => {return controller.requestReturn(res, req, id)});
    app.route('/ms/release')
        .post((res, req) => {return controller.release(res, req, id, vectorClock)});
    app.route('/client/release')
        .post((res, req) => {return controller.clientRelease(res, req, id, vectorClock)});
    app.route('/client/request')
        .post((res, req) => {return controller.clientRequest(res, req, id, vectorClock)});
};