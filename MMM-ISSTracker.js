/* global Module */

/* Magic Mirror
 * Module: ISS Tracker
 *
 * By Philip Karlsson Gisslow
 * MIT Licensed.
 */

Module.register("MMM-ISSTracker", {

    // Default module config.
    defaults: {
        lat: 56.108715,
        lon: 15.661008
    },

    getStyles: function(){
        return ['modules/MMM-ISSTracker/MMM-ISSTracker.css']
    },

    start: function () {
        var self = this;
        self.sendSocketNotification('get_state', {'lat': self.config.lat, 'lon': self.config.lon});
        setInterval(function () {
            self.sendSocketNotification('get_state', {'lat': self.config.lat, 'lon': self.config.lon});
        }, 4000);
    },

    socketNotificationReceived: function(notification, payload) {
        this.data = {...payload};
        this.updateDom();
    },

    createRow: function (wrapper, type, value) {
        let headerRow = document.createElement('tr');
        headerRow.className = 'normal';

        let cell = document.createElement('td');
        cell.innerHTML = type;
        cell.className = 'bold align-left'

        let cell2 = document.createElement('td');
        cell2.innerHTML = value
        cell2.className = 'align-right'

        headerRow.append(cell);
        headerRow.append(cell2);

        wrapper.append(headerRow);
    },

    // Override dom generator.
    getDom: function () {
        var wrapper = document.createElement("div");

        var header = document.createElement("div");
        header.className = "light bright";

        var sp1 = document.createElement("span");
        sp1.className = "fas fa-satellite";
        var sp2 = document.createElement("span");

        if (this.data.visible)
        {
            sp2.innerHTML = "    ISS VISIBLE!";

        }
        else
        {
            sp2.innerHTML = "    ISS Tracker";
        }
        header.append(sp1);
        header.append(sp2);

        wrapper.append(header);

        var separator = document.createElement("header");
        separator.innerHTML = "Realtime stats";
        wrapper.append(separator);

        var table = document.createElement("table");
        table.className = 'small';

        if (!this.data.visible)
        {
            this.createRow(table, 'Next:', this.data.rt);
        }
        this.createRow(table, 'Distance to ISS', this.data.dist+'km');
        this.createRow(table, 'ISS latitude:', this.data.lat);
        this.createRow(table, 'ISS longitude:', this.data.lon);
        this.createRow(table, 'Heading:', this.data.az);
        this.createRow(table, 'Elevation:', this.data.elev);
        if (this.data.visible)
        {
            this.createRow(table, 'Set in:', this.data.time_to);
        }
        else
        {
            this.createRow(table, 'Rise in:', this.data.time_to);
        }

        wrapper.append(table);

        return wrapper;
    }

});
