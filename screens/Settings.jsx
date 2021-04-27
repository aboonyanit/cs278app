import { FlatList, StyleSheet, Text, View } from "react-native";
import React from "react";
import * as firebase from "firebase";

/**
 * This component is the settings page where the user can logout of the app.
 */
export default function Settings({ navigation }) {
  const renderSeparator = () => {
    return <View style={styles.seperator} />;
  };

  const getListViewItem = async (item) => {
    if (item.key == "Logout") {
      try {
        await firebase.auth().signOut();
        navigation.navigate("Login");
      } catch (e) {
        console.log(e);
      }
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ key: "Logout" }]}
        renderItem={({ item }) => (
          <Text style={styles.item} onPress={() => getListViewItem(item)}>
            {item.key}
          </Text>
        )}
        ItemSeparatorComponent={renderSeparator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
    color: "#00A398",
    margin: 5,
  },
  seperator: {
    height: 1,
    width: "100%",
    backgroundColor: "#000",
  },
});
