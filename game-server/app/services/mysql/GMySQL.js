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
    });

    this.conn = conn;
};

module.exports = GMySQL;

GMySQL.prototype.info = function(msg,next) {

    var self = this;

    var uid = msg.uid;
    var gid = msg.gid;

    var SQLGetInfo = function()
    {
        self.conn.query('SELECT * FROM '+gid+' WHERE uid='+uid,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){

                    var info = rows[0];

                    next(null, {code: 200,info:info});

                }else{
                    next(null, {code: 500,msg: 'Login Failed��'});
                }

                self.conn.end();
            });
    };

    self.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetInfo();
    });

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

        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200});
                self.conn.end();
            });
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
    };

    self.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetMoney();
    });

};

GMySQL.prototype.use = function(uid,val,next) {

    var self = this;

    var SQLUseMoney = function(gold)
    {
        var sql = 'UPDATE crossword SET gold='+(gold-val)+' WHERE uid=\''+uid+'\'';
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200});
                self.conn.end();
            });
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
        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    var gold = rows[0]['gold'];
                    if (gold >= val){
                        SQLUseMoney(gold);
                    }else{
                        next(null, {code: 500,msg: 'Register Failed��'});
                        self.conn.end();
                    }
                }else{
                    next(null, {code: 500,msg: 'Register Failed��'});
                    self.conn.end();
                }
            }
        );
    };

    self.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetMoney();
    });
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

        self.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200});
                self.conn.end();
            });
    };
    /*
     SELECT user.id, crossword.gold
     FROM user
     LEFT JOIN crossword ON user.id = crossword.uid
     WHERE user.name = 'user1'
     LIMIT 0 , 30
     */
    var SQLGetReward = function()
    {

        var sql = 'SELECT gold,exp FROM crossword WHERE uid='+uid;
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
    };

    this.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            self.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetReward();
    });
};
