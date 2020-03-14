const request = require('request');
var NodeHelper = require("node_helper");
var tracker = require('tracker');

module.exports = NodeHelper.create({
    socketNotificationReceived: function(notification, payload) {
        var self = this;
        tracker.track(payload, function(res){
            self.sendSocketNotification('update', res);
        });
    },
});
