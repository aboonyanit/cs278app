import * as firebase from "firebase";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { TextInput } from "react-native-gesture-handler";
import db from "../firebase";
import { pastPostComponent } from "./Home";
import { useFocusEffect } from "@react-navigation/native";

/**
 * This component shows a profile which includes the number of followers
 * and people you are following. It also contains a list of all past trips
 * when user presses the "Profile" button from the tab bar. Clicking on
 * a past trip will take you to the trip overview.
 */
export default function Profile({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [currBio, setCurrBio] = useState("");
  const [editingBioText, setEditingBioText] = useState("");
  const [pastPosts, setPastPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const parsePostsFromDatabase = (postsFromDatabase) => {
    const parsedPosts = [];
    const user = firebase.auth().currentUser;
    postsFromDatabase.forEach((post) => {
      const postData = post.data();
      if (postData.uid == user.uid) {
        postData["id"] = post.id;
        parsedPosts.push(postData);
      }
    });
    return parsedPosts;
  };

  const loadPastPosts = async () => {
    setLoading(true);
    setPastPosts([]);
    const collRef = db.collection("posts");
    const tripsFromDatabase = await collRef.orderBy("time", "desc").get();
    const parsedPosts = parsePostsFromDatabase(tripsFromDatabase);
    setPastPosts(parsedPosts);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPastPosts();
      getCurrentUser();
    }, [])
  );

  const getCurrentUser = () => {
    let uid = firebase.auth().currentUser.uid;
    const usersRef = firebase.firestore().collection("users");
    usersRef.doc(uid).onSnapshot((userDoc) => {
      setCurrBio(userDoc.data()["bio"] ?? "Hi there!");
      setFollowers(userDoc.data()["followers"]);
      setFollowing(userDoc.data()["following"]);
    });
  };

  const onPressFollowers = () => {
    const data = {
      email: firebase.auth().currentUser.email,
      follow: followers,
      isFollowers: true,
    };
    navigation.navigate("Follow", data);
  };

  const onPressFollowing = () => {
    const data = {
      email: firebase.auth().currentUser.email,
      follow: following,
      isFollowers: false,
    };
    navigation.navigate("Follow", data);
  };

  const noPostsComponent = () => {
    return <Text style={styles.noTripText}>No posts to display!</Text>;
  };

  const onSave = () => {
    const user = firebase.auth().currentUser;
    db.collection("users")
      .doc(user.uid)
      .update({
        bio: editingBioText,
      })
      .then(() => {
        console.log("Bio successfully edited!");
        setEditingBio(false);
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
        setEditingBio(false);
      });
    setCurrBio(editingBioText);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.spaceBetweenRow}>
        <Text style={styles.name}>
          {firebase.auth().currentUser.displayName}
        </Text>
        <MaterialCommunityIcons
          style={styles.icon}
          name="account-cog"
          color={"#808080"}
          size={34}
          onPress={() => navigation.navigate("Settings")}
        />
      </View>
      <View style={styles.row}>
        <TouchableOpacity onPress={onPressFollowers}>
          <Text style={styles.follow}>{followers.length} Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressFollowing}>
          <Text style={styles.follow}>{following.length} Following</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bio}>
        {editingBio && (
          <Modal
            animationType="slide"
            transparent={true}
            onRequestClose={() => setEditingBio(false)}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <TouchableOpacity onPress={() => setEditingBio(false)}>
                  <Image
                    source={require("../assets/close-button.png")}
                    style={styles.exit}
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.bioText}
                  defaultValue={currBio}
                  onChangeText={setEditingBioText}
                  multiline={true}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                  }}
                  blurOnSubmit={true}
                />
                <TouchableOpacity
                  onPress={onSave}
                  style={styles.appButtonContainer}
                >
                  <Text style={styles.appButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        <Text style={styles.bioText}>{currBio}</Text>
        <MaterialCommunityIcons
          style={styles.icon}
          name="account-edit-outline"
          color={"#808080"}
          size={30}
          onPress={() => setEditingBio(true)}
        />
      </View>
      <Text style={styles.header}>My Posts</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={pastPosts}
          renderItem={pastPostComponent}
          ListEmptyComponent={noPostsComponent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  modalView: {
    width: 350,
    height: 500,
    padding: 20,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  spaceBetweenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  appButtonContainer: {
    backgroundColor: "#00A398",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  appButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
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
    width: 300,
  },
  follow: {
    fontSize: 15,
    fontWeight: "bold",
    margin: 15,
  },
  bio: {
    margin: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bioText: {
    fontSize: 20,
    width: 200,
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
    paddingVertical: 10,
    marginVertical: 10,
  },
  postText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  time: {
    fontSize: 12,
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
  noTripText: {
    fontSize: 15,
    alignSelf: "center",
  },
  exit: {
    width: 30,
    height: 30,
    marginLeft: 250,
    marginBottom: 20,
  },
});
