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
		console.log("var name <%s> %d in channels",name,m.length);
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
	
	console.log(channel);
	
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

	conn.connect();
	
	conn.query('INSERT INTO user (name, password) VALUES (\'Wilson\', \'Champs-Elysees\')', 
			function(err, rows, fields) {
	    if (err) throw err;
	});
	
	conn.end();

	console.log('Handler.prototype.register >>> ');
	
  next(null, {code: 200, msg: 'crossword game server is ok.'});
  //hello
};

Handler.prototype.logout = function(msg, session, next) {
	
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
//	conn.query('INSERT INTO user (name, password) VALUES (\'Wilson\', \'Champs-Elysees\')', 
//			function(err, rows, fields) {
//	    if (err) throw err;
//	});
//	
//	conn.end();

	console.log('Handler.prototype.logout >>> ');
	
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
	
	var fs = require('fs');
	fs.readFile('./data/map0000.json',function(err,data){
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
	var uid = msg.username + '*' + rid
	var sessionService = self.app.get('sessionService');

	//duplicate log in
	if( !! sessionService.getByUid(uid)) {
		next(null, {
			code: 500,
			error: true
		});
		return;
	}

	session.bind(uid);
	session.set('rid', rid);
	session.push('rid', function(err) {
		if(err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, self.app));

	var channel = this.getValidChannel();
	
	session.set('cid',channel.name);
	session.push('cid', function(err) {
		if(err) {
			console.error('set cid for session service failed! error is : %j', err.stack);
		}
	});
	
//	console.log(session);
	
	//put user into channel
	self.app.rpc.crossword.gameRemote.add(session, uid, self.app.get('serverId'), channel.name, true, function(users){
		next(null, {
			users:users
		});
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
				error: true
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
//	console.log(session);
	app.rpc.crossword.gameRemote.kick(session, session.uid, app.get('serverId'), session.get('cid'), null);
};