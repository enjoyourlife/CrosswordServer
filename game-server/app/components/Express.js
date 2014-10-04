
var express = require('express');
var bodyParser = require('body-parser');

var dns = require('dns');
var net = require('net');

var GMySQL = require('../services/mysql/GMySQL');
var GUtils = require('../services/utils/GUtils');

module.exports = function(app, opts) {
  return new Express(app, opts);
};

var getHost = function(input){
    var hostx = input.split(':');
    return hostx[0];
};

var CreateServer = function(){
    var app = express();

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use(express.static('./htdocs'));

    app.get('/', function(req, res){
        res.sendfile('index.html');
    });

    app.get('/getip', function(req, res){

        var host = getHost(req.headers['host']);
        if (net.isIPv4(host)){
            res.send(host);
        }else{
            dns.resolve4(host, function (err, addresses) {
                if (err){
                    res.send('127.0.0.1');
                    throw err;
                }else{
                    console.log(addresses);
                    console.log('addresses: ' + JSON.stringify(addresses));
                    res.send(addresses[0]);
                }
            });
        }

    });

    app.post('/paybaidu', function(req, res){

        var transdata = eval("(" + req.body.transdata + ")");
        console.log(transdata);

        var mysql = new GMySQL();
        mysql.setPayment(
            {paycode:100,transdata:GUtils.getTransData(transdata,'baidu')},
            function(err,msg){
                if (msg != null && msg.code == 200){
                    res.send("SUCCESS");
                }else{
                    res.send("FAILURE");
                }
            });

    });

    return app;
};

var Express = function(app, opts) {
    this.app = app;
    this.opts = opts;

    this.http = CreateServer();
};

Express.name = '__Express__';

Express.prototype.start = function(cb) {
  console.log('Express Start');

    var port = this.opts.port;
    this.http.listen(port);
    console.log('Express Server running at http://localhost:%d/',port);

  process.nextTick (cb);
}

Express.prototype.afterStart = function(cb) {
  console.log ('Express afterStart');
  process.nextTick (cb);
}

Express.prototype.stop = function(force, cb) {
    console.log ('Express stop');
//    this.http.delete;
  process.nextTick (cb);
}
