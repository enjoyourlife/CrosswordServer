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
var url=require('url');
var fs=require('fs');
var path=require('path');
var querystring = require('querystring');
var GMySQL = require('../mysql/GMySQL');

var getRemoteIp = function(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};

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

    var conn = GMySQL();

    var usr = msg.usr;
    var pwd = msg.pwd;

    if (!usr || !pwd){
        reqMessage(200,{code:500,msg:'Null Err'},request,response);
        return;
    }

    var SQLInsertUser = function()
    {
        var sql = 'INSERT INTO user (name, password) VALUES (\''+usr+'\', \''+pwd+'\')';
        conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                conn.end();
                reqMessage(200,{code:200,msg:'OK'},request,response);
            });
    };

    var SQLFindUser = function()
    {
        var sql = 'SELECT * FROM user WHERE name=\''+usr+'\' AND password=\''+pwd+'\'';
        conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    conn.end();
                    reqMessage(200,{code:500,msg:'Find Err'},request,response);
                }else{
                    SQLInsertUser();
                }
            }
        );
    };

    conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            conn.end();
            reqMessage(200,{code:500,msg:'Conn Err'},request,response);
            return;
        }
        console.log('Connected to MySQL');

        SQLFindUser();
    });

};

exports.createServer = function(){

    var port = (conf.Port || 80);

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
            response.end(getRemoteIp(request).toString());

        }else{

            reqHttpHandle(realPath,request, response);
        }

    }).listen(port);

    console.log('HTTP Server running at http://localhost:%d/',port);
};

// -------------------------------------------- //