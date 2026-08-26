import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

type Prestataire = {
  id: string;
  nomCommercial: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  statutDisponibilite: string | null;
};

export default function PrestatairesScreen() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErreur('Permission de localisation refusée');
        setChargement(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setPosition({ lat, lng });

      try {
        const res = await fetch(`http://192.168.1.8:3000/api/prestataires?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        setPrestataires(data);
      } catch (err) {
        setErreur('Impossible de charger les prestataires');
        console.error(err);
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  if (chargement) return <ActivityIndicator style={styles.centre} size="large" />;
  if (erreur) return <Text style={styles.centre}>{erreur}</Text>;
  if (!position) return <Text style={styles.centre}>Position indisponible</Text>;

  return (
    <MapView
      style={styles.carte}
      initialRegion={{
        latitude: position.lat,
        longitude: position.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker
        coordinate={{ latitude: position.lat, longitude: position.lng }}
        title="Votre position"
        pinColor="blue"
      />
      {prestataires.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.latitude, longitude: p.longitude }}
          title={p.nomCommercial}
          description={`${p.distanceM} m · ${p.statutDisponibilite ?? ''}`}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  carte: { flex: 1 },
  centre: { flex: 1, textAlign: 'center', marginTop: 100, color: '#000000' },
});