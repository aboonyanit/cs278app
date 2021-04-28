import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import * as firebase from "firebase";
import db from "../firebase";
import moment from "moment";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function Home({ navigation }) {
  const [feedItems, setFeedItems] = useState(["asdasd"]);
  const [isLoading, setIsLoading] = useState(true);
  const [likesUsers, setLikesUsers] = useState({});
  const myUid = firebase.auth().currentUser.uid;

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
    const likeUserDict = {};
    for (let tripBatch of tripsFromDatabase) {
      tripBatch.forEach((trip) => {
        const tripData = trip.data();
        const usersId = tripData["uid"];
        tripData["usersName"] = userIdToNameMap[usersId];
        tripData["id"] = trip.id;
        tripData["tripTitle"] = tripData.tripTitleText;
        likeUserDict[trip.id] = tripData.likes;
        parsedTrips.push(tripData);
      });
    }
    setLikesUsers(likeUserDict);
    return parsedTrips;
  };

  const fetchMyFollowing = async () => {
    const myUid = firebase.auth().currentUser.uid;
    const userDoc = await db.collection("users").doc(myUid).get();
    const followedUserIds = userDoc.data()["following"];
    followedUserIds.push(myUid);
    return followedUserIds;
  };

  const fetchUsersTrips = async (userIds) => {
    const trips = [];
    for (let i = 0; i < userIds.length; i += 10) {
      // Firestore limits "in" queries to 10 elements
      // so we must batch these queries
      const batchIds = userIds.slice(i, i + 10);
      const batchTrips = await db
        .collection("trips")
        .where("uid", "in", batchIds)
        .orderBy("time", "desc")
        .get();
      trips.push(batchTrips);
    }
    return trips;
  };

  const fetchUsersNames = async (userIds) => {
    const userIdToName = {};
    const users = [];
    for (let i = 0; i < userIds.length; i += 10) {
      // Firestore limits "in" queries to 10 elements
      // so we must batch these queries
      const batchIds = userIds.slice(i, i + 10);
      const batchUsers = await db
        .collection("users")
        .where("uid", "in", batchIds)
        .get();
      users.push(batchUsers);
    }
    for (let userBatch of users) {
      userBatch.forEach((user) => {
        const userData = user.data();
        const uid = userData["uid"];
        const name = userData["displayName"];
        userIdToName[uid] = name;
      });
    }
    return userIdToName;
  };

  const onUserLike = async (item) => {
    if (item.likes != null && item.uid != myUid) {
      // Check to make sure it's not your own post
      const tripRef = await db.collection("trips").doc(item.id);
      if (item.likes.includes(myUid)) {
        tripRef.update({
          likes: firebase.firestore.FieldValue.arrayRemove(myUid)
        });
        const index = item.likes.indexOf(myUid);
        if (index > -1) {
          item.likes.splice(index, 1);
        }
      } else {
        item.likes.push(myUid);
        tripRef.update({
          likes: firebase.firestore.FieldValue.arrayUnion(myUid)
      });
      }
      const newLikesUsers = { ...likesUsers, [item.id]: item.likes };
      setLikesUsers(newLikesUsers); 
      // There is probably a way around likesUsers - used this to get rereneder to occur
    }
  }

  const pastTripComponent = ({ item }) => {
    return (
      <View>
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
            {tripViewComponent(
              item.pins,
              findRegion(item.pins, item.coordinates),
              item.coordinates
            )}
          </View>
          <View>
            {item.likes == null && <Text> {item.likes} 0 likes </Text>}
            {item.likes != null && <Text> {item.likes.length} likes </Text>}
          </View>
          <View
            style={{
              paddingTop: 10,
              borderBottomColor: "lightgray",
              borderBottomWidth: 1,
            }}
          />
          {item.likes != null && item.likes.includes(myUid) && <MaterialCommunityIcons
            style={styles.icon}
            name="thumb-up-outline"
            color={"#00A398"}
            size={25}
            onPress={() => onUserLike(item)}
          />}
          {item.likes != null && !item.likes.includes(myUid) && <MaterialCommunityIcons
            style={styles.icon}
            name="thumb-up-outline"
            color={"#808080"}
            size={25}
            onPress={() => onUserLike(item)}
          />}
        </TouchableOpacity>
      </View>
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
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadFeedTrips} />
          }
        />
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
    paddingTop: Dimensions.get("window").height * 0.3,
    fontSize: 16,
    alignSelf: "center",
    textAlign: "center",
  },
  icon: {
    alignSelf: "center",
    marginVertical: 10,
  },
});
