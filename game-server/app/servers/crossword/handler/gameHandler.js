
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
        next(null, {code: 500});
        return;
    }

    var val = msg.val;
    var cid = session.get('cid');
    var uid = session.uid;

    if (!val || !cid){
        next(null, {code: 500});
        return;
    }

    var room = this.gameHall.getRoomById(cid);
    room.setUser(uid,'game',val);

    next(null, {code:200});

};

Handler.prototype.chat = function(msg, session, next) {

    if (!session.uid){
        next(null, {code: 500});
        return;
    }

    var chat = msg.chat;
    var cid = session.get('cid');
    var uid = session.uid;

    if (!chat || !cid){
        next(null, {code: 500});
        return;
    }

    var room = this.gameHall.getRoomById(cid);
    room.chat(uid,chat);

    next(null, {code:200});

};