/**
 * Created by Administrator on 2014/4/11.
 * 备注事项：
 */
var GUtils = require('../utils/GUtils');
var GCODE = {
    ROOM: {
        USER_MIN:  8,
        USER_MAX:  16,

        G_ROOM_OPEN:    5001,
//        G_ROOM_FULL:   5002,
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
    },
    BUFF: {
        BUFFER_MURDER:  0x00010000,
        BUFFER_CHECK:   0x00020000
    }

};

// GCODE.RTYPE.
var c_nRole_V1 = [
    GCODE.RTYPE.ROLE_KILLER,GCODE.RTYPE.ROLE_POLICE,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,
    GCODE.RTYPE.ROLE_KILLER,GCODE.RTYPE.ROLE_POLICE,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,
    GCODE.RTYPE.ROLE_KILLER,GCODE.RTYPE.ROLE_POLICE,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_CIVILIAN,GCODE.RTYPE.ROLE_KILLER,
    GCODE.RTYPE.ROLE_POLICE];

var GUser = function(idx){
    this.idx = idx;
    this.reset();
};

GUser.prototype.init = function(uid){
    this.reset();

    this.enable = true;

    this.uid = uid;
    this.dat = {};

    this.ins=null;
    this.master=false;

    this.on_net=true;
};

GUser.prototype.fini = function(){
    this.reset();

    this.uid=null;

    this.ins=null;
    this.master=false;
    this.on_net=false;
};

GUser.prototype.reset = function(){

    this.tid=null;
    this.dat=null;
    this.ready=false;

    this.check=false;
    this.enable=false;
    this.lastws=false;
    this.rand=0.0;

    this.rtype=GCODE.RTYPE.ROLE_ALL;
};

GUser.prototype.offline = function(){

    this.on_net=false;
    this.master=false;
//    this.reset();
//
//    this.uid=null;
//
//    this.ins=null;
//    this.master=false;
};

GUser.prototype.endState = function(){
    this.tid=null;
};

GUser.prototype.finiGame = function(){

    if (this.on_net==false){
        this.fini();
    }else if (this.uid != null){
        this.enable = true;
        this.lastws = false;
    }
    this.tid=null;
    this.dat=null;
    this.ready=false;


};

GUser.prototype.initGame = function(){

    this.tid=null;
    this.dat=null;
    this.ready=false;

    this.check=false;
//    this.enable=true;
    this.rand=0.0;

    this.rtype=GCODE.RTYPE.ROLE_ALL;
};

GUser.prototype.toRType = function(rtype){
    var to_rtype = GCODE.RTYPE.ROLE_ALL;
    if (this.rtype==rtype){
        to_rtype = this.rtype;
    }
    if (GCODE.RTYPE.ROLE_POLICE==rtype && this.check){
        to_rtype = this.rtype;
    }
    if (rtype==GCODE.RTYPE.ROLE_CIVILIAN){
        to_rtype = GCODE.RTYPE.ROLE_ALL;
    }
    return to_rtype;
};

GUser.prototype.getByRType = function(rtype){

    var sdata = {idx:this.idx,uid:this.uid,
        rtype:this.toRType(rtype)};

    return sdata;
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
    this.player_cnt = 0;
    this.groups = {};

    this.hasDone = {};
//    this.randRoles();
};

GRoom.prototype.canInto = function(){
    var result = true;
    if (this.door == GCODE.ROOM.G_ROOM_GAME){
        result = false;
    }
    if (this.getUserCount() == GCODE.ROOM.USER_MAX){
        result = false;
    }
    return result;
};

GRoom.prototype.getUsersByRType = function(rtype){
    var sdata = [];
    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var usr = users[i];
//        sdata.push({idx:usr.idx,uid:usr.uid,rtype:usr.toRType(rtype)});
        sdata.push(usr.getByRType(rtype));
    }
    return sdata;
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

GRoom.prototype.isInGame = function(){
    return (this.door == GCODE.ROOM.G_ROOM_GAME);
};

GRoom.prototype.getUserCount = function(){
    return this.usr_cnt;
};

GRoom.prototype.getPlayerCount = function(){
    return this.player_cnt;
};

GRoom.prototype.masterUser = function(){
    var master = false;

    var users = this.users;
    // 查找房主
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var user = users[i];
        if (user.uid != null && user.on_net && user.master){
            master = true;
            break;
        }
    }

    if (!master){
        // 设定房主
        for (var i = 0 , len = users.length ; i < len ; ++ i){
            var user = users[i];
            if (user.uid != null && user.on_net && !user.master){
                user.master = true;
                user.ready = false;
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
        if (user.uid==null){
            user.init(uid);
            user.ins = this.randIns();
            user_get = user;
            this.usr_cnt ++;
            this.player_cnt ++;
            break;
        }
    }

    this.masterUser();

    var users_get = this.getUsers(false);

    cb(null,this.cid,users_get,user_get);

    var param = {
        route: 'onUserEnter',
        users: users_get,
        user: user_get,
        cid:this.cid
    };
    this.pushMessage(param);

//    if (this.getUserCount()>=GCODE.ROOM.USER_MAX){
//        this.door = GCODE.ROOM.G_ROOM_FULL;
//    }

    return user_get;
};

GRoom.prototype.initClient = function(uid){

    var user_get = this.getUser(uid);
    var users_get = this.getUsers(false);

    var param = {
        route: 'onUserEnter',
        users: users_get,
        user: user_get,
        cid:this.cid
    };
    this.pushMessage(param);
};

GRoom.prototype.delUser = function(uid,sid){

    if (this.isInGame()){

        this.channel.leave(uid,sid);
        var user = this.getUser(uid);
        if (!!user){
            user.offline();

            this.player_cnt --;
        }

        this.masterUser();

        var users_get = this.getUsers(false);
        var param = {
            route: 'onUserExit',
            users: users_get,
            uid: uid,
            channel:this.cid
        };
        this.pushMessage(param);

    }else{

        this.channel.leave(uid,sid);
        var user = this.getUser(uid);
        if (!!user){
            user.fini();
            this.usr_cnt --;
            this.player_cnt --;
        }

        this.masterUser();

        var users_get = this.getUsers(false);
        var param = {
            route: 'onUserExit',
            users: users_get,
            uid: uid,
            channel:this.cid
        };
        this.pushMessage(param);

    }


    // 这是小型房间的设定。
    if (this.getPlayerCount()==0 && this.isInGame()){
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

GRoom.prototype.getUsers = function(all){
    var sdata = [];
    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var usr = users[i];
        var item = {idx:usr.idx,uid:usr.uid,ins:usr.ins,
            master:usr.master,ready:usr.ready,enable:usr.enable,
            offline:!usr.on_net};
        if (usr.enable==false || all==true){
            item.rtype = usr.rtype;
        }
        sdata.push(item);
    }
    return sdata;
};

GRoom.prototype.tryTarget = function(rtype,tid){

    if (this.hintTarget(rtype)){
        this.hasDone[rtype] = true;
        // 发消息，可能是全体或职业
        if (rtype==GCODE.RTYPE.ROLE_KILLER){
            this.pushMessage('onUserTarget',
                {tid:tid,rtype:rtype,
                    buff:GCODE.BUFF.BUFFER_MURDER});
        }else if (rtype==GCODE.RTYPE.ROLE_POLICE){
            var user = this.users[tid];
            user.check = true;
            var check = (user.rtype == GCODE.RTYPE.ROLE_KILLER);
            this.pushMessageByUids('onUserTarget',
                {tid:tid,rtype:rtype,check:check,
                    buff:GCODE.BUFF.BUFFER_CHECK},
                this.groups[rtype]);
        }
    }

};

GRoom.prototype.calTargetNum = function(rtype){
    var result = [];
    var users = this.users;
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        result.push(0);
    }
    for (var i = 0 , len = users.length ; i < len ; ++ i){
        var usr = users[i];
        if (usr!=null && usr.enable &&
            (rtype==GCODE.RTYPE.ROLE_ALL || usr.rtype==rtype) &&
            usr.tid!=null){
            var tid = usr.tid;
            result[tid] ++;
        }
    }
    return result;
};

GRoom.prototype.setCursor = function(uid,tid){

    var result = false;
    var user = this.getUser(uid);
    var target = this.users[tid];
    if (user.enable==true && target.enable==true){

        switch(this.state){
            case GCODE.GAME.STAT_RESET:
                break;
            case GCODE.GAME.STAT_NIGHT:
            {

                var rtype = user.rtype;
                if (rtype==GCODE.RTYPE.ROLE_KILLER ||
                    rtype==GCODE.RTYPE.ROLE_POLICE){

                    // 警察不允许指自己人，但杀手可以杀自己。
                    var skip = false;
                    if (rtype==GCODE.RTYPE.ROLE_POLICE){
                        if (target.rtype==rtype){
                            skip = true;
                        }else if (target.check==true){
                            skip = true;
                        }
                    }

                    if (!skip && this.hasDone[rtype]==false){

                        if (user.tid==tid){
                            user.tid = null;
                        }else{
                            user.tid = tid;
                        }

                        this.pushMessageByUids('onUserCursor',
                            {user:user,fid:user.idx,
                                tid:user.tid,nums:this.calTargetNum(rtype)},
                            this.groups[rtype]);

                        result = true;

                        this.tryTarget(rtype,tid);

                    }
                }
            }
                break;
            case GCODE.GAME.STAT_FIGHT:
            {
                // 白天不允许指自己
                var skip = false;
                if (user.idx == tid){
                    skip = true;
                }

                if (!skip){

                    if (user.tid==tid){
                        user.tid = null;
                    }else{
                        user.tid = tid;
                    }

                    var param = {
                        route: 'onUserCursor',
                        user:user,
                        fid:user.idx,
                        tid:user.tid,
                        nums:this.calTargetNum(GCODE.RTYPE.ROLE_ALL)
                    };
                    this.pushMessage(param);

                    result = true;
                }

            }
                break;
            default:
                break;
        }
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
            if (this.getPlayerCount() >= GCODE.ROOM.USER_MIN){

                var ready_cnt = 1;
                var users = this.users;
                for (var i = 0 , len = users.length ; i < len ; ++ i) {
                    var usr = users[i];
                    if (!!usr && !usr.master && usr.ready){
                        ready_cnt ++;
                    }
                }
                console.log("ready:%d",ready_cnt);
                if (ready_cnt >= this.getPlayerCount()){
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

GRoom.prototype.randIns = function() {
    var inses = [];

    var users = this.users;
    for (var i = 0,len = users.length ; i < len ; ++ i){
        var usr = users[i];
        if (usr.ins != null){
            inses.push(usr.ins);
        }
    }


    var rnd = 0;

    do {
        rnd = GUtils.randInt(0,15);
        var find = false;
        for (var i = 0,len = inses.length ; i < len ; ++ i){
            if (rnd == inses[i]){
                find = true;
                break;
            }
        }
    }while(find);


    return rnd;
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
    var count = 0;
    for (var i = 0,len = users.length ; i < len ; ++ i)
    {
        var usr = users[i];
        if (usr.uid!=null){
            usr.rtype = c_nRole_V1[count];
            usr.rand = Math.random();
            count ++;
        }else{
            usr.rtype = GCODE.RTYPE.ROLE_ALL;
            usr.rand = 0.0;
        }
    }

    // fix.
    if (count == 11 || count == 15){

        var xcnt = 0;
        for (var i = 0,len = users.length ; i < len ; ++ i) {
            var usr = users[i];
            if (usr.uid != null) {
                xcnt ++;
                if (xcnt == 2){
                    usr.rtype = GCODE.RTYPE.ROLE_POLICE;
                }
            }
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

GRoom.prototype.getCountInArray = function(array,item) {
    var val;
    var count = 0;
    for (var i = 0,len = array.length; i < len ; ++ i){
        val = array[i];
        if (item==val){
            count = count + 1;
        }
    }
    return count;
};

GRoom.prototype.getMaxCountMember = function(array) {
    var count;
    var val;
    var counts = {};
    for (var i = 0,len = array.length; i < len ; ++ i){
        val = array[i];
        count = counts[val];
        if (count==null){
            counts[val] = 1;
        }else{
            counts[val] = count + 1;
        }
    }

    var max = 0;
    var result;
    var same = false;
    for (var key in counts){
        count = counts[key];
        if (max < count){
            max = count;
            result = key;
            same = false;
        }else if (max==count){
            same = true;
        }
    }

    return same?null:result;
};

GRoom.prototype.getTarget = function(rtype) {
    var groups = this.groups[rtype];
    var tids = [];
    for (var i = 0,len = groups.length; i < len ; ++ i){
        var user = this.getUser(groups[i].uid);
        if (user!=null && user.enable){
            if (user.tid!=null){
                tids.push(user.tid);
            }
        }
    }

    var tid = this.getMaxCountMember(tids);
    console.log('getTarget rtype:'+rtype+' -> '+tids+':'+tid);
    var user_get = null;
    if (!!tid){
        user_get = this.users[tid];
    }
    return user_get;
};

GRoom.prototype.hintTarget = function(rtype) {

    var groups = this.groups[rtype];
    var tids = [];

    var ucount = 0;
    for (var i = 0,len = groups.length; i < len ; ++ i){
        var user = this.getUser(groups[i].uid);
        if (user!=null && user.enable){
            if (user.on_net==true){
                ucount ++;
            }
            if (user.tid!=null){
                tids.push(user.tid);
            }
        }
    }

    var tid = this.getMaxCountMember(tids);

    var tcount = this.getCountInArray(tids,tid);

    var result = false;
    if (tcount * 2 > ucount){
        result = true;
    }

    return result;
};

GRoom.prototype.doKillerTarget = function() {
    console.log('doKillerTarget');
    var target = this.getTarget(GCODE.RTYPE.ROLE_KILLER);
    if (!!target){
        target.enable = false;
        target.lastws = true;
        this.pushMessage('onUserUpdate',
            {event:GCODE.EVENT.FUNC_KILL,
                user:target.getByRType(GCODE.RTYPE.ROLE_KILLER)});
    }
};
// 在过程中已确认，无需结束确认。
GRoom.prototype.doPoliceTarget = function() {
    console.log('doPoliceTarget');
    var rtype = GCODE.RTYPE.ROLE_POLICE;

    if (this.hasDone[rtype]==false){
        var target = this.getTarget(rtype);
        if (!!target){
            target.check = true;
            var check = (target.rtype == GCODE.RTYPE.ROLE_KILLER);
            this.pushMessageByUids('onUserTarget',
                {tid:target.idx,rtype:rtype,check:check,
                    buff:GCODE.BUFF.BUFFER_CHECK},
                this.groups[rtype]);

        }
        /*
        var target = this.getTarget(GCODE.RTYPE.ROLE_POLICE);
        if (!!target){
            target.check = true;
            this.pushMessageByUids('onUserUpdate',
                {event:GCODE.EVENT.FUNC_POLICE,
                    user:target.getByRType(GCODE.RTYPE.ROLE_POLICE)},
                this.groups[GCODE.RTYPE.ROLE_POLICE]);
        }
        */
    }

};

GRoom.prototype.doJudgeTarget = function() {
    console.log('doJudgeTarget');
    var target = this.getTarget(GCODE.RTYPE.ROLE_ALL);
    if (!!target){
        target.enable = false;
        this.pushMessage('onUserUpdate',
            {event:GCODE.EVENT.FUNC_FIGHT,
                user:target.getByRType(GCODE.RTYPE.ROLE_ALL)});
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

GRoom.prototype.getResult = function() {

    var result;

    var killer_count = this.getRoleCount(GCODE.RTYPE.ROLE_KILLER);
    var police_count = this.getRoleCount(GCODE.RTYPE.ROLE_POLICE);
    var civizn_count = this.getRoleCount(GCODE.RTYPE.ROLE_CIVILIAN);

    result = [civizn_count,police_count,killer_count];

    return result;
};

GRoom.prototype.hintResult = function() {

    var result = this.getResult();

    var ret = 0;

    var killer_count = result[2];
    var police_count = result[1];
    var civizn_count = result[0];
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

//    console.log('hintResult >> %d %d %d',killer_count,police_count,civizn_count);
//    result = [civizn_count,police_count,killer_count];

//    return result;
};

GRoom.prototype.endGameState = function() {
//    var result = this.getResult();
    console.log('endGameState ... ');
    switch(this.state){
//        case GCODE.GAME.STAT_RESET:
//            break;
        case GCODE.GAME.STAT_NIGHT:
        {
            this.doPoliceTarget();
            this.doKillerTarget();
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
        usr.endState();
    }
    this.hasDone[GCODE.RTYPE.ROLE_POLICE] = false;
    this.hasDone[GCODE.RTYPE.ROLE_KILLER] = false;
//    return result;
};

GRoom.prototype.onGameState = function(state) {

    this.endGameState();

    if (this.door!=GCODE.ROOM.G_ROOM_GAME){
        return;
    }

    var time = 30;
    switch(state)
    {
        case GCODE.GAME.STAT_NIGHT:
            this.requireNextGameState(GCODE.GAME.STAT_FIGHT,time*1000);
            break;
        case GCODE.GAME.STAT_FIGHT:
            this.requireNextGameState(GCODE.GAME.STAT_NIGHT,time*1000);
            break;
        default :
            break;
    }

    var result = this.getResult();

    this.state = state;
    var param = {
        route: 'onGameState',
        state: state,
        time: time,
        users: this.getUsers(false),
        result: result
    };
    this.pushMessage(param);

    console.log('onGameState ... ');
};

GRoom.prototype.requireNextGameState = function(state,time) {

    var self = this;
    if (time > 0){
        self.tid = setTimeout(
            function(){
                self.tid = null;
                self.onGameState(state);
            }
            ,time);
    }else{
        self.onGameState(state);
    }

};

GRoom.prototype.startGame = function() {

    var self = this;

    self.door = GCODE.ROOM.G_ROOM_GAME;

    var users = this.users;
    for (var i = 0,len = users.length ; i < len ; ++ i)
    {
        var usr = users[i];
        usr.initGame();
    }

    self.randRTypes();

    self.pushMessageByUids('onGameStart',
        {users:self.getUsersByRType(GCODE.RTYPE.ROLE_CIVILIAN),
            rtype:GCODE.RTYPE.ROLE_CIVILIAN},
        this.groups[GCODE.RTYPE.ROLE_CIVILIAN]);
    self.pushMessageByUids('onGameStart',
        {users:self.getUsersByRType(GCODE.RTYPE.ROLE_POLICE),
            rtype:GCODE.RTYPE.ROLE_POLICE},
        this.groups[GCODE.RTYPE.ROLE_POLICE]);
    self.pushMessageByUids('onGameStart',
        {users:self.getUsersByRType(GCODE.RTYPE.ROLE_KILLER),
            rtype:GCODE.RTYPE.ROLE_KILLER},
        this.groups[GCODE.RTYPE.ROLE_KILLER]);

    this.state = GCODE.GAME.STAT_RESET;
    this.requireNextGameState(GCODE.GAME.STAT_NIGHT,0);

};

GRoom.prototype.stopGame = function() {
    console.log('stopGame');

    this.state = GCODE.GAME.STAT_RESET;

    var result = this.getResult();

    var param = {
        route: 'onGameStop',
        users:this.getUsers(true),
        result: result
    };
    this.pushMessage(param);

    var users = this.users;
    for (var i = 0,len = users.length ; i < len ; ++ i)
    {
        var usr = users[i];
        usr.finiGame();
    }
    this.usr_cnt = this.player_cnt;


    if (this.tid!=null){
        clearTimeout(this.tid);
        this.tid = null;
    }

    // 小型房间的设定是：停止游戏后，直到所有玩家退出前，不会再开放。
//    this.door = GCODE.ROOM.G_ROOM_OPEN;

    if (this.getUserCount()>=GCODE.ROOM.USER_MAX){
//        this.door = GCODE.ROOM.G_ROOM_FULL;
    }else{
        this.door = GCODE.ROOM.G_ROOM_OPEN;
    }

};

GRoom.prototype.setChat = function(uid,chat) {

    var user = this.getUser(uid);

    if (user != null && this.state==GCODE.GAME.STAT_RESET){

        var param = {
            route: 'onUserChat',
            user: user,
            chat: chat,
            last: false
        };
        this.pushMessage(param);

        return;
    }

    if (user != null && user.enable){

        switch(this.state)
        {
            case GCODE.GAME.STAT_NIGHT:
            {
                var rtype = user.rtype;
                if (rtype==GCODE.RTYPE.ROLE_POLICE ||
                    rtype==GCODE.RTYPE.ROLE_KILLER){

                    this.pushMessageByUids('onUserChat',
                        {user:user,chat: chat},
                        this.groups[rtype]);

                }
            }
                break;
            case GCODE.GAME.STAT_FIGHT:
            {
                var param = {
                    route: 'onUserChat',
                    user: user,
                    chat: chat,
                    last: false
                };
                this.pushMessage(param);
            }
                break;
            default :
                break;
        }

        return;
    }

    if (user != null && !user.enable && user.lastws){

        user.lastws = false;

        var param = {
            route: 'onUserChat',
            user: user,
            chat: chat,
            last: true
        };
        this.pushMessage(param);

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
        list.push({cid:cid,door:room.door,
            count:room.getUserCount(),total:GCODE.ROOM.USER_MAX,
            canin:room.canInto()});
    }
    return list;
};

GGameHall.prototype.getOpenRoom = function(cid) {
    var room_get;
    if (!!cid){
        var room = this.rooms[cid];
        if (!!room && room.canInto()){
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