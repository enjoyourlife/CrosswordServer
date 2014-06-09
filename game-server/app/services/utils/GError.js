/**
 * Created by Administrator on 2014/6/9.
 */


var GError = module.exports = {};

GError.New = function(app,eid) {

    var config = app.get('public');

    var ret = config.getById(eid,'errors');

    return ret;

};