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


GMySQL.prototype.pay = function(msg,next) {

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

        this.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200});
                this.conn.end();
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
        var sql = 'SELECT user.id, crossword.gold FROM user LEFT JOIN crossword ON user.id = crossword.uid WHERE user.name = \''+usr+'\' AND user.password = \''+pwd+'\' LIMIT 0 , 30';
        this.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    SQLAddMoney(rows[0]['id'],rows[0]['gold']);
                }else{
                    next(null, {code: 500,msg: 'Register Failed��'});
                    this.conn.end();
                }
            }
        );
    };

    this.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            this.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetMoney();
    });

};

GMySQL.prototype.use = function(usr,val,next) {

    var SQLUseMoney = function(uid,gold)
    {
        var sql = 'UPDATE crossword SET gold='+(gold-val)+' WHERE uid=\''+uid+'\'';
        this.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200});
                this.conn.end();
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

        var sql = 'SELECT user.id, crossword.gold FROM user LEFT JOIN crossword ON user.id = crossword.uid WHERE user.name=\''+usr+'\' LIMIT 0 , 30';
        this.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    var gold = rows[0]['gold'];
                    if (gold >= val){
                        SQLUseMoney(rows[0]['id'],gold);
                    }else{
                        next(null, {code: 500,msg: 'Register Failed��'});
                        this.conn.end();
                    }
                }else{
                    next(null, {code: 500,msg: 'Register Failed��'});
                    this.conn.end();
                }
            }
        );
    };

    this.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            this.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetMoney();
    });
};

GMySQL.prototype.reward = function(usr,gold_val,exp_val,next) {

    var SQLSetReward = function(uid,gold,exp)
    {
        var sql = 'UPDATE crossword SET gold='+(gold+gold_val)+',exp='+(exp+exp_val)+' WHERE uid=\''+uid+'\'';
        this.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200});
                this.conn.end();
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

        var sql = 'SELECT user.id, crossword.gold, crossword.exp FROM user LEFT JOIN crossword ON user.id = crossword.uid WHERE user.name=\''+usr+'\' LIMIT 0 , 30';
        this.conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    if (!!rows[0]['gold']){
                        SQLSetReward(rows[0]['id'],rows[0]['gold'],rows[0]['exp']);
                    }else{
                        next(null, {code: 500,msg: 'Register Failed��'});
                        this.conn.end();
                    }
                }else{
                    next(null, {code: 500,msg: 'Register Failed��'});
                    this.conn.end();
                }
            }
        );
    };

    this.conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            this.conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetReward();
    });
};