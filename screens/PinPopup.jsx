import * as ImagePicker from "expo-image-picker";

import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";

import { ScrollView } from "react-native-gesture-handler";

/**
 * This component allows the user to edit the pin title, description, as well
 * as add photos.
 */
export default function PinPopup(props) {
  const [pinTitle, setPinTitle] = useState(props.pin.title);
  const [pinDescrip, setPinDescrip] = useState(props.pin.description ?? "");
  const [pinPhotos, setPinPhotos] = useState(props.pin.photos ?? []);
  // TODO: Add feature to allow user to set new location

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      base64: true,
      quality: 1,
    });
    if (!result.cancelled) {
      const updatedPhotos = pinPhotos.concat([
        { key: pinPhotos.length, uri: result.uri },
      ]);
      setPinPhotos(updatedPhotos);
    }
  };
  return (
    <View style={styles.centeredView}>
      <Modal animationType="slide" transparent={true}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity onPress={props.exitEditPin}>
              <Image
                source={require("../assets/close-button.png")}
                style={styles.exit}
              />
            </TouchableOpacity>
            <View style={styles.flexView}>
              <Text style={styles.text}> Pin title </Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Pin title"
                onChangeText={(text) => setPinTitle(text)}
                defaultValue={pinTitle}
              />
            </View>
            <View style={styles.flexView}>
              <Text style={styles.text}> Pin description </Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Pin description"
                onChangeText={(text) => setPinDescrip(text)}
                defaultValue={pinDescrip}
              />
            </View>
            <View
              style={{
                height: pinPhotos.length == 0 ? 50 : 250,
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <ScrollView horizontal={true}>
                {pinPhotos.map((photo, i) => (
                  <Image
                    key={photo.key}
                    source={{ uri: photo.uri }}
                    style={{ width: 200, height: 200, margin: 5 }}
                  />
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.appButtonContainer}
                onPress={pickImage}
              >
                <Text style={styles.appButtonText}> Add Photo</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonFlexView}>
              <TouchableOpacity
                style={styles.appButtonContainer}
                onPress={() => {
                  props.getUpdatedPin({
                    ...props.pin,
                    title: pinTitle,
                    description: pinDescrip,
                    photos: pinPhotos,
                  });
                }}
              >
                <Text style={styles.appButtonText}> Save pin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.appButtonContainer}
                onPress={() => {
                  props.deletePin(props.pin);
                }}
              >
                <Text style={styles.appButtonText}> Delete pin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  flexView: {
    marginBottom: 15,
    alignItems: "stretch",
    height: 40,
    flexDirection: "row",
  },
  buttonFlexView: {
    marginBottom: 15,
    alignItems: "stretch",
    height: 53,
    flexDirection: "row",
  },
  text: {
    marginTop: 10,
    marginRight: 10,
    fontWeight: "bold",
  },
  titleInput: {
    borderWidth: 1,
    flex: 2,
    borderColor: "#00A398",
    padding: 5,
  },
  appButtonContainer: {
    elevation: 8,
    backgroundColor: "#00A398",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    margin: 5,
  },
  appButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  exit: {
    width: 30,
    height: 30,
    marginLeft: 250,
    marginBottom: 20,
  },
});
