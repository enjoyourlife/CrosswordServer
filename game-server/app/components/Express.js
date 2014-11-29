
var express = require('express');
var bodyParser = require('body-parser');

var dns = require('dns');
var net = require('net');

var GMySQL = require('../services/mysql/GMySQL');
var GUtils = require('../services/utils/GUtils');
var GHttp = require('../services/http/GHttp');

module.exports = function(app, opts) {
  return new Express(app, opts);
};

var getHost = function(input){
    var hostx = input.split(':');
    return hostx[0];
};

var isAppleSandbox = function(data)
{
    var decode = new Buffer(data, 'base64');
    var decode_str = decode.toString();
//    console.log(s);

    var sandbox = false;
    if(decode_str.indexOf("\"Sandbox\"") != -1){
        sandbox = true;
    }
//    console.log(sandbox);
    return sandbox;
};

var CreateServer = function(master){
    var app = express();

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use(express.static('./htdocs'));

    app.get('/', function(req, res){
        res.sendfile('index.html');
    });

//    app.get('/exit', function(req, res){
//        process.exit(1001);
//        console.log(process.getgroups());
//        res.send('Bye bye!');

//        var connector = master.getServerById('connector-server-1');
//        console.log(connector);
//        process.kill(connector.pid);

//        connector.stop(true);
//        master.stop(true);
//        console.log(master);
//        master.removeServers(['connector-server-1']);
//    });

//    app.get('/enter', function(req, res){
//        process.exit(1001);
//        console.log(process.getgroups());
//        res.send('Bye bye!');

//        console.log(master);
//        master.addServers(['connector-server-1']);
//    });

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

    app.post('/payapple', function(req, res){

/*

 [2014-11-23 02:51:02.432] [INFO] console - { ewoJInNpZ25hdHVyZSIgPSAiQW1MU0hOTHFJR3ZPVlBITGhZcHpYNXVkdERaTFVuVVZOamJPOEdTR
 UVqakJobUhTeFR3enkyOUpGUHl6R3VKL2J3WHBIYURONVZHaGZpZ3RwMFpYV25oQjZpNUNEOTd1VnpPbGxLV2t1Y2htbjQwRVhCNkdVcEVjUVMzd1V4YmhURTJ
 DaERMSDM0VHZ6VkhQeXZGK1FnN0sycG1WczZDRk9lWVRJQU83VXhxbEFBQURWekNDQTFNd2dnSTdvQU1DQVFJQ0NCdXA0K1BBaG0vTE1BMEdDU3FHU0liM0RRR
 UJCUVVBTUg4eEN6QUpCZ05WQkFZVEFsVlRNUk13RVFZRFZRUUtEQXBCY0hCc1pTQkpibU11TVNZd0pBWURWUVFMREIxQmNIQnNaU0JEWlhKMGFXWnBZMkYwYVc
 5dUlFRjFkR2h2Y21sMGVURXpNREVHQTFVRUF3d3FRWEJ3YkdVZ2FWUjFibVZ6SUZOMGIzSmxJRU5sY25ScFptbGpZWFJwYjI0Z1FYVjBhRzl5YVhSNU1CNFhEV
 EUwTURZd056QXdNREl5TVZvWERURTJNRFV4T0RFNE16RXpNRm93WkRFak1DRUdBMVVFQXd3YVVIVnlZMmhoYzJWU1pXTmxhWEIwUTJWeWRHbG1hV05oZEdVeEd
 6QVpCZ05WQkFzTUVrRndjR3hsSUdsVWRXNWxjeUJUZEc5eVpURVRNQkVHQTFVRUNnd0tRWEJ3YkdVZ1NXNWpMakVMTUFrR0ExVUVCaE1DVlZNd2daOHdEUVlKS
 29aSWh2Y05BUUVCQlFBRGdZMEFNSUdKQW9HQkFNbVRFdUxnamltTHdSSnh5MW9FZjBlc1VORFZFSWU2d0Rzbm5hbDE0aE5CdDF2MTk1WDZuOTNZTzdnaTNvclB
 TdXg5RDU1NFNrTXArU2F5Zzg0bFRjMzYyVXRtWUxwV25iMzRucXlHeDlLQlZUeTVPR1Y0bGpFMU93QytvVG5STStRTFJDbWVOeE1iUFpoUzQ3VCtlWnRERWhWQ
 jl1c2szK0pNMkNvZ2Z3bzdBZ01CQUFHamNqQndNQjBHQTFVZERnUVdCQlNKYUVlTnVxOURmNlpmTjY4RmUrSTJ1MjJzc0RBTUJnTlZIUk1CQWY4RUFqQUFNQjh
 HQTFVZEl3UVlNQmFBRkRZZDZPS2RndElCR0xVeWF3N1hRd3VSV0VNNk1BNEdBMVVkRHdFQi93UUVBd0lIZ0RBUUJnb3Foa2lHOTJOa0JnVUJCQUlGQURBTkJna
 3Foa2lHOXcwQkFRVUZBQU9DQVFFQWVhSlYyVTUxcnhmY3FBQWU1QzIvZkVXOEtVbDRpTzRsTXV0YTdONlh6UDFwWkl6MU5ra0N0SUl3ZXlOajVVUllISytIalJ
 LU1U5UkxndU5sMG5rZnhxT2JpTWNrd1J1ZEtTcTY5Tkluclp5Q0Q2NlI0Szc3bmI5bE1UQUJTU1lsc0t0OG9OdGxoZ1IvMWtqU1NSUWNIa3RzRGNTaVFHS01ka
 1NscDRBeVhmN3ZuSFBCZTR5Q3dZVjJQcFNOMDRrYm9pSjNwQmx4c0d3Vi9abEwyNk0ydWVZSEtZQ3VYaGRxRnd4VmdtNTJoM29lSk9PdC92WTRFY1FxN2VxSG0
 2bTAzWjliN1BSellNMktHWEhEbU9Nazd2RHBlTVZsTERQU0dZejErVTNzRHhKemViU3BiYUptVDdpbXpVS2ZnZ0VZN3h4ZjRjemZIMHlqNXdOelNHVE92UT09I
 jsKCSJwdXJjaGFzZS1pbmZvIiA9ICJld29KSW05eWFXZHBibUZzTFhCMWNtTm9ZWE5sTFdSaGRHVXRjSE4wSWlBOUlDSXlNREUwTFRFeExUSXdJREF6T2pFNE9
 qUXlJRUZ0WlhKcFkyRXZURzl6WDBGdVoyVnNaWE1pT3dvSkluVnVhWEYxWlMxcFpHVnVkR2xtYVdWeUlpQTlJQ0psWXpnd09UZzBOV014WW1Zd1lqVmpNVFppW
 ldOak9XUmpPVGM1TTJSbE16RTRORFUzT1dGbElqc0tDU0p2Y21sbmFXNWhiQzEwY21GdWMyRmpkR2x2YmkxcFpDSWdQU0FpTVRBd01EQXdNREV6TWpRek1UYzR
 OQ0k3Q2draVluWnljeUlnUFNBaU1TNDFMakFpT3dvSkluUnlZVzV6WVdOMGFXOXVMV2xrSWlBOUlDSXhNREF3TURBd01UTXlOek15TVRZMElqc0tDU0p4ZFdGd
 WRHbDBlU0lnUFNBaU1TSTdDZ2tpYjNKcFoybHVZV3d0Y0hWeVkyaGhjMlV0WkdGMFpTMXRjeUlnUFNBaU1UUXhOalE0TWpNeU1qQXdNQ0k3Q2draWRXNXBjWFZ
 sTFhabGJtUnZjaTFwWkdWdWRHbG1hV1Z5SWlBOUlDSXpRakl3T1RnNU5pMHhRMFF6TFRSRU1UZ3RPVFV4UlMxRE1UazNRamMzTVRrM016TWlPd29KSW5CeWIyU
 jFZM1F0YVdRaUlEMGdJbXR3Vlc1c2IyTnJJanNLQ1NKcGRHVnRMV2xrSWlBOUlDSTVORE0xTVRjd05qa2lPd29KSW1KcFpDSWdQU0FpYjNKbkxtZGhiV1Z3WVc
 1ekxtRndjR3hwWTJGMGFXOXVMbXRsZVhObGRIQnBZVzV2SWpzS0NTSndkWEpqYUdGelpTMWtZWFJsTFcxeklpQTlJQ0l4TkRFMk5qZ3lNakk1TXpjNUlqc0tDU
 0p3ZFhKamFHRnpaUzFrWVhSbElpQTlJQ0l5TURFMExURXhMVEl5SURFNE9qVXdPakk1SUVWMFl5OUhUVlFpT3dvSkluQjFjbU5vWVhObExXUmhkR1V0Y0hOMEl
 pQTlJQ0l5TURFMExURXhMVEl5SURFd09qVXdPakk1SUVGdFpYSnBZMkV2VEc5elgwRnVaMlZzWlhNaU93b0pJbTl5YVdkcGJtRnNMWEIxY21Ob1lYTmxMV1JoZ
 EdVaUlEMGdJakl3TVRRdE1URXRNakFnTVRFNk1UZzZORElnUlhSakwwZE5WQ0k3Q24wPSI7CgkiZW52aXJvbm1lbnQiID0gIlNhbmRib3giOwoJInBvZCIgPSA
 iMTAwIjsKCSJzaWduaW5nLXN0YXR1cyIgPSAiMCI7Cn0: '' }

 */

/*
 {
 "signature" = "AmLSHNLqIGvOVPHLhYpzX5udtDZLUnUVNjbO8GSEEjjBhmHSxTwzy29JFPyzGuJ/bwXpHaDN5VGhfigtp0ZXWnhB6i5CD97uVzO
 llKWkuchmn40EXB6GUpEcQS3wUxbhTE2ChDLH34TvzVHPyvF+Qg7K2pmVs6CFOeYTIAO7UxqlAAADVzCCA1MwggI7oAMCAQICCBup4+PAhm/LMA0GCSqGSIb3D
 QEBBQUAMH8xCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTEzMDEGA1UEAww
 qQXBwbGUgaVR1bmVzIFN0b3JlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MB4XDTE0MDYwNzAwMDIyMVoXDTE2MDUxODE4MzEzMFowZDEjMCEGA1UEAwwaUHVyY
 2hhc2VSZWNlaXB0Q2VydGlmaWNhdGUxGzAZBgNVBAsMEkFwcGxlIGlUdW5lcyBTdG9yZTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwgZ8wDQY
 JKoZIhvcNAQEBBQADgY0AMIGJAoGBAMmTEuLgjimLwRJxy1oEf0esUNDVEIe6wDsnnal14hNBt1v195X6n93YO7gi3orPSux9D554SkMp+Sayg84lTc362UtmY
 LpWnb34nqyGx9KBVTy5OGV4ljE1OwC+oTnRM+QLRCmeNxMbPZhS47T+eZtDEhVB9usk3+JM2Cogfwo7AgMBAAGjcjBwMB0GA1UdDgQWBBSJaEeNuq9Df6ZfN68
 Fe+I2u22ssDAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFDYd6OKdgtIBGLUyaw7XQwuRWEM6MA4GA1UdDwEB/wQEAwIHgDAQBgoqhkiG92NkBgUBBAIFADANB
 gkqhkiG9w0BAQUFAAOCAQEAeaJV2U51rxfcqAAe5C2/fEW8KUl4iO4lMuta7N6XzP1pZIz1NkkCtIIweyNj5URYHK+HjRKSU9RLguNl0nkfxqObiMckwRudKSq
 69NInrZyCD66R4K77nb9lMTABSSYlsKt8oNtlhgR/1kjSSRQcHktsDcSiQGKMdkSlp4AyXf7vnHPBe4yCwYV2PpSN04kboiJ3pBlxsGwV/ZlL26M2ueYHKYCuX
 hdqFwxVgm52h3oeJOOt/vY4EcQq7eqHm6m03Z9b7PRzYM2KGXHDmOMk7vDpeMVlLDPSGYz1+U3sDxJzebSpbaJmT7imzUKfggEY7xxf4czfH0yj5wNzSGTOvQ=
 =";
 "purchase-info" = "ewoJIm9yaWdpbmFsLXB1cmNoYXNlLWRhdGUtcHN0IiA9ICIyMDE0LTExLTIwIDAzOjE4OjQyIEFtZXJpY2EvTG9zX0FuZ2V
 sZXMiOwoJInVuaXF1ZS1pZGVudGlmaWVyIiA9ICJlYzgwOTg0NWMxYmYwYjVjMTZiZWNjOWRjOTc5M2RlMzE4NDU3OWFlIjsKCSJvcmlnaW5hbC10cmFuc2Fjd
 Glvbi1pZCIgPSAiMTAwMDAwMDEzMjQzMTc4NCI7CgkiYnZycyIgPSAiMS41LjAiOwoJInRyYW5zYWN0aW9uLWlkIiA9ICIxMDAwMDAwMTMyNzMyMTY0IjsKCSJ
 xdWFudGl0eSIgPSAiMSI7Cgkib3JpZ2luYWwtcHVyY2hhc2UtZGF0ZS1tcyIgPSAiMTQxNjQ4MjMyMjAwMCI7CgkidW5pcXVlLXZlbmRvci1pZGVudGlmaWVyI
 iA9ICIzQjIwOTg5Ni0xQ0QzLTREMTgtOTUxRS1DMTk3Qjc3MTk3MzMiOwoJInByb2R1Y3QtaWQiID0gImtwVW5sb2NrIjsKCSJpdGVtLWlkIiA9ICI5NDM1MTc
 wNjkiOwoJImJpZCIgPSAib3JnLmdhbWVwYW5zLmFwcGxpY2F0aW9uLmtleXNldHBpYW5vIjsKCSJwdXJjaGFzZS1kYXRlLW1zIiA9ICIxNDE2NjgyMjI5Mzc5I
 jsKCSJwdXJjaGFzZS1kYXRlIiA9ICIyMDE0LTExLTIyIDE4OjUwOjI5IEV0Yy9HTVQiOwoJInB1cmNoYXNlLWRhdGUtcHN0IiA9ICIyMDE0LTExLTIyIDEwOjU
 wOjI5IEFtZXJpY2EvTG9zX0FuZ2VsZXMiOwoJIm9yaWdpbmFsLXB1cmNoYXNlLWRhdGUiID0gIjIwMTQtMTEtMjAgMTE6MTg6NDIgRXRjL0dNVCI7Cn0=";
 "environment" = "Sandbox";
 "pod" = "100";
 "signing-status" = "0";
 }
 */

        console.log(req.body);

        var receipt = req.body.receipt;
        console.log(receipt);

        var json_receipt = eval("(" + receipt + ")");
        console.log(json_receipt);


        var host = "buy.itunes.apple.com";
        if (isAppleSandbox(json_receipt['receipt-data'])){
            host = "sandbox.itunes.apple.com";
        }
        console.log(host);
        var port = 443;
        var path = "/verifyReceipt";

        var myData=receipt;

        GHttp.postDataToServer(host, port, path, myData,
            function(err,data){
                if(err){
                    console.log(err);
                    res.send("FAILURE");
                    return;
                }

                console.log(data);
                res.send("SUCCESS");

                //transdata={"userid":"2049653523","username":"GamePans"}&sign=20e529266ca5e660b980e538f1073a21
//            var msg = querystring.parse(data);
//            var trans =  eval("(" + msg.transdata + ")");
//            var transdata = GUtils.getTransData(trans,'baidu');
//            var mysql = new GMySQL();
//            mysql.setPayment(
//                {paycode:101,transdata:transdata},
//                function(err,msg){
//                    if (msg != null && msg.code == 200){
//                        self.doPayment(msg,session,next);
//                    }else{
//                        var paycode = msg.paycode;
//                        if (paycode == null){
//                            paycode = 0;
//                        }
//                        next(null, {code: 500,paycode:paycode,msg:'set pay err!'});
//                    }
//                });



            });






/*

 {
 "receipt":{"original_purchase_date_pst":"2014-11-20 03:18:42 America/Los_Angeles", "purchase_date_ms":"1416682229379", "un
 ique_identifier":"ec809845c1bf0b5c16becc9dc9793de3184579ae", "original_transaction_id":"1000000132431784", "bvrs":"1.5.0",
 "transaction_id":"1000000132732164", "quantity":"1", "unique_vendor_identifier":"3B209896-1CD3-4D18-951E-C197B7719733", "
 item_id":"943517069", "product_id":"kpUnlock", "purchase_date":"2014-11-22 18:50:29 Etc/GMT", "original_purchase_date":"20
 14-11-20 11:18:42 Etc/GMT", "purchase_date_pst":"2014-11-22 10:50:29 America/Los_Angeles", "bid":"org.gamepans.application
 .keysetpiano", "original_purchase_date_ms":"1416482322000"}, "status":0}

 */






//        var receipt = eval("(" + req.body.receipt-data + ")");
//        console.log(receipt);

//        var mysql = new GMySQL();
//        mysql.setPayment(
//            {paycode:100,transdata:GUtils.getTransData(receipt,'apple')},
//            function(err,msg){
//                if (msg != null && msg.code == 200){
//                    res.send("SUCCESS");
//                }else{
//                    res.send("FAILURE");
//                }
//            });

    });

    return app;
};

var Express = function(app, opts) {
    this.app = app;
    this.opts = opts;

    this.http = CreateServer(app);
};

Express.name = '__Express__';

Express.prototype.start = function(cb) {
    console.log('Express Start');

    var port = this.opts.port;
    this.http.listen(port);
    console.log('Express Server running at http://localhost:%d/',port);

    process.nextTick (cb);
};

Express.prototype.afterStart = function(cb) {
    console.log ('Express afterStart');
    process.nextTick (cb);
};

Express.prototype.stop = function(force, cb) {
    console.log ('Express stop');
//    this.http.delete;
    process.nextTick (cb);
};
