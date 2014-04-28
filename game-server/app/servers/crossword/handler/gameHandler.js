
module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
    this.gameHall = app.get('GGameHall');
};

// ---------------------------------------------------- //

Handler.prototype.send = function(msg, session, next) {

    if (!session.uid){
        return;
    }

    var val = msg.val;
    var cid = session.get('cid');
    var uid = session.uid;

    var room = this.gameHall.getRoomById(cid);
    room.setUser(uid,'game',val);

    next(null, {
        route: msg.route,
        msg:'finish Send...'
    });

};

Handler.prototype.chat = function(msg, session, next) {

    if (!session.uid){
        return;
    }

    var chat = msg.chat;
    var cid = session.get('cid');
    var uid = session.uid;

    var room = this.gameHall.getRoomById(cid);
    room.chat(uid,chat);

    next(null, {
        route: msg.route,
        msg:'finish Send...'
    });

};