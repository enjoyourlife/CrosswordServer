module.exports = function(app) {
	return new GameRemote(app);
};

var GameRemote = function(app) {
	this.app = app;
    this.gameHall = app.get('GGameHall');
};

GameRemote.prototype.add = function(uid, sid, cid, cb) {

    console.log('before GameRemote.prototype.add ...[%s][%s]',uid,sid);

    console.log(cid);

    var room = this.gameHall.getOpenRoom(cid);
    if (!!room){
        room.addUser(uid,sid);
//        room.autoStart();
        cb(null,room.cid,room.users);
    }else{
        cb('err when add',null,null);
    }

    console.log('end ... GameRemote.prototype.add');
};

GameRemote.prototype.kick = function(uid, sid, cid , cb) {

    console.log('before GameRemote.prototype.kick ...[%s][%s][%s]',uid,sid,cid);

    if (uid==null || sid==null || cid==null){
        cb(new Error('Null arg'));
        return;
    }

    var room = this.gameHall.getRoomById(cid);
    if (!!room){
        room.delUser(uid,sid);
        cb(null);
    }else{
        cb(new Error('Null room'));
    }

    console.log('end GameRemote.prototype.kick ...');
};

GameRemote.prototype.list = function(cb) {

    console.log('before GameRemote.prototype.list ...');

    var rooms = this.gameHall.getRoomList();

    cb(null,rooms);

};