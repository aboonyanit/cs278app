import "firebase/firestore";

import * as firebase from "firebase";

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyAE0XqY7UIt84jbvDgwR_bWWkRy4k-X1EM",
  authDomain: "cs-210-project.firebaseapp.com",
  projectId: "cs-210-project",
  storageBucket: "cs-210-project.appspot.com",
  messagingSenderId: "263845644775",
  appId: "1:263845644775:web:608290748a570d669d1542",
  measurementId: "G-FSFDGW8XDY",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// firebase.initializeApp(firebaseConfig);
var firestore = firebase.firestore();

// export const auth = firebase.auth();
export default firestore; 
