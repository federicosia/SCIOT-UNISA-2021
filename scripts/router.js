var MongoClient = require("mongodb").MongoClient;
var mqtt = require("mqtt"), url = require("url");
var jsonConfig = require("../env.json")

var mqtt_url = url.parse('mqtt://admin:admin@172.17.0.1:1883');
var auth = (mqtt_url.auth || ':').split(':');
var url = "mqtt://" + mqtt_url.host;

var options = {
    port: mqtt_url.port,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: auth[0],
    password: auth[1]
};

var uri = jsonConfig.mongodb_uri 
var thi = -255

function loadDataToDB(thi_value) {
    MongoClient.connect(uri, function(err, db){
        if(err) 
            throw err;
        var thi_collection = db.db("sciot").collection("thi"); 
        const date = new Date()
        const dateString = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear()
        var obj = {date : dateString, thi : thi_value};
        
        thi_collection.insertOne(obj, function(err, res){
            if(err)
                throw err;
            db.close();
        });
    });
}

exports.handler = function(context, event) {
    var clientMQTT = mqtt.connect(url, options);
    
    clientMQTT.on('connect', function() {
        clientMQTT.subscribe("iot/logs");
    })
    
    clientMQTT.on('message', function (topic, message) {
        thi = message.toString();
        if(event.trigger.kind !== "http")
            loadDataToDB(thi);
        clientMQTT.end()
        context.callback(JSON.stringify(thi))
    });
}