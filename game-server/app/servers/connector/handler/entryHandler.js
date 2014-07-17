var GMySQL = require('../../../services/mysql/GMySQL');
var GUtils = require('../../../services/utils/GUtils');
var GError = require('../../../services/utils/GError');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

Handler.prototype.entry = function(msg, session, next) {
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

    if (!usr || !pwd || !sex || !nick){
        next(null, {code: 500,eid: 401});
        return;
    }

    var self = this;

    var SQLInsertUser = function()
    {
        var sql = 'INSERT INTO user (name, password,nick,sex) VALUES (\''+usr+'\', \''+pwd+'\',\''+nick+'\','+sex+')';
        mysql.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                self.login(msg,session,next);

                mysql.conn.end();
            });
    };

    var SQLFindUser = function()
    {
        var sql = 'SELECT * FROM user WHERE name=\''+usr+'\' AND password=\''+pwd+'\'';
        mysql.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    next(null, {code: 500,eid: 601,msg: 'Register Failed��'});
                    mysql.conn.end();
                }else{
                    SQLInsertUser();
                }
            }
        );
    };

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

    if (!usr || !pwd || !gid){
        next(null, {code: 500});
        return;
    }

    var SQLLoginUser = function()
    {
        mysql.conn.query('SELECT * FROM user LEFT JOIN '+gid+' ON user.id='+gid+'.uid WHERE name=\''+usr+'\' AND password=\''+pwd+'\' LIMIT 0,30',
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){

                    var uid = rows[0]['uid'];
                    var info = rows[0];

                    delete info.id;
                    delete info.password;

                    self.dologin(uid,info,msg,session,next);

                }else{
                    next(null, {code: 500,msg: 'Login Failed��'});
                }

                mysql.conn.end();
            });
    };

    mysql.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            mysql.conn.end();
            return;
        }
        console.log('Connected to MySQL');
        SQLLoginUser();
    });

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
