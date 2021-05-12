import * as firebase from "firebase";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";

import Clipboard from "expo-clipboard";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import db from "../firebase";
import moment from "moment";
import { useFocusEffect } from "@react-navigation/native";

export default function Home({ navigation }) {
  const [postItems, setPostItems] = useState(["asdasd"]);
  const [isLoading, setIsLoading] = useState(true);
  const [likesUsers, setLikesUsers] = useState({});
  const [friendsPic, setFriendsPic] = useState({});
  const [contactPressed, setContactPressed] = useState(false);

  const myUid = firebase.auth().currentUser.uid;

  const pastPostComponent = ({ item }) => {
    const myUid = firebase.auth().currentUser.uid;
    const profilePicture = friendsPic[item.uid];
    return (
      <View
        style={styles.itemContainer}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {profilePicture ? (
              <Image
                style={styles.profilePic}
                source={{ uri: profilePicture }}
              />
            ) : (
              <MaterialCommunityIcons
                name="account-circle"
                color={"#808080"}
                size={50}
              />
            )}
            <Text>By: {item.usersName}</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setContactPressed([item.usersName, item.email])}
          >
            <Text style={styles.buttonText}>Contact</Text>
          </TouchableOpacity>
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
        <View style={styles.row}>
        <View style={styles.likes}>
          {item.likes == null && <Text> {item.likes} 0 likes </Text>}
          {item.likes != null && <Text> {item.likes.length} likes </Text>}
        </View>
        <View>
            {item.comments.length != 1 && (
              <Text onPress={() => navigation.navigate("Comment", item)}>
                {" "}
                {item.comments.length} comments{" "}
              </Text>
            )}
            {item.comments.length == 1 && (
              <Text onPress={() => navigation.navigate("Comment", item)}>
                {" "}
                {item.comments.length} comment{" "}
              </Text>
            )}
          </View>
          </View>

        <View
          style={{
            paddingTop: 10,
            borderBottomColor: "lightgray",
            borderBottomWidth: 1,
          }}
        />
        <View style={styles.reactionBar}>
          <TouchableOpacity onPress={() => onUserLike(item)}>
            <View style={styles.iconView}>
              <MaterialCommunityIcons
                style={styles.icon}
                name="thumb-up-outline"
                color={item.likes.includes(myUid) ? "#00A398" : "#808080"}
                size={25}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Comment", item)}
          >
            <View style={styles.iconView}>
              <MaterialCommunityIcons
                style={styles.icon}
                name="comment-text-outline"
                color={"#808080"}
                size={25}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  useEffect(() => {
    loadFeedPosts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      async function fetchUsersPics() {
        const dbUsers = await db.collection("users").get();
        var userPicDict = {};
        dbUsers.forEach((user) => {
          const userData = user.data();
          userPicDict[userData.uid] = userData.profilePicture;
        });
        setFriendsPic(userPicDict);
      }
      fetchUsersPics();
    }, [])
  );

  const loadFeedPosts = async () => {
    setIsLoading(true);
    const feedPosts = await parsePostsForFeed();
    setPostItems(feedPosts);
    setIsLoading(false);
  };

    const parsePostsForFeed = async () => {
      const parsedPosts = [];
      const followedUserIds = await fetchMyFollowing();
      const postsFromDatabase = await fetchUsersPosts(followedUserIds);
      const userIdToNameMap = await fetchUsersNames(followedUserIds);
      for (let postBatch of postsFromDatabase) {
        for (const post of postBatch.docs) {
          const postData = post.data();
          const usersId = postData["uid"];
          postData["usersName"] = userIdToNameMap[usersId];
          postData["id"] = post.id;
          const commentsArray = [];
          await db
            .collection("comments")
            .where("postId", "==", post.id)
            .orderBy("time", "asc")
            .get()
            .then((comments) => {
              comments.forEach((comment) => {
                commentsArray.push(comment.data());
              });
            });
            postData["comments"] = commentsArray;
            parsedPosts.push(postData);
        }
      }
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
        const email = userData["email"];
        userIdToName[uid] = [name, email];
      });
    }
    return userIdToName;
  };

  const onUserLike = async (item) => {
    if (item.likes != null) {
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
        <Text>Follow more friends to see their posts here</Text>
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator />
      ) : contactPressed == false ? (
        <FlatList
          data={postItems}
          renderItem={pastPostComponent}
          ListEmptyComponent={noPostsComponent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadFeedPosts} />
          }
        />
      ) : (
        <View style={styles.centeredView}>
          <Modal animationType="slide" transparent={true}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <TouchableOpacity onPress={() => setContactPressed(false)}>
                  <Image
                    source={require("../assets/close-button.png")}
                    style={styles.exit}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Clipboard.setString(contactPressed[1])}
                >
                  <Text style={styles.modalText}>
                    {contactPressed[0]}'s Contact Info (Press to Copy):
                  </Text>
                  <Text style={styles.modalText}>
                    Email: {contactPressed[1]}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  reactionBar: {
    flexDirection: "row",
    alignItems: "center",
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
  iconView: {
    width: Dimensions.get("window").width * 0.5,
  },
  profilePic: {
    width: Dimensions.get("window").height * 0.058,
    height: Dimensions.get("window").height * 0.058,
    borderRadius: 50,
    margin: 5,
    marginLeft: 0,
  },
  button: {
    margin: 10,
    padding: 5,
    backgroundColor: "#00A398",
    borderColor: "#00A398",
    borderWidth: 1,
    alignItems: "center",
    height: "50%",
    borderRadius: 18,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    textAlignVertical: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  exit: {
    width: Dimensions.get("window").height * 0.032,
    height: Dimensions.get("window").height * 0.032,
    marginLeft: 250,
    marginBottom: 20,
  },
  modalText: { fontSize: 17 },
});
