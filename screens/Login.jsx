import {
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState } from "react";
import * as firebase from "firebase";

/**
 * This component takes the user to the Login page. The user inputs their
 * email and passowrd to login.
 */
export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => navigation.navigate("Road Trip Buddy", { screen: "Home" }))
      .catch(error => alert(error))
  }

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Text style={styles.header}>Login</Text>
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
      <TouchableOpacity style={styles.loginButton}
        onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signupButton}
        onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.signupButtonText}>Don't have an account yet? Sign up</Text>
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
	loginButton: {
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
	loginButtonText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#fff",
    textAlign: "center"
	},
  signupButtonText: {
    color: "#00A398",
    textAlign: "center"
  },
  signupButton: {
    width: "100%",
  }
})
