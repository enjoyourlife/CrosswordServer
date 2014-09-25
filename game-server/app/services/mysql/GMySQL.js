/**
 * Created by Administrator on 2014/4/27.
 */

var mysql      = require('mysql');

var GMySQL = function() {

    var conn = mysql.createConnection({

        host     : '127.0.0.1',
        database : 'test',
        port     : '3306',
        user     : 'root',
        password : 'kissme'

/*
        host     : 'sqld.duapp.com',
        database : 'JutovcgeAHNrOhqMinSE',
        port     : '4050',
        user     : 'lGErHBMLBEOCHNpfNwNADjDc',
        password : '07wdCHTLAGpFjk9n8mK7iNW3oh0QNt9m'
*/
    });

    this.conn = conn;
};

module.exports = GMySQL;

GMySQL.prototype.End = function() {

    this.conn.end(function(err) {
        if (err){
            if (err.errno != 'ECONNRESET') {
                throw err;
            } else {
                // do nothing
            }
        }
    });

};

GMySQL.prototype.Connect = function(cb,next) {

    var self = this;
    this.conn.connect(function(err, results) {

        if(err) {
            console.log('Connection Error: ' + err.message);
            self.End();
            if (next!=null){
                next(null, {code: 500,eid: 501});
            }
        }else{
            console.log('Connected to MySQL');
            cb();
        }

    });

};

GMySQL.prototype.Query = function(sql,cb) {

    this.conn.query(sql,function(err, rows, fields){

        if (err){
            if (err.errno != 'ECONNRESET') {
                throw err;
            } else {
                // do nothing
            }
        }else{
            cb(rows);
        }

    });

};

GMySQL.prototype.info = function(msg,next) {

    var self = this;

    var uid = msg.uid;
    var gid = msg.gid;

    console.log("uid:"+uid+" gid:"+gid);

    var SQLGetInfo = function()
    {
        var sql = 'SELECT '+gid+'.*,user.nick,user.sex, user.name FROM '+gid+' INNER JOIN user ON user.id = '+gid+'.uid WHERE uid='+uid;

        self.Query(sql,function(rows){

            if (rows.length==1){
                var info = rows[0];
                next(null, {code: 200,info:info});
            }else{
                next(null, {code: 200});
            }
            self.End();

        });

        /*
        self.conn.query('SELECT '+gid+'.*,user.nick,user.sex, user.name FROM '+gid+' INNER JOIN user ON user.id = '+gid+'.uid WHERE uid='+uid,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){

                    var info = rows[0];

                    next(null, {code: 200,info:info});

                }else{

                    next(null, {code: 200});
                }

                self.conn.end();
            });
        */
    };


    self.Connect(SQLGetInfo,next);
    /*
    self.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetInfo();
    });
    */
};

GMySQL.prototype.pay = function(msg,next) {

    var self = this;

    var usr = msg.usr;
    var pwd = msg.pwd;
    var val = msg.val;

    var SQLAddMoney = function(uid,gold)
    {
        var sql;
        if (gold==null){
            sql = 'INSERT INTO crossword (uid,gold) VALUES ('+uid+','+val+')';
        }else{
            sql = 'UPDATE crossword SET gold='+(gold+val)+' WHERE uid='+uid;
        }

        self.Query(sql,function(rows){

            next(null, {code: 200});
            self.End();

        });

        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200});
                self.conn.end();
            });
        */
    };

    /*
     SELECT user.id, crossword.gold
     FROM user
     LEFT JOIN crossword ON user.id = crossword.uid
     WHERE user.name = 'user1'
     AND user.password = 'pwd'
     LIMIT 0 , 30
     */
    var SQLGetMoney = function()
    {
//        var sql = 'SELECT * FROM user WHERE name=\''+usr+'\' AND password=\''+pwd+'\'';

        var sql = 'SELECT crossword.uid, crossword.gold FROM user LEFT JOIN crossword ON user.id = crossword.uid WHERE user.name = \''+usr+'\' AND user.password = \''+pwd+'\' LIMIT 0 , 30';

        self.Query(sql,function(rows){

            if (rows.length==1){
                SQLAddMoney(rows[0]['uid'],rows[0]['gold']);
            }else{
                next(null, {code: 500,msg: 'Register Failed��'});
                self.End();
            }

        });
        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    SQLAddMoney(rows[0]['uid'],rows[0]['gold']);
                }else{
                    next(null, {code: 500,msg: 'Register Failed��'});
                    self.conn.end();
                }
            }
        );
        */
    };


    self.Connect(SQLGetMoney,next);

    /*
    self.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetMoney();
    });
    */
};

GMySQL.prototype.use = function(uid,iid,val,arg,next,cb) {

    var self = this;

    var SQLUseMoney = function(gold)
    {
        var sql = 'UPDATE crossword SET gold='+(gold-val)+' WHERE uid=\''+uid+'\'';

        self.Query(sql,function(rows){

            cb((gold-val));
            next(null, {code: 200,uid:uid,iid:iid,gold:(gold-val),arg:arg});
            self.End();

        });
        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                cb((gold-val));
                next(null, {code: 200,uid:uid,iid:iid,gold:(gold-val),arg:arg});
                self.conn.end();
            });
        */
    };
    /*
     SELECT user.id, crossword.gold
     FROM user
     LEFT JOIN crossword ON user.id = crossword.uid
     WHERE user.name = 'user1'
     LIMIT 0 , 30
     */
    var SQLGetMoney = function()
    {

        var sql = 'SELECT gold FROM crossword WHERE uid='+uid;

        self.Query(sql,function(rows){

            if (rows.length==1){
                var gold = rows[0]['gold'];
                if (gold >= val){
                    SQLUseMoney(gold);
                }else{
                    next(null, {code: 500,gold:gold,eid:1,msg: 'Register A Failed��'});
                    self.End();
                }
            }else{
                next(null, {code: 500,gold:0,eid:1,msg: 'Register B Failed��'});
                self.End();
            }

        });
        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    var gold = rows[0]['gold'];
                    if (gold >= val){
                        SQLUseMoney(gold);
                    }else{
                        next(null, {code: 500,gold:gold,eid:1,msg: 'Register A Failed��'});
                        self.conn.end();
                    }
                }else{
                    next(null, {code: 500,gold:0,eid:1,msg: 'Register B Failed��'});
                    self.conn.end();
                }
            }
        );
        */

    };

    self.Connect(SQLGetMoney,next);

    /*
    self.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetMoney();
    });
    */
};

GMySQL.prototype.reward = function(uid,gold_val,exp_val,next) {

    var self = this;

    var SQLSetReward = function(gold,exp,insert)
    {
        var sql;
        if (insert){
            sql = 'INSERT INTO crossword (uid,gold,exp) VALUES ('+uid+','+gold_val+','+exp_val+')';
        }else{
            sql = 'UPDATE crossword SET gold='+(gold+gold_val)+',exp='+(exp+exp_val)+' WHERE uid='+uid;
        }

        self.Query(sql,function(rows){
            next(null, {code: 200});
            self.End();
        });

        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200});
                self.conn.end();
            });
        */
    };

    var SQLGetReward = function()
    {

        var sql = 'SELECT gold,exp FROM crossword WHERE uid='+uid;

        self.Query(sql,function(rows){

            if (rows.length==1){
                SQLSetReward(rows[0]['gold'],rows[0]['exp'],false);
            }else{
                SQLSetReward(0,0,true);
            }

        });
        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    SQLSetReward(rows[0]['gold'],rows[0]['exp'],false);
                }else{
                    SQLSetReward(0,0,true);
                }
            }
        );
        */
    };

    self.Connect(SQLGetReward,next);

    /*
    this.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetReward();
    });
    */
};

GMySQL.prototype.getWords = function(next) {

    var self = this;
    var words = [];

    var SQLGetWords = function()
    {

        var sql = 'SELECT * FROM word WHERE id >= (SELECT floor(RAND() * (SELECT MAX(id) FROM word))) LIMIT 64';

        self.Query(sql,function(rows){

            if (rows.length>0){
                for (var i = 0 ; i < rows.length ; ++ i){
                    var name = encodeURI(rows[i]['caption']);
                    var tips = encodeURI(rows[i]['rem']);
                    var word = {id:i,name:name,tips:tips};
                    words.push(word);
                }
                next(null,words);
            }

            self.End();

        });

        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length>0){

                    for (var i = 0 ; i < rows.length ; ++ i){
                        var name = encodeURI(rows[i]['caption']);
                        var tips = encodeURI(rows[i]['rem']);
                        var word = {id:i,name:name,tips:tips};
                        words.push(word);
                    }

                    next(null,words);
                }
            }
        );
        */
    };

    self.Connect(SQLGetWords,next);

    /*
    this.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetWords();
    });
    */

};

GMySQL.prototype.getTops = function(msg,next) {
    var self = this;

    var uid = msg.uid;
    var list;

    var SQLGetSelfTops = function()
    {

        var sql = 'SELECT COUNT(*)+1 AS pos FROM escape WHERE score>(SELECT score FROM escape WHERE uid='+uid+')';

        self.Query(sql,function(rows){

            next(null,{code:200,rows:list,pos:rows[0]['pos']});
            self.End();

        });

        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null,{code:200,rows:list,pos:rows[0]['pos']});
                self.conn.end();
            }
        );
        */
    };

    var SQLGetTops = function()
    {

        var sql = 'SELECT * FROM escape ORDER BY score DESC LIMIT 5';

        self.Query(sql,function(rows){

            list = rows;
            SQLGetSelfTops();

        });

        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                list = rows;

                SQLGetSelfTops();
//                next(null,{code:200,rows:rows});
//                self.conn.end();
            }
        );
        */

    };

    self.Connect(SQLGetTops,next);
    /*
    this.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetTops();
    });
    */
};

GMySQL.prototype.setScore = function(msg,next) {

    var self = this;
    var score_new = msg.score;
    var uid = msg.uid;

    var SQLSetScore = function(score,insert)
    {
        var sql;
        if (insert){
            sql = 'INSERT INTO escape (uid,score) VALUES ('+uid+','+score+')';
        }else{
            sql = 'UPDATE escape SET score='+score+' WHERE uid='+uid;
        }

        self.Query(sql,function(rows){

            next(null, {code: 200,update:true});
            self.End();

        });

        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200,update:true});
                self.conn.end();
            });
        */
    };

    var SQLGetScore = function()
    {

        var sql = 'SELECT score FROM escape WHERE uid='+uid;

        self.Query(sql,function(rows){

            if (rows.length==1){
                if (rows[0]['score']<score_new){
                    SQLSetScore(score_new,false);
                }else{
                    next(null, {code: 200,update:false});
                    self.End();
                }
            }else{
                SQLSetScore(score_new,true);
            }

        });

        /*
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    if (rows[0]['score']<score_new){
                        SQLSetScore(score_new,false);
                    }else{
                        self.conn.end();
                        next(null, {code: 200,update:false});
                    }
                }else{
                    SQLSetScore(score_new,true);
                }
            }
        );
        */

    };

    self.Connect(SQLGetScore,next);
    /*
    this.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetScore();
    });
    */

};

GMySQL.prototype.setPayment = function(msg,next) {

    var transdata = msg.transdata;

/*
    result >>
    100：来自支付方，仅当查询为空时插入。表示接受且未生效。
    101：来自客户端，表示使用请求，仅当查询为100时修改结果。表示已生效。
    0：仅查询。
*/

    var result = msg.result;

    if (transdata == null ||
        transdata.plat ==null ||
        transdata.transid == null){

        next(null,{code:500});
        return;
    }

    var where = "WHERE plat="+transdata.plat+" AND transid="+transdata.transid;

    var SQLSetPayment = function(insert) {

        var sql;

        if (insert) {
            sql = 'INSERT INTO payment (appid,waresid,transid,orderno,plat,paytype,money,transtime,result) VALUES ('
                + transdata.appid + ',' + transdata.waresid + ',' + transdata.transid + ','
                + transdata.exorderno + ',' + transdata.plat + ',' + transdata.paytype + ','
                + transdata.money+ ',' + transdata.transtime + ',' + result + ')';
        } else {
            sql = 'UPDATE payment SET result=' + result + ' ' + where;
        }

        self.Query(sql, function (rows) {

            next(null, {code: 200,update:true});
            self.End();

        });

    };

    var SQLGetPayment = function(){

        var sql = 'SELECT id,result FROM payment '+where;

        self.Query(sql,function(rows){

            if (rows.length==1){
                if (result==101){
                    if (rows['result']==100){
                        SQLSetPayment(false);
                    }else{
                        next(null, {code: 500});
                    }
                }else{
                    // result 100 or 0.查到。
                    next(null, {code: 200});
                }
            }else{
                if (result==100){
                    SQLSetPayment(true);
                }else{
                    // result 101 or 0.查不到。
                    next(null, {code: 500});
                }
            }

        });

    };

    self.Connect(SQLGetPayment,next);

};
