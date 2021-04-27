import * as firebase from "firebase";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { findRegion, tripViewComponent } from "./TripViewer";

import db from "../firebase";
import moment from "moment";
import { useFocusEffect } from "@react-navigation/native";

/**
 * This component shows a profile which includes the number of followers
 * and people you are following. It also contains a list of all past trips
 * when user presses the "Profile" button from the tab bar. Clicking on
 * a past trip will take you to the trip overview.
 */
export default function PastTrips({ navigation, route }) {
  const { item } = route.params;
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [pastTrips, setPastTrips] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const parseTripsFromDatabase = (tripsFromDatabase) => {
    const parsedTrips = [];
    const uid = firebase.auth().currentUser.uid;
    const usersRef = firebase.firestore().collection("users");
    usersRef.doc(uid).onSnapshot((userDoc) => {
      if (userDoc.data()["following"].includes(item.uid)) {
        setIsFollowing(true);
        tripsFromDatabase.forEach((trip) => {
          const tripData = trip.data();
          if (tripData.uid == item.uid) {
            tripData["id"] = trip.id;
            tripData["tripTitle"] = tripData.tripTitleText;
            parsedTrips.push(tripData);
          }
        });
      }
    });
    return parsedTrips;
  };

  const loadPastTrips = async () => {
    setLoading(true);
    setPastTrips([]);
    const collRef = db.collection("trips");
    const tripsFromDatabase = await collRef.orderBy("time", "desc").get();
    const parsedTrips = parseTripsFromDatabase(tripsFromDatabase);
    setPastTrips(parsedTrips);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPastTrips();
      getFriendUser();
    }, [])
  );

  const getFriendUser = () => {
    const usersRef = firebase.firestore().collection("users");
    usersRef.doc(item.uid).onSnapshot((userDoc) => {
      setFollowers(userDoc.data()["followers"]);
      setFollowing(userDoc.data()["following"]);
    });
  };

  const onFollowUser = async () => {
    const myUid = firebase.auth().currentUser.uid;
    const myRef = firebase.firestore().collection("users").doc(myUid);
    const theirRef = firebase.firestore().collection("users").doc(item.uid);
    const myRes = myRef.update({
      following: firebase.firestore.FieldValue.arrayUnion(item.uid)
    });
    const theirRes = theirRef.update({
      followers: firebase.firestore.FieldValue.arrayUnion(myUid)
    });
    Promise.all([myRes, theirRes])
      .then(() => setIsFollowing(true))
      .catch(error => alert(error));
  }

  const onUnfollowUser = async () => {
    const myUid = firebase.auth().currentUser.uid;
    const myRef = firebase.firestore().collection("users").doc(myUid);
    const theirRef = firebase.firestore().collection("users").doc(item.uid);
    const myRes = myRef.update({
      following: firebase.firestore.FieldValue.arrayRemove(item.uid)
    });
    const theirRes = theirRef.update({
      followers: firebase.firestore.FieldValue.arrayRemove(myUid)
    });
    Promise.all([myRes, theirRes])
      .then(() => setIsFollowing(false))
      .catch(error => alert(error));
  }

  const pastTripComponent = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("Past Trip", item)}
        style={styles.itemContainer}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.tripName}>{item.tripTitle}</Text>
          <Text>{moment(item.time, moment.ISO_8601).format("LLL")}</Text>
        </View>
        <View style={styles.tripCard}>
          {tripViewComponent(item.pins, findRegion(item.pins, item.coordinates), item.coordinates)}
        </View>
      </TouchableOpacity>
    );
  };

  const noTripsComponent = () => {
    return (
      <Text style={styles.noTripText}>No trips to display!</Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.name}>
        {item.displayName}
      </Text>
      <View style={styles.row}>
        <Text style={styles.follow}>{followers.length} Followers</Text>
        <Text style={styles.follow}>{following.length} Following</Text>
        {isFollowing ? (
          <TouchableOpacity 
            onPress={onUnfollowUser}
            style={[styles.button, {backgroundColor: "#AEB8C1"}]}>
            <Text style={styles.buttonText}>
              Following
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onFollowUser}
            style={[styles.button, {backgroundColor: "#00A398"}]}>
            <Text style={styles.buttonText}>
              Follow
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.header}>Past Trips</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        isFollowing ? (
          <FlatList 
            data={pastTrips} 
            renderItem={pastTripComponent}
            ListEmptyComponent={noTripsComponent}
          />
        ) : (
          <View style={styles.private}>
            <Text style={styles.privateLargeText}>This Account is Private</Text>
            <Text style={styles.privateText}>Follow this account to see their trips.</Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  private: {
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
    marginTop: 15,
  },
  name: {
    fontSize: 35,
    color: "#8275BD",
    fontWeight: "bold",
    margin: 15,
  },
  follow: {
    fontSize: 15,
    fontWeight: "bold",
    margin: 15,
  },
  privateText: {
    fontSize: 15,
    margin: 15,
  },
  privateLargeText: {
    fontSize: 15,
    margin: 15,
    fontWeight: "bold",
  },
  header: {
    fontSize: 24,
    margin: 15,
    fontWeight: "bold",
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
  tripName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  tripCard: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.4,
    paddingLeft: 10,
    paddingTop: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    margin: 5,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "white",
  },
  noTripText: {
    fontSize: 15,
    alignSelf: "center",
  },
});
