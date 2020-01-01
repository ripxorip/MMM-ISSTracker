const request = require('request');
var NodeHelper = require("node_helper");

function get_iss_pos_now(cbk)
{
    let iss_now_url = 'http://api.open-notify.org/iss-now.json';
    let options = {json: true, timeout: 10000};
    try
    {
        request(iss_now_url, options, (error, res, body) => {
            if (error) {
                return console.log(error)
            };

            if (!error && res.statusCode == 200) {
                location = body.iss_position;
                lat = parseFloat(location.latitude);
                lon = parseFloat(location.longitude);
                cbk({ 'lat': lat, 'lon': lon });
            };
        });
    }
    catch (error) {
        console.log('Timeout in get pos')
        console.log(error)
        cbk(undefined);
    }
}

function when_is_iss_at(lat, lon, cbk)
{
    let url = 'http://api.open-notify.org/iss-pass.json';
    url = url + '?lat=' + lat.toString() + '&lon=' +lon.toString();
    let options = {json: true, timeout: 10000};

    try
    {
       request(url, options, (error, res, body) => {
            if (error) {
                return console.log(error)
            };

            if (!error && res.statusCode == 200) {

            passes = body.response
            ret = passes[0]
            currentTime = Date.now();

            if (currentTime > ret.risetime + ret.duration)
            {
                for(var i = 0; i < passes.length; i++)
                {
                    if (passes[i].risetime > currentTime)
                    {
                        ret = passes[i];
                        break;
                    }
                }
            }
                cbk(ret);
            };
        });
    }
    catch(error)
    {
        console.log('Timeout in when is iss');
        console.log(error);
        cbk(undefined);
    }
}

function radians_to_degrees(radians)
{
  var pi = Math.PI;
  return radians * (180/pi);
}

function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

function get_3d_coord(lat, lon, r){
    theta = degrees_to_radians(lat)
    phi = degrees_to_radians(lon)
    x = r * (Math.cos(theta) * Math.cos(phi))
    y = r * (Math.cos(theta) * Math.sin(phi))
    z = r * (Math.sin(theta))
    return {'x': x, 'y': y, 'z': z}
}

function get_elev(c1, c2){
    x = c1.x
    y = c1.y
    z = c1.z
    dx = c2.x - x
    dy = c2.y - y
    dz = c2.z - z

    e = (x*dx + y*dy + z*dz) / Math.sqrt(((x*x + y*y + z*z) * (dx*dx + dy*dy + dz*dz)))
    elev = 90 - radians_to_degrees(Math.acos(e))
    return elev
}

function get_azimuth(c1, c2){
    phi_1 = degrees_to_radians(c1.lat);
    phi_2 = degrees_to_radians(c2.lat);
    delta_lambda = degrees_to_radians(c2.lon - c1.lon);
    y = Math.sin(delta_lambda) * Math.cos(phi_2);
    x = Math.cos(phi_1) * Math.sin(phi_2) - Math.sin(phi_1) * Math.cos(phi_2) * Math.cos(delta_lambda)
    theta = Math.atan2(y, x)
    return Math.round(radians_to_degrees(theta) + 360) % 360
}


function get_distance_between(c1, c2){
    return Math.sqrt(Math.pow((c1.x - c2.x), 2) + Math.pow((c1.y - c2.y), 2) + Math.pow((c1.z - c2.z), 2))
}

function get_hdg_letter(az){
    hdgLetter = ''
    if (az == 0)
        hdgLetter = 'N'
    else if ((az > 0) && (az < 90))
        hdgLetter = 'NE'
    else if (az == 90)
        hdgLetter = 'E'
    else if ((az > 90) && (az < 180))
        hdgLetter = 'SE'
    else if (az == 180)
        hdgLetter = 'S'
    else if ((az > 180) && (az < 270))
        hdgLetter = 'SW'
    else if (az == 270)
        hdgLetter = 'W'
    else if ((az > 270) && (az < 360))
        hdgLetter = 'NW'
    return hdgLetter
}

function get_date_str(d)
{
    var dd = new Date(d);
    var raw_str = ""+dd
    var s = raw_str.split(" ");
    return s[1] + " " + s[2] + " " + s[4]
}

module.exports = NodeHelper.create({

    run_tracker: function(local_coord)
    {
        var self = this;
        var data = {
            'dist': 0,
            'lat': 0,
            'lon': 0,
            'rt': 0,
            'time_to': 0,
            'elev': 0,
            'az': 0,
            'visible': false
        }

        get_iss_pos_now(async function (coord){
            if (typeof coord != "undefined")
            {
                iss_2d_coord = coord;
                iss_3d_coord = get_3d_coord(iss_2d_coord.lat, iss_2d_coord.lon, 6808);

                local_2d_coord = local_coord;
                local_3d_coord = get_3d_coord(local_2d_coord.lat, local_2d_coord.lon, 6400);

                dist = get_distance_between(iss_3d_coord, local_3d_coord)
                elev = get_elev(local_3d_coord, iss_3d_coord)
                az = get_azimuth(local_2d_coord, iss_2d_coord);

                /* Wait one second for next request */
                await new Promise(resolve => setTimeout(resolve, 1000));
                when_is_iss_at(local_2d_coord.lat, local_2d_coord.lon, function(next_passage){
                    rt = new Date(next_passage.risetime*1000);
                    dur = new Date(next_passage.duration*1000);
                    ft = rt + dur

                    currentTime = Date.now();
                    if ((currentTime > rt) && (currentTime < ft))
                    {
                        timediff = ft - currentTime;
                        data.visible = true;
                    }
                    else
                    {
                        timediff = rt - currentTime;
                    }

                    var hours = timediff / (3600*1000);
                    var minutes = 60 * (hours - Math.floor(hours))
                    var seconds = 60 * (minutes - Math.floor(minutes))
                    hours = Math.floor(hours)
                    minutes = Math.floor(minutes)
                    seconds = Math.floor(seconds)

                    var time_to = '' + ("0" + hours).slice(-2) + ':' + ("0" + minutes).slice(-2) + ':' + ("0" + seconds).slice(-2)

                    rt = get_date_str(rt)

                    /* Deliver result */
                    data.dist = dist.toFixed(2);
                    data.elev = elev.toFixed(2) + "°";
                    data.lat = iss_2d_coord.lat + "°";
                    data.lon = iss_2d_coord.lon + "°";
                    data.az = "" + az + "°" + get_hdg_letter(az);
                    data.time_to = time_to;
                    data.rt = rt

                    self.sendSocketNotification('update', data);
                });
            }
        });

    },

    socketNotificationReceived: function(notification, payload) {
        this.run_tracker(payload);
    },
});