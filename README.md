# Preventing heat stress on cattle  
## Abstract  

The idea is to find a cheap way to keep heat under control and prevent stress on cattle. In developing this application, we aimed for a tool that can give support to a livestock farmer to be able to provide support and relief to the livestock on days of high heat, such as preparing a specific diet, activating fans or water sprayers.

The temperature isn't the only thing to keep under control, humidity plays a key role. With both values we can calculate the temperature humidity index (THI) to keep track of the stress caused by heat on animals.  

A client application will be used to show the obtained THI value to the user and, based on the received THI value, a color will be shown to indicate the current situation. In case of intense heat, ventilators and water nebulizers can be automatically activated to provide relief to the animals.

All the values are stored in a database and downloadable to keep track of the climate in the farm over a given period of time. All the values acquired during the weeks is possible to figure out how to react and support animals, for example add specific supplements in the food to compensate for deficiencies due to climatic conditions (sweating, etc...).  

Services:
- **MongoDB Atlas** NoSQL database on cloud used to store THI values
- **Data API** lets you read and write data in MongoDB Atlas with HTTPS requests.

Tools:  
- **Docker** to create, deploy and run applications by using containers  
- **Docker Compose** tool for running multi-container Docker applications.  
- **Nuclio** serverless framework, uses Docker Compose to create, build and deploy serverless functions as Docker containers.  
- **RabbitMQ** message broker    
- **React Native** used to develop a client application that fetch and shows THI values on screen, also download all the THI values stored in the database and showing the current state of ventilators and water nebulizers.    
- **Node.js** asynchronous event-driven JavaScript runtime used to simulate sensors, build and execute the client using Expo.
- **Expo** open-source platform for making universal apps for Android, iOS with Javascript and React

Libraries:  
- **MQTT.js** client library for MQTT protocol

## Architecture  

![Architecture](/assets/architecture.png)

This is the architecture of the project, it’s composed of:  
- 2 sensors, one for the temperature and one for the humidity. Both values are send to their respective topics.
- The serverless function “THI” has a trigger on both topics, when one message for each topic is consumed then it generetes a thi value that is sent to thi topic.
- The router functions triggers when a message is stored in THI topic, it consumes it and stores the value in the DB.
- The React Native client fetch the thi value from the serverless function sending HTTP requests every 10 seconds, if the router has a value it will responde with the thi value, otherwise nothing. The client can also fetch data from the server to gain the last 30 thi values to get indications regarding the trend of THI values (can be useful activate ventilators, water sprayers).


## How it works  

The application is composed by 4 functions:  
- **sendTemperature**, sends a new temperature value on the topic `iot/sensors/temperature` every 10 seconds. Executed locally using `node`.  
- **sendHumidity**, sends a new humidity value on the topic `iot/sensors/humidity` every 10 seconds. Executed locally using `node`.  
- **THIGenerator**, is triggered by a new MQTT message on the topic `iot/sensors/humidity` or `iot/sensors/temperature`, when one value of temperature and humidity are received a THI value is generated and sent to the topic `iot/logs`.  
- **router**, is triggered by a new MQTT message on the topic `iot/logs`, when a new value is received sends it to a MongoDB database where is stored with the current date. If a client is listening it will receive the THI value too as HTTP message.

**N.B**: The time values used for temperature and humidity generation are for demonstration purposes only, but in practice the generation of values for THI calculation should occur after a few hours.  

### Client app  

The client application is written inside **App.js**, the application pulls the message by sending a request to the function:  

```javascript
fetch(uri).then(response => {
    response.json().then(json => {
        console.log(json)
        thi.current = json
        switch(true) {
            case (thi.current >= 90):
                setColor("#e931ba")
                break
            case (thi.current >= 80 && thi.current <= 89):
                setColor("#ff8800")
                break
            case (thi.current >= 72 && thi.current <= 79):
                setColor("#ffff00")
                break
            case (thi.current < 72):
                setColor("#68ff00")
                break
        }
    }).catch(err => {console.log("ERRORE RESPONSE", err)})
}).catch(err => console.log("ERRORE FETCH", err))
```
the value **thi** received is used to show a color on the screen with the aim of alerting the user to the status of the farm at that moment and react accordingly in case of problems.  

Four colors are used:  
- **Green** when THI is less or equal to 72  
- **Yellow** when THI is between 72 and 79  
- **Orange** when THI is between 80 and 89  
- **Purple** when THI is equal to more than 90

There is a button that allows the user to download all the thi values stored in the mongoDB database (it sends a HTTP request to an URL thanks to **Data API**) and prepare a plan to safeguard the animals in case of catastrophic events. For example, prepare an ad-hoc diet, buy specific medicines or transfer the animals.

```javascript
fetch(jsonConfig.mongogb_urlEndpoint + "/action/find", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Access-Control-Request-Headers": "*",
        "api-key": jsonConfig.dataAPIprivateKey,
    },
    body: JSON.stringify({
        "dataSource": "SCIOT-Cluster",
        "database": "sciot",
        "collection": "thi",
        "sort": { "date": 1 },
        "limit": 30,
        "projection": {
            "date": 1,
            "thi": 1,
            "_id": 0
        }
    })
})
```
In the body there's the query to the mongoDB database to download the last 30 values.

All values are then saved in the user's smartphone as a `.CSV` file with the fields THI, containing the corresponding THI value, and date containing the date of receipt of the value. 

## Installation & run

Start Nuclio using a docker container:  

```
docker run -p 8070:8070 -v /var/run/docker.sock:/var/run/docker.sock -v /tmp:/tmp nuclio/dashboard:stable-amd64
```

Browse to http://localhost:8070, create a project, and add the functions.  

Start RabbitMQ using a docker container with MQTT enabled:

```
docker run -p 9000:15672  -p 1883:1883 -p 5672:5672  hansehe/rabbitmq-mqtt 
```

Browse to http://localhost:9000, go in `Queues` section and add following three queues:

```
iot/sensors/temperature
iot/sensors/humidity
iot/logs
```

After that open the project's directory in a terminal and run the command:

```
npm install
```

It will install all the modules needed to run the client.

Install [Expo](https://play.google.com/store/apps/details?id=host.exp.exponent) on your Android or iOS (not tested on iOS if the app works correctly) smartphone and follow the istructions to setup the app.

Then, on terminal, run `expo start` to launch the application and scan the QRcode that appear in the terminal with Expo's app.

To send values `cd scripts` and then `node sendTemperature.js` and `node sendHumidity.js` to generate random values needed to calculate THI, after a while the client should start receiving data.  

## References  

[THI](https://elearning.unipd.it/scuolaamv/pluginfile.php/19330/mod_resource/content/1/THI.pdf)  
[Heat is a serious threat to dairy cows](https://theconversation.com/heat-is-a-serious-threat-to-dairy-cows-were-finding-innovative-ways-to-keep-them-cool-84494)
