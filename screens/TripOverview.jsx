import * as firebase from "firebase";

import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { findRegion, tripViewComponent } from "./TripViewer";

import { ScrollView } from "react-native-gesture-handler";
import db from "../firebase";

/**
 * This component shows an overview of the trip such as a list of pins and a map
 * of the trip. The user can also enter a trip title and save/edit the trip.
 */
export default function TripOverview({ navigation, route }) {
  const [tripTitle, setTripTitle] = useState("");

  const storage = firebase.storage();

  const getImageUrl = (uri) => {
    const splitURI = uri.split("/");
    const filename = splitURI[splitURI.length - 1];
    const path = "/trip_assets/";
    var storageRef = firebase.storage().ref(path);
    const ref = storageRef.child(`${filename}`);
    const url = "gs://cs-210-project.appspot.com/trip_assets/" + filename;
    return fetch(uri)
      .then((response) => response.blob())
      .then((blob) => {
        return ref.put(blob).then((snapshot) => {
          return storage
            .refFromURL(url)
            .getDownloadURL()
            .then(function (imageUrl) {
              return imageUrl;
            })
            .catch((error) => {
              console.log(error);
            });
        });
      })
      .catch((error) => {
        console.log("Error My Guy!", error);
      });
  };
  const onSaveTrip = () => {
    var tripTitleText = tripTitle["text"];
    if (tripTitleText == null) {
      // Currently using a default name of road trip if user doesn't enter name
      tripTitleText = "Road Trip";
    }
    const promises = [];
    const pins = route.params["pins"];
    const coordinates = route.params["coordinates"];
    const time = route.params["time"];
    for (let pin of pins) {
      if (pin.photos) {
        for (let photo of pin.photos) {
          promises.push(getImageUrl(photo.uri));
        }
      }
    }
    Promise.all(promises).then((urls) => {
      var count = 0;
      for (var i = 0; i < pins.length; i++) {
        if (pins[i].photos) {
          for (photo of pins[i].photos) {
            photo.uri = urls[count];
            count++;
          }
        }
      }
      const user = firebase.auth().currentUser;
      const post = {
        tripTitleText: tripTitleText,
        pins: pins,
        coordinates: coordinates,
        time: time,
        uid: user.uid,
      };
      if (!route.params["isNewTrip"]) {
        console.log("not new trip");
        db.collection("trips")
          .doc(route.params["id"])
          .delete()
          .catch((error) => {
            console.error("Error removing document: ", error);
          });
        navigation.navigate("Profile");
      } else {
        navigation.navigate("Home");
      }
      db.collection("trips")
        .add(post)
        .then(() => {
          console.log("Posts successfully written!");
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    });
  };

  const pinImages = ({ item }) => {
    return (
      <View style={styles.itemContainer}>
        {item.title ? (
          <Text style={styles.pinTitle}>{item.title}</Text>
        ) : (
          <Text style={styles.pinTitle}>Pinned Stop</Text>
        )}
        {item.description != "" && item.description && (
          <Text style={styles.pinDescrip}>{item.description}</Text>
        )}
        {item.photos && (
          <ScrollView horizontal={true}>
            {item.photos.map((photo, i) => (
              <Image
                key={photo.key}
                source={{ uri: photo.uri }}
                style={{ width: 200, height: 200, margin: 5, padding: 5 }}
              />
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <FlatList
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <View style={styles.tripTitleView}>
            <Text style={styles.tripTitleText}> Name </Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Enter trip title"
              onChangeText={(text) => setTripTitle({ text })}
              defaultValue={route.params["tripTitleText"]}
            />
          </View>
        </>
      }
      data={route.params["pins"]}
      renderItem={pinImages}
      keyExtractor={(item, index) => index.toString()}
      ListFooterComponent={
        <>
          <View style={styles.bottom}>
            <View style={styles.map}>
              {tripViewComponent(
                route.params["pins"],
                findRegion(route.params["pins"], route.params["coordinates"]),
                route.params["coordinates"]
              )}
            </View>
            <TouchableOpacity
              onPress={onSaveTrip}
              style={styles.appButtonContainer}
            >
              <Text style={styles.appButtonText}>Save Trip</Text>
            </TouchableOpacity>
          </View>
        </>
      }
    ></FlatList>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  pinTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  pinDescrip: {
    fontSize: 13,
  },
  pinText: {
    fontSize: 11,
  },
  itemContainer: {
    elevation: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 6,
    elevation: 3,
    backgroundColor: "#fff",
    shadowOffset: { width: 1, height: 1 },
    shadowColor: "#333",
    shadowOpacity: 0.3,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tripTitleView: {
    margin: 10,
    alignItems: "stretch",
    height: 40,
    flexDirection: "row",
  },
  tripTitleText: {
    marginTop: 10,
    marginRight: 10,
    fontWeight: "bold",
  },
  titleInput: {
    borderWidth: 1,
    flex: 2,
    borderColor: "#00A398",
    padding: 5,
  },
  appButtonContainer: {
    elevation: 8,
    backgroundColor: "#00A398",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    marginHorizontal: 15,
  },
  appButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.55,
    marginLeft: 22,
    paddingTop: 20,
  },
  bottom: {
    paddingBottom: 20,
  },
});
