import {
  Dimensions,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";

const useMount = (func) => useEffect(() => func(), []);

const useInitialURL = () => {
  const [url, setUrl] = useState(null);
  const [processing, setProcessing] = useState(true);

  useMount(() => {
    const getUrlAsync = async () => {
      // Get the deep link used to open the app
      const initialUrl = await Linking.getInitialURL();

      // The setTimeout is just for testing purpose
      setTimeout(() => {
        setUrl(initialUrl);
        setProcessing(false);
      }, 1000);
    };

    getUrlAsync();
  });

  return { url, processing };
};
const base64 = require("base-64");

const getAccessToken = async () => {
  await Linking.openURL(
    "https://id.mercedes-benz.com/as/authorization.oauth2?response_type=code&client_id=142a054e-e379-4af0-92ee-4c896c8b4573&redirect_uri=https://localhost&scope=mb:vehicle:status:general mb:user:pool:reader offline_access&state=xyzABC123"
  );
  try {
    console.log("Got here");
    let formData = new FormData();
formData.append('grant_type', 'authorization_code');
// formData.append('code', 'RP0jKBpywPRdB8ivTt6gK4l6qfzwsC_dZ_VLWIW3');
formData.append('redirect_uri', 'https://localhost');
formData.append('client_id', '142a054e-e379-4af0-92ee-4c896c8b4573');
formData.append('client_secret', 'anbNBGSlPTwudIsghgRBuukgodehAZUhynrcqZOdyDkkqxjuhEPHmbLiAudAQgAr');

    let response = await fetch("https://id.mercedes-benz.com/as/token.oauth2", {
      method: "POST",
      headers: {
        "Authorization":
          "Basic " +
          base64.encode(
            "<insert_your_base64_encoded_client_id_and_client_secret_here>"
          ),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      // body: JSON.stringify({
      //   grant_type: "authorization_code",
      //   code: "RP0jKBpywPRdB8ivTt6gK4l6qfzwsC_dZ_VLWIW3",
      //   // redirect_uri: "exp://10.0.0.7:19000",
      //   redirect_uri: "https://localhost",
      // }),
    });
    console.log("Got here2");
    let json = await response.json();
    console.log(json);
    return json.access_token;
  } catch (error) {
    console.error(error);
  }
};

export const Home = ({ navigation }) => {
  const { url: initialUrl } = useInitialURL();

  const onPressLogin = () => {
    navigation.navigate("Login");
  }
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require("../assets/daimler-logo.png")}
      />
      <Text style={styles.header}>Road Trip Buddy</Text>
      <TouchableOpacity
        onPress={onPressLogin}
        style={styles.loginButtonContainer}>
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          getAccessToken()
        }
        style={styles.loginButtonContainer}
      >
        <Text style={styles.loginButtonText}>Log In with Mercedes-Benz</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", //"#aeb8c1"
    alignItems: "center",
    justifyContent: "space-around",
  },
  logo: {
    width: Dimensions.get("window").width * 0.7,
    height: "10%",
    resizeMode: "contain",
  },
  header: {
    fontSize: 30,
    color: "#8275BD",
    fontWeight: "bold",
  },
  appButtonContainer: {
    elevation: 8,
    backgroundColor: "#00A398",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  appButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  loginButtonContainer: {
    elevation: 8,
    backgroundColor: "#AEB8C1",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  loginButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
  },
});
