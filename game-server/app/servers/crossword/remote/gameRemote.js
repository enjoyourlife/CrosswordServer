// 140330
module.exports = function(app) {
	return new GameRemote(app);
};

var GameRemote = function(app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

//ChannelService.prototype.getValidChannel = function() {
//	var name = "xx";
//	  var c = new Channel(name, this);
//	  this.channels[name] = c;
//	  return c;
//	};

//GameRemote.prototype.getValidChannel = function() {
//	var channels = this.channelService.channels;
//	console.log(channels);
//	var channel;
//	for(var name in channels) {
//		console.log("var name <%s> in channels",name);
//		var c = channels[name];
//		var m = c.getMembers();
//		if (!! m && m.length < 2) {
//			channel = c;
//			break;
//		}
//	}
//	if (!channel){
//		channel = this.channelService.getChannel("x", true);
//	}
//	
//	console.log(channel);
//	
//	return channel;
//}

/**
 * Add user into chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 *
 */
GameRemote.prototype.add = function(uid, sid, name, flag, cb) {
//	var channel = this.getValidChannel();
	
	var channel = this.channelService.getChannel(name, flag);

	if( !! channel) {
		channel.add(uid, sid);
		
		var m = channel.getMembers();
		
		var username = uid.split('*')[0];
		var param = {
			route: 'onEnter',
			user: username,
			users: m,
			channel:name
		};
		channel.pushMessage(param);
		
		
		console.log("GameRemote.prototype.add >>name:%s members:%d",name,m.length);
		if (!! m && m.length >= 2) {
			var param = {
					route: 'onGameStart',
					channel:name
				};
			channel.pushMessage(param);
		}
		
	}

	cb(this.get(name, flag));
	
	console.log('GameRemote.prototype.add ... [%s][%s][%s][%s]',uid,sid,name,username);
};

/**
 * Get user from chat channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
GameRemote.prototype.get = function(name, flag) {
	var users = [];
	var channel = this.channelService.getChannel(name, flag);
	if( !! channel) {
		users = channel.getMembers();
	}
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	return users;
};

/**
 * Kick user out chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
GameRemote.prototype.kick = function(uid, sid, name) {
	var channel = this.channelService.getChannel(name, false);
	
	console.log('GameRemote.prototype.kick ... [%s]',name);
	
//	console.log(channel);
	if( !! channel) {
		
		var m = channel.getMembers();
		
		var username = uid.split('*')[0];

		var param = {
				route: 'onExit',
				user: username,
				users: m,
				channel:name
			};
		channel.pushMessage(param);
		
		
		if (!! m && m.length >= 2) {
			var param = {
					route: 'onGameStop',
					channel:name
				};
			channel.pushMessage(param);
		}
		
		console.log("GameRemote.prototype.kick >>name:%s members:%d",name,m.length);
	
		// leave channel	
		channel.leave(uid, sid);		
		
		console.log('GameRemote.prototype.kick ... [%s][%s][%s][%s]',uid,sid,name,username);
	}
	
	
};
