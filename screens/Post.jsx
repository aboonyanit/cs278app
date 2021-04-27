import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import React, { useState } from "react";
import * as firebase from "firebase";
import db from "../firebase";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";

export default function Post({ navigation }) {
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState([]);

  const onPost = () => {
    const user = firebase.auth().currentUser;
    const post = {
      post: text,
      time: new Date().toISOString(),
      uid: user.uid,
    };
    db.collection("posts")
      .add(post)
      .then(() => {
        console.log("Posts successfully written!");
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
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
    marginBottom: 20,
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
