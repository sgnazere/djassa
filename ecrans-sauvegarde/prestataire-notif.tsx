import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';

const PRESTATAIRE_ID_TEST = '7394b35b-4816-434b-84b6-3f6933c4c07d'; // Kouassi, temporaire

type TentativeAvecDemande = {
  id: string;
  distanceM: number;
  demande: {
    latitudeClient: number;
    longitudeClient: number;
    categorie: { nom: string };
  };
};

export default function PrestataireNotifScreen() {
  const [tentative, setTentative] = useState<TentativeAvecDemande | null>(null);
  const [chargement, setChargement] = useState(true);
  const [reponseEnCours, setReponseEnCours] = useState(false);

  const chargerTentative = useCallback(() => {
    setChargement(true);
    fetch(`http://192.168.1.9:3000/api/prestataires/${PRESTATAIRE_ID_TEST}/tentative-en-attente`)
      .then((res) => res.json())
      .then((data) => setTentative(data))
      .catch((err) => console.error(err))
      .finally(() => setChargement(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerTentative();
    }, [chargerTentative])
  );

  const repondre = async (action: 'accepter' | 'decliner') => {
    if (!tentative) return;
    setReponseEnCours(true);
    try {
      await fetch(`http://192.168.1.9:3000/api/tentatives/${tentative.id}/${action}`, {
        method: 'POST',
      });
      setTentative(null);
      chargerTentative();
    } catch (err) {
      console.error(err);
    } finally {
      setReponseEnCours(false);
    }
  };

  if (chargement) return <ActivityIndicator style={styles.centre} size="large" />;

  if (!tentative) {
    return (
      <View style={styles.container}>
        <Text style={styles.vide}>Aucune demande en attente</Text>
        <TouchableOpacity style={styles.boutonRafraichir} onPress={chargerTentative}>
          <Text style={styles.texteBoutonRafraichir}>Rafraîchir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Nouvelle demande</Text>
      <Text style={styles.categorie}>{tentative.demande.categorie.nom}</Text>
      <Text style={styles.distance}>{tentative.distanceM} m</Text>

      <TouchableOpacity
        style={[styles.bouton, styles.boutonAccepter]}
        onPress={() => repondre('accepter')}
        disabled={reponseEnCours}
      >
        <Text style={styles.texteBouton}>Accepter</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bouton, styles.boutonDecliner]}
        onPress={() => repondre('decliner')}
        disabled={reponseEnCours}
      >
        <Text style={styles.texteBouton}>Décliner</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#ffffff' },
  centre: { flex: 1, textAlign: 'center', marginTop: 100, color: '#000000' },
  vide: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 40 },
  titre: { fontSize: 22, fontWeight: '600', marginBottom: 8, color: '#000000' },
  categorie: { fontSize: 18, color: '#000000', marginBottom: 4 },
  distance: { fontSize: 14, color: '#888', marginBottom: 24 },
  bouton: { padding: 14, borderRadius: 10, marginBottom: 12, alignItems: 'center' },
  boutonAccepter: { backgroundColor: '#22c55e' },
  boutonDecliner: { backgroundColor: '#ef4444' },
  texteBouton: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  boutonRafraichir: { padding: 12, alignItems: 'center', marginTop: 16 },
  texteBoutonRafraichir: { color: '#3b82f6', fontSize: 14 },
});