var GMySQL = require('../../../services/mysql/GMySQL');
var GUtils = require('../../../services/utils/GUtils');


module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

// ---------------------------------------------------- //

Handler.prototype.register = function(msg, session, next) {

    var conn = GMySQL();

    var usr = msg.usr;
    var pwd = msg.pwd;

    if (!usr || !pwd){
        next(null, {code: 500});
        return;
    }

    var SQLInsertUser = function()
    {
        var sql = 'INSERT INTO user (name, password) VALUES (\''+usr+'\', \''+pwd+'\')';
        conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200,result: 0, msg: 'insert user ok.'});
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
                    next(null, {code: 500,result: 1,msg: 'Register Failed��'});
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

    var mid = GUtils.MD5(usr);

    console.log(mid);

    var SQLLoginUser = function()
    {
        conn.query('SELECT * FROM user WHERE name=\''+usr+'\' AND password=\''+pwd+'\'',
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){

                    session.bind(mid,null);
                    session.on('closed', onUserLogout.bind(null, self.app));

                    next(null, {code: 200,result: 0,uid: mid});

                }else{
                    next(null, {code: 500,result: 1,msg: 'Login Failed��'});
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
//	var rid = msg.rid;
//	var uid = msg.username + '*' + rid;
    var sessionService = self.app.get('sessionService');

//	if (session.uid != uid){
//		console.log('Handler.prototype.logout >>> Error uid...');
//	}

    console.log('Handler.prototype.logout >>> ');

    next(null, {code: 200, result:0, msg: 'logout OK.'});

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
    // 检查登录session。
    if( ! sessionService.getByUid(xuid)) {
        next(null, {code: 500});
        return;
    }
*/
    // kick if login again.
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
            function(err,cid,user){
                if(err){
                    console.log(err);
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
                next(null, {code: 200,user: user});
            });

    }else{
        next(null, {code: 500});
        sessionService.kick(uid, 'kick', null);
    }

};

Handler.prototype.exit = function(msg, session, next) {

    if (!session.uid){
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

    if(!session || !session.uid) {
        return;
    }

    var rpc = app.rpc[session.get('gid')];
    if (!!rpc){
        rpc.gameRemote.kick(session,
            session.uid, app.get('serverId'), session.get('cid'),
            function(err){});
    }

};
