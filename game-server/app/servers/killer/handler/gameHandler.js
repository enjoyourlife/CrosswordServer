module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
    this.gameHall = app.get('GGameHall');
};

/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
Handler.prototype.send = function(msg, session, next) {

    var dis = msg.dis;
    var cid = session.get('cid');
    var uid = session.uid;

    if (uid==null || dis==null || cid==null){
        next(null, {code: 500});
        return;
    }

    var room = this.gameHall.getRoomById(cid);
    if (!!room){
        room.setUser(uid,'game',dis);
        next(null, {code:200});
    }else{
        next(null, {code: 500});
    }

};

Handler.prototype.init = function(msg, session, next) {
    if (!session.uid){
        return;
    }

    var cid = session.get('cid');
    var uid = session.uid;
    var room = this.gameHall.getRoomById(cid);
    if (!!room){
        room.initClient(uid);
        next(null, {code:200});
    }else{
        next(null, {code:500});
    }
};

Handler.prototype.cursor = function(msg, session, next) {

    if (!session.uid){
        return;
    }

    var tid = msg.tid;
    var cid = session.get('cid');
    var uid = session.uid;

    var room = this.gameHall.getRoomById(cid);
    var result = room.setCursor(uid,tid);

    next(null, {code:200,result:result});

};

Handler.prototype.ready = function(msg, session, next) {

    if (!session.uid) {
        return;
    }

    var ready = msg.ready;
    var cid = session.get('cid');
    var uid = session.uid;

    var room = this.gameHall.getRoomById(cid);

    var result = room.setReady(uid,ready);

    next(null, {code:200,result:result});
};

Handler.prototype.chat = function(msg, session, next) {

    if (!session.uid) {
        return;
    }

    var chat = msg.chat;
    var cid = session.get('cid');
    var room = this.gameHall.getRoomById(cid);
    if (!!room) {
        room.setChat(session.uid, chat);
    }
    next(null, {code:200});
};
