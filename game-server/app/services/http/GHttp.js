/**
 * Created by Administrator on 2014/4/28.
 */

var conf = {
    Root : 'data', //文件的根路径
    Port : 1337,
    IndexEnable : true, //开启目录功能？
    IndexFile : 'index.html', //目录欢迎文件
    DynamicExt : /^\.njs$/ig, //动态页面后缀（需要.）
    ServerName : 'nodeJS', //服务器名字
    FileCache : { //文件（内存）缓存
        MaxSingleSize : 1024*1024, //单个文件最大尺寸
        MaxTotalSize : 30*1024*1024 //整个文件Cache最大尺寸
    },
    Expires : { //浏览器缓存
        FileMatch : /gif|jpg|png|js|css|ico/ig, //匹配的文件格式
        MaxAge : 3600*24*365 //最大缓存时间
    },
    Compress : { //编码压缩
        FileMatch : /css|js|html/ig //匹配的文件格式
    },
    MIME : {
        "css": "text/css",
        "gif": "image/gif",
        "html": "text/html",
        "ico": "image/x-icon",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "js": "text/javascript",
        "json": "application/json",
        "pdf": "application/pdf",
        "png": "image/png",
        "svg": "image/svg+xml",
        "swf": "application/x-shockwave-flash",
        "tiff": "image/tiff",
        "txt": "text/plain",
        "wav": "audio/x-wav",
        "wma": "audio/x-ms-wma",
        "wmv": "video/x-ms-wmv",
        "xml": "text/xml",
        "zip": "application/x-zip-compressed",
        "jar": "application/java-archive"
    }
};

var http = require('http');
var https = require('https');
var url=require('url');
var fs=require('fs');
var path=require('path');
var zlib = require('zlib');
var dns = require('dns');
var net = require('net');
var querystring = require('querystring');
var GMySQL = require('../mysql/GMySQL');

var getClientIp = function(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};

/*
var getRemoteIp = function(req) {

};
*/
var reqHttpHandle = function(realPath, request, response) {

    var ext = path.extname(realPath);
    ext = ext ? ext.slice(1) : 'unknown';
    fs.exists(realPath, function (exists) {

        console.log("path:"+realPath+" "+exists);

        if (!exists) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });

            response.write("<h3>404: Not Found</h3>");
            response.end();
        } else {
            fs.readFile(realPath, "binary", function (err, file) {
                if (err) {
                    response.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    response.end(err);
                } else {
                    var contentType = conf.MIME[ext] || "text/plain";
                    response.writeHead(200, {
                        'Content-Type': contentType
                    });
                    response.write(file, "binary");
                    response.end();
                }
            });
        }
    });

};

var getRealPath = function(request, response) {

    var httppath = '/';
    try{
        httppath = path.normalize(decodeURI(url.parse(request.url).pathname.replace(/\.\./g, '')));
    }
    catch(err){
        httppath = path.normalize(url.parse(request.url).pathname.replace(/\.\./g, ''));
    }
    var realPath = path.join(conf.Root, httppath );

    return realPath;
};

var reqMessage = function(code,message ,request, response) {
    response.writeHead(code, {
        'Content-Type': 'text/plain'
    });
    response.write(JSON.stringify(message));
    response.end();
};

var reqRegister = function(msg,request, response) {

    var mysql = new GMySQL();

    var usr = msg.usr;
    var pwd = msg.pwd;

    if (!usr || !pwd){
        reqMessage(200,{code:500,msg:'Null Err'},request,response);
        return;
    }

    var SQLInsertUser = function()
    {
        var sql = 'INSERT INTO user (name, password) VALUES (\''+usr+'\', \''+pwd+'\')';
        mysql.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                mysql.conn.end();
                reqMessage(200,{code:200,msg:'OK'},request,response);
            });
    };

    var SQLFindUser = function()
    {
        var sql = 'SELECT * FROM user WHERE name=\''+usr+'\' AND password=\''+pwd+'\'';
        mysql.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    mysql.conn.end();
                    reqMessage(200,{code:500,msg:'Find Err'},request,response);
                }else{
                    SQLInsertUser();
                }
            }
        );
    };

    mysql.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            mysql.conn.end();
            reqMessage(200,{code:500,msg:'Conn Err'},request,response);
            return;
        }
        console.log('Connected to MySQL');

        SQLFindUser();
    });

};

var getHost = function(input){
    var hostx = input.split(':');
    return hostx[0];
};

exports.createServer = function(port){

    if (!port){port = (conf.Port || 80);};

    http.createServer(function (request, response) {

        if(conf.ServerName){response.setHeader('Server',conf.ServerName);};

        var realPath = getRealPath(request, response);

        var fname = path.basename(realPath);

        console.log(fname);

        if (fname=='register'){

            var arg = url.parse(request.url).query;
            var msg = querystring.parse(arg);

            reqRegister(msg,request, response);

        }else if (fname=='getip'){

            response.writeHead(200, {'Content-Type': 'text/plain'});
//            response.end(getRemoteIp(request).toString());

            var host = getHost(request.headers['host']);
            if (net.isIPv4(host)){
                response.end(host);
            }else{
                dns.resolve4(host, function (err, addresses) {
                    if (err){
                        response.end('127.0.0.1');
                        throw err;
                    }else{
                        console.log(addresses);
                        console.log('addresses: ' + JSON.stringify(addresses));
                        response.end(addresses[0]);
                    }
                });
            }

        }else if (fname=='download'){

//            var arg = url.parse(request.url).query;
//            var msg = querystring.parse(arg);
            // use msg : level,count,type

            realPath = path.join(conf.Root, "crossword.zip" );
            reqHttpHandle(realPath,request, response);

        }else if (fname=='payment'){

            var postData = "";

            request.addListener("data", function (postDataChunk) {
                postData += postDataChunk;
            });

            request.addListener("end", function () {
                console.log('recv finish.');
                var params = querystring.parse(postData);//GET & POST  ////解释表单数据部分{name="zzl",email="zzl@sina.com"}
                console.log(params);


                /*
                 var b = new Buffer('JavaScript');
                 var s = b.toString('base64');
                 // SmF2YVNjcmlwdA==

                 var b = new Buffer('SmF2YVNjcmlwdA==', 'base64')
                 var s = b.toString();
                 // JavaScript
                 */

                var options = {
                    hostname: 'sandbox.itunes.apple.com',
                    port: 443,
                    path: '/verifyReceipt',
                    method: 'POST'
                };
                // base64
                var b = new Buffer('JavaScript');
                var s = b.toString('base64');
                // end
                var data=querystring.stringify({"receipt-data":s});
                var req = https.request(options, function(res) {
                    console.log('STATUS: ' + res.statusCode);
                    console.log('HEADERS: ' + JSON.stringify(res.headers));
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        console.log('BODY: ' + chunk);

                        response.write(chunk);
                        response.end();

                    });
                });

                req.on('error', function(e) {
                    console.log('problem with request: ' + e.message);
                });

                console.log('data: ' + data);
                req.write(data);
                req.end();


            });

        }else if (fname=='paybaidu'){

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
 */

            var postData = "";

            request.addListener("data", function (postDataChunk) {
                postData += postDataChunk;
            });

            request.addListener("end", function () {
                console.log('recv finish.');
                var params = querystring.parse(postData);
//                var params = eval("(" + postData + ")");
                console.log(params);

                var transdata = eval("(" + params.transdata + ")");

                var mysql = new GMySQL();
                mysql.setPayment({result:100,transdata:transdata},
                    function(err,msg){});

            });

        }else{

            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write("<h3>404: Not Found</h3>");
            response.end();

//            reqHttpHandle(realPath,request, response);
        }

    }).listen(port);

    console.log('HTTP Server running at http://localhost:%d/',port);
};

exports.postDataToServer = function(host, port, path, myData, cb){
    var options = {
        host : host,
        port : port,
        path : path,
        method : 'post',
        headers : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : myData.length
        }
    };

    //使用http 发送
    var req = http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        // 设置字符编码
        res.setEncoding('utf8');
        // 返回数据流
        var _data = "";
        // 数据
        res.on('data', function(chunk) {
            _data += chunk;
            console.log('BODY: ' + chunk);
        });
        // 结束回调
        res.on('end', function() {
            console.log("REBOAK:", _data);
            //next(null, {code: 200});
            cb(null,_data);
        });
        // 错误回调 // 这个必须有。 不然会有不少 麻烦
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
            //next(null, {code: 500});
            cb("error");
        });
    });

    req.write(myData + "\n");
    req.end();

};


