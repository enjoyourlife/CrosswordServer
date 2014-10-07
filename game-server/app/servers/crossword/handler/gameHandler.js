var GMySQL = require('../../../services/mysql/GMySQL');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
    this.gameHall = app.get('GGameHall');
    this.gameConfig = app.get('GConfig');
};

// ---------------------------------------------------- //

Handler.prototype.send = function(msg, session, next) {

    var val = msg.val;
    var cid = session.get('cid');
    var uid = session.uid;

    if (uid==null || val==null || cid==null){
        next(null, {code: 500});
        return;
    }

    var room = this.gameHall.getRoomById(cid);
    if (!!room){
    	if (room.isEmptyChess(val)){
    		room.setUser(uid,'game',val);
    	}
        next(null, {code:200});
    }else{
        next(null, {code: 500});
    }

};

Handler.prototype.chat = function(msg, session, next) {

    var chat = msg.chat;
    var cid = session.get('cid');
    var uid = session.uid;

    if (uid==null || chat==null || cid==null){
        next(null, {code: 500});
        return;
    }

    var room = this.gameHall.getRoomById(cid);
    if (!!room){
        room.chat(uid,chat);
        next(null, {code:200});
    }else{
        next(null, {code: 500});
    }
};

Handler.prototype.use = function(msg, session, next) {

    var mysql = new GMySQL();

    var uid = session.uid;
    var iid = msg.iid;
    var arg = this.gameConfig.getById(iid,'items','arg');
    var val = this.gameConfig.getById(iid,'items','price');

    var cid = session.get('cid');

    var room = this.gameHall.getRoomById(cid);
    if (!!room){
        mysql.use(uid,iid,val,arg,next,function(gold){
            room.useItem(uid,iid,gold,arg);
        });

    }



};
