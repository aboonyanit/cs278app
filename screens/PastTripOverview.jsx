import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import React from "react";
import moment from "moment";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";

import { ScrollView } from "react-native-gesture-handler";
import { findRegion, tripViewComponent } from "./TripViewer";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import db from "../firebase";

/**
 * This component shows an overview of the trip such as a list of pins and a map
 * of the trip. It allows you to delete the trip.
 */
export default function PastTripOverview({ navigation, route }) {
  const { pins, tripTitle, time, coordinates, id } = route.params;

  const onDeleteTrip = () => {
    db.collection("trips")
      .doc(route.params["id"])
      .delete()
      .then(() => {
        navigation.navigate("Profile");
      })
      .catch((error) => {
        console.error("Error removing document: ", error);
      });
  };

  const onEditTrip = () => {
    const data = {
      tripTitleText: tripTitle,
      pins: pins,
      coordinates: coordinates,
      time: time,
      id: id,
      isNewTrip: false,
    };
    navigation.navigate("Trip Overview", data);
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
      style={styles.container}
      ListHeaderComponent={
        <>
          <View style={styles.row}>
            <Text style={styles.header}> {tripTitle} </Text>
            <Menu>
              <MenuTrigger>
                <Text>
                  <MaterialCommunityIcons
                    style={styles.icon}
                    name="dots-horizontal"
                    color={"#808080"}
                    size={26}
                  />
                </Text>
              </MenuTrigger>
              <MenuOptions>
                <MenuOption onSelect={onDeleteTrip} text="Delete trip" />
                <MenuOption onSelect={onEditTrip} text="Edit trip" />
              </MenuOptions>
            </Menu>
          </View>
          <Text style={styles.date}>
            {" "}
            {moment(time, moment.ISO_8601).format("LLL")}
          </Text>
        </>
      }
      data={route.params["pins"]}
      renderItem={pinImages}
      keyExtractor={(item, index) => index.toString()}
      ListFooterComponent={
        <>
          <View style={styles.map}>
            {tripViewComponent(
              pins,
              findRegion(pins, coordinates),
              coordinates
            )}
          </View>
        </>
      }
    ></FlatList>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 30,
    fontWeight: "bold",
    padding: 10,
    paddingBottom: 0,
    width: 370,
  },
  icon: {
    marginLeft: 50,
    marginTop: 15,
  },
  row: {
    flexDirection: "row",
  },
  date: {
    fontSize: 10,
    padding: 10,
    paddingLeft: 15,
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
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.6,
    marginLeft: 22,
    paddingTop: 20,
  },
});
