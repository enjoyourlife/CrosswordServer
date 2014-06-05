
module.exports = function(app) {
	return new GameRemote(app);
};

var GameRemote = function(app) {
	this.app = app;
    this.gameHall = app.get('GGameHall');
    this.gameConfig = app.get('GConfig');
};

// ---------------------------------------------------- //

GameRemote.prototype.add = function(uid, sid, cid, cb) {

    console.log('before GameRemote.prototype.add ...[%s][%s]',uid,sid);

    console.log(cid);

    if (!cid || !cid.type || !cid.level){
        cb('err',null,null);
        return;
    }

    var room = this.gameHall.getOpenRoom(cid);

    room.addUser(uid,sid);

    room.autoStart();

    cb(null,room.cid,room.users);

    console.log('end ... GameRemote.prototype.add');
};

GameRemote.prototype.kick = function(uid, sid, cid , cb) {

    console.log('before GameRemote.prototype.kick ...[%s][%s][%s]',uid,sid,cid);

    if (!uid || !sid || !cid){
        cb(new Error('Null arg'));
        return;
    }

    var room = this.gameHall.getRoomById(cid);

    room.delUser(uid,sid);

    cb(null);

    console.log('end GameRemote.prototype.kick ...');
};

GameRemote.prototype.cfg = function(cb) {
    cb(null,this.gameConfig.config);
};