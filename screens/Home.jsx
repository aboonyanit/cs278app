import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import React, { useEffect, useState } from "react";
import * as firebase from "firebase";
import db from "../firebase";
import moment from "moment";
import { findRegion, tripViewComponent } from "./TripViewer";

export default function Home({ navigation }) {
  const [feedItems, setFeedItems] = useState(["asdasd"]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeedTrips();
  }, []);

  const loadFeedTrips = async () => {
    setIsLoading(true);
    setFeedItems([]);
    const feedTrips = await parseTripsForFeed();
    setFeedItems(feedTrips);
    setIsLoading(false);
  };

  const parseTripsForFeed = async () => {
    const parsedTrips = [];
    const followedUserIds = await fetchMyFollowing();
    const tripsFromDatabase = await fetchUsersTrips(followedUserIds);
    const userIdToNameMap = await fetchUsersNames(followedUserIds);
    tripsFromDatabase.forEach(trip => {
      const tripData = trip.data();
      const usersId = tripData["uid"];
      tripData["usersName"] = userIdToNameMap[usersId];
      tripData["id"] = trip.id;
      tripData["tripTitle"] = tripData.tripTitleText;
      parsedTrips.push(tripData);
    });
    return parsedTrips;
  }

  const fetchMyFollowing = async () => {
    const myUid = firebase.auth().currentUser.uid;
    const userDoc = await db.collection("users").doc(myUid).get();
    const followedUserIds = userDoc.data()["following"];
    return followedUserIds;
  };

  const fetchUsersTrips = async (userIds) => {
    const trips = db.collection("trips")
      .where("uid", "in", userIds)
      .orderBy("time", "desc")
      .get();
    return trips;
  }

  const fetchUsersNames = async (userIds) => {
    const userIdToName = {}
    const users = await db.collection("users")
      .where("uid", "in", userIds)
      .get();
    users.forEach(user => {
      const userData = user.data();
      const uid = userData["uid"];
      const name = userData["displayName"];
      userIdToName[uid] = name;
    });
    return userIdToName;
  };

  const pastTripComponent = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("Past Trip", item)}
        style={styles.itemContainer}
      >
        <View style={styles.cardHeader}>
          <View style={styles.row}>
            <Text style={styles.tripName}>{item.tripTitle}</Text>
            <Text>{moment(item.time, moment.ISO_8601).format("LLL")}</Text>
          </View>
          <Text>by {item.usersName}</Text>
        </View>
        <View style={styles.tripCard}>
          {tripViewComponent(item.pins, findRegion(item.pins, item.coordinates), item.coordinates)}
        </View>
      </TouchableOpacity>
    );
  };

  const noTripsComponent = () => {
    return (
      <Text style={styles.noTripText}>
        <Text>Your feed is currently empty!{"\n"}</Text>
        <Text>Follow more friends to see their trips here</Text>
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Road Trip Buddy</Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList 
          data={feedItems} 
          renderItem={pastTripComponent} 
          ListEmptyComponent={noTripsComponent} 
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  header: {
    fontSize: 30,
    color: "#8275BD",
    fontWeight: "bold",
    alignSelf: "center",
    marginVertical: 5,
  },
  itemContainer: {
    borderRadius: 6,
    elevation: 3,
    backgroundColor: "#fff",
    shadowOffset: { width: 1, height: 1 },
    shadowColor: "#333",
    shadowOpacity: 0.3,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  cardHeader: {
    margin: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  tripName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  tripCard: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.4,
    paddingLeft: 10,
    paddingTop: 15,
  },
  noTripText: {
    paddingTop: Dimensions.get("window").height * 0.35,
    fontSize: 16,
    alignSelf: "center",
    textAlign: "center",
  },
});
