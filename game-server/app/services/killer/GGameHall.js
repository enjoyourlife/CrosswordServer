/**
 * Created by Administrator on 2014/4/11.
 * 备注事项：
 */
var GCODE = {
    ROOM: {
        USER_MIN:  3,
        USER_MAX:  6,

        G_ROOM_OPEN:    5001,
        G_ROOM_FULL:   5002,
        G_ROOM_GAME:    5003
    },
    GAME: {
        STAT_RESET: 0x00000001,     // 1
        STAT_NIGHT: 0x00000004,     // 4
        STAT_FIGHT: 0x00000040      // 64
    },
    RTYPE: {
        ROLE_ALL:       0x00,
        ROLE_CIVILIAN:  0x01,
        ROLE_POLICE:    0x02,
        ROLE_KILLER:    0x04
    },
    EVENT: {
        FUNC_FIGHT:		0x00010001,	//辩论
        FUNC_KILL:		0x00020101,	//击杀
        FUNC_POLICE:	0x00020201	//验人
    }

};
var c_nRole_V1 = [
    GCODE.RTYPE.ROLE_KILLER,GCODE.RTYPE.ROLE_POLICE,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_KILLER,GCODE.RTYPE.ROLE_POLICE,
    GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,
    GCODE.RTYPE.ROLE_KILLER,GCODE.RTYPE.ROLE_POLICE,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_KILLER,
    GCODE.RTYPE.ROLE_POLICE];

var GUser = function(idx){
    this.idx = idx;
    this.reset();
};

GUser.prototype.init = function(uid){
    this.reset();

    this.uid = uid;
    this.dat = {};
};

GUser.prototype.fini = function(){
    this.reset();
};

GUser.prototype.reset = function(){
    this.uid=null;
    this.ins=null;
    this.tid=null;
    this.dat=null;
    this.ready=false;
    this.master=false;
    this.enable=true;
    this.rand=0.0;
    this.rtype=GCODE.RTYPE.ROLE_ALL;
};

// Room State: OPEN READY GAME
var GRoom = function(cid){
    this.users = [];
    for (var i = 0 ; i < GCODE.ROOM.USER_MAX ; ++ i){
        this.users.push(new GUser(i));
    }
    this.channel = null;
    this.cid = cid;
    this.door = GCODE.ROOM.G_ROOM_OPEN;
    this.state = GCODE.GAME.STAT_RESET;
    this.tid = null;
    this.usr_cnt = 0;
    this.groups = {};

    this.randRoles();
};

GRoom.prototype.instance = function(app){
    if (!this.channel){
        var channelService = app.get('channelService');
        this.channel = channelService.getChannel(this.cid, true);
    }
    return this;
};

GRoom.prototype.isOpen = function(){
    return (this.door == GCODE.ROOM.G_ROOM_OPEN);
};

GRoom.prototype.getUserCount = function(){
    return this.usr_cnt;
};

GRoom.prototype.masterUser = function(){
    var master = false;

    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        if (!!user.uid && user.master){
            master = true;
            break;
        }
    }

    if (!master){
        for (var i = 0 , len = users.length ; i < len ; ++ i){
            var user = users[i];
            if (!!user.uid && !user.master){
                user.master = true;
                break;
            }
        }
    }

};

GRoom.prototype.addUser = function(uid,sid,cb){
    this.channel.add(uid,sid);
    var users = this.users;
    var user_get;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        if (!user.uid){
            user.init(uid);
            user_get = user;
            this.usr_cnt ++;
            break;
        }
    }

    this.masterUser();

    cb(null,this.cid,this.users,user_get);

    var param = {
        route: 'onUserEnter',
        users: users,
        user: user_get,
        cid:this.cid
    };
    this.pushMessage(param);

    if (this.getUserCount()>=GCODE.ROOM.USER_MAX){
        this.door = GCODE.ROOM.G_ROOM_FULL;
    }

    return user_get;
};

GRoom.prototype.delUser = function(uid,sid){

    this.channel.leave(uid,sid);
    var user = this.getUser(uid);
    if (!!user){
        user.fini();

        this.usr_cnt --;
    }

    this.masterUser();

    var users = this.users;
    var param = {
        route: 'onUserExit',
        users: users,
        uid: uid,
        channel:this.cid
    };
    this.pushMessage(param);

    // 这是小型房间的设定。
    if (this.getUserCount()==0){
        this.stopGame();
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

GRoom.prototype.setCursor = function(uid,tid){
    var result = false;
    switch(this.state){
        case GCODE.GAME.STAT_RESET:
            break;
        case GCODE.GAME.STAT_NIGHT:
        {
            var user = this.getUser(uid);
            if (user.rtype==GCODE.RTYPE.ROLE_KILLER ||
                user.rtype==GCODE.RTYPE.ROLE_POLICE){

                user.tid = tid;
//                console.log('GRoom.prototype.setCursor !!!!!');
//                console.log(this.groups[user.rtype]);
                this.pushMessageByUids('onUserCursor',
                    {user:user,fid:user.idx,tid:tid},
                    this.groups[user.rtype]);

                result = true;
            }
        }
            break;
        case GCODE.GAME.STAT_FIGHT:
        {
            var user = this.getUser(uid);
            user.tid = tid;
            var param = {
                route: 'onUserCursor',
                user:user,
                fid:user.idx,
                tid:tid
            };
            this.pushMessage(param);

            result = true;
        }
            break;
        default:
            break;
    }

    return result;
}

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
            sdata.push({uid:usr.uid,dis:this.getUserData(usr.uid,key)});
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

GRoom.prototype.pushMessageByUids = function(route, msg, uids, opts, cb) {
    var channelService = this.channel.__channelService__;
    channelService.pushMessageByUids(route,msg,uids,opts,cb);
};

GRoom.prototype.setReady = function(uid,ready) {
    var result = ready;
    var user = this.getUser(uid);
    if (!!user){
        if (user.master && ready){
            if (this.getUserCount() >= GCODE.ROOM.USER_MIN){

                var ready_cnt = 1;
                var users = this.users;
                for (var i = 0 , len = users.length ; i < len ; ++ i) {
                    var usr = users[i];
                    if (!!usr && !usr.master && usr.ready){
                        ready_cnt ++;
                    }
                }
                console.log("ready:%d",ready_cnt);
                if (ready_cnt >= GCODE.ROOM.USER_MIN){
                    user.ready = ready;

                    var param = {
                        route: 'onUserReady',
                        user: user,
                        ready:ready
                    };
                    this.pushMessage(param);

                    this.startGame();
                }else{
                    // 人数够但准备不够。
                    result = false;
                }
            }else{
                // 人数不够。
                result = false;
            }
        }else{
            user.ready = ready;

            var param = {
                route: 'onUserReady',
                user: user,
                ready:ready
            };
            this.pushMessage(param);
        }

    }

    return result;
};

GRoom.prototype.randRoles = function() {
    var users = this.users;
    var ins = [];
    var rnd = [];
    for (var i = 0,len = 32 ; i < len ; ++ i)
    {
        ins[i] = i;
        rnd[i] = Math.random();
    }

    for (var i = 0 ; i < 16 ; ++ i)
    {
        for (var j = 0 ; j < i ; ++ j)
        {
            if (rnd[i] > rnd[j])
            {
                var rd = rnd[i];
                rnd[i] = rnd[j];
                rnd[j] = rd;

                var is = ins[i];
                ins[i] = ins[j];
                ins[j] = is;
            }
        }
    }

    for (var i = 0,len = users.length ; i < len ; ++ i)
    {
        var usr = users[i];
        usr.ins = ins[i];
    }

};

GRoom.prototype.randRTypes = function() {
    var users = this.users;
    for (var i = 0,len = users.length ; i < len ; ++ i)
    {
        var usr = users[i];
        if (!!usr.uid){
            usr.rtype = c_nRole_V1[i];
            usr.rand = Math.random();
        }
    }

    for (var i = 0,len = users.length ; i < len ; ++ i)
    {
        for (var j = 0 ; j < i ; ++ j)
        {
            var usrI = users[i];
            var usrJ = users[j];
            if (usrI.rand == 0.0 || usrJ.rand == 0.0){
                continue;
            }
            if (usrI.rand > usrJ.rand){
                var rtype = usrI.rtype;
                usrI.rtype = usrJ.rtype;
                usrJ.rtype = rtype;

                var rand = usrI.rand;
                usrI.rand = usrJ.rand;
                usrJ.rand = rand;
            }
        }
    }

    for (var key in this.groups){
        delete this.groups[key];
    }

    this.groups[GCODE.RTYPE.ROLE_ALL] = [];
    this.groups[GCODE.RTYPE.ROLE_CIVILIAN] = [];
    this.groups[GCODE.RTYPE.ROLE_POLICE] = [];
    this.groups[GCODE.RTYPE.ROLE_KILLER] = [];

    for (var i = 0,len = users.length ; i < len ; ++ i)
    {
        var usr = users[i];
        if (!!usr.uid){
            this.groups[GCODE.RTYPE.ROLE_ALL].push(this.channel.getMember(usr.uid));
            this.groups[usr.rtype].push(this.channel.getMember(usr.uid));
        }
    }

    console.log(this.groups);
};

GRoom.prototype.getMaxCountMember = function(array) {
    var count;
    var val;
    var counts = {};
    for (var i = 0,len = array.length; i < len ; ++ i){
        val = array[i];
        count = counts[val];
        if (count==null){
            counts[val] = 0;
        }else{
            counts[val] = count + 1;
        }
    }

    var max = 0;
    var result;
    for (var key in counts){
        count = counts[key];
        if (max < count){
            max = count;
            result = key;
        }
    }

    return result;
};

GRoom.prototype.getTarget = function(rtype) {
    var groups = this.groups[rtype];
    var tids = [];
    for (var i = 0,len = groups.length; i < len ; ++ i){
        var user = this.getUser(groups[i].uid);
        if (!!user && user.tid!=null){
            tids.push(user.tid);
        }
    }

    var tid = this.getMaxCountMember(tids);
    console.log('getTarget rtype:'+rtype+' -> '+tids+':'+tid);
    var user_get;
    if (!!tid){
        user_get = this.users[tid];
    }
    return user_get;
};

GRoom.prototype.doKillerTarget = function() {
    console.log('doKillerTarget');
    var target = this.getTarget(GCODE.RTYPE.ROLE_KILLER);
    if (!!target){
        target.enable = false;
        this.pushMessage('onUserUpdate',
            {event:GCODE.EVENT.FUNC_KILL,user:target});
    }

};

GRoom.prototype.doPoliceTarget = function() {
    console.log('doPoliceTarget');
    var target = this.getTarget(GCODE.RTYPE.ROLE_POLICE);
    if (!!target){
        this.pushMessageByUids('onUserUpdate',
            {event:GCODE.EVENT.FUNC_POLICE,user:target},
            this.groups[GCODE.RTYPE.ROLE_POLICE]);
    }
};

GRoom.prototype.doJudgeTarget = function() {
    console.log('doJudgeTarget');
    var target = this.getTarget(GCODE.RTYPE.ROLE_ALL);
    if (!!target){
        target.enable = false;
        this.pushMessage('onUserUpdate',
            {event:GCODE.EVENT.FUNC_FIGHT,user:target});
    }
};

GRoom.prototype.getRoleCount = function(rtype) {
    var count = 0;
    var users = this.users;
    for (var i = 0,len = users.length ; i < len ; ++ i)
    {
        var usr = users[i];
        if (!!usr.uid && usr.enable && usr.rtype==rtype){
            count ++;
        }
    }
    return count;
};

GRoom.prototype.hintResult = function() {
    var ret = 0;
    var killer_count = this.getRoleCount(GCODE.RTYPE.ROLE_KILLER);
    var police_count = this.getRoleCount(GCODE.RTYPE.ROLE_POLICE);
    var civizn_count = this.getRoleCount(GCODE.RTYPE.ROLE_CIVILIAN);
    if (killer_count == 0)
    {
        ret = 1;
    }
    if (police_count == 0 || civizn_count == 0)
    {
        ret = -1;
    }
    if (ret!=0){
        this.stopGame();
    }

    console.log('hintResult >> %d %d %d',killer_count,police_count,civizn_count);
};

GRoom.prototype.endGameState = function() {
    switch(this.state){
        case GCODE.GAME.STAT_RESET:
            break;
        case GCODE.GAME.STAT_NIGHT:
        {
            this.doKillerTarget();
            this.doPoliceTarget();
            this.hintResult();
        }
            break;
        case GCODE.GAME.STAT_FIGHT:
        {
            this.doJudgeTarget();
            this.hintResult();
        }
            break;
        default:
            break;
    }

    var users = this.users;
    for (var i = 0,len = users.length ; i < len ; ++ i)
    {
        var usr = users[i];
        console.log('usr tid '+i+':'+usr.tid);
        usr.tid = null;
    }
};

GRoom.prototype.onGameState = function(state) {

    this.endGameState();

    if (this.door!=GCODE.ROOM.G_ROOM_GAME){
        return;
    }

    this.state = state;
    var param = {
        route: 'onGameState',
        state: state
    };
    this.pushMessage(param);

    switch(state)
    {
        case GCODE.GAME.STAT_NIGHT:
            this.requireNextGameState(GCODE.GAME.STAT_FIGHT,15000);
            break;
        case GCODE.GAME.STAT_FIGHT:
            this.requireNextGameState(GCODE.GAME.STAT_NIGHT,15000);
            break;
        default :
            break;
    }
};

GRoom.prototype.requireNextGameState = function(state,time) {

    var self = this;
    if (time > 0){
        self.tid = setTimeout(
            function(){


                self.onGameState(state);

                self.tid = null;
            }
            ,time);
    }else{
        self.onGameState(state);
    }

};

GRoom.prototype.startGame = function() {

    var self = this;
    self.door = GCODE.ROOM.G_ROOM_GAME;

    self.randRTypes();

    self.pushMessageByUids('onGameStart',
        {users:self.users,rtype:GCODE.RTYPE.ROLE_CIVILIAN},
        this.groups[GCODE.RTYPE.ROLE_CIVILIAN]);
    self.pushMessageByUids('onGameStart',
        {users:self.users,rtype:GCODE.RTYPE.ROLE_POLICE},
        this.groups[GCODE.RTYPE.ROLE_POLICE]);
    self.pushMessageByUids('onGameStart',
        {users:self.users,rtype:GCODE.RTYPE.ROLE_KILLER},
        this.groups[GCODE.RTYPE.ROLE_KILLER]);

    this.state = GCODE.GAME.STAT_RESET;
    this.requireNextGameState(GCODE.GAME.STAT_NIGHT,0);

};

GRoom.prototype.stopGame = function() {
    console.log('stopGame');

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
//    this.door = GCODE.ROOM.G_ROOM_OPEN;

    if (this.getUserCount()>=GCODE.ROOM.USER_MAX){
        this.door = GCODE.ROOM.G_ROOM_FULL;
    }else{
        this.door = GCODE.ROOM.G_ROOM_OPEN;
    }

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

//module.exports = function(app) {
//    return new GGameHall(app);
//};

var GGameHall = function(app) {
    this.app = app;
    this.rooms = {};
    this.initRoomList();
};

module.exports = GGameHall;

// ------------
GGameHall.prototype.getRoomById = function(cid) {
    return this.rooms[cid];
};

GGameHall.prototype.initRoomList = function() {
    for (var i = 0 ; i < 9 ; ++ i){
        var cid = 'C' + i;
        this.rooms[cid] = new GRoom(cid);
    }
};

GGameHall.prototype.getRoomList = function() {
    console.log('GGameHall.prototype.getRoomList !!!');

    var rooms = this.rooms;
    var room;
    var list = [];
    for (var cid in rooms){
        room = rooms[cid];
        list.push({cid:cid});
    }
    return list;
};

GGameHall.prototype.getOpenRoom = function(cid) {
    var room_get;
    if (!!cid){
        var room = this.rooms[cid];
        if (!!room && room.isOpen()){
            room_get = room.instance(this.app);
        }
    }
    return room_get;
};

// ------------
/*
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

    return room_open;
};
*/