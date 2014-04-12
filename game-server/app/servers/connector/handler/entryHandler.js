// 140330
module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
  this.channelService = app.get('channelService');
};

Handler.prototype.getValidChannel = function() {
	var channels = this.channelService.channels;
	var channel;
	var count = 0;
	for(var name in channels) {
		var c = channels[name];
		var m = c.getMembers();
		console.log("getValidChannel >>name:%s members:%d ",name,m.length);
		if (!! m && m.length < 2) {
			channel = c;
			break;
		}
		count ++;
	}
	if (!channel){
		var cname = "channel"+count;
		channel = this.channelService.getChannel(cname, true);
	}
	
//	console.log(channel);
	
	return channel;
}

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
Handler.prototype.register = function(msg, session, next) {
	
	var mysql      = require('mysql');
	var conn = mysql.createConnection({
	  host     : '127.0.0.1',
	  database: 'test',
	  port: '3306',
	  user     : 'root',
	  password : 'kissme',
	});

	conn.connect(function(error, results) {
		  if(error) {
			  console.log('Connection Error: ' + error.message);
			  return;
		  }
		  console.log('Connected to MySQL');
		  
	});
	
	SQLInsertUser = function()
	{
		var sql = 'INSERT INTO user (name, password) VALUES (\''+msg.username+'\', \''+msg.rid+'\')';
		console.log('SQLInsertUser >> '+sql);
		conn.query(sql, 
				function(err, rows, fields) {
		    if (err) throw err;
		    
		    next(null, {code: 200,result: 0, msg: 'crossword game server is ok.'});
		});
		
		conn.end();
	};
	
	SQLFindUser = function()
	{
		var sql = 'SELECT * FROM user WHERE name=\''+msg.username+'\' AND password=\''+msg.rid+'\'';
		console.log('SQLFindUser >> '+sql);
		conn.query(sql, 
				function(err, rows, fields) {
		    if (err) throw err;
		    
		    console.log('SQLFindUser ..');
		    
		    if (rows.length==1){
		    	
//		    	conn.end();
		    	console.log('SQLFindUser >>> end A');
		    	next(null, {code: 500,result: 1,msg: 'Register Failed！'});
		    	
		    	conn.end();
		    }else{
		    	
		    	console.log('SQLFindUser >>> end B');
		    	SQLInsertUser();
//		    	return;
		    }
		}
		);		

	};	
	
	SQLFindUser();
//	SQLInsertUser();
	
	

	console.log('Handler.prototype.register >>> end B');
	
	

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

  //hello
};


/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
Handler.prototype.entry = function(msg, session, next) {
	
//	var mysql      = require('mysql');
//	var conn = mysql.createConnection({
//	  host     : '127.0.0.1',
//	  database: 'test',
//	  port: '3306',
//	  user     : 'root',
//	  password : 'kissme',
//	});
//
//	conn.connect();
//	
//	conn.query('SELECT * FROM user', function(err, rows, fields) {
//	    if (err) throw err;
//	    console.log('SELECT * FROM user ... %d',rows.length);
//	    console.log(rows);
//	});
//	
//	conn.end();
	
	/*
	"map_h":[
	       [0,0,0,0,0],
	       [0,1,1,1,1],
	       [0,0,0,0,0],
	       [2,2,2,2,0],
	       [0,0,0,0,0],
	       ],           
           
   "map_v":[
            [2,0,0,0,0],
            [2,0,0,2,0],
            [2,0,0,2,0],
            [2,0,0,2,0],
            [0,0,0,2,0],
            ],
                    
    "words":[

             ], 
	*/
	
	var fs = require('fs');
	fs.readFile('./data/map0001.json',function(err,data){
	    if(err) throw err;
	    var jsonObj = JSON.parse(data);
	    console.log(jsonObj);
	});

	console.log('Handler.prototype.entry >>> ');
	next(null, {code: 200, msg: 'crossword game server is ok.'});
  //hello
};



/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
Handler.prototype.enter = function(msg, session, next) {
	
	var self = this;
	var rid = msg.rid;
	var uid = msg.username + '*' + rid;
	var sessionService = self.app.get('sessionService');

	//duplicate log in
	if( !! sessionService.getByUid(uid)) {
		// 重复登录，则需要将之前的踢掉...		
		console.log('relogin >> kick!!!');
		sessionService.kick(uid, 'kick', null);
		
		/*
		next(null, {
			code: 500,
			error: true
		});
		
		return;
		*/
	}

	session.bind(uid);
	session.set('rid', rid);
	session.push('rid', function(err) {
		if(err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, self.app));
	
	console.log('enter >> ');
//	console.log(session);
	
	next(null, {
		code: 200,
		result: 0,
		msg: 'Login Success！'
	});
	
	/*
	var channel = this.getValidChannel();
	
	session.set('cid',channel.name);
	session.push('cid', function(err) {
		if(err) {
			console.error('set cid for session service failed! error is : %j', err.stack);
		}
	});

	//put user into channel
	self.app.rpc.crossword.gameRemote.add(session, uid, self.app.get('serverId'), channel.name, true, function(users){
		next(null, {
			users:users
		});
	});
	*/
	
	

};

Handler.prototype.desk = function(msg, session, next) {
	
	var self = this;
//	var rid = msg.rid;
//	var uid = msg.username + '*' + rid
	var sessionService = self.app.get('sessionService');
	
	console.log('desk >> ');
	
	var sit = msg.sit;	// 0:down 1:up
	var level = msg.level;
	var type = msg.type;
	
	if (sit==0){
		// 提取一个可用频道...
		var channel = this.getValidChannel();
		// 将频道名保存在session中...
		session.set('cid',channel.name);
		session.push('cid', function(err) {
			if(err) {
				console.error('set cid for session service failed! error is : %j', err.stack);
			}
		});
		
		
		//put user into channel
		self.app.rpc.crossword.gameRemote.add(session, session.uid, self.app.get('serverId'), channel.name, true,
				null
//				function(users){next(null, {users:users});}
		);
		
	}else if (sit==1){
		
		self.app.rpc.crossword.gameRemote.kick(session, session.uid, self.app.get('serverId'), session.get('cid'), null);
		
		// 将频道名保存在session中...
		session.set('cid','none');
		session.push('cid', function(err) {
			if(err) {
				console.error('set cid for session service failed! error is : %j', err.stack);
			}
		});

	}

	next(null, {
		code: 200,
		result: 0,
		msg: 'Handler.prototype.desk'
	});

};

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
Handler.prototype.login = function(msg, session, next) {

	var self = this;
	// login
	var mysql      = require('mysql');
	var conn = mysql.createConnection({
	  host     : '127.0.0.1',
	  database: 'test',
	  port: '3306',
	  user     : 'root',
	  password : 'kissme',
	});

	conn.connect();
	
	conn.query('SELECT * FROM user WHERE name=\''+msg.username+'\' AND password=\''+msg.rid+'\'', 
			function(err, rows, fields) {
	    if (err) throw err;
	    console.log('SELECT * FROM user >> for login %d',rows.length);
	    console.log(rows);
	    if (rows.length==1){
	    	self.enter(msg, session, next);
	    }else{
			next(null, {
				code: 500,
				result: 1,
				msg: 'Login Failed！'
			});
	    }
	});
	
	conn.end();
	
	console.log('login >> ');
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
	
	console.log('onUserLeave >> ');
	
//	console.log(session);
	app.rpc.crossword.gameRemote.kick(session, session.uid, app.get('serverId'), session.get('cid'), null);
	
};