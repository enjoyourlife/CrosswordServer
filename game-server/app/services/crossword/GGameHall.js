/**
 * Created by Administrator on 2014/4/11.
 */

var GUtils = require('../utils/GUtils');

var GCODE = {
    ROOM: {
        USER_SIZE:  2,

        G_ROOM_OPEN:    5001,
        G_ROOM_READY:   5002,
        G_ROOM_GAME:    5003
    }
};

    // Room State: OPEN READY GAME
var GRoom = function(channel){
    this.users = [{uid:null,dat:null},{uid:null,dat:null}];
    this.channel = channel;
    this.cid = channel.name;
    this.door = GCODE.ROOM.G_ROOM_OPEN;
    this.tid = null;
    this.usr_cnt = 0;
    this.chess = null;
};

GRoom.prototype.isOpen = function(){
    return (this.door == GCODE.ROOM.G_ROOM_OPEN);
};

GRoom.prototype.getUserCount = function(){
    return this.usr_cnt;
};

GRoom.prototype.chat = function(uid,content){
    var param = {
        route: 'onUserChat',
        uid: uid,
        chat: content
    };
    this.pushMessage(param);
};

GRoom.prototype.addUser = function(uid,sid){
    this.channel.add(uid,sid);
    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        if (!user.uid){
            user.uid = uid;
            user.dat = {};
            this.usr_cnt ++;
            break;
        }
    }

    var param = {
        route: 'onUserEnter',
        uid: uid,
        channel:this.cid
    };
    this.pushMessage(param);

    if (this.getUserCount()>=GCODE.ROOM.USER_SIZE){
        this.door = GCODE.ROOM.G_ROOM_READY;
    }
};

GRoom.prototype.delUser = function(uid,sid){

    var param = {
        route: 'onUserExit',
        uid: uid,
        channel:this.cid
    };
    this.pushMessage(param);

    this.channel.leave(uid,sid);
    var user = this.getUser(uid);
    if (!!user){
        user.uid = null;
        user.dat = null;
        this.usr_cnt --;
    }

    if (this.getUserCount()>0){
        this.stopGame();
    }

    // 这是小型房间的设定。
    if (this.getUserCount()==0){
        this.door = GCODE.ROOM.G_ROOM_OPEN;
    }
};

GRoom.prototype.getUser = function(uid){
    if (!uid){
        return null;
    }
    var user_get;
    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        if (user.uid==uid){
            user_get = user;
            break;
        }
    }
    return user_get;
};

GRoom.prototype.setUser = function(uid,key,val){
    if (this.door!=GCODE.ROOM.G_ROOM_GAME){
        return;
    }

    var user = this.getUser(uid);
    if (!!user){
        user.dat[key] = val;

        var sdata = [];
        var users = this.users;
        for (var i = 0 , len = users.length ; i < len ; ++ i){
            var usr = users[i];
            sdata.push({uid:usr.uid,val:this.getUserData(usr.uid,'game')});
        }

        var param = {
            route: 'onGameProc',
            users:sdata
        };

        this.pushMessage(param);
    }
    this.doLogic();
};

GRoom.prototype.pushMessage = function(route, msg, opts, cb) {
    this.channel.pushMessage(route,msg,opts,cb);
};

GRoom.prototype.autoStart = function() {
    if (this.isOpen()){
        return;
    }

    var self = this;

    var param = {
        route: 'onGameReady'

    };
    self.pushMessage(param);

    this.chess = GUtils.JsonFromFile('./data/map0001.json');

    this.tid = setTimeout(
        function(){

            var param = {
                route: 'onGameStart',
                chess: this.chess
            };
            self.pushMessage(param);

            self.door = GCODE.ROOM.G_ROOM_GAME;
            self.tid = null;
        }
        ,3000);

};

GRoom.prototype.stopGame = function() {
    var param = {
        route: 'onGameStop',
        users:this.users
    };
    this.pushMessage(param);

    if (!!this.tid){
        clearTimeout(this.tid);
        this.tid = null;
    }

    // 小型房间的设定是：停止游戏后，直到所有玩家退出前，不会再开放。
    this.door = GCODE.ROOM.G_ROOM_READY;

    /*
    if (this.getUserCount()>=GCODE.ROOM.USER_SIZE){
        this.state = GCODE.ROOM.G_ROOM_READY;
    }else{
        this.state = GCODE.ROOM.G_ROOM_OPEN;
    }
    */
};

GRoom.prototype.getUserData = function(uid,key) {
    var user = this.getUser(uid);
    if (!!user && !!user.dat){
        return user.dat[key];
    }
    return null;
};

GRoom.prototype.doLogic = function() {
    var users = this.users;
    var usrA = this.getUserData(users[0].uid,'game');
    var usrB = this.getUserData(users[1].uid,'game');

/*
    if (usrA && usrA < this.distance){

    }else{

    }
*/

    if ((usrA && usrA >= this.distance) ||
        (usrB && usrB >= this.distance)){
        this.stopGame();
    }



     /*
    if (!usrA || !usrB){
        return;
    }
    if ((usrA - usrB) == 1 || (usrA - usrB) == -2){
        // usrA win.
    }
    if ((usrB - usrA) == 1 || (usrB - usrA) == -2){
        // usrB win.
    }
    */

};

var GGameHall = function(app) {
    this.app = app;
    this.rooms = {};
};

module.exports = GGameHall;

GGameHall.prototype.getRoomById = function(cid) {

    return this.rooms[cid];
};

GGameHall.prototype.getOpenRoom = function() {

    var rooms = this.rooms;
    var room_cnt = 0;
    var room;
    var room_open;

    if (!room_open){
        // 先找有人的房间...
        for (var cid in rooms){
            room = rooms[cid];
            if (room.isOpen() && room.getUserCount()==1){
                room_open = room;
                break;
            }
        }
    }

    if (!room_open){

        for (var cid in rooms){
            room = rooms[cid];
            if (room.isOpen()){
                room_open = room;
                break;
            }
            room_cnt ++;
        }
    }

    if (!room_open){
        var cid = "channel"+room_cnt;
        var channelService = this.app.get('channelService');
        var channel = channelService.getChannel(cid, true);
        room_open = rooms[cid] = new GRoom(channel);
    }

//    console.log(room_open);

    return room_open;
};