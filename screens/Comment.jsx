import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  Image,
  FlatList
} from "react-native";
import React, { useState, useEffect } from "react";
import moment from "moment";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import db from "../firebase";
import * as firebase from "firebase";
import { TextInput } from "react-native-gesture-handler";
import uuidv4 from "uuid/v4";

export default function Comment({ route }) {
  const item = route.params;
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    addUsersToComments();
  }, [comments]);

  const addUsersToComments = async () => {
    if (comments.length != 0) {
      return;
    }
    const commentsWithUsers = [];
    for (const comment of route.params.comments) {
      await db
        .collection("users")
        .where("uid", "==", comment.uid)
        .get()
        .then((users) => {
          users.forEach((user) => {
            comment.user = user.data();
            commentsWithUsers.push(comment);
          });
        });
    }
    if (commentsWithUsers.length == comments.length) {
      // Not sure if this is the best way - prevents infinte loop
      return;
    }
    setComments(commentsWithUsers);
  };

  const onAddComment = async () => {
    const post = {
      comment: comment,
      time: new Date().toISOString(),
      uid: firebase.auth().currentUser.uid,
      postId: item.id,
    };

    db.collection("comments")
      .add(post)
      .then(() => {
        // you know you are the user for a comment just added
        db.collection("users")
          .where("uid", "==", firebase.auth().currentUser.uid)
          .get()
          .then((users) => {
            users.forEach((user) => {
              post.user = user.data();
              setComments((comments) => [...comments, post]);
            });
          });
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
      });
  };

  return (
    <FlatList
      style={styles.container}
      keyboardShouldPersistTaps={"handled"}
      ListHeaderComponent={
        <>
          <View>
            {/* <Text style={styles.header}>{route.params.tripTitle}</Text> */}
            <Text style={styles.userName}> {route.params.usersName}</Text>
            <Text style={styles.time}>
              {moment(route.params.time, moment.ISO_8601).format("LLL")}
            </Text>
          </View>
        </>
      }
      data={comments}
      renderItem={({ item }) => (
        <View style={styles.row}>
          {item.user.profilePicture ? (
            <Image
              style={styles.profilePic}
              source={{ uri: item.user.profilePicture }}
            />
          ) : (
            <MaterialCommunityIcons
              name="account-circle"
              color={"#808080"}
              size={50}
            />
          )}
          <View>
            <View style={styles.row}>
              <Text style={styles.commentUserName}>
                {item.user.displayName}
              </Text>
              <Text style={styles.time}>
                {moment(item.time, moment.ISO_8601).format("LLL")}
              </Text>
            </View>
            <Text style={styles.comment}>{item.comment}</Text>
          </View>
        </View>
      )}
      keyExtractor={() => uuidv4()}
      ListFooterComponent={
        <>
          <View style={styles.textInputView}>
            <TextInput
              style={styles.textInput}
              placeholder="Add a comment"
              onChangeText={setComment}
            />
            <TouchableOpacity
              onPress={onAddComment}
              style={styles.appButtonContainer}
            >
              <Text style={styles.appButtonText}>Post</Text>
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
    padding: 10,
  },
  header: {
    fontSize: 30,
    fontWeight: "bold",
    alignSelf: "center",
    marginVertical: 5,
  },
  comment: {
    paddingLeft: 2,
    fontSize: 16,
  },
  commentUserName: {
    color: "#A9A9A9",
    paddingLeft: 4,
    fontSize: 12,
    paddingTop: 12,
    width: "57%",
  },
  textInputView: {
    paddingBottom: 50,
    // paddingTop: 20,
    alignItems: "stretch",
    flexDirection: "row",
    // marginBottom: 30,
  },
  time: {
    color: "#A9A9A9",
    paddingLeft: 4,
    paddingBottom: 5,
    paddingTop: 10,
    fontSize: 12,
  },
  textInput: {
    borderWidth: 1,
    flex: 2,
    borderColor: "gray",
    paddingLeft: 10,
    height: 30,
    borderRadius: 18,
    marginLeft: 10,
    marginTop: 10,
  },
  appButtonContainer: {
    elevation: 8,
    backgroundColor: "gray",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
    marginRight: 5,
    marginTop: 7,
  },
  appButtonText: {
    fontSize: 18,
    color: "white",
    // fontWeight: "bold",
    alignSelf: "center",
  },
  profilePic: {
    width: Dimensions.get("window").height * 0.058,
    height: Dimensions.get("window").height * 0.058,
    borderRadius: 50,
    margin: 5,
    marginLeft: 0,
  },
  row: {
    flexDirection: "row",
  },
});