import { Dimensions, StyleSheet, Text, View, TouchableOpacity, LogBox, Alert, Image } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import * as FileSystem from "expo-file-system"
import * as MediaLibrary from "expo-media-library"
import * as Permission from "expo-permissions"
import * as jsonConfig from "./env.json"
import Constans from "expo-constants"

export default function App() {
	const thi = useRef(-255)
	const [color, setColor] = useState("white")
	const { manifest } = Constans
	const uri = `http://${manifest.debuggerHost.split(':').shift()}:10300`;
	LogBox.ignoreAllLogs();
	//console.log("IP -> ", uri)

	useEffect(() => {
		const id = setInterval(() => {
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
		}, 3000)

		return () => clearInterval(id)
	}, [])

	const downloadHistory = () => {
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
		}).then(response => {
			response.json().then(json => {
				var path = FileSystem.documentDirectory	+ "history.csv"
				//create the csv file
				console.log("PATH -> ", path)
				var csv = "Date\tthi\n"
				for(var doc of json.documents)
					csv += doc.date + "\t" + doc.thi + "\n"
				console.log(csv)

				FileSystem.writeAsStringAsync(path, csv)
					.then(() => {
						const perm = Permission.askAsync(Permission.MEDIA_LIBRARY)
							.then(result => {
								if(result.status === "granted"){
									const asset = MediaLibrary.createAssetAsync(path)
										.then(() => {
											//Create alert
											Alert.alert('Informazione', 'Log scaricato con successo!', [
												{
													text: 'Cancel',
													onPress: () => console.log('Cancel Pressed'),
													style: 'cancel',
												},
												{ text: 'OK', onPress: () => console.log('OK Pressed') },
											]);
											console.log("Log scaricati!")

										})
										.catch((err) => {
											console.log(err)
										})
								}
							})
							.catch((err) => {
								console.log(err)
							})
					})
					.catch(err => console.log(err))
			})
		}).catch(err => {
			console.log(err)
		})
	}

	return (
		<View style={styles.container}>
			<View style={styles.top}>
				<Text style = { {fontSize: 23, paddingBottom: 10} }>Valore thi</Text>
				<View style = {{ alignItems: "center", flexDirection: 'column' }}>
					<Text style = { {fontSize: 23} }>{ thi.current }</Text>
					<View style = {{
						borderRadius: Math.round(Dimensions.get('window').width + Dimensions.get('window').height) / 2,
						width: Dimensions.get('window').width * 0.1,
						height: Dimensions.get('window').width * 0.1,
						backgroundColor: color,
						justifyContent: 'center',
						alignItems: 'center',
						marginTop: 20	
					}}
					/>
				</View>
				<TouchableOpacity
					style = {styles.storico}
					onPress = {downloadHistory}
				>
					<Text style = {{fontSize: 18, color: "white"}}>Scarica storico</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.bottom}>
				<View style={styles.element}>
					<Image
						style={styles.image}
						source={require("./assets/fan.png")}
					/>
					<View style={{
						borderRadius: Math.round(Dimensions.get('window').width + Dimensions.get('window').height) / 2,
						width: Dimensions.get('window').width * 0.1,
						height: Dimensions.get('window').width * 0.1,
						backgroundColor: (thi.current >= 72) ? "#68ff00" : "red",
						marginTop: 20
					}}/>
				</View>
				<View style={styles.element}>
					<Image
						style={styles.image}
						source={require("./assets/water_nebulizer.jpg")}
					/>
					<View style={{
						borderRadius: Math.round(Dimensions.get('window').width + Dimensions.get('window').height) / 2,
						width: Dimensions.get('window').width * 0.1,
						height: Dimensions.get('window').width * 0.1,
						backgroundColor: (thi.current >= 80) ? "#68ff00" : "red",
						marginTop: 20
					}}/>
				</View>
			</View>
		</View>
	);
}

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: '#fff',
			alignItems: 'center',
			justifyContent: 'center',
		},
		top: {
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: 30
		},
		bottom: {
			flex: 0.3,
			marginTop: 30,
			flexDirection: "row",
			alignItems: "center"
		},
		element: {
			padding: 10,
			alignItems: "center"
		},
		image: {
			width: 100,
			height: 100
		},
		storico: {
			backgroundColor: "#0095a4",
			padding: 15,
			borderRadius: 15,
			marginTop: 40
		}
});
