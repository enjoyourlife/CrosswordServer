/**
 * Created by Administrator on 2014/4/28.
 */

var fs = require('fs');


var NameMan;
var NameWoMan;

var GUtils = module.exports ={};

GUtils.randName = function(sex){

    var names;
    if (sex == 1){
        if (NameMan==null){
            var data = fs.readFileSync('./data/robotplayername_man.json','utf8');
            NameMan = data.split("*");
        }
        names = NameMan;
    }else{
        if (NameWoMan==null){
            var data = fs.readFileSync('./data/robotplayername_woman.json','utf8');
            NameWoMan = data.split("*");
        }
        names = NameWoMan;
    }
    var rand = GUtils.randInt(0,names.length-1);
    return names[rand];
};

GUtils.codeXOR = function(data,key){
    var ret = "";
    for (var i = 0 ; i < data.length ; ++ i){
        console.log(data.charAt(i));
        ret += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(0));
    }
    return ret;
};

GUtils.getTransData = function(data,plat){
    var ret = {};
    if (plat == 'baidu'){
        //"2274c4183b-uqpy-8884-4018-8438db75b8-c16";
        var orderno = data.exorderno;
        var nums = orderno.split('-');

        var uid_info = nums[0];
        var len = parseInt(uid_info.charAt(0));
        var uid_str = uid_info.substring(1,1+len);

        var wid_org = parseInt(GUtils.codeXOR(nums[1],'A'));
        var wid_dec = parseInt(nums[3]);
        var wid = wid_org - wid_dec;

        ret.uid = uid_str;
        ret.waresid = wid;

        ret.orderno = data.exorderno;
        ret.transid = data.transid;
        ret.appid = data.appid;
        ret.feetype = data.feetype;
        ret.money = data.money;
        ret.count = data.count;
        ret.result = data.result;
        ret.transtype = data.transtype;
        ret.transtime = data.transtime;
        ret.paytype = data.paytype;
        
        ret.plat = plat;
    }else if (plat == 'apple'){

/*

 {
 "receipt":{"original_purchase_date_pst":"2014-11-20 03:18:42 America/Los_Angeles", "purchase_date_ms":"1416682229379", "un
 ique_identifier":"ec809845c1bf0b5c16becc9dc9793de3184579ae", "original_transaction_id":"1000000132431784", "bvrs":"1.5.0",
 "transaction_id":"1000000132732164", "quantity":"1", "unique_vendor_identifier":"3B209896-1CD3-4D18-951E-C197B7719733", "
 item_id":"943517069", "product_id":"kpUnlock", "purchase_date":"2014-11-22 18:50:29 Etc/GMT", "original_purchase_date":"20
 14-11-20 11:18:42 Etc/GMT", "purchase_date_pst":"2014-11-22 10:50:29 America/Los_Angeles", "bid":"org.gamepans.application
 .keysetpiano", "original_purchase_date_ms":"1416482322000"}, "status":0}

 */

        var receipt = data['receipt'];

        ret.uid = data['uid'];  //fix
        ret.waresid = data['waresid'];  //fix

        ret.orderno = receipt['transaction_id'];
        ret.transid = receipt['transaction_id'];
        ret.appid = receipt['bid'];
        ret.feetype = 0;
        ret.money = data['money'];  //fix
        ret.count = receipt['quantity'];
        ret.result = data['status'];
        ret.transtype = 0;
        ret.transtime = receipt['purchase_date'];
        ret.paytype = 0;

        ret.plat = plat;
    }

    return ret;
};

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

GUtils.JsonFromDir = function(path,prefix,type)
{
    var result;
    var file_path = null;
    try{
        var data = fs.readdirSync(path);
//        console.log(path);
//        console.log(data);
//        console.log(prefix);
//        console.log(type);
        var count = 0;
        for(var i=1;i<data.length;i++) {
            var file = data[i];
            if (file.indexOf(prefix)==0 && file.match(type)!=null){
                count = count + 1;
            }
        }
        var rand = GUtils.randInt(1,count);
        count = 0;
        for(var i=1;i<data.length;i++) {
            var file = data[i];
            if (file.indexOf(prefix)==0 && file.match(type)!=null){
                count = count + 1;
                if (count == rand){
                    file_path = file;
                    break;
                }
            }
        }

    }catch(err){}

    if (file_path != null){
        result = GUtils.JsonFromFile(path+file_path);
    }

    return result;
};

