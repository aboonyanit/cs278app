import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import React from "react";

export const findRegion = (pins, coords) => {
  let minLatitude = 90;
  let maxLatitude = -90;
  let minLongitude = 180;
  let maxLongitude = -180;
  for (let pin of pins) {
    let { latitude, longitude } = pin.coordinate;
    minLatitude = Math.min(minLatitude, latitude);
    maxLatitude = Math.max(maxLatitude, latitude);
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
  }
  for (let coord of coords) {
    let { latitude, longitude } = coord;
    minLatitude = Math.min(minLatitude, latitude);
    maxLatitude = Math.max(maxLatitude, latitude);
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
  }
  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: (maxLatitude - minLatitude) * 1.2,
    longitudeDelta: (maxLongitude - minLongitude) * 1.2,
  };
};

export const tripViewComponent = (pins, region, coords) => {
  const onMarkerPress = (marker) => {
    pins[marker.key].hideCallout();
  };
  return (
    <MapView style={styles.map} initialRegion={region}>
      {pins.map((marker, idx) => (
        <Marker
          key={idx}
          coordinate={marker.coordinate}
          draggable
          ref={(ref) => {
            pins[marker.key] = ref;
          }}
          stopPropagation={true}
          onCalloutPress={() => onMarkerPress(marker)}
        >
          <MapView.Callout>
            <View>
              <Text>{marker.title}</Text>
              <Text>{marker.description}</Text>
              <ScrollView horizontal={true}>
                {marker.photos &&
                  marker.photos.map((photo) => (
                    <Image
                      key={photo.key}
                      source={{ uri: photo.uri }}
                      style={{ width: 200, height: 200, margin: 5 }}
                    />
                  ))}
              </ScrollView>
            </View>
          </MapView.Callout>
        </Marker>
      ))}
      <Polyline
        strokeColor="#FF0000"
        strokeWidth={2}
        coordinates={coords.map((coord) => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
        }))}
      />
    </MapView>
  );
};

export default function TripView({ navigation, route }) {
  const { pins, tripTitle } = route.params;
  const region = findRegion(pins);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Viewing trip: {tripTitle}</Text>
      {tripViewComponent(pins, region, currentPin, isPinPopupVisible)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start",
    margin: 15,
  },
  header: {
    fontSize: 30,
    color: "#8275BD",
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    color: "#8275BD",
    margin: 10,
  },
  map: {
    width: "90%",
    height: "90%",
  },
});
