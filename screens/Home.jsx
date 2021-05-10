import * as firebase from "firebase";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import db from "../firebase";
import moment from "moment";

export const pastPostComponent = ({ item }) => {
  const myUid = firebase.auth().currentUser.uid;

  return (
    <TouchableOpacity
      // onPress={() => navigation.navigate("Past Trip", item)}
      style={styles.itemContainer}
    >
      <Text>By: {item.usersName}</Text>

      <Text style={styles.time}>
        {moment(item.time, moment.ISO_8601).format("LLL")}
      </Text>
      <View style={styles.cardHeader}>
        <Text style={styles.postText}>{item.post}</Text>
      </View>
      <ScrollView horizontal={true}>
        {item.images &&
          item.images.map((photo, i) => (
            <Image
              key={i}
              source={{ uri: photo }}
              style={{
                width: Dimensions.get("window").height * 0.23,
                height: Dimensions.get("window").height * 0.23,
                margin: 5,
                padding: 5,
              }}
            />
          ))}
      </ScrollView>
      <View style={styles.likes}>
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
      {item.likes != null && item.likes.includes(myUid) && (
        <TouchableOpacity onPress={() => onUserLike(item)}>
          <View>
            <MaterialCommunityIcons
              style={styles.icon}
              name="thumb-up-outline"
              color={"#00A398"}
              size={25}
            />
          </View>
        </TouchableOpacity>
      )}
      {item.likes != null && !item.likes.includes(myUid) && (
        <TouchableOpacity onPress={() => onUserLike(item)}>
          <View>
            <MaterialCommunityIcons
              style={styles.icon}
              name="thumb-up-outline"
              color={"#808080"}
              size={25}
            />
          </View>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default function Home({ navigation }) {
  const [postItems, setPostItems] = useState(["asdasd"]);
  const [isLoading, setIsLoading] = useState(true);
  const [likesUsers, setLikesUsers] = useState({});
  const myUid = firebase.auth().currentUser.uid;

  useEffect(() => {
    loadFeedPosts();
  }, []);

  const loadFeedPosts = async () => {
    setIsLoading(true);
    setPostItems([]);
    const feedPosts = await parseTripsForFeed();
    setPostItems(feedPosts);
    setIsLoading(false);
  };

  const parseTripsForFeed = async () => {
    const parsedPosts = [];
    const followedUserIds = await fetchMyFollowing();
    const postsFromDatabase = await fetchUsersPosts(followedUserIds);
    const userIdToNameMap = await fetchUsersNames(followedUserIds);
    const likeUserDict = {};
    for (let postBatch of postsFromDatabase) {
      postBatch.forEach((post) => {
        const postData = post.data();
        const usersId = postData["uid"];
        postData["usersName"] = userIdToNameMap[usersId];
        postData["id"] = post.id;
        likeUserDict[post.id] = postData.likes;
        parsedPosts.push(postData);
      });
    }
    setLikesUsers(likeUserDict);
    return parsedPosts;
  };

  const fetchMyFollowing = async () => {
    const myUid = firebase.auth().currentUser.uid;
    const userDoc = await db.collection("users").doc(myUid).get();
    const followedUserIds = userDoc.data()["following"];
    followedUserIds.push(myUid);
    return followedUserIds;
  };

  const fetchUsersPosts = async (userIds) => {
    const posts = [];
    for (let i = 0; i < userIds.length; i += 10) {
      // Firestore limits "in" queries to 10 elements
      // so we must batch these queries
      const batchIds = userIds.slice(i, i + 10);
      const batchTrips = await db
        .collection("posts")
        .where("uid", "in", batchIds)
        .orderBy("time", "desc")
        .get();
      posts.push(batchTrips);
    }
    return posts;
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
      const postRef = await db.collection("posts").doc(item.id);
      if (item.likes.includes(myUid)) {
        postRef.update({
          likes: firebase.firestore.FieldValue.arrayRemove(myUid),
        });
        const index = item.likes.indexOf(myUid);
        if (index > -1) {
          item.likes.splice(index, 1);
        }
      } else {
        item.likes.push(myUid);
        postRef.update({
          likes: firebase.firestore.FieldValue.arrayUnion(myUid),
        });
      }
      const newLikesUsers = { ...likesUsers, [item.id]: item.likes };
      setLikesUsers(newLikesUsers);
      // There is probably a way around likesUsers - used this to get rereneder to occur
    }
  };

  const noPostsComponent = () => {
    return (
      <Text style={styles.noTripText}>
        <Text>Your feed is currently empty!{"\n"}</Text>
        <Text>Follow more friends to see their trips here</Text>
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={postItems}
          renderItem={pastPostComponent}
          ListEmptyComponent={noPostsComponent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadFeedPosts} />
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
  postText: {
    fontSize: 20,
  },
  time: {
    color: "#A9A9A9",
    paddingLeft: 4,
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
