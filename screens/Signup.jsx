import {
  TextInput,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  StyleSheet
} from "react-native";
import React, { useState } from "react";
import db from "../firebase";
import * as firebase from "firebase"

/**
 * This component takes the user to the Signup page. The user inputs their
 * full name, email, and passowrd to create a new account.
 */
export default function Signup({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  const handleSignUp = async () => {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(function(userCred) {  
        console.log(userCred);
        userCred.user.updateProfile({
          displayName: name
        });
        const user = {
          uid: userCred.user.uid,
          email: email,
          displayName: name,
          trips: {},
          username: username,
          followers: [],
          following: []
        }
        db.collection("users")
          .doc(userCred.user.uid)
          .set(user);
        navigation.navigate("Home")
      }).catch((error) => {
        alert(error);
      });
  }

  const onPressSignUp = () => {
    handleSignUp();
    navigation.navigate("Road Trip Buddy", { screen: "Home" });
  }

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Text style={styles.header}>Sign Up</Text>
      <TextInput
      	style={styles.inputBox}
        onChangeText={(text) => setName(text)}
        placeholder="Full Name"
        autoCapitalize="words"
        autoCorrect={false}
        defaultValue={name}
      />
      <TextInput
      	style={styles.inputBox}
        onChangeText={(text) => setUsername(text)}
        placeholder="Username"
        autoCapitalize="none"
        autoCorrect={false}
        defaultValue={username}
      />
      <TextInput
      	style={styles.inputBox}
        onChangeText={(text) => setEmail(text)}
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        defaultValue={email}
      />
      <TextInput
      	style={styles.inputBox}
        onChangeText={(text) => setPassword(text)}
        placeholder="Password"
        type="password"
        secureTextEntry={true}
        defaultValue={password}
      />
      <TouchableOpacity style={styles.button}
        onPress={onPressSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "flex-start",
		justifyContent: "center"
	},
  header: {
    fontSize: 40,
    color: "#00A398",
    fontWeight: "bold",
    textAlign: "left",
    marginLeft: 23,
    marginBottom: 15,
  },
	inputBox: {
		width: "90%",
		margin: 10,
    marginLeft: 23,
    marginRight: 23,
		padding: 15,
		fontSize: 16,
		borderColor: "#d3d3d3",
    borderWidth: 1,
	},
	button: {
		marginTop: 10,
		marginBottom: 20,
    margin: 23,
		paddingVertical: 10,
		backgroundColor: "#00A398",
		borderColor: "#00A398",
		borderWidth: 1,
		borderRadius: 5,
    width: "90%",
	},
	buttonText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#fff",
    textAlign: "center"
	},
})
