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
