var GMySQL = require('../../../services/mysql/GMySQL');
var GUtils = require('../../../services/utils/GUtils');
var GError = require('../../../services/utils/GError');
var GHttp = require('../../../services/http/GHttp');

var querystring = require('querystring');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

Handler.prototype.entry = function(msg, session, next) {
//    var data = 'transdata={"userid":"2049653523","username":"GamePans"}&sign=20e529266ca5e660b980e538f1073a21';
//    var msg = querystring.parse(data);
//    var trans =  eval("(" + msg.transdata + ")");
//    console.log(trans);
    next(null, {code: 200, err: GError.New(this.app,1000)});
};

// ---------------------------------------------------- //
Handler.prototype.dologin = function(uid, info, msg, session, next){

    var self = this;

    var gid = msg.gid;

    var rpc = self.app.rpc[gid];
    if (!!rpc){

        var uuid = GUtils.MD5(msg.usr);
        console.log(uuid);

        var sessionService = self.app.get('sessionService');
        if( !! sessionService.getByUid(uuid)) {
            sessionService.kick(uuid, 'kick', null);
        }

        session.bind(uuid,null);
        session.on('closed', onUserLogout.bind(null, self.app));

        rpc.gameRemote.cfg(session,function(err,cfg){

            session.set('gid', gid);
            session.push('gid', function(err) {
                if(err) {
                    console.error('set gid failed! error: %j', err.stack);
                }
            });

            session.set('uid', uid);
            session.push('uid', function(err) {
                if(err) {
                    console.error('set uid failed! error: %j', err.stack);
                }
            });

            session.set('typ', 'hall');
            session.push('typ', function(err) {
                if(err) {
                    console.error('set typ failed! error: %j', err.stack);
                }
            });

            next(null, {code: 200,uuid:uuid,uid: uid,config:cfg,info:info});
        });
    }else{
        next(null, {code: 500,result: 0});
    }

};

Handler.prototype.register = function(msg, session, next) {

    if (!!session.uid){
        next(null, {code: 500,eid:402,result: 0});
        return;
    }

    var mysql = new GMySQL();

    var usr = msg.usr;
    var pwd = msg.pwd;
    var sex = msg.sex;
    var nick = msg.nick;

    console.log('register:'+usr+'/'+pwd+'/'+sex+'/'+nick);

    if (!usr || !pwd || sex==null || !nick){
        next(null, {code: 500,eid: 401});
        return;
    }

    var self = this;

    var SQLInsertUser = function()
    {
        var sql = 'INSERT INTO user (name, password,nick,sex,uuid) VALUES (\''+usr+'\', \''+pwd+'\',\''+nick+'\','+sex+',\'empty\')';

        mysql.Query(sql,function(rows){

            self.login(msg,session,next);
            mysql.End();

        });

        /*
        mysql.conn.query(sql,
            function(err, rows, fields) {
                if (err.errno != 'ECONNRESET') {
                    throw err;
                } else {
                    // do nothing
                }


                self.login(msg,session,next);

                mysql.conn.end();
        });
        */

    };

    var SQLFindUser = function()
    {
        var sql = 'SELECT * FROM user WHERE name=\''+usr+'\'';

        mysql.Query(sql,function(rows){

            if (rows.length==1){
                next(null, {code: 500,eid: 601,msg: 'Register Failed��'});
                mysql.End();
            }else{
                SQLInsertUser();
            }

        });

        /*
        mysql.conn.query(sql,
            function(err, rows, fields) {
                if (err.errno != 'ECONNRESET') {
                    throw err;
                } else {
                    // do nothing
                }

                if (rows.length==1){
                    next(null, {code: 500,eid: 601,msg: 'Register Failed��'});
                    mysql.conn.end();
                }else{
                    SQLInsertUser();
                }
            }
        );
        */
    };

    mysql.Connect(SQLFindUser,next);

    /*
    mysql.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            mysql.conn.end();
            next(null, {code: 500,eid: 501,msg: 'Register Failed��'});
            return;
        }
        console.log('Connected to MySQL');

        SQLFindUser();
    });
    */
};

Handler.prototype.login = function(msg, session, next) {

    if (!!session.uid){
        next(null, {code: 500,result: 0});
        return;
    }

    var self = this;

    var mysql = new GMySQL();

    var usr = msg.usr;
    var pwd = msg.pwd;
    var gid = msg.gid;
    var plat = msg.plat;

    var verify = true;

    if (plat == 'baidu')
    {
        verify = false;
    }

    if (gid=='escape' || gid=='killer'){
        pwd = 'password';
        verify = false;
    }else{

    }

    if (!usr || !pwd || !gid){
        next(null, {code: 500});
        return;
    }

    var SQLLoginUser = function()
    {

        var sql = 'SELECT user.id as uid,user.name,user.nick,user.sex,'+gid+'.gold,'+gid+'.exp FROM user LEFT JOIN '+gid
            +' ON user.id='+gid+'.uid WHERE name=\''+usr+'\' AND password=\''+pwd+'\' LIMIT 0,30';

        mysql.Query(sql,function(rows){

            if (rows.length>=1){

                var uid = rows[0]['uid'];
                var info = rows[0];

                console.log(info);

                self.dologin(uid,info,msg,session,next);
            }else if (!verify){
                msg.sex = 1;
                msg.nick = msg.usr;
                msg.pwd = 'password';
                self.register(msg, session, next);
            }else{

                next(null, {code: 500,msg: 'Login Failed'});
            }

            mysql.End();

        });

        /*
        mysql.conn.query(sql,
            function(err, rows, fields) {
                if (err.errno != 'ECONNRESET') {
                    throw err;
                } else {
                    // do nothing
                }

                if (rows.length>=1){

                    var uid = rows[0]['uid'];
                    var info = rows[0];

                    console.log(info);

//                    delete info.uuid;
//                    delete info.password;

                    self.dologin(uid,info,msg,session,next);
                }else if (!verify){
                    msg.sex = 0;
                    msg.nick = 'nick';
                    msg.pwd = 'password';
                    self.register(msg, session, next);
//                    self.dologin(uid,info,msg,session,next);
//                    next(null, {code: 500,msg: 'Login ! verify Failed'});
                }else{

                    next(null, {code: 500,msg: 'Login Failed'});
                }

                mysql.conn.end();
            });
        */

    };

    mysql.Connect(SQLLoginUser,next);

    /*
    mysql.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            mysql.conn.end();
            return;
        }
        console.log('Connected to MySQL');
        SQLLoginUser();
    });
    */
};

Handler.prototype.logout = function(msg, session, next) {

    if (!!session.uid && session.get('typ')=='hall'){

        var self = this;
        var sessionService = self.app.get('sessionService');

        next(null, {code: 200, msg: 'logout OK.'});

        sessionService.kick(session.uid, 'kick', null);

    }else{
        next(null, {code: 500,result: 0});
    }

};

var onUserLogout = function(app, session) {

    if(!session || !session.uid) {
        return;
    }

};

Handler.prototype.pay = function(msg, session, next) {

    var usr = msg.usr;
    var pwd = msg.pwd;
    var val = msg.val;
    if (!usr || !pwd || !val){
        next(null, {code: 500});
        return;
    }

    var mysql = new GMySQL();

    mysql.pay(msg,next);

};

Handler.prototype.list = function(msg, session, next) {

    var self = this;
    var gid = msg.gid;

    var rpc = self.app.rpc[gid];
    if (!!rpc){
        rpc.gameRemote.list(session,function(err,rooms){
            next(null, {code: 200,result: 0,rooms:rooms});
        });
    }else{
        next(null, {code: 500,result: 0});
    }

};

Handler.prototype.getinfo = function(msg, session, next) {

    var uid = msg.uid;
    var gid = session.get('gid');

    if (!uid || !gid){
        next(null, {code: 500});
        return;
    }

    console.log('uid:'+uid+ ' and gid:'+gid);

    var mysql = new GMySQL();
    mysql.info({uid:uid,gid:gid},next);
};

Handler.prototype.setScore = function(msg, session, next) {

    var gid = session.get('gid');
    var uid = session.get('uid');

    var score = msg.score;

    if (!uid || !gid){
        next(null, {code: 500});
        return;
    }

    var mysql = new GMySQL();
    mysql.setScore({uid:uid,gid:gid,score:score},next);
};

Handler.prototype.getTops = function(msg, session, next) {

    var gid = session.get('gid');
    var uid = session.get('uid');

    if (!uid || !gid){
        next(null, {code: 500});
        return;
    }

    var mysql = new GMySQL();
    mysql.getTops({uid:uid,gid:gid},next);
};

Handler.prototype.enter = function(msg, session, next) {

    if (!!session.uid && session.get('typ')!='game'){
        next(null, {code: 500});
        return;
    }

    var self = this;

    var uuid = msg.uuid;
    var uid = 0;
//    var usr = msg.usr;
    var gid = msg.gid;  // 游戏ID，请传入crossword
    var xcid = msg.cid;  // 频道ID，自动匹配的不用传。

    if (!uuid || !gid){
        next(null, {code: 500});
        return;
    }

    var sessionService = self.app.get('sessionService');

    // 如果不想检查登录，请注释掉这一段。
    if (gid=='escape' || gid=='killer'){
        uid = msg.uuid;
    }else{
        var sessions_login = sessionService.getByUid(uuid);
        if( !! sessions_login && sessions_login.length==1) {
            uid = sessions_login[0].get('uid');
        }else{
            next(null, {code: 500});
            return;
        }
    }

    var rpc = self.app.rpc[gid];

    if (!!rpc){

        // 游戏不会检查重复登录...
        // 检查重复登录.
        if(session.uid==null && !! sessionService.getByUid(uid)) {
            sessionService.kick(uid, 'kick', null);
        }

        var is_new = (!!session.uid)?false:true;
        if (is_new) {
            // do session config.
            session.bind(uid,null);
            session.on('closed', onUserLeave.bind(null, self.app));
        }

        // 已经坐下了，将不能再次坐下。
        if (!!session.get('cid')){
            next(null, {code: 500});
            return;
        }

        // add channel for session.
        rpc.gameRemote.add(session,
            uid, self.app.get('serverId'),xcid,
            function(err,cid,users,user){
                if(err){
                    console.log(err);
                    next(null, {code: 500});
                    return;
                }

                if (is_new) {
                    // set session settings.
                    session.set('gid', gid);
                    session.push('gid', function(err) {
                        if(err) {
                            console.error('set gid failed! error: %j', err.stack);
                        }
                    });

                    session.set('uid', uid);
                    session.push('uid', function(err) {
                        if(err) {
                            console.error('set id failed! error: %j', err.stack);
                        }
                    });

                    session.set('typ', 'game');
                    session.push('typ', function(err) {
                        if(err) {
                            console.error('set typ failed! error: %j', err.stack);
                        }
                    });
                }

                session.set('cid', cid);
                session.push('cid', function(err) {
                    if(err) {
                        console.error('set cid failed! error: %j', err.stack);
                    }
                });

                next(null, {code: 200,users:users,user:user,cid:cid});
            });

    }else{
        next(null, {code: 500});
//        sessionService.kick(usr, 'kick', null);
    }

};

Handler.prototype.exit = function(msg, session, next) {

    if (!!session.uid && session.get('typ')!='game'){
        next(null, {code: 500});
        return;
    }

    if (!session.uid || !session.get('gid')){
        next(null, {code: 500});
        return;
    }

    var self = this;
    var rpc = self.app.rpc[session.get('gid')];
    if (!!rpc){
        rpc.gameRemote.kick(session,
            session.uid, self.app.get('serverId'), session.get('cid'),
            function(err){

                session.set('cid', null);
                session.push('cid', function(err) {
                    if(err) {
                        console.error('set cid failed! error: %j', err.stack);
                    }
                });

            });
    }

    next(null, {code: 200});
};

var onUserLeave = function(app, session) {

    if(!session || !session.uid || !session.get('gid')) {
        return;
    }

//    console.log(session);

    var rpc = app.rpc[session.get('gid')];
    if (!!rpc){
        rpc.gameRemote.kick(session,
            session.uid, app.get('serverId'), session.get('cid'),
            function(err){

//                session.set('cid', null);
//                session.push('cid', function(err) {
//                    if(err) {
//                        console.error('set cid failed! error: %j', err.stack);
//                    }
//                });

            });
    }

};

Handler.prototype.loginThird = function(msg, session, next) {
    console.log("loginThird~~~~~~~~");
    this.loginBaidu(msg, session, next);
};
/*


 { transdata: '{"exorderno":"1411295926049",
                 "transid":"06514092118384853651",
                 "waresid":1,
                 "appid":"1137915",
                 "feetype":0,
                 "money":1,
                 "count":1,
                 "result":0,
                 "transtype":0,
                 "transtime":"2014-09-21 18:45:22",
                 "cpprivate":"gamepans",
                 "paytype":5}',
 sign: '253b742ec7a41b987d48b2551772b403' }

 工蚁 2014/9/21 18:48:43
  REBOAK: transdata={"userid":"2049653523","username":"GamePans"}&sign=20e529266ca5e660b980e538f1073a21

*/


Handler.prototype.loginBaidu = function(msg, session, next) {

    var self = this;

    var appid = msg.appid;
    var appkey = msg.appkey;
    var token = msg.token;
    var plat = msg.plat;

    console.log("appid " + appid + "   " + appkey + "   " + token + "   " + plat);

    if (!appid || !appkey || !token){
        next(null, {code: 500});
        return;
    }

    var host = "gameopen.baidu.com";
    var port = 80;
    var path = "/index.php";

    var transdata = "{'appid':'" + appid + "','code':'" + token + "'}";
    var sign = GUtils.MD5(transdata + appkey);

    var myData = "r=FromIapppayToUserAction&m=domethod2&transdata=" + transdata + "&sign=" + sign;
    console.log("myData is " + myData);

    GHttp.postDataToServer(host, port, path, myData,
        function(err,data){
            if(err){
                console.log(err);
                next(null, {code: 500});
                return;
            }

            //transdata={"userid":"2049653523","username":"GamePans"}&sign=20e529266ca5e660b980e538f1073a21
            var msg = querystring.parse(data);
            var trans =  eval("(" + msg.transdata + ")");
            console.log("i am here~~~~~~~~");
            self.login({usr:trans.username,pwd:'password',gid:'crossword',plat:'baidu'},session,next);
        });
//    next(null, {code: 200});
};

Handler.prototype.vertifyPayBaidu = function(msg, session, next) {

//    var self = this;

    var appid = msg.appid;
    var orderno = msg.orderno;
    var appkey = msg.appkey;

//    var token = msg.token;
//    var plat = msg.plat;

//    console.log("appid " + appid + "   " + appkey + "   " + token + "   " + plat);

    if (!appid || !appkey || !orderno){
        next(null, {code: 500});
        return;
    }

    var host = "gameopen.baidu.com";
    var port = 80;
    var path = "/index.php";

    var transdata = "{'appid':'" + appid + "','exorderno':'" + orderno + "'}";

    var sign = GUtils.MD5(transdata + appkey);

    var myData = "r=FromIapppayToUserAction&transdata=" + transdata + "&sign=" + sign;
    console.log("myData is " + myData);

    GHttp.postDataToServer(host, port, path, myData,
        function(err,data){
            if(err){
                console.log(err);
                next(null, {code: 500});
                return;
            }

            //transdata={"userid":"2049653523","username":"GamePans"}&sign=20e529266ca5e660b980e538f1073a21


            var msg = querystring.parse(data);
            var trans =  eval("(" + msg.transdata + ")");

            next(null, {code: 200,transdata:trans});

//            self.login({usr:trans.username,pwd:'password',gid:'crossword',plat:'baidu'},session,next);


        });
//    next(null, {code: 200});
};

