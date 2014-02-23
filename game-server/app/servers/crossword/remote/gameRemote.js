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
	var channel = this.channelService.getChannel(name, flag);
//	var channel = this.getValidChannel();

	if( !! channel) {
		channel.add(uid, sid);
	}
	
	var username = uid.split('*')[0];
	var param = {
		route: 'onAdd',
		user: username,
		channel:name
	};
	channel.pushMessage(param);

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
	

	var username = uid.split('*')[0];
	var param = {
		route: 'onLeave',
		user: username
	};
	channel.pushMessage(param);
	
	// leave channel
	if( !! channel) {
		channel.leave(uid, sid);
	}
};
