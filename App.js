import "react-native-gesture-handler";

import * as React from "react";
import { useEffect, useState } from "react";
import * as firebase from "firebase";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import Home from "./screens/Home";
import Profile from "./screens/Profile";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Search from "./screens/Search";
import Settings from "./screens/Settings";
import Post from "./screens/Post";
import Follow from "./screens/Follow";

import { MenuProvider } from "react-native-popup-menu";
import FriendProfile from "./screens/FriendProfile";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function getHeaderTitle(route) {
  // If the focused route is not found, we need to assume it's the initial screen
  // This can happen during if there hasn't been any navigation inside the screen
  // In our case, it's "Feed" as that's the first screen inside the navigator
  const routeName = getFocusedRouteNameFromRoute(route) ?? "Road Trip Buddy";

  switch (routeName) {
    case "Home":
      return "Home";
    case "Search":
      return "Search";
    case "Post":
      return "Post";
    case "Profile":
      return "Profile";
  }
}

function Tabs() {
  return (
    <Tab.Navigator
      tabBarOptions={{
        activeTintColor: "#00A398",
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={Search}
        options={{
          tabBarLabel: "Search",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={Post}
        options={{
          tabBarLabel: "Post",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="note-plus"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user == null) {
        setLoggedIn(false);
        setUser(null);
      } else {
        const usersRef = firebase.firestore().collection("users");
        usersRef
          .doc(user.uid)
          .get()
          .then((firestoreDocument) => {
            if (!firestoreDocument.exists) {
              alert("User does not exist anymore.");
              return;
            }
            const user = firestoreDocument.data();
            setUser(user);
            setLoggedIn(true);
          })
          .catch((error) => {
            alert(error);
          });
      }
    });
  }, []);

  return (
    <MenuProvider>
      <NavigationContainer>
        {loggedIn ? (
          <Stack.Navigator>
            <Stack.Screen
              name="Jazz"
              component={Tabs}
              options={({ route }) => ({
                headerTitle: getHeaderTitle(route),
              })}
            />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="Friend Profile" component={FriendProfile} />
            <Stack.Screen name="Follow" component={Follow} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Signup" component={Signup} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </MenuProvider>
  );
};
export default App;

// color scheme:
// black: #000
// white: #fff
// grey: #AEB8C1
// teal: #00A398
// purple: #8275BD
