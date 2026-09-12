import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'djassa_utilisateur';

type Utilisateur = {
  id: string;
  nom: string;
  telephone: string;
  typeCompte: string;
};

export default function ConnexionScreen() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [etape, setEtape] = useState<'telephone' | 'code'>('telephone');
  const [telephone, setTelephone] = useState('');
  const [nom, setNom] = useState('');
  const [typeCompte, setTypeCompte] = useState<'client' | 'prestataire'>('client');
  const [code, setCode] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) setUtilisateur(JSON.parse(data));
    });
  }, []);

  const envoyerCode = async () => {
    setErreur(null);
    if (!telephone.startsWith('+')) {
      setErreur('Le numéro doit être au format international, ex: +2250700000000');
      return;
    }
    setChargement(true);
    try {
      await fetch('http://102.168.1.9:3000/api/auth/envoyer-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone }),
      });
      setEtape('code');
    } catch (err) {
      setErreur("Erreur lors de l'envoi du code");
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const verifierCode = async () => {
    setErreur(null);
    if (!nom.trim()) {
      setErreur('Le nom est requis');
      return;
    }
    setChargement(true);
    try {
      const res = await fetch('http://192.168.1.9:3000/api/auth/verifier-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone, code, nom, typeCompte }),
      });
      const data = await res.json();
      if (data.succes) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.utilisateur));
        setUtilisateur(data.utilisateur);
      } else {
        setErreur(data.message ?? 'Code invalide');
      }
    } catch (err) {
      setErreur('Erreur lors de la vérification');
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const seDeconnecter = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUtilisateur(null);
    setEtape('telephone');
    setTelephone('');
    setCode('');
    setNom('');
  };

  if (utilisateur) {
    return (
      <View style={styles.container}>
        <Text style={styles.titre}>Connecté</Text>
        <Text style={styles.info}>{utilisateur.nom}</Text>
        <Text style={styles.infoMuted}>{utilisateur.telephone}</Text>
        <Text style={styles.infoMuted}>{utilisateur.typeCompte}</Text>
        <TouchableOpacity style={styles.boutonSecondaire} onPress={seDeconnecter}>
          <Text style={styles.texteBoutonSecondaire}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Connexion</Text>

      {etape === 'telephone' ? (
        <>
          <Text style={styles.label}>Numéro de téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="+2250700000000"
            placeholderTextColor="#888"
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
          />
          {erreur && <Text style={styles.erreur}>{erreur}</Text>}
          <TouchableOpacity style={styles.bouton} onPress={envoyerCode} disabled={chargement}>
            {chargement ? <ActivityIndicator color="#fff" /> : <Text style={styles.texteBouton}>Recevoir le code</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Code reçu par SMS</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor="#888"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          <Text style={styles.label}>Votre nom</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            placeholderTextColor="#888"
            value={nom}
            onChangeText={setNom}
          />
          <Text style={styles.label}>Type de compte</Text>
          <View style={styles.rowChoix}>
            <TouchableOpacity
              style={[styles.choix, typeCompte === 'client' && styles.choixActif]}
              onPress={() => setTypeCompte('client')}
            >
              <Text style={typeCompte === 'client' ? styles.texteChoixActif : styles.texteChoix}>Client</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choix, typeCompte === 'prestataire' && styles.choixActif]}
              onPress={() => setTypeCompte('prestataire')}
            >
              <Text style={typeCompte === 'prestataire' ? styles.texteChoixActif : styles.texteChoix}>Prestataire</Text>
            </TouchableOpacity>
          </View>
          {erreur && <Text style={styles.erreur}>{erreur}</Text>}
          <TouchableOpacity style={styles.bouton} onPress={verifierCode} disabled={chargement}>
            {chargement ? <ActivityIndicator color="#fff" /> : <Text style={styles.texteBouton}>Valider</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#ffffff' },
  titre: { fontSize: 22, fontWeight: '600', marginBottom: 20, color: '#000000' },
  label: { fontSize: 13, color: '#888', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, color: '#000000' },
  bouton: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  texteBouton: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  boutonSecondaire: { borderWidth: 1, borderColor: '#ef4444', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  texteBoutonSecondaire: { color: '#ef4444', fontWeight: '600', fontSize: 16 },
  erreur: { color: '#ef4444', marginTop: 10, fontSize: 13 },
  info: { fontSize: 18, color: '#000000', marginTop: 4 },
  infoMuted: { fontSize: 14, color: '#888', marginTop: 2 },
  rowChoix: { flexDirection: 'row', gap: 10 },
  choix: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  choixActif: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  texteChoix: { color: '#000000' },
  texteChoixActif: { color: '#ffffff', fontWeight: '600' },
});