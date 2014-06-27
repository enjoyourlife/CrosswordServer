/**
 * Created by Administrator on 2014/4/11.
 */

var GUtils = require('../utils/GUtils');
var GMySQL = require('../mysql/GMySQL');

var GCODE = {
    ROOM: {
        USER_SIZE:  2,

        G_ROOM_OPEN:    5001,
        G_ROOM_READY:   5002,
        G_ROOM_GAME:    5003
    },
    ROOM_EX: {
        USER_SIZE:  2,

        G_ROOM_OPEN:    5001,
        G_ROOM_READY:   5002,
        G_ROOM_GAME:    5003
    }
};

var GUser = function(idx){
    this.idx = idx;

    this.init(null);

};

GUser.prototype.init = function(uid){

    this.uid = uid;

    this.chess = null;
    this.flags = null;

    this.rewards = {pass:0,every:0,special:0,specialexp:0};
    this.info = null;
    this.blood = 0;

//    var self = this;
//    var mysql = new GMySQL();
//    mysql.info({uid:uid,gid:'crossword'},function(err,msg){
//        if (!!msg && msg.code==200){
//            self.info = msg.info;
//            console.log(self.info);
//        }
//    });
};

GUser.prototype.fini = function(){
    this.uid = null;

//    this.chess = null;
//    this.flags = null;

    this.rewards = {pass:0,every:0,special:0,specialexp:0};
    this.info = null;
    this.blood = 0;
};

GUser.prototype.initChess = function(chess){
    this.chess = [];
    this.flags = [];
    var words = chess['words'];
    if (!!words){
        for (var i = 0 ; i < words.length ; ++ i){
            this.chess.push(0);
            this.flags.push(words[i].flag);
        }
    }
};

GUser.prototype.setChessByPos = function(pos){
    var ret = false;

    if (this.chess!=null){
        if (pos >= 0 && pos < this.chess.length){
            if (this.chess[pos]==0){
                this.chess[pos] = 1;
                ret = true;
            }
        }
        if (ret){
            if (this.flags[pos]==1) {
                this.rewards.special++;
            }if (this.flags[pos]==2){
                this.rewards.specialexp++;
            }else{
                this.rewards.every ++;
            }
        }
    }

    return ret;
};

GUser.prototype.setChess = function(pos){

    if (pos instanceof Array){
        var posx;
        for (var i = 0 ; i < pos.length ; ++ i) {
            posx = pos[i];
            if (this.setChessByPos(posx)){

            }
        }
    }else{
        if (this.setChessByPos(pos)){

        }
    }

};

GUser.prototype.isWin = function(){
    if (this.uid == null){
        return false;
    }

    var win = true;
    for (var i = 0 ; i < this.chess.length ; ++ i){
        if (this.chess[i] == 0){
            win = false;
        }
    }

    this.rewards.pass = win?1:0;

    return win;
};

GUser.prototype.getReward = function(cfg){

//    var cfg = config.getById(0,'rewards');

    var gold = 0;
    gold += this.rewards.pass * cfg['passsilver'];
    gold += this.rewards.every * cfg['everysilver'];
    gold += this.rewards.special * cfg['specialsilver'];

    var exp = 0;
    exp += this.rewards.pass * cfg['passexp'];
    exp += this.rewards.every * cfg['everyexp'];
    exp += this.rewards.specialexp * cfg['specialexp'];

//    if (GUtils.randInt(1,100)>50){
//        gold += this.rewards.special * cfg['specialsilver'];
//    }else{
//        exp += this.rewards.special * cfg['specialexp'];
//    }

    var result = {gold:gold,exp:exp};
    return result;
};

GUser.prototype.setReward = function(cfg){

//    var cfg = config.getById(0,'rewards');

//    var gold = 0;
//    gold += this.rewards.pass * cfg['passsilver'];
//    gold += this.rewards.every * cfg['everysilver'];
//    gold += this.rewards.special * cfg['specialsilver'];
//
//    var exp = 0;
//    exp += this.rewards.pass * cfg['passexp'];
//    exp += this.rewards.every * cfg['everyexp'];
//    exp += this.rewards.special * cfg['specialexp'];

//    console.log(cfg);

//    console.log("gold:"+gold+" exp:"+exp);

    var val = this.getReward(cfg);

    if (!!this.uid){
        var mysql = new GMySQL();
        mysql.reward(this.uid,val.gold,val.exp,function(err,msg){});
    }

};

    // Room State: OPEN READY GAME
var GRoom = function(app,channel,xcid){
    this.users = [];
    for (var i = 0 ; i < GCODE.ROOM.USER_SIZE ; ++ i){
        this.users.push(new GUser(i));
    }
    this.channel = channel;
    this.cid = channel.name;
    this.xcid = xcid;

    this.door = GCODE.ROOM.G_ROOM_OPEN;
    this.tid = null;
    this.iid = null;
    this.usr_cnt = 0;
    this.time_cnt = 0;
    this.chess = null;
    this.config = app.get('GConfig');

    this.xcid.time = this.config.getById(this.xcid.level,'levels','time');
};

GRoom.prototype.isType = function(xcid){
    if (this.xcid.level==xcid.level &&
        this.xcid.type==xcid.type){
        return true;
    }
    return false;
};

GRoom.prototype.isOpen = function(){
    return this.door == GCODE.ROOM.G_ROOM_OPEN;
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

//    console.log('addUser ...'+uid);
    this.channel.add(uid,sid);
//    console.log('getMembers ...'+this.channel.getMembers());

    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        if (!user.uid){
            user.init(uid);
            this.usr_cnt ++;
            break;
        }
    }

    var param = {
        route: 'onUserEnter',
        uid: uid,
        cid:this.cid,
        users: this.getUsers(false)
    };
    this.pushMessage(param);

    if (this.getUserCount()>=GCODE.ROOM.USER_SIZE){
        this.door = GCODE.ROOM.G_ROOM_READY;
    }
};

GRoom.prototype.delUser = function(uid,sid){

    var user = this.getUser(uid);
    if (!!user){
        user.fini();
        this.usr_cnt --;
    }

    var param = {
        route: 'onUserExit',
        uid: uid,
        cid: this.cid,
        users: this.getUsers(false)
    };
    this.pushMessage(param);

//    console.log('delUser ...'+uid);
    this.channel.leave(uid,sid);
//    console.log('getMembers ...'+this.channel.getMembers());

    if (this.xcid.type==2){
        if (this.getUserCount()==0){
            this.stopGame(2);
        }
    }else{
        if (this.getUserCount()>0){
            this.stopGame(2);
        }
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

GRoom.prototype.getUsers = function(is_chess){
    var sdata = [];
    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var usr = users[i];
        if (is_chess){
            var cfg =  this.config.getById(this.xcid.level,'rewards');
            sdata.push({idx:usr.idx,uid:usr.uid,
                rewards:usr.getReward(cfg),
                chess:usr.chess,flags:usr.flags});
        }else{
            sdata.push({idx:usr.idx,uid:usr.uid});
        }
    }
    return sdata;
};

GRoom.prototype.setUser = function(uid,key,val){
    if (this.door!=GCODE.ROOM.G_ROOM_GAME){
        return;
    }

    if (this.xcid.type==1){

        var user = this.getUser(uid);
        if (!!user){

            user.setChess(val);

            var param = {
                route: 'onGameProc',
                users: this.getUsers(true)
            };

            this.pushMessage(param);
        }

    }else{

        var user = this.getUser(uid);
        if (!!user){

            user.setChess(val);

            var param = {
                route: 'onGameProc',
                users: this.getUsers(true)
            };

            this.pushMessage(param);
        }

        /*
        var users = this.users;

        users[0].setChess(val);
        users[1].setChess(val);

        var param = {
            route: 'onGameProc',
            users: this.getUsers(true)
        };

        this.pushMessage(param);
        */
    }

    this.doLogic();
};

GRoom.prototype.pushMessage = function(route, msg, opts, cb) {
    this.channel.pushMessage(route,msg,opts,cb);
};

GRoom.prototype.startTime = function() {
    var self = this;
    this.time_cnt = 0;
    var time_tab = 60;
    this.iid = setInterval(
        function(){

            console.log("setInterval:"+self.time_cnt+","+self.xcid.time);

            self.time_cnt += time_tab;
            if (self.time_cnt >= self.xcid.time){
                console.log('auto stop for time up.');
                self.stopGame(1);
            }else{

                var param = {
                    route: 'onGameTime',
                    time:   self.time_cnt
                };
                self.pushMessage(param);
            }

        },time_tab*1000);
};

GRoom.prototype.autoStart = function() {
    if (this.isOpen()){
        return;
    }

    var self = this;

    this.door = GCODE.ROOM.G_ROOM_READY;
    var param = {
        route: 'onGameReady',
        cid: self.xcid
    };
    self.pushMessage(param);

    var size = this.config.getById(this.xcid.level,'levels','size');
    var fname = GUtils.genMapPath(size);
    console.log('get filename:'+fname);
    this.chess = GUtils.JsonFromFile('./data/'+fname+'.json');

    // rand chess flag ...
    var words = this.chess['words'];
    for (var i = 0 , len = words.length ; i < len ; ++ i){
        words[i].flag = 0;
    }
    var rand = GUtils.randInt(0,words.length-1);
    words[rand].flag = (GUtils.randInt(0,100)>50)?1:2;
    // end

    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        user.initChess(this.chess);
    }

    this.tid = setTimeout(
        function(){

            var param = {
                route: 'onGameStart',
                chess: self.chess
            };
            self.pushMessage(param);

            self.door = GCODE.ROOM.G_ROOM_GAME;
            self.tid = null;

            if (self.xcid.type!=1){
                self.startTime();
            }
        }
        ,3000);

};

GRoom.prototype.stopGame = function(flag) {

    var users = this.users;
    var cfg =  this.config.getById(this.xcid.level,'rewards');

    users[0].setReward(cfg);
    users[1].setReward(cfg);

    var param = {
        route: 'onGameStop',
        flag: flag,
        users:this.getUsers(true)
    };
    this.pushMessage(param);

    if (!!this.tid){
        clearTimeout(this.tid);
        this.tid = null;
    }

    if (!!this.iid){
        clearInterval(this.iid);
        this.iid = null;
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
/*
GRoom.prototype.getUserData = function(uid,key) {
    var user = this.getUser(uid);
    if (!!user && !!user.dat){
        return user.dat[key];
    }
    return null;
};
*/
GRoom.prototype.doLogic = function() {
    var users = this.users;
    var usrA = users[0];
    var usrB = users[1];

    if (this.xcid.type == 2){

        var usr = (usrA.uid!=null)?usrA:usrB;

        if (usr==null){
            this.stopGame(3);
        }

        var win = true;
        for (var i = 0 ; i < usr.chess.length ; ++ i){
            var isA =  (usrA!=null) && usrA.chess[i] == 0;
            var isB =  (usrB!=null) && usrB.chess[i] == 0;
            if (isA && isB){
                win = false;
            }
        }

        if (usrA!=null && win){
            usrA.rewards.pass = win?1:0;
        }
        if (usrB!=null && win){
            usrB.rewards.pass = win?1:0;
        }
        if (win){
            this.stopGame(0);
        }

    }else{
        if (usrA.isWin() || usrB.isWin()){
            console.log('auto stop for one win.');
            this.stopGame(0);
        }
    }


};

// -----------------------------------------------------

var GRoomEx = function(app,channel,xcid){
    this.users = [];
    for (var i = 0 ; i < GCODE.ROOM_EX.USER_SIZE ; ++ i){
        this.users.push(new GUser(i));
    }
    this.channel = channel;
    this.cid = channel.name;
    this.xcid = xcid;
    this.xcid.time = 300;
    this.door = GCODE.ROOM_EX.G_ROOM_OPEN;
    this.tid = null;
    this.iid = null;
    this.usr_cnt = 0;
    this.time_cnt = 0;
    this.chess = null;
    this.config = app.get('GConfig');
};

GRoomEx.prototype.isType = function(xcid){
    if (this.xcid.level==xcid.level &&
        this.xcid.type==xcid.type){
        return true;
    }
    return false;
};

GRoomEx.prototype.isOpen = function(){
    return this.door == GCODE.ROOM_EX.G_ROOM_OPEN;
};

GRoomEx.prototype.getUser = function(uid){
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

GRoomEx.prototype.getUsers = function(is_chess){
    var sdata = [];
    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var usr = users[i];
        if (is_chess){
            var cfg =  this.config.getById(this.xcid.level,'rewards');
            sdata.push({idx:usr.idx,uid:usr.uid,blood:usr.blood,
                rewards:usr.getReward(cfg),
                chess:usr.chess,flags:usr.flags});
        }else{
            sdata.push({idx:usr.idx,uid:usr.uid});
        }
    }
    return sdata;
};

GRoomEx.prototype.addUser = function(uid,sid){

    this.channel.add(uid,sid);

    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        if (!user.uid){
            user.init(uid);
            this.usr_cnt ++;
            break;
        }
    }

    var param = {
        route: 'onUserEnter',
        uid: uid,
        cid:this.cid,
        users: this.getUsers(false)
    };
    this.pushMessage(param);

    if (this.getUserCount()>=GCODE.ROOM_EX.USER_SIZE){
        this.door = GCODE.ROOM_EX.G_ROOM_READY;
    }
};

GRoomEx.prototype.delUser = function(uid,sid){

    var user = this.getUser(uid);
    if (!!user){
        user.fini();
        this.usr_cnt --;
    }

    var param = {
        route: 'onUserExit',
        uid: uid,
        cid: this.cid,
        users: this.getUsers(false)
    };
    this.pushMessage(param);

    this.channel.leave(uid,sid);

    if (this.getUserCount()>0){
        this.stopGame(2);
    }

    // 这是小型房间的设定。
    if (this.getUserCount()==0){
        this.door = GCODE.ROOM_EX.G_ROOM_OPEN;
    }
};

GRoomEx.prototype.getUserCount = function(){
    return this.usr_cnt;
};

GRoomEx.prototype.pushMessage = function(route, msg, opts, cb) {
    this.channel.pushMessage(route,msg,opts,cb);
};

GRoomEx.prototype.autoStart = function() {
    console.log('GRoomEx.prototype.autoStart');

    if (this.isOpen()){
        return;
    }

    var self = this;

    this.door = GCODE.ROOM_EX.G_ROOM_READY;
    var param = {
        route: 'onGameReady',
        cid: self.xcid
    };
    self.pushMessage(param);

    /*

    var size = this.config.getById(this.xcid.level,'levels','size');
    var fname = GUtils.genMapPath(size);
    this.chess = GUtils.JsonFromFile('./data/'+fname+'.json');

    // rand chess flag ...
    var words = this.chess['words'];
    for (var i = 0 , len = words.length ; i < len ; ++ i){
        words[i].flag = 0;
    }
    var rand = GUtils.randInt(0,words.length-1);
    words[rand].flag = 1;
    // end

    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        user.initChess(this.chess);
    }

    */

    var mysql = new GMySQL();
    mysql.getWords(
        function(err,words){

            self.chess = {};
            self.chess['words'] = words;
            self.chess['nowid'] = 0;

            self.tid = setTimeout(
                function(){

                    var param = {
                        route: 'onGameStart'
                    };
                    self.pushMessage(param);

                    self.door = GCODE.ROOM_EX.G_ROOM_GAME;
                    self.tid = null;

                    self.startRound();
                }
                ,3000);

        });



};

GRoomEx.prototype.startTime = function() {
    var self = this;
    this.time_cnt = 0;
    this.iid = setInterval(
        function(){

            if (self.time_cnt >= 2){
                console.log('auto nextRound.');
                self.nextRound();
            }else{
                self.time_cnt ++;
                var param = {
                    route: 'onGameTime',
                    time:   self.time_cnt
                };
                self.pushMessage(param);
            }

        },5000);
};

GRoomEx.prototype.startRound = function() {
    var self = this;

    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        user.blood = 0;
    }

    var word = this.chess['words'][this.chess['nowid']];

    var nowid = this.chess['nowid'];
    nowid ++;
    if (nowid >= this.chess['words'].length){
        nowid = 0;
    }
    this.chess['nowid'] = nowid;

    var param = {
        route: 'onGameRound',
        word: word
    };
    self.pushMessage(param);

    self.startTime();
};

GRoomEx.prototype.nextRound = function() {

    if (!!this.iid){
        clearInterval(this.iid);
        this.iid = null;
    }

    if (this.getLiveCount()>1){
        this.startRound();
    }else{
        this.stopGame(0);
    }

};

GRoomEx.prototype.stopGame = function(flag) {

    var users = this.users;
    var cfg =  this.config.getById(this.xcid.level,'rewards');

    users[0].setReward(cfg);
    users[1].setReward(cfg);

    var param = {
        route: 'onGameStop',
        flag: flag,
        users:this.getUsers(true)
    };
    this.pushMessage(param);

    if (!!this.tid){
        clearTimeout(this.tid);
        this.tid = null;
    }

    if (!!this.iid){
        clearInterval(this.iid);
        this.iid = null;
    }

    // 小型房间的设定是：停止游戏后，直到所有玩家退出前，不会再开放。
    this.door = GCODE.ROOM_EX.G_ROOM_READY;

    /*
     if (this.getUserCount()>=GCODE.ROOM.USER_SIZE){
     this.state = GCODE.ROOM.G_ROOM_READY;
     }else{
     this.state = GCODE.ROOM.G_ROOM_OPEN;
     }
     */
};

GRoomEx.prototype.setUser = function(uid,key,val){
    if (this.door!=GCODE.ROOM_EX.G_ROOM_GAME){
        return;
    }

    var user = this.getUser(uid);
    if (!!user){

        if (user.blood <= -3 || user.blood > 0){
            return;
        }

        if (val == 1){
            user.blood = 1;
        }else if (val == -1){
            user.blood --;
        }

        var param = {
            route: 'onGameProc',
            users: this.getUsers(true),
            uid  : uid
        };

        this.pushMessage(param);
    }

//    this.doLogic();
};

GRoomEx.prototype.getLiveCount = function() {
    var cnt_live = 0;
    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        if (user.blood > 0){
            cnt_live ++;
        }
    }
    return cnt_live;
};

// -----------------------------------------------------

var GGameHall = function(app) {
    this.app = app;

    this.rooms = {};
};

module.exports = GGameHall;

GGameHall.prototype.getRoomById = function(cid) {

    return this.rooms[cid];
};

GGameHall.prototype.getOpenRoomEx = function(xcid) {

    if (xcid.level < 0 || xcid.level > 2){
        return null;
    }

    var rooms = this.rooms;
    var room_cnt = 0;
    var room;
    var room_open;

    for (var i = GCODE.ROOM_EX.USER_SIZE-1 ; i > 0 ; -- i){
        if (!room_open){
            // 先找有人的房间...
            for (var cid in rooms){
                room = rooms[cid];
                if (room.isType(xcid) && room.isOpen() && room.getUserCount()==i){
                    room_open = room;
                    break;
                }
            }
        }
    }

    if (!room_open){

        for (var cid in rooms){
            room = rooms[cid];
            if (room.isType(xcid) && room.isOpen()){
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
        room_open = rooms[cid] = new GRoomEx(this.app,channel,xcid);
    }

    return room_open;
};

GGameHall.prototype.getOpenRoom = function(xcid) {

    if (!xcid){
        return null;
    }
    if (xcid.type == 3){
        return this.getOpenRoomEx(xcid);
    }
    if (xcid.type < 1 || xcid.type > 2){
        return null;
    }
    if (xcid.level < 0 || xcid.level > 2){
        return null;
    }

    var rooms = this.rooms;
    var room_cnt = 0;
    var room;
    var room_open;

    if (!room_open){
        // 先找有人的房间...
        for (var cid in rooms){
            room = rooms[cid];
            if (room.isType(xcid) && room.isOpen() && room.getUserCount()==1){
                room_open = room;
                break;
            }
        }
    }

    if (!room_open){

        for (var cid in rooms){
            room = rooms[cid];
            if (room.isType(xcid) && room.isOpen()){
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
        room_open = rooms[cid] = new GRoom(this.app,channel,xcid);
    }

    return room_open;
};