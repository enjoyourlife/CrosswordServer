// 140330
module.exports = function(app) {
	return new GameRemote(app);
};

var GameRemote = function(app) {
	this.app = app;
    this.gameHall = app.get('GGameHall');
};

// ---------------------------------------------------- //

GameRemote.prototype.add = function(uid, sid, cid, cb) {

    console.log('before GameRemote.prototype.add ...[%s][%s]',uid,sid);

    var room = this.gameHall.getOpenRoom();

    room.addUser(uid,sid);

    room.autoStart();

    cb(null,room.cid,room.users);

};

GameRemote.prototype.kick = function(uid, sid, cid , cb) {

    console.log('before GameRemote.prototype.kick ...[%s][%s][%s]',uid,sid,cid);

    var room = this.gameHall.getRoomById(cid);

    room.delUser(uid,sid);

    cb(null);
};
