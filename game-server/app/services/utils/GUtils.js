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

GUtils.format = function() {
    if( arguments.length == 0 )
        return null;

    var str = arguments[0];
    for(var i=1;i<arguments.length;i++) {
        var re = new RegExp('\\{' + (i-1) + '\\}','gm');
        str = str.replace(re, arguments[i]);
    }
    return str;
};

/**
 * 格式化数字显示方式
 * 用法
 * formatNumber(12345.999,'#,##0.00');
 * formatNumber(12345.999,'#,##0.##');
 * formatNumber(123,'000000');
 * @param num
 * @param pattern

 */
function formatNumber(num,pattern){
    var strarr = num?num.toString().split('.'):['0'];
    var fmtarr = pattern?pattern.split('.'):[''];
    var retstr='';

    // 整数部分
    var str = strarr[0];
    var fmt = fmtarr[0];
    var i = str.length-1;
    var comma = false;
    for(var f=fmt.length-1;f>=0;f--){
        switch(fmt.substr(f,1)){
            case '#':
                if(i>=0 ) retstr = str.substr(i--,1) + retstr;
                break;
            case '0':
                if(i>=0) retstr = str.substr(i--,1) + retstr;
                else retstr = '0' + retstr;
                break;
            case ',':
                comma = true;
                retstr=','+retstr;
                break;
        }
    }
    if(i>=0){
        if(comma){
            var l = str.length;
            for(;i>=0;i--){
                retstr = str.substr(i,1) + retstr;
                if(i>0 && ((l-i)%3)==0) retstr = ',' + retstr;
            }
        }
        else retstr = str.substr(0,i+1) + retstr;
    }

    retstr = retstr+'.';
    // 处理小数部分
    str=strarr.length>1?strarr[1]:'';
    fmt=fmtarr.length>1?fmtarr[1]:'';
    i=0;
    for(var f=0;f<fmt.length;f++){
        switch(fmt.substr(f,1)){
            case '#':
                if(i<str.length) retstr+=str.substr(i++,1);
                break;
            case '0':
                if(i<str.length) retstr+= str.substr(i++,1);
                else retstr+='0';
                break;
        }
    }
    return retstr.replace(/^,+/,'').replace(/\.$/,'');
};

GUtils.randInt = function(min,max)
{
    return Math.floor(Math.random() * ( max-min + 1)) + min;
};

GUtils.genMapPath = function(level)
{
    var fname = 'map0001.json';
    if (!!level){
        var rand = GUtils.randInt(0,9);
        fname = 'map'+level+'_';
        fname += formatNumber(rand,'0000');
    }
    return fname;
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
