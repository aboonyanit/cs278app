import * as ImagePicker from "expo-image-picker";
import * as firebase from "firebase";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import db from "../firebase";

export const getImageUrl = (uri) => {
  const splitURI = uri.split("/");
  const filename = splitURI[splitURI.length - 1];
  const path = "/post_assets/";
  var storageRef = firebase.storage().ref(path);
  const ref = storageRef.child(`${filename}`);
  const url = "gs://" + "cs278-app.appspot.com" + path + filename;
  return fetch(uri)
    .then((response) => response.blob())
    .then((blob) => {
      return ref.put(blob).then((snapshot) => {
        return firebase
          .storage()
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

export default function Post({ navigation }) {
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState([]);

  const onPost = () => {
    const user = firebase.auth().currentUser;
    const promises = [];
    for (let photo of photos) {
      promises.push(getImageUrl(photo.uri));
    }
    Promise.all(promises).then((urls) => {
      const post = {
        post: text,
        time: new Date().toISOString(),
        uid: user.uid,
        images: urls,
        likes: []
      };
      db.collection("posts")
        .add(post)
        .then(() => {
          console.log("Posts successfully written!", post);
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
      setPhotos([]);
      setText("");
    });
  };

  const onAddPic = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      base64: true,
      quality: 1,
    });
    if (!result.cancelled) {
      const updatedPhotos = photos.concat([
        { key: photos.length, uri: result.uri },
      ]);
      setPhotos(updatedPhotos);
    }
  };

  return (
    <ScrollView>
      <View style={{ flexDirection: "row" }}>
        <Text style={styles.name}>
          {firebase.auth().currentUser.displayName}
        </Text>
        <MaterialCommunityIcons
          style={styles.icon}
          name="camera-plus"
          color={"#808080"}
          size={34}
          onPress={onAddPic}
        />
        <TouchableOpacity onPress={onPost} style={styles.appButtonContainer}>
          <Text style={styles.appButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.titleInput}
        multiline={true}
        maxLength={240}
        placeholder="What do you want to say?"
        onChangeText={(textVal) => setText(textVal)}
        value={text}
      />
      <ScrollView horizontal={true}>
        {photos.map((photo, i) => (
          <Image
            key={photo.key}
            source={{ uri: photo.uri }}
            style={{ width: 200, height: 200, margin: 5 }}
          />
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    margin: 15,
    width: 100,
    marginTop: 30,
  },
  titleInput: {
    fontSize: 20,
    padding: 20,
  },
  appButtonContainer: {
    elevation: 8,
    backgroundColor: "#00A398",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 30,
    marginHorizontal: 15,
    width: "20%",
    marginLeft: 15,
    marginTop: 20,
  },
  appButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  icon: {
    marginTop: 20,
    marginLeft: 135,
  },
});
