/**
 * Created by Administrator on 2014/4/28.
 */

var fs = require('fs');

var GUtils = module.exports = {};

GUtils.MD5 = function(content)
{
    var crypto = require('crypto');
    var md5 = crypto.createHash('md5');
    md5.update(content);
    var ret_md5 = md5.digest('hex');
    return ret_md5;
};

GUtils.JsonFromFile = function(path)
{
    var result;

    try{
        var data = fs.readFileSync(path);
        result = JSON.parse(data);
    }catch(err){}

    return result;
};