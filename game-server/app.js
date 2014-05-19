var pomelo = require('pomelo');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'CrosswordServer');

// app configuration
app.configure('production|development', 'master', function(){

//    console.log(app);
    var port = app.master.http;
    var GHttp = require('./app/services/http/GHttp');
    GHttp.createServer(port);

//    var GUtils = require('./app/services/utils/GUtils');
//    var fname = GUtils.genMapPath(10);
//    console.log(fname);
});

app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.hybridconnector,
      heartbeat : 3,
      useDict : true,
      useProtobuf : true
    });
});

app.configure('production|development', 'gate', function(){
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
			useProtobuf : true
		});
});

app.configure('production|development', 'crossword', function(){
    var GGameHall = require('./app/services/crossword/GGameHall');
    var GConfig = require('./app/services/utils/GConfig');
    app.set('GGameHall',new GGameHall(app));
    app.set('GConfig',new GConfig(app));
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
