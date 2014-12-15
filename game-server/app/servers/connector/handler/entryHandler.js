var GMySQL = require('../../../services/mysql/GMySQL');
var GUtils = require('../../../services/utils/GUtils');
var GError = require('../../../services/utils/GError');
var GHttp = require('../../../services/http/GHttp');
var querystring = require('querystring');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
    this.appConfig = app.get('GConfig');
};

var https = require('https');

Handler.prototype.entry = function(msg, session, next) {
//    var data = 'transdata={"userid":"2049653523","username":"GamePans"}&sign=20e529266ca5e660b980e538f1073a21';
//    var msg = querystring.parse(data);
//    var trans =  eval("(" + msg.transdata + ")");
//    console.log(trans);
    /*
    var orderno = msg.orderno;//"2274c4183b-uqpy-8884-4018-8438db75b8-c16";
    var nums = orderno.split('-');

    var uid_info = nums[0];
    var len = parseInt(uid_info.charAt(0));
    var uid_str = uid_info.substring(1,1+len);
    console.log(uid_str);

    var wid_org = parseInt(GUtils.codeXOR(nums[1],'A'));
    var wid_dec = parseInt(nums[3]);
    var wid = wid_dec - wid_org;
    console.log(wid);
    */

//    var chess = GUtils.JsonFromDir('./data/','map_12_12_','.json');
//    console.log(chess);

//    console.log(GUtils.randName(2));
/*
    var str = "ewoJInNpZ25hdHVyZSIgPSAiQW1MU0hOTHFJR3ZPVlBITGhZcHpYNXVkdERaTFVuVVZOamJPOEdTRUVqakJobUhTeFR3enkyOUpGUHl6R3VKL2J3WHBIYURONVZHaGZpZ3RwMFpYV25oQjZpNUNEOTd1VnpPbGxLV2t1Y2htbjQwRVhCNkdVcEVjUVMzd1V4YmhURTJDaERMSDM0VHZ6VkhQeXZGK1FnN0sycG1WczZDRk9lWVRJQU83VXhxbEFBQURWekNDQTFNd2dnSTdvQU1DQVFJQ0NCdXA0K1BBaG0vTE1BMEdDU3FHU0liM0RRRUJCUVVBTUg4eEN6QUpCZ05WQkFZVEFsVlRNUk13RVFZRFZRUUtEQXBCY0hCc1pTQkpibU11TVNZd0pBWURWUVFMREIxQmNIQnNaU0JEWlhKMGFXWnBZMkYwYVc5dUlFRjFkR2h2Y21sMGVURXpNREVHQTFVRUF3d3FRWEJ3YkdVZ2FWUjFibVZ6SUZOMGIzSmxJRU5sY25ScFptbGpZWFJwYjI0Z1FYVjBhRzl5YVhSNU1CNFhEVEUwTURZd056QXdNREl5TVZvWERURTJNRFV4T0RFNE16RXpNRm93WkRFak1DRUdBMVVFQXd3YVVIVnlZMmhoYzJWU1pXTmxhWEIwUTJWeWRHbG1hV05oZEdVeEd6QVpCZ05WQkFzTUVrRndjR3hsSUdsVWRXNWxjeUJUZEc5eVpURVRNQkVHQTFVRUNnd0tRWEJ3YkdVZ1NXNWpMakVMTUFrR0ExVUVCaE1DVlZNd2daOHdEUVlKS29aSWh2Y05BUUVCQlFBRGdZMEFNSUdKQW9HQkFNbVRFdUxnamltTHdSSnh5MW9FZjBlc1VORFZFSWU2d0Rzbm5hbDE0aE5CdDF2MTk1WDZuOTNZTzdnaTNvclBTdXg5RDU1NFNrTXArU2F5Zzg0bFRjMzYyVXRtWUxwV25iMzRucXlHeDlLQlZUeTVPR1Y0bGpFMU93QytvVG5STStRTFJDbWVOeE1iUFpoUzQ3VCtlWnRERWhWQjl1c2szK0pNMkNvZ2Z3bzdBZ01CQUFHamNqQndNQjBHQTFVZERnUVdCQlNKYUVlTnVxOURmNlpmTjY4RmUrSTJ1MjJzc0RBTUJnTlZIUk1CQWY4RUFqQUFNQjhHQTFVZEl3UVlNQmFBRkRZZDZPS2RndElCR0xVeWF3N1hRd3VSV0VNNk1BNEdBMVVkRHdFQi93UUVBd0lIZ0RBUUJnb3Foa2lHOTJOa0JnVUJCQUlGQURBTkJna3Foa2lHOXcwQkFRVUZBQU9DQVFFQWVhSlYyVTUxcnhmY3FBQWU1QzIvZkVXOEtVbDRpTzRsTXV0YTdONlh6UDFwWkl6MU5ra0N0SUl3ZXlOajVVUllISytIalJLU1U5UkxndU5sMG5rZnhxT2JpTWNrd1J1ZEtTcTY5Tkluclp5Q0Q2NlI0Szc3bmI5bE1UQUJTU1lsc0t0OG9OdGxoZ1IvMWtqU1NSUWNIa3RzRGNTaVFHS01ka1NscDRBeVhmN3ZuSFBCZTR5Q3dZVjJQcFNOMDRrYm9pSjNwQmx4c0d3Vi9abEwyNk0ydWVZSEtZQ3VYaGRxRnd4VmdtNTJoM29lSk9PdC92WTRFY1FxN2VxSG02bTAzWjliN1BSellNMktHWEhEbU9Nazd2RHBlTVZsTERQU0dZejErVTNzRHhKemViU3BiYUptVDdpbXpVS2ZnZ0VZN3h4ZjRjemZIMHlqNXdOelNHVE92UT09IjsKCSJwdXJjaGFzZS1pbmZvIiA9ICJld29KSW05eWFXZHBibUZzTFhCMWNtTm9ZWE5sTFdSaGRHVXRjSE4wSWlBOUlDSXlNREUwTFRFeExUSXdJREF6T2pFNE9qUXlJRUZ0WlhKcFkyRXZURzl6WDBGdVoyVnNaWE1pT3dvSkluVnVhWEYxWlMxcFpHVnVkR2xtYVdWeUlpQTlJQ0psWXpnd09UZzBOV014WW1Zd1lqVmpNVFppWldOak9XUmpPVGM1TTJSbE16RTRORFUzT1dGbElqc0tDU0p2Y21sbmFXNWhiQzEwY21GdWMyRmpkR2x2YmkxcFpDSWdQU0FpTVRBd01EQXdNREV6TWpRek1UYzROQ0k3Q2draVluWnljeUlnUFNBaU1TNDFMakFpT3dvSkluUnlZVzV6WVdOMGFXOXVMV2xrSWlBOUlDSXhNREF3TURBd01UTXlOek15TVRZMElqc0tDU0p4ZFdGdWRHbDBlU0lnUFNBaU1TSTdDZ2tpYjNKcFoybHVZV3d0Y0hWeVkyaGhjMlV0WkdGMFpTMXRjeUlnUFNBaU1UUXhOalE0TWpNeU1qQXdNQ0k3Q2draWRXNXBjWFZsTFhabGJtUnZjaTFwWkdWdWRHbG1hV1Z5SWlBOUlDSXpRakl3T1RnNU5pMHhRMFF6TFRSRU1UZ3RPVFV4UlMxRE1UazNRamMzTVRrM016TWlPd29KSW5CeWIyUjFZM1F0YVdRaUlEMGdJbXR3Vlc1c2IyTnJJanNLQ1NKcGRHVnRMV2xrSWlBOUlDSTVORE0xTVRjd05qa2lPd29KSW1KcFpDSWdQU0FpYjNKbkxtZGhiV1Z3WVc1ekxtRndjR3hwWTJGMGFXOXVMbXRsZVhObGRIQnBZVzV2SWpzS0NTSndkWEpqYUdGelpTMWtZWFJsTFcxeklpQTlJQ0l4TkRFMk5qZ3lNakk1TXpjNUlqc0tDU0p3ZFhKamFHRnpaUzFrWVhSbElpQTlJQ0l5TURFMExURXhMVEl5SURFNE9qVXdPakk1SUVWMFl5OUhUVlFpT3dvSkluQjFjbU5vWVhObExXUmhkR1V0Y0hOMElpQTlJQ0l5TURFMExURXhMVEl5SURFd09qVXdPakk1SUVGdFpYSnBZMkV2VEc5elgwRnVaMlZzWlhNaU93b0pJbTl5YVdkcGJtRnNMWEIxY21Ob1lYTmxMV1JoZEdVaUlEMGdJakl3TVRRdE1URXRNakFnTVRFNk1UZzZORElnUlhSakwwZE5WQ0k3Q24wPSI7CgkiZW52aXJvbm1lbnQiID0gIlNhbmRib3giOwoJInBvZCIgPSAiMTAwIjsKCSJzaWduaW5nLXN0YXR1cyIgPSAiMCI7Cn0";

    var b = new Buffer(str, 'base64');
    var s = b.toString();
    console.log(s);

    var sandbox = false;
    if(s.indexOf("\"Sandbox\"") != -1){
        sandbox = true;
    }
    console.log(sandbox);
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
    // konw it was sandbox or not.

//    var q = querystring.parse(s,';');
//    console.log(q);

//    var receipt = eval("(" + s + ")");



/*
    var options = {
        hostname: 'sandbox.itunes.apple.com',
        port: 443,
        path: '/verifyReceipt',
        method: 'POST'
    };
    // base64
//    var b = new Buffer(str);
//    var s = b.toString('base64');
    // end
//    var data=querystring.stringify({"receipt-data":str});
    var data="{\"receipt-data\":\"" + str + "\"}";
    var req = https.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);

//            response.write(chunk);
//            response.end();

        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    console.log('data: ' + data);
    req.write(data);
    req.end();
*/

/*

 {
 "receipt":{"original_purchase_date_pst":"2014-11-20 03:18:42 America/Los_Angeles", "purchase_date_ms":"1416682229379", "un
 ique_identifier":"ec809845c1bf0b5c16becc9dc9793de3184579ae", "original_transaction_id":"1000000132431784", "bvrs":"1.5.0",
 "transaction_id":"1000000132732164", "quantity":"1", "unique_vendor_identifier":"3B209896-1CD3-4D18-951E-C197B7719733", "
 item_id":"943517069", "product_id":"kpUnlock", "purchase_date":"2014-11-22 18:50:29 Etc/GMT", "original_purchase_date":"20
 14-11-20 11:18:42 Etc/GMT", "purchase_date_pst":"2014-11-22 10:50:29 America/Los_Angeles", "bid":"org.gamepans.application
 .keysetpiano", "original_purchase_date_ms":"1416482322000"}, "status":0}


 */










/*
    var host = "sandbox.itunes.apple.com";
    var port = 443;
    var path = "/verifyReceipt";

    var myData="{\"receipt-data\":\"" + str + "\"}";

    GHttp.postDataToServer(host, port, path, myData,
        function(err,data){
            if(err){
                console.log(err);
                next(null, {code: 500});
                return;
            }

            console.log(data);


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
*/



    console.log('Handler.prototype.entry ...');
    next(null, {code: 200, err: GError.New(this.app,1000)});
};

//Handler.prototype.GetHallChannel = function(gid){
//    var channelService = this.app.get('channelService');
//    var channel = channelService.getChannel('Hall'+gid, true);
//    return channel;
//}

// ---------------------------------------------------- //
Handler.prototype.dologin = function(uid, info, msg, session, next){
    var self = this;
    var gid = msg.gid;
    var rpc = self.app.rpc[gid];
    if (!!rpc){
        var uuid = GUtils.MD5(msg.usr);
        console.log(uuid);
        var sessionService = self.app.get('sessionService');
        if( !! sessionService.getByUid(uuid)) {
            sessionService.kick(uuid, 'kick', null);
        }
        session.bind(uuid);
        session.on('closed', onUserLogout.bind(null, self.app));

//        self.GetHallChannel(gid).add(uuid,self.app.get('serverId'));

        rpc.gameRemote.cfg(session,
            function(err,cfg){

            session.set('gid', gid);
            session.push('gid', function(err) {
                if(err) {
                    console.error('set gid failed! error: %j', err.stack);
                }
            });

            session.set('uid', uid);
            session.push('uid', function(err) {
                if(err) {
                    console.error('set uid failed! error: %j', err.stack);
                }
            });

            session.set('typ', 'hall');
            session.push('typ', function(err) {
                if(err) {
                    console.error('set typ failed! error: %j', err.stack);
                }
            });
            next(null, {code: 200,uuid:uuid,uid: uid,info:info/*config:cfg.config,*/});
        });
    }else{
        next(null, {code: 500,result: 0});
    }
};

Handler.prototype.register = function(msg, session, next) {
    if (!!session.uid){
        next(null, {code: 500,eid:402,result: 0});
        return;
    }

    var mysql = new GMySQL();

    var usr = msg.usr;
    var pwd = msg.pwd;
    var sex = msg.sex;
    var nick = msg.nick;
    var userid = msg.userid;
    var plat = msg.plat;

    if (sex == null){sex = 1;};
    if (nick == null){nick = usr;};
    if (userid == null){userid = '0';};
    if (plat == null){plat = 'default';};

    console.log('register:'+usr+'/'+pwd+'/'+sex+'/'+nick);

    if (!usr || !pwd){
        next(null, {code: 500,eid: 401});
        return;
    }

    var self = this;
    var SQLInitUser = function(insertId)
    {
        var sql = 'INSERT INTO crossword (uid, gold,silver) VALUES (' + insertId + ',500,3000)';
        mysql.Query(sql,function(rows){
            self.login(msg,session,next);
            mysql.End();
        });
    };

    var SQLInsertUser = function()
    {
        var sql = 'INSERT INTO user (name, password,nick,sex,uuid,plat) VALUES (\''+
            usr+'\', \''+pwd+'\',\''+nick+'\','+sex+',\''+userid+'\',\''+plat+'\')';
        mysql.Query(sql,function(rows){
//            console.log('xxxxxxxxxxxxxxxxxxxxxxx');
//            console.log(rows);

            if (msg.gid=='crossword'){
                var insertId = rows.insertId;
                SQLInitUser(insertId);
            }else{
                self.login(msg,session,next);
                mysql.End();
            }
        });
    };

    var SQLFindUser = function()
    {
        var sql = 'SELECT * FROM user WHERE name=\''+usr+'\'';
        mysql.Query(sql,function(rows){
            if (rows.length==1){
                next(null, {code: 500,eid: 601,msg: 'Register Failed��'});
                mysql.End();
            }else{
                SQLInsertUser();
            }
        });
    };
    mysql.Connect(SQLFindUser,next);
};

Handler.prototype.login = function(msg, session, next) {
    if (!!session.uid){
        next(null, {code: 500,result: 0});
        return;
    }
    var self = this;
    var mysql = new GMySQL();

    var usr = msg.usr;
    var pwd = msg.pwd;
    var gid = msg.gid;
    var plat = msg.plat;
    var anymous =  msg.anymous;

    var verify = true;
    if (plat == null){plat = 'default';};
    if (anymous == null){anymous = false;};

    if (plat == 'baidu' || plat=='waps')
    {
        verify = false;
    }

    if (gid=='crossword' && plat=='apple'){
        if (pwd == null){pwd = 'password';}
        verify = false;
    }

    if (gid=='escape'){
        pwd = 'password';
        verify = false;
    }else{

    }

    if (!usr || !pwd || !gid){
        next(null, {code: 500});
        return;
    }
    var SQLLoginUserEx = function()
    {
        var sql = 'SELECT user.id as uid,user.name,user.nick,user.sex,'+gid+'.gold,'+gid+'.silver,'+gid+'.exp FROM user LEFT JOIN '+gid
            +' ON user.id='+gid+'.uid WHERE name=\''+usr+'\' AND password=\''+pwd+'\' LIMIT 0,30';
        mysql.Query(sql,function(rows){
            if (rows.length>=1){
                var uid = rows[0]['uid'];
                var info = rows[0];
                console.log(info);
                self.dologin(uid,info,msg,session,next);
//            }else if (anymous==true){
//                var uid = GUtils.MD5(msg.usr);
//                var info = {uid:uid,name:msg.usr,nick:msg.usr,sex:1,gold:0,exp:0};
//                self.dologin(uid,info,msg,session,next);
            }else if (!verify){
                msg.sex = 1;
                if (plat == 'apple'){
                    msg.nick = 'Guest';
                }else{
                    msg.nick = msg.usr;
                }
                msg.pwd = pwd;
                self.register(msg, session, next);
            }else{
                next(null, {code: 500,msg: 'Login Failed'});
            }
            mysql.End();
        });
    };
    var SQLLoginUser = function()
    {
        var sql = 'SELECT user.id as uid,user.name,user.nick,user.sex,'+gid+'.gold,'+gid+'.exp FROM user LEFT JOIN '+gid
            +' ON user.id='+gid+'.uid WHERE name=\''+usr+'\' AND password=\''+pwd+'\' LIMIT 0,30';
//        console.log(sql);
        mysql.Query(sql,function(rows){
            if (rows.length>=1){
                var uid = rows[0]['uid'];
                var info = rows[0];
                console.log(info);
                self.dologin(uid,info,msg,session,next);
            }else if (anymous==true){
                var uid = GUtils.MD5(msg.usr);
                var info = {uid:uid,name:msg.usr,nick:msg.usr,sex:1,gold:0,exp:0};
                self.dologin(uid,info,msg,session,next);
            }else if (!verify){
                msg.sex = 1;
                msg.nick = msg.usr;
                msg.pwd = 'password';
                self.register(msg, session, next);
            }else{
                next(null, {code: 500,msg: 'Login Failed'});
            }
            mysql.End();
        });
    };
    if (gid == 'crossword'){
        mysql.Connect(SQLLoginUserEx,next);
    }else{
        mysql.Connect(SQLLoginUser,next);
    }
};

Handler.prototype.logout = function(msg, session, next) {
    if (!!session.uid && session.get('typ')=='hall'){
        var self = this;
        var sessionService = self.app.get('sessionService');
        next(null, {code: 200, msg: 'logout OK.'});
        sessionService.kick(session.uid, 'kick', null);
    }else{
        next(null, {code: 500,result: 0});
    }
};

var onUserLogout = function(app, session) {
    if(!session || !session.uid) {
        return;
    }
    console.log('onUserLogout');
//    var gid = session.get('gid');
//    var channelService = app.get('channelService');
//    var channel = channelService.getChannel('Hall'+gid, false);
//    if (channel){
//        channel.leave(session.uid,app.get('serverId'));
//    }
};

Handler.prototype.pay = function(msg, session, next) {
    var usr = msg.usr;
    var pwd = msg.pwd;
    var val = msg.val;
    if (!usr || !pwd || !val){
        next(null, {code: 500});
        return;
    }
    var mysql = new GMySQL();
    mysql.pay(msg,next);
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

Handler.prototype.getinfo = function(msg, session, next) {
    var uid = msg.uid;
    var gid = session.get('gid');
    if (uid==null || gid==null){
        next(null, {code: 500});
        return;
    }
    console.log('uid:'+uid+ ' and gid:'+gid);
    if (uid==0){
        var gold = GUtils.randInt(20,500);
        var silver = GUtils.randInt(20,500);
        var exp = GUtils.randInt(0,200);
        var sex = GUtils.randInt(1,2);
        var name = GUtils.randName(sex);
        next(null, {code: 200,
            info:{uid:0,gold:gold,silver:silver,exp:exp,
            nick:name,sex:sex,name:'Guest'}});
        return;
    }
    var mysql = new GMySQL();
    mysql.info({uid:uid,gid:gid},next);
};

Handler.prototype.setSilver = function(msg, session, next) {
    var gid = session.get('gid');
    var uid = session.get('uid');
    var val = msg.val;
    if (!uid || !gid){
        next(null, {code: 500});
        return;
    }
    var mysql = new GMySQL();
    mysql.setSilver({uid:uid,gid:gid,val:val},next);
};

Handler.prototype.setScore = function(msg, session, next) {
    var gid = session.get('gid');
    var uid = session.get('uid');
    var score = msg.score;
    if (!uid || !gid){
        next(null, {code: 500});
        return;
    }
    var mysql = new GMySQL();
    mysql.setScore({uid:uid,gid:gid,score:score},next);
};

Handler.prototype.getTops = function(msg, session, next) {
    var gid = session.get('gid');
    var uid = session.get('uid');
    if (!uid || !gid){
        next(null, {code: 500});
        return;
    }
    var mysql = new GMySQL();
    mysql.getTops({uid:uid,gid:gid},next);
};

Handler.prototype.enter = function(msg, session, next) {
    if (session.uid!=null && session.get('typ')!='game'){
        next(null, {code: 500,msg:'err session.'});
        return;
    }
    var self = this;

    var uuid = msg.uuid;
    var uid = 0;
    var gid = msg.gid;  // 游戏ID，请传入crossword
    var xcid = msg.cid;  // 频道ID，自动匹配的不用传。

    if (uuid==null || gid==null){
        next(null, {code: 500,msg:'err arg.'});
        return;
    }

    var sessionService = self.app.get('sessionService');
    // 如果不想检查登录，请注释掉这一段。
    if (gid=='escape' || gid=='killer'){
        uid = msg.uuid;
    }else{
        var sessions_login = sessionService.getByUid(uuid);
        if( !! sessions_login && sessions_login.length==1) {
            uid = sessions_login[0].get('uid');
        }else{
            next(null, {code: 500,msg:'err login.'});
            return;
        }
    }

    var rpc = self.app.rpc[gid];
    if (!!rpc){
        // 游戏不会检查重复登录...
        // 检查重复登录.
        if(session.uid==null && !! sessionService.getByUid(uid)) {
            sessionService.kick(uid, 'kick', null);
        }
        console.log('enter user '+session.uid + ' uid:'+uid);
//        var is_new = (session.uid!=null)?false:true;
        var is_new = (session.uid==null || session.uid!=uid)?true:false;
        if (is_new) {
            // do session config.
        	var uid_old = session.uid;
        	if (uid_old!=null){
        		session.unbind(uid_old,function(err){
//        			console.log('===$$$$$$$$$$=======');
        			console.log(err);
        			if (!err){
        				session.bind(uid,function(err){
//        					console.log('===#########=======');
                			console.log(err);
        				});
        			}
        		});
        	}else{
        		session.bind(uid);
        	}
            session.on('closed', onUserLeave.bind(null, self.app));
        }

        // 已经坐下了，将不能再次坐下。
        if (!!session.get('cid')){
            next(null, {code: 500,msg:'err cid.'});
            return;
        }

        // add channel for session.
        rpc.gameRemote.add(session,
            uid, self.app.get('serverId'),xcid,
            function(err,cid,users,user){
                if(err){
                    console.log(err);
                    next(null, {code: 500,msg:'err add.'});
                    return;
                }
                if (is_new) {
                    // set session settings.
                    session.set('gid', gid);
                    session.push('gid', function(err) {
                        if(err) {
                            console.error('set gid failed! error: %j', err.stack);
                        }
                    });
                    session.set('uid', uid);
                    session.push('uid', function(err) {
                        if(err) {
                            console.error('set id failed! error: %j', err.stack);
                        }
                    });
                    session.set('typ', 'game');
                    session.push('typ', function(err) {
                        if(err) {
                            console.error('set typ failed! error: %j', err.stack);
                        }
                    });
                }
                session.set('cid', cid);
                session.push('cid', function(err) {
                    if(err) {
                        console.error('set cid failed! error: %j', err.stack);
                    }
                });
                next(null, {code: 200,users:users,user:user,cid:cid});
            });

    }else{
        next(null, {code: 500,msg:'err rpc.'});
//        sessionService.kick(usr, 'kick', null);
    }
};

Handler.prototype.exit = function(msg, session, next) {
    if (!!session.uid && session.get('typ')!='game'){
        next(null, {code: 500});
        return;
    }

    if (!session.uid || !session.get('gid')){
        next(null, {code: 500});
        return;
    }

    var self = this;
    var rpc = self.app.rpc[session.get('gid')];
    if (!!rpc){
        rpc.gameRemote.kick(session,
            session.uid, self.app.get('serverId'), session.get('cid'),
            function(err){

                session.set('cid', null);
                session.push('cid', function(err) {
                    if(err) {
                        console.error('set cid failed! error: %j', err.stack);
                    }
                });

            });
    }
    next(null, {code: 200});
};

var onUserLeave = function(app, session) {
    if(!session || !session.uid || !session.get('gid')) {
        return;
    }
    var rpc = app.rpc[session.get('gid')];
    if (!!rpc){
        rpc.gameRemote.kick(session,
            session.uid, app.get('serverId'), session.get('cid'),
            function(err){
            });
    }
};

Handler.prototype.loginThird = function(msg, session, next) {
    console.log("loginThird~~~~~~~~");
    this.loginBaidu(msg, session, next);
};

/*
 { transdata: '{"exorderno":"1411295926049",
                 "transid":"06514092118384853651",
                 "waresid":1,
                 "appid":"1137915",
                 "feetype":0,
                 "money":1,
                 "count":1,
                 "result":0,
                 "transtype":0,
                 "transtime":"2014-09-21 18:45:22",
                 "cpprivate":"gamepans",
                 "paytype":5}',
 sign: '253b742ec7a41b987d48b2551772b403' }

 工蚁 2014/9/21 18:48:43
  REBOAK: transdata={"userid":"2049653523","username":"GamePans"}&sign=20e529266ca5e660b980e538f1073a21

*/

Handler.prototype.loginBaidu = function(msg, session, next) {
    var self = this;

    var appid = msg.appid;
    var appkey = msg.appkey;
    var token = msg.token;
    var plat = msg.plat;
    console.log("appid " + appid + "   " + appkey + "   " + token + "   " + plat);
    if (!appid || !appkey || !token){
        next(null, {code: 500});
        return;
    }

    var host = "gameopen.baidu.com";
    var port = 80;
    var path = "/index.php";
    var transdata = "{'appid':'" + appid + "','code':'" + token + "'}";
    var sign = GUtils.MD5(transdata + appkey);
    var myData = "r=FromIapppayToUserAction&m=domethod2&transdata=" + transdata + "&sign=" + sign;
    console.log("myData is " + myData);

    GHttp.postDataToServer(host, port, path, myData,
        function(err,data){
            if(err){
                console.log(err);
                next(null, {code: 500});
                return;
            }
            //transdata={"userid":"2049653523","username":"GamePans"}&sign=20e529266ca5e660b980e538f1073a21
            var msg = querystring.parse(data);
            var trans =  eval("(" + msg.transdata + ")");
            console.log("i am here~~~~~~~~");
            self.login({usr:trans.username,userid:trans.userid,pwd:'password',gid:'crossword',plat:'baidu'},session,next);
        });
//    next(null, {code: 200});
};

Handler.prototype.doPayment = function(msg,session,next) {
    var waresid =msg.waresid;
    var orderno = msg.orderno;
    var uid = session.get('uid');
    var gid = session.get('gid');

    if (uid == null || gid == null){
        // fix for empty login...
        next(null, {code: 200,msg:'empty uid and gid.',
            result:{orderno:orderno,wid:waresid}});
//        next(null,{code:500,msg:'uid or gid null!'});
        return;
    }

    var val = this.appConfig.getById(waresid,'wares','gold',gid);
//    console.log(waresid);
//    console.log(gid);
//    console.log(val);
//    console.log(this.appConfig.config);
    if (val == null || val <= 0){
        next(null, {code: 200,msg:'gold add zero.',result:{orderno:orderno,wid:waresid}});
        return;
    }


    var mysql = new GMySQL();
    mysql.addGold(
        {uid:uid,val:val},
        function(err,msg){
            if (msg != null && msg.code == 200){
                next(null, {code: 200,
                    result:{orderno:orderno,wid:waresid,gold:msg.gold}});
            }
        });
};

Handler.prototype.vertifyPayBaidu = function(msg, session, next) {
    var self = this;
    var appid = msg.appid;
    var orderno = msg.orderno;
    var appkey = msg.appkey;
//    console.log("appid " + appid + "   " + appkey + "   " + token + "   " + plat);
    if (!appid || !appkey || !orderno){
        next(null, {code: 500,msg:'appid,appkey,order null.'});
        return;
    }

    var host = "gameopen.baidu.com";
    var port = 80;
    var path = "/index.php";
    var transdata = "{'appid':'" + appid + "','exorderno':'" + orderno + "'}";
    var sign = GUtils.MD5(transdata + appkey);
    var myData = "r=FromIapppayToUserAction&transdata=" + transdata + "&sign=" + sign;
    console.log("myData is " + myData);

    GHttp.postDataToServer(host, port, path, myData,
        function(err,data){
            if(err){
                console.log(err);
                next(null, {code: 500});
                return;
            }
            //transdata={"userid":"2049653523","username":"GamePans"}&sign=20e529266ca5e660b980e538f1073a21
            var msg = querystring.parse(data);
//            console.log(msg);
            var trans =  eval("(" + msg.transdata + ")");
//            console.log(trans);
            var transdata = GUtils.getTransData(trans,'baidu');
//            console.log(transdata);
            var mysql = new GMySQL();
            mysql.setPayment(
                {paycode:101,transdata:transdata},
                function(err,msg){
                    if (msg != null && msg.code == 200){
                        self.doPayment(msg,session,next);
                    }else{
                        var paycode = msg.paycode;
                        if (paycode == null){
                            paycode = 0;
                        }
                        next(null, {code: 500,paycode:paycode,msg:'set pay err!'});
                    }
                });
//            next(null, {code: 200,transdata:trans});
        });
//    next(null, {code: 200});
};

Handler.prototype.notifyPayBaidu = function(msg, session, next) {
    // 支付需要特定session执行。
    var self = this;

//    var transdata = eval("(" + msg.transdata + ")");
    if (msg.resultInfo==null){
        next(null, {code: 500,msg:'resultInfo null'});
        return;
    }
    // 1137915&1&2274c4183b-uqpy-8884-4018-8438db75b8-c16
    var resultInfo = msg.resultInfo.split('&');
    console.log(resultInfo);
    var appid = resultInfo[0];
    var money = resultInfo[1];
    var orderno = resultInfo[2];
    setTimeout(
        function(){
            var mysql = new GMySQL();
            mysql.setPayment(
                {paycode:101,transdata:{orderno:orderno,appid:appid,plat:'baidu'}},
                function(err,msg){
                    if (msg != null && msg.code == 200){
                        self.doPayment(msg,session,next);
                    }else{
                        var paycode = msg.paycode;
                        if (paycode == null){
                            paycode = 0;
                        }
                        next(null, {code: 500,paycode:paycode});
                    }
                });
        }
        ,5000);
};

Handler.prototype.notifyPayApple = function(msg, session, next) {
    // 支付需要特定session执行。
    var self = this;

    var receipt = msg.resultInfo;

    if (msg.resultInfo==null){
        next(null, {code: 500,msg:'resultInfo null'});
        return;
    }

    var isAppleSandbox = function(data)
    {
        var decode = new Buffer(data, 'base64');
        var decode_str = decode.toString();

        var sandbox = false;
        if(decode_str.indexOf("\"Sandbox\"") != -1){
            sandbox = true;
        }
        return sandbox;
    };

    var host = "buy.itunes.apple.com";
    if (isAppleSandbox(receipt)){
        host = "sandbox.itunes.apple.com";
    }
    console.log(host);
    var port = 443;
    var path = "/verifyReceipt";

    var myData="{\"receipt-data\": \"" + receipt + "\"}";
    console.log(receipt);

    GHttp.postDataToServer(host, port, path, myData,
        function(err,data){
            if(err){
                console.log(err);
                next(null, {code: 500,paycode:100});
                return;
            }

            var transdata = eval("(" + data + ")");
            console.log(transdata);

            if (transdata['status'] != 0){
                next(null, {code: 500,paycode:100});
                return;
            }

            var receipt = transdata['receipt'];
            var product_id = receipt['product_id'];
            var proId = '0';
            if (product_id=='com.crossword.gold0'){
                proId = '0';
            }else if (product_id=='com.crossword.gold1'){
                proId = '1';
            }else if (product_id=='com.crossword.gold2'){
                proId = '2';
            }else if (product_id=='com.crossword.gold3'){
                proId = '3';
            }else if (product_id=='com.crossword.silver0'){
                proId = '4';
            }else if (product_id=='com.crossword.silver1'){
                proId = '5';
            }else if (product_id=='com.crossword.silver2'){
                proId = '6';
            }else if (product_id=='com.crossword.silver3'){
                proId = '7';
            }

            var price = self.appConfig.getById(proId,'wares','price',msg.gid);
            if (price == null){
                next(null, {code: 500,paycode:100});
                return;
            }
            transdata['waresid'] = proId;
            transdata['money'] = price;
            transdata['uid'] = msg.uid;

            var mysql = new GMySQL();
            mysql.setPayment(
                {paycode:101,transdata:GUtils.getTransData(transdata,'apple')},
                function(err,msg){
                    if (msg != null && msg.code == 200){
                        self.doPayment(msg,session,next);
                    }else{
                        var paycode = msg.paycode;
                        if (paycode == null){
                            paycode = 0;
                        }
                        next(null, {code: 500,paycode:paycode});
                    }
                });
        });

};

