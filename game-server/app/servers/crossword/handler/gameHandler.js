var GMySQL = require('../../../services/mysql/GMySQL');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
    this.gameHall = app.get('GGameHall');
    this.gameConfig = app.get('GConfig');
};

// ---------------------------------------------------- //

Handler.prototype.send = function(msg, session, next) {

    if (!session.uid){
        next(null, {code: 500});
        return;
    }

    var val = msg.val;
    var cid = session.get('cid');
    var uid = session.uid;

    if (!val || !cid){
        next(null, {code: 500});
        return;
    }

    var room = this.gameHall.getRoomById(cid);
    room.setUser(uid,'game',val);

    next(null, {code:200});

};

Handler.prototype.chat = function(msg, session, next) {

    if (!session.uid){
        next(null, {code: 500});
        return;
    }

    var chat = msg.chat;
    var cid = session.get('cid');
    var uid = session.uid;

    if (!chat || !cid){
        next(null, {code: 500});
        return;
    }

    var room = this.gameHall.getRoomById(cid);
    room.chat(uid,chat);

    next(null, {code:200});

};

Handler.prototype.use = function(msg, session, next) {

    var conn = GMySQL();

    var uid = session.uid;
    var iid = msg.iid;
    var val = this.gameConfig.getById(iid,'items','price');


    var SQLUseMoney = function(gold)
    {
        var sql = 'UPDATE user SET gold='+(gold-val)+' WHERE name=\''+uid+'\'';
        conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                next(null, {code: 200});
                conn.end();
            });
    };

    var SQLGetMoney = function()
    {
        var sql = 'SELECT * FROM user WHERE name=\''+uid+'\'';
        conn.query(sql,
            function(err, rows, fields) {
                if (err) throw err;

                if (rows.length==1){
                    SQLUseMoney(rows[0]['gold']);
                }else{
                    next(null, {code: 500,msg: 'Register Failed��'});
                    conn.end();
                }
            }
        );
    };

    conn.connect(function(error, results) {
        if(error) {
            console.log('Connection Error: ' + error.message);
            conn.end();
            return;
        }
        console.log('Connected to MySQL');

        SQLGetMoney();
    });
};
