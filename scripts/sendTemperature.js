import { connect } from 'mqtt';
import { parse } from 'url';

var mqtt_url = parse('mqtt://admin:admin@localhost:1883');
var auth = (mqtt_url.auth || ':').split(':');
var url = "mqtt://" + mqtt_url.host;

var options = {
    port: mqtt_url.port,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: auth[0],
    password: auth[1],
};

var client = connect(url, options);

client.on('connect', function() {
    setInterval(function() {
        var temperature = (Math.floor(Math.random() * 30)).toString();
        client.publish('iot/sensors/temperature', temperature, function() {
            console.info("Sent temp -> ", temperature)
        })
    }, 10000)
})