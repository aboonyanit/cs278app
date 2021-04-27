import "firebase/firestore";

import * as firebase from "firebase";

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyBKpw-6j_iCfLZ-ri-kiqkyyWpWMJpq06g",
  authDomain: "cs278-app.firebaseapp.com",
  projectId: "cs278-app",
  storageBucket: "cs278-app.appspot.com",
  messagingSenderId: "239119134291",
  appId: "1:239119134291:web:04ce349495fa625e6f20a6",
  measurementId: "G-H6MMJ2TDNW"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// firebase.initializeApp(firebaseConfig);
var firestore = firebase.firestore();

// export const auth = firebase.auth();
export default firestore; 
