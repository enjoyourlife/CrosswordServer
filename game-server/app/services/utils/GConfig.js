/**
 * Created by Administrator on 2014/4/28.
 */

var fs = require('fs');

var GConfig = function(app,section) {

    var data = fs.readFileSync('./config/games.json');
    var result = JSON.parse(data);
    if (!!section){
        this.config = result[section];
    }else if (!!app){
        this.config = result[app.serverType];
    }else{
        this.config = result;
    }

};

//GConfig.prototype.getCfg = function(key) {
//    return this.config[key];
//};

GConfig.prototype.getById = function(id,section,key,gid) {
    var ret = null;
    var cfg;
    if (gid == null){
        cfg = this.config[section];
    }else{
        cfg = this.config[gid][section];
    }

    for (var i = 0 ; i < cfg.length ; ++ i){
        var item = cfg[i];
        if (!!item && item.id==id){
            if (!!key){
                ret = item[key];
            }else{
                ret = item;
            }
            break;
        }
    }
    return ret;
};

module.exports = GConfig;
