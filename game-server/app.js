var pomelo = require('pomelo');
var GConfig = require('./app/services/utils/GConfig');
var Express = require ('./app/components/Express');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'CrosswordServer');
app.set('public',new GConfig(app,'public'));

//app.enable('systemMonitor');

//console.log("process pid:"+process.pid);

// app configuration
app.configure('production|development', 'master', function(){
    /*
    app.event.on('add_servers',function(stream){
        console.log(' ADD !!!!!!!!!!!!!!!!!!!');
    });

    app.event.on('remove_servers',function(stream){
        console.log(' REMOVE !!!!!!!!!!!!!!!!!!!');
    });
    */
//    var port = app.master.http;
//    var GHttp = require('./app/services/http/GHttp');
//    GHttp.createExpress(port);

    app.load (Express, {port: app.master.http});

});

app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.hybridconnector,
      heartbeat : 3,
      useDict : true,
      useProtobuf : true
    });
    /*
    app.event.on('add_servers',function(stream){
        console.log(' ADD !!!!!!!!!!!!!!!!!!!');
    });
    */
    app.event.on('remove_servers',function(stream){
        var servers = stream;
        for (var i = 0  ,len = servers.length; i < len ; ++ i){
            var server = servers[i];
            if (server=='killer-server-1'){
//                var sessionService = app.get('sessionService');
//                sessionService.kickBySessionId(server,null);
            }
        }
    });

    app.set('GConfig',new GConfig());
});

app.configure('production|development', 'gate', function(){
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
			useProtobuf : true
		});
});

app.configure('production|development', 'crossword', function(){

    app.set('GConfig',new GConfig(app));

    var GGameHall = require('./app/services/crossword/GGameHall');
    app.set('GGameHall',new GGameHall(app));
    /*
    app.event.on('add_servers',function(stream){
        console.log(' ADD !!!!!!!!!!!!!!!!!!!');
    });

    app.event.on('remove_servers',function(stream){
        console.log(' REMOVE !!!!!!!!!!!!!!!!!!!');
    });
    */
});

app.configure('production|development', 'escape', function(){

    app.set('GConfig',new GConfig(app));

    var GGameHall = require('./app/services/escape/GGameHall');
    app.set('GGameHall',new GGameHall(app));
    /*
    app.event.on('add_servers',function(stream){
        console.log(' ADD !!!!!!!!!!!!!!!!!!!');
    });

    app.event.on('remove_servers',function(stream){
        console.log(' REMOVE !!!!!!!!!!!!!!!!!!!');
    });
    */
});

app.configure('production|development', 'killer', function(){

    app.set('GConfig',new GConfig(app));

    var GGameHall = require('./app/services/killer/GGameHall');
    var hall = new GGameHall(app);
    app.set('GGameHall',hall);

    app.event.on('add_servers',function(stream){
        var servers = stream;
        for (var i = 0 ,len = servers.length; i < len ; ++ i){
            var server = servers[i];
            if (server.serverType=='connector'){
                hall.onAddConnector();
            }
        }
    });

    app.event.on('remove_servers',function(stream){
        var servers = stream;
        console.log(servers);
        for (var i = 0  ,len = servers.length; i < len ; ++ i){
            var server = servers[i];
            if (server=='connector-server-1'){
                hall.onRemoveConnector();
            }
        }
    });

});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});

process.on('exit', function(code) {
    console.log('About to exit with code:', code);
});