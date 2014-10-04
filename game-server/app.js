var pomelo = require('pomelo');
var GConfig = require('./app/services/utils/GConfig');
var Express = require ('./app/components/Express');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'CrosswordServer');
app.set('public',new GConfig(app,'public'));

// app configuration
app.configure('production|development', 'master', function(){

    var port = app.master.http;
//    var GHttp = require('./app/services/http/GHttp');
//    GHttp.createExpress(port);

    app.load (Express, {port: port});

});

app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.hybridconnector,
      heartbeat : 3,
      useDict : true,
      useProtobuf : true
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

});

app.configure('production|development', 'escape', function(){

    app.set('GConfig',new GConfig(app));

    var GGameHall = require('./app/services/escape/GGameHall');
    app.set('GGameHall',new GGameHall(app));

});

app.configure('production|development', 'killer', function(){

    app.set('GConfig',new GConfig(app));

    var GGameHall = require('./app/services/killer/GGameHall');
    app.set('GGameHall',new GGameHall(app));

});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});

process.on('exit', function(code) {
    console.log('About to exit with code:', code);
});