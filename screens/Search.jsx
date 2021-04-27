import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Searchbar } from "react-native-paper";
import * as firebase from "firebase";
import uuidv4 from "uuid/v4";

export default function SearchScreen({ navigation }) {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const onChangeSearch = (query) => setSearchQuery(query);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let users = [];
    firebase
      .firestore()
      .collection("users")
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          if (doc.exists) {
            let user = doc.data();
            users.push(user);
          }
          if (mounted) {
            setUsers(users);
          }
        });
      });

    // Get current user
    let uid = firebase.auth().currentUser.uid;
    const usersRef = firebase.firestore().collection("users");
    usersRef.doc(uid).onSnapshot((userDoc) => {
      if (!userDoc.exists) {
        alert("User does not exist anymore.");
        return;
      }
      if (mounted) {
        setUserId(userDoc.data()["uid"]);
        setName(userDoc.data()["displayName"]);
      }
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onPressUser = (item) => {
    if (item.uid == firebase.auth().currentUser.uid) {
      navigation.navigate("Profile");
    } else {
      navigation.navigate("Friend Profile", { item: item });
    }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search"
        onChangeText={onChangeSearch} //when input changes
        value={searchQuery} //input
      />
      <View style={styles.container}>
        <View style={styles.peopleView}>
          <Text style={styles.titleText}>People</Text>
          <FlatList
            style={{
              // backgroundColor: 'white',
              marginLeft: 10,
              marginRight: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(216,213,214,1)",
            }}
            contentContainerStyle={{
              alignItems: "center",
            }}
            data={users}
            renderItem={({ item }) => {
              if (item.displayName) {
                if (
                  searchQuery != "" &&
                  (item.displayName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                    item.username
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()))
                ) {
                  return (
                    <TouchableOpacity style={styles.userCard} onPress={() => onPressUser(item)}>
                      <View style={styles.userCardInfo}>
                        <View style={styles.userCardRow}>
                          <Text style={styles.userTitle}>{item.username}</Text> 
                        </View>
                        <Text style={styles.userText}>{item.displayName}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }
              }
            }}
            keyExtractor={() => uuidv4()}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarStyle: {
    backgroundColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    flex: 5,
  },
  viewSearch: {
    alignSelf: "stretch",
    flex: 3,
  },
  filter: {
    flex: 5,
  },
  peopleView: {
    // backgroundColor:'#E3EC97',
    flex: 10,
  },
  titleText: {
    padding: 15,
    fontSize: 20,
    fontWeight: "bold",
  },
  userCard: {
    width: "90%",
    marginTop: 10,
    // marginLeft: 10,
    // marginRight: 10,
    // backgroundColor: '#e7e2e2',
    backgroundColor: "#AEB8C1",
    padding: 5,
    borderRadius: 10,
    flexDirection: "row",
  },
  userTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  userText: {
    fontSize: 12,
  },
  userCardInfo: {
    flex: 1,
    paddingLeft: 10,
  },
  userCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
