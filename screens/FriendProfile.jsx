import * as firebase from "firebase";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import db from "../firebase";
import moment from "moment";
import { useFocusEffect } from "@react-navigation/native";

/**
 * This component shows a profile which includes the number of followers
 * and people you are following. It also contains a list of all past trips
 * when user presses the "Profile" button from the tab bar. Clicking on
 * a past trip will take you to the trip overview.
 */
export default function FriendProfile({ navigation, route }) {
  const { item } = route.params;
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [pastPosts, setPastPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [buttonText, setButtonText] = useState("Follow");
  const [likesUsers, setLikesUsers] = useState({});
  const [isFollowingRequested, setIsFollowingRequested] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  const myUid = firebase.auth().currentUser.uid;

  const parsePostsFromDatabase = (postsFromDatabase) => {
    const parsedPosts = [];
    const uid = firebase.auth().currentUser.uid;
    const usersRef = firebase.firestore().collection("users");
    usersRef.doc(uid).onSnapshot((userDoc) => {
      if (userDoc.data()["following"].includes(item.uid)) {
        setIsFollowing(true);
        postsFromDatabase.forEach((post) => {
          const postData = post.data();
          if (postData.uid == item.uid) {
            postData["id"] = post.id;
            parsedPosts.push(postData);
          }
        });
      } else if (
        userDoc.data()["followingRequests"] &&
        userDoc.data()["followingRequests"].includes(item.uid)
      ) {
        setIsFollowingRequested(true);
      }
      if (parsedPosts.length != pastPosts.length) {
        // Could potentially add more rigorous check than length
        console.log("parsedPosts", parsedPosts);
        setPastPosts(parsedPosts);
      }
    });
  };

  const loadPastPosts = async () => {
    setLoading(true);
    const collRef = db.collection("posts");
    const postsFromDatabase = await collRef.orderBy("time", "desc").get();
    parsePostsFromDatabase(postsFromDatabase);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const uid = firebase.auth().currentUser.uid;
      const usersRef = firebase.firestore().collection("users");
      usersRef.doc(uid).onSnapshot((userDoc) => {
        if (
          userDoc.data()["followingRequests"] &&
          userDoc.data()["followingRequests"].includes(item.uid)
        ) {
          setIsFollowingRequested(true);
          setButtonText("Requested");
        }
      });
      loadPastPosts();
      getFriendUser();
    }, [pastPosts])
  );

  const getFriendUser = () => {
    const usersRef = firebase.firestore().collection("users");
    usersRef.doc(item.uid).onSnapshot((userDoc) => {
      setFollowers(userDoc.data()["followers"]);
      setFollowing(userDoc.data()["following"]);
      setProfilePicture(userDoc.data()["profilePicture"]);
    });
  };

  const onUnfollowUser = async () => {
    const myRef = firebase.firestore().collection("users").doc(myUid);
    const theirRef = firebase.firestore().collection("users").doc(item.uid);
    const myRes = myRef.update({
      following: firebase.firestore.FieldValue.arrayRemove(item.uid),
    });
    const theirRes = theirRef.update({
      followers: firebase.firestore.FieldValue.arrayRemove(myUid),
    });
    Promise.all([myRes, theirRes])
      .then(() => setIsFollowing(false))
      .catch((error) => alert(error));
  };

  const onRequestUser = async () => {
    const myRef = firebase.firestore().collection("users").doc(myUid);
    const theirRef = firebase.firestore().collection("users").doc(item.uid);
    if (buttonText == "Requested") {
      const myRes = myRef.update({
        followingRequests: firebase.firestore.FieldValue.arrayRemove(item.uid),
      });
      const theirRes = theirRef.update({
        followerRequests: firebase.firestore.FieldValue.arrayRemove(myUid),
      });
      Promise.all([myRes, theirRes])
        .then(() => setIsFollowingRequested(false))
        .catch((error) => alert(error));
      setButtonText("Follow");
    } else {
      const myRes = myRef.update({
        followingRequests: firebase.firestore.FieldValue.arrayUnion(item.uid),
      });
      const theirRes = theirRef.update({
        followerRequests: firebase.firestore.FieldValue.arrayUnion(myUid),
      });
      Promise.all([myRes, theirRes])
        .then(() => setIsFollowingRequested(true))
        .catch((error) => alert(error));
      setButtonText("Requested");
    }
  };

  const onUserLike = async (item) => {
    if (item.likes != null && item.uid != myUid) {
      // Check to make sure it's not your own post
      const postRef = await db.collection("posts").doc(item.id);
      if (item.likes && item.likes.includes(myUid)) {
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

  const pastPostComponent = ({ item }) => {
    return (
      <View
        // onPress={() => navigation.navigate("Past Trip", item)}
        style={styles.itemContainer}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {profilePicture ? (
            <Image
              style={styles.smallProfilePic}
              source={{ uri: profilePicture }}
            />
          ) : (
            <MaterialCommunityIcons
              name="account-circle"
              color={"#808080"}
              size={50}
            />
          )}
          <Text>By: {firebase.auth().currentUser.displayName}</Text>
        </View>
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
        {item.likes && item.likes.includes(myUid) && (
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
        {item.likes && !item.likes.includes(myUid) && (
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
      </View>
    );
  };

  const noTripsComponent = () => {
    return <Text style={styles.noTripText}>No posts to display!</Text>;
  };

  const onPressFollowers = () => {
    if (followers.includes(myUid)) {
      const data = { follow: followers, isFollowers: true };
      navigation.navigate("Follow", data);
    }
  };

  const onPressFollowing = () => {
    if (followers.includes(myUid)) {
      const data = { follow: following, isFollowers: false };
      navigation.navigate("Follow", data);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: "row" }}>
        {profilePicture ? (
          <Image style={styles.profilePic} source={{ uri: profilePicture }} />
        ) : (
          <MaterialCommunityIcons
            style={styles.profileIcon}
            name="account-circle"
            color={"#808080"}
            size={90}
          />
        )}
        <Text style={styles.name}>{item.displayName}</Text>
      </View>
      <View style={styles.row}>
        <TouchableOpacity onPress={onPressFollowers}>
          <Text style={styles.follow}>{followers.length} Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressFollowing}>
          <Text style={styles.follow}>{following.length} Following</Text>
        </TouchableOpacity>
        {isFollowing ? (
          <TouchableOpacity
            onPress={onUnfollowUser}
            style={[styles.button, { backgroundColor: "#AEB8C1" }]}
          >
            <Text style={styles.buttonText}>Following</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onRequestUser}
            style={[styles.button, { backgroundColor: "#00A398" }]}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.header}>Past Posts</Text>
      {loading ? (
        <ActivityIndicator style={styles.activityIndicator} size={"large"} />
      ) : isFollowing ? (
        <FlatList
          data={pastPosts}
          renderItem={pastPostComponent}
          ListEmptyComponent={noTripsComponent}
        />
      ) : (
        <View style={styles.private}>
          <Text style={styles.privateLargeText}>This Account is Private</Text>
          <Text style={styles.privateText}>
            Follow this account to see their posts.
          </Text>
        </View>
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
    alignSelf: "center",
    marginVertical: 10,
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
  postText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  profilePic: {
    width: Dimensions.get("window").height * 0.1,
    height: Dimensions.get("window").height * 0.1,
    margin: 10,
    borderRadius: 50,
  },
  smallProfilePic: {
    width: Dimensions.get("window").height * 0.058,
    height: Dimensions.get("window").height * 0.058,
    borderRadius: 50,
    margin: 5,
    marginLeft: 0,
  },
});
