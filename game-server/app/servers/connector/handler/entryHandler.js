var GMySQL = require('../../../services/mysql/GMySQL');
var GUtils = require('../../../services/utils/GUtils');


module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

// ---------------------------------------------------- //
Handler.prototype.dologin = function(msg, session, next){

    var self = this;

    var mid = GUtils.MD5(msg.usr);
    console.log(mid);
    session.bind(mid,null);
    session.on('closed', onUserLogout.bind(null, self.app));

    next(null, {code: 200,uid: mid});

};

Handler.prototype.register = function(msg, session, next) {

    var conn = GMySQL();

    var usr = msg.usr;
    var pwd = msg.pwd;

    if (!usr || !pwd){
        next(null, {code: 500});
        return;
    }

    var self = this;

    var SQLInsertUser = function()
    {
        var sql = 'INSERT INTO user (name, password) VALUES (\''+usr+'\', \''+pwd+'\')';
        conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                self.dologin({usr:usr},session,next);

                conn.end();
            });
    };

    var SQLFindUser = function()
    {
        var sql = 'SELECT * FROM user WHERE name=\''+usr+'\' AND password=\''+pwd+'\'';
        conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    next(null, {code: 500,msg: 'Register Failed��'});
                    conn.end();
                }else{
                    SQLInsertUser();
                }
            }
        );
    };

    conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLFindUser();
    });

};

Handler.prototype.login = function(msg, session, next) {

    var self = this;

    var conn = GMySQL();

    var usr = msg.usr;
    var pwd = msg.pwd;

    if (!usr || !pwd){
        next(null, {code: 500});
        return;
    }



    var SQLLoginUser = function()
    {
        conn.query('SELECT * FROM user WHERE name=\''+usr+'\' AND password=\''+pwd+'\'',
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){

                    self.dologin({usr:usr},session,next);

                }else{
                    next(null, {code: 500,msg: 'Login Failed��'});
                }

                conn.end();
            });
    };

    conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            conn.end();
            return;
        }
        console.log('Connected to MySQL');
        SQLLoginUser();
    });

};

Handler.prototype.logout = function(msg, session, next) {

    var self = this;
    var sessionService = self.app.get('sessionService');

    next(null, {code: 200, msg: 'logout OK.'});

    sessionService.kick(session.uid, 'kick', null);
};

var onUserLogout = function(app, session) {

    if(!session || !session.uid) {
        return;
    }

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

Handler.prototype.enter = function(msg, session, next) {

    var self = this;

    var xuid = msg.uid;
    var uid = msg.usr;
    var gid = msg.gid;  // 游戏ID，请传入crossword
    var xcid = msg.cid;  // 频道ID，自动匹配的不用传。

    if (!xuid || !uid || !gid){
        next(null, {code: 500});
        return;
    }

    var sessionService = self.app.get('sessionService');
/*
    // 如果不想检查登录，请注释掉这一段。
    if( ! sessionService.getByUid(xuid)) {
        next(null, {code: 500});
        return;
    }
*/
    // 检查重复登录.
    if( !! sessionService.getByUid(uid)) {
        sessionService.kick(uid, 'kick', null);
    }

    var rpc = self.app.rpc[gid];

    if (!!rpc){
        // do session config.
        session.bind(uid,null);
        session.on('closed', onUserLeave.bind(null, self.app));

        // add channel for session.
        rpc.gameRemote.add(session,
            uid, self.app.get('serverId'),xcid,
            function(err,cid,users){
                if(err){
                    console.log(err);
                    next(null, {code: 500});
                    return;
                }
                // set session settings.
                session.set('cid', cid);
                session.push('cid', function(err) {
                    if(err) {
                        console.error('set cid failed! error: %j', err.stack);
                    }
                });

                session.set('gid', gid);
                session.push('gid', function(err) {
                    if(err) {
                        console.error('set gid failed! error: %j', err.stack);
                    }
                });
                next(null, {code: 200,users: users});
            });

    }else{
        next(null, {code: 500});
        sessionService.kick(uid, 'kick', null);
    }

};

Handler.prototype.exit = function(msg, session, next) {

    if (!session.uid || !session.get('gid')){
        next(null, {code: 500});
        return;
    }

    var self = this;
    var rpc = self.app.rpc[session.get('gid')];
    if (!!rpc){
        rpc.gameRemote.kick(session,
            session.uid, self.app.get('serverId'), session.get('cid'),
            function(err){});
    }

    next(null, {code: 200});
};

var onUserLeave = function(app, session) {

    if(!session || !session.uid || !session.get('gid')) {
        return;
    }

    var rpc = app.rpc[session.get('gid')];
    if (!!rpc){
        rpc.gameRemote.kick(session,
            session.uid, app.get('serverId'), session.get('cid'),
            function(err){});
    }

};
