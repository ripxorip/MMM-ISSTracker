var nh = require('../tracker.js');

var local_coord = {
    lat: 56.108715,
    lon: 15.661008
}

nh.track(local_coord, function(data){
    console.log(data);
});
