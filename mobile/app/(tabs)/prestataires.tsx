import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type Prestataire = {
  id: string;
  nomCommercial: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  statutDisponibilite: string | null;
};

// Position de test (Cocody, Abidjan) - deviendra la géoloc réelle du client plus tard
const LAT_CLIENT = 5.36;
const LNG_CLIENT = -3.99;

export default function PrestatairesScreen() {
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://192.168.1.8:3000/api/prestataires?lat=${LAT_CLIENT}&lng=${LNG_CLIENT}`)
      .then((res) => res.json())
      .then((data) => {
        setPrestataires(data);
        setChargement(false);
      })
      .catch((err) => {
        setErreur('Impossible de charger les prestataires');
        setChargement(false);
        console.error(err);
      });
  }, []);

  if (chargement) return <ActivityIndicator style={styles.centre} size="large" />;
  if (erreur) return <Text style={styles.centre}>{erreur}</Text>;

  return (
    <MapView
      style={styles.carte}
      initialRegion={{
        latitude: LAT_CLIENT,
        longitude: LNG_CLIENT,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker
        coordinate={{ latitude: LAT_CLIENT, longitude: LNG_CLIENT }}
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