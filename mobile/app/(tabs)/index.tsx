import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';

type Categorie = {
  id: string;
  nom: string;
  typeService: string;
};

export default function HomeScreen() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://192.168.1.7:3000/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setChargement(false);
      })
      .catch((err) => {
        setErreur('Impossible de charger les catégories');
        setChargement(false);
        console.error(err);
      });
  }, []);

  if (chargement) return <ActivityIndicator style={styles.centre} size="large" />;
  if (erreur) return <Text style={styles.centre}>{erreur}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Catégories disponibles</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.ligne}>
            <Text style={styles.nom}>{item.nom}</Text>
            <Text style={styles.type}>{item.typeService}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  titre: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  ligne: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  nom: { fontSize: 16 },
  type: { fontSize: 13, color: '#888' },
  centre: { flex: 1, textAlign: 'center', marginTop: 100 },
});