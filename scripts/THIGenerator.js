var mqtt = require("mqtt"), url = require("url");

var mqtt_url = url.parse('mqtt://admin:admin@172.17.0.1:1883');
var auth = (mqtt_url.auth || ':').split(':');
var url = "mqtt://" + mqtt_url.host;

var options = {
    port: mqtt_url.port,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: auth[0],
    password: auth[1],
};

const DEFAULT_VALUE = -255;
var temperature = DEFAULT_VALUE;
var humidity = DEFAULT_VALUE;

exports.handler = function(context, event) {
    var client = mqtt.connect(url, options);

    client.on('connect', function() {
        client.subscribe(["iot/sensors/temperature", "iot/sensors/humidity"], function(err){
            if(err){
                console.error("Error on subscribing...");
            }
        });
    });
    client.on('message', function (topic, message) {
        var topicName = topic.split("/").pop();
    
        switch(topicName){
            //temperature
            case "temperature":
                temperature = message.toString(); 
            break;
            //humidity
            case "humidity":
                humidity = message.toString();
            break;
        }
        if((temperature != DEFAULT_VALUE) && (humidity != DEFAULT_VALUE)){
            //THI
            var thi_index = (Math.floor(((1.8 * temperature) - ((1 - (humidity / 100)) * (temperature - 14.3))) + 32)).toString();

            client.publish("iot/logs", thi_index, function(){
                client.end();
                temperature = DEFAULT_VALUE;
                humidity = DEFAULT_VALUE;
                var infos = " Temp -> "+ temperature + ", Humi -> " + humidity;
                context.callback('MQTT values received, THI : ' + thi_index + infos + ", sending to logs."); 
            });
        } else console.log("Aspetto dati mancanti...");
    });
};