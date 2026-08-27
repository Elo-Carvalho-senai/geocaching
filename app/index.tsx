import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  StatusBar,
} from "react-native";

import MapView, {
  Marker,
  Circle,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import * as Location from "expo-location";

import { LinearGradient } from "expo-linear-gradient";

import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

type Tesouro = {
  id: number;
  nome: string;
  descricao: string;
  latitude: number;
  longitude: number;
};

const TESOUROS: Tesouro[] = [
  {
    id: 1,
    nome: "Tesouro Perdido",
    descricao:
      "Um antigo tesouro escondido pelos primeiros exploradores.",
    latitude: -21.800481,
    longitude: -50.884091,
  },

  {
    id: 2,
    nome: "Tesouro Secreto",
    descricao:
      "Uma nova pista foi encontrada. Você está chegando perto!",
    latitude: -21.799900,
    longitude: -50.884900,
  },

  {
    id: 3,
    nome: "Tesouro do Fundador",
    descricao:
      "O último tesouro da missão. Encontre-o e complete o desafio!",
    latitude: -21.799950,
    longitude: -50.884350,
  },
];

const RAIO_DETECTAR = 100;

export default function Home() {
  const [localizacao, setLocalizacao] =
    useState<Location.LocationObject | null>(null);

  const [tesouroSelecionado, setTesouroSelecionado] =
    useState<Tesouro | null>(null);

  const [modalVisivel, setModalVisivel] = useState(false);

  const [conquistas, setConquistas] = useState<number[]>([]);

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    iniciarGPS();
  }, []);

  async function iniciarGPS() {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Localização necessária",
          "Permita o acesso ao GPS para participar da missão."
        );

        setCarregando(false);
        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocalizacao(location);

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (novaLocalizacao) => {
          setLocalizacao(novaLocalizacao);
        }
      );
    } catch {
      Alert.alert(
        "Erro de localização",
        "Não foi possível encontrar sua localização."
      );
    } finally {
      setCarregando(false);
    }
  }

  function calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371e3;

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;

    const Δφ =
      ((lat2 - lat1) * Math.PI) / 180;

    const Δλ =
      ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  }

  function distanciaDoTesouro(tesouro: Tesouro) {
    if (!localizacao) return Infinity;

    return calcularDistancia(
      localizacao.coords.latitude,
      localizacao.coords.longitude,
      tesouro.latitude,
      tesouro.longitude
    );
  }

  function abrirTesouro(tesouro: Tesouro) {
    const distancia = distanciaDoTesouro(tesouro);

    if (distancia > RAIO_DETECTAR) {
      Alert.alert(
        "Ainda está longe 📍",
        `Você está a aproximadamente ${Math.round(
          distancia
        )} metros deste tesouro.\n\nAproxime-se até ficar dentro do raio de 100 metros.`
      );

      return;
    }

    if (conquistas.includes(tesouro.id)) {
      Alert.alert(
        "Tesouro já encontrado 🏆",
        "Você já completou essa missão!"
      );

      return;
    }

    setConquistas((anteriores) => [
      ...anteriores,
      tesouro.id,
    ]);

    setTesouroSelecionado(tesouro);
    setModalVisivel(true);
  }

  if (carregando || !localizacao) {
    return (
      <LinearGradient
        colors={["#100B25", "#21124A", "#382070"]}
        style={styles.loading}
      >
        <View style={styles.loadingIcon}>
          <Ionicons
            name="navigate"
            size={42}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.loadingTitle}>
          Localizando você...
        </Text>

        <Text style={styles.loadingText}>
          Preparando sua missão de geocaching
        </Text>

        <View style={styles.loadingLine}>
          <View style={styles.loadingProgress} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#110C27"
      />

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.mapa}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: localizacao.coords.latitude,
          longitude: localizacao.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {TESOUROS.map((tesouro) => {
          const distancia =
            distanciaDoTesouro(tesouro);

          const perto =
            distancia <= RAIO_DETECTAR;

          const encontrado =
            conquistas.includes(tesouro.id);

          return (
            <React.Fragment key={tesouro.id}>
              <Marker
                coordinate={{
                  latitude: tesouro.latitude,
                  longitude: tesouro.longitude,
                }}
                title={tesouro.nome}
                description={
                  encontrado
                    ? "Tesouro encontrado!"
                    : perto
                    ? "Tesouro disponível!"
                    : `${Math.round(
                        distancia
                      )}m de distância`
                }
                pinColor={
                  encontrado
                    ? "#22C55E"
                    : perto
                    ? "#8B5CF6"
                    : "#EF4444"
                }
                onPress={() =>
                  abrirTesouro(tesouro)
                }
              />

              <Circle
                center={{
                  latitude: tesouro.latitude,
                  longitude: tesouro.longitude,
                }}
                radius={RAIO_DETECTAR}
                fillColor="rgba(139,92,246,0.10)"
                strokeColor="rgba(139,92,246,0.35)"
              />
            </React.Fragment>
          );
        })}
      </MapView>

      <LinearGradient
        colors={[
          "rgba(17,12,39,0.97)",
          "rgba(36,20,76,0.92)",
        ]}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Ionicons
              name="compass"
              size={25}
              color="#FFFFFF"
            />
          </View>

          <View>
            <Text style={styles.headerTitle}>
              Operação Geocaching
            </Text>

            <Text style={styles.headerSubtitle}>
              O Código do Fundador
            </Text>
          </View>
        </View>

        <View style={styles.score}>
          <Ionicons
            name="trophy"
            size={16}
            color="#FFD76A"
          />

          <Text style={styles.scoreText}>
            {conquistas.length}/3
          </Text>
        </View>
      </LinearGradient>

      <TouchableOpacity
        style={styles.gpsButton}
        onPress={() => {
          Alert.alert(
            "Sua localização",
            `Latitude: ${localizacao.coords.latitude.toFixed(
              5
            )}\nLongitude: ${localizacao.coords.longitude.toFixed(
              5
            )}`
          );
        }}
      >
        <Ionicons
          name="locate"
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <View style={styles.bottomPanel}>
        <View style={styles.panelHandle} />

        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>
              Tesouros da missão
            </Text>

            <Text style={styles.panelSubtitle}>
              Explore o mapa e encontre todos
            </Text>
          </View>

          <View style={styles.progressCircle}>
            <Text style={styles.progressNumber}>
              {conquistas.length}
            </Text>

            <Text style={styles.progressTotal}>
              /3
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <LinearGradient
            colors={["#7C3AED", "#22D3B6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              {
                width: `${
                  (conquistas.length / 3) * 100
                }%`,
              },
            ]}
          />
        </View>

        <FlatList
          data={TESOUROS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) =>
            item.id.toString()
          }
          contentContainerStyle={{
            paddingRight: 10,
          }}
          renderItem={({ item }) => {
            const distancia =
              distanciaDoTesouro(item);

            const encontrado =
              conquistas.includes(item.id);

            const perto =
              distancia <= RAIO_DETECTAR;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.tesouroCard,
                  encontrado &&
                    styles.cardEncontrado,
                  perto &&
                    !encontrado &&
                    styles.cardPerto,
                ]}
                onPress={() =>
                  abrirTesouro(item)
                }
              >
                <LinearGradient
                  colors={
                    encontrado
                      ? [
                          "#153C35",
                          "#102D29",
                        ]
                      : [
                          "#28204D",
                          "#19172F",
                        ]
                  }
                  style={styles.cardGradient}
                >
                  <View
                    style={[
                      styles.tesouroIcon,
                      encontrado &&
                        styles.iconEncontrado,
                    ]}
                  >
                    <Ionicons
                      name={
                        encontrado
                          ? "trophy"
                          : "cube"
                      }
                      size={25}
                      color={
                        encontrado
                          ? "#FFD76A"
                          : "#B39AFF"
                      }
                    />
                  </View>

                  <Text
                    style={styles.tesouroNumero}
                  >
                    TESOURO {item.id}
                  </Text>

                  <Text style={styles.tesouroNome}>
                    {item.nome}
                  </Text>

                  <View style={styles.distanceRow}>
                    <Ionicons
                      name={
                        encontrado
                          ? "checkmark-circle"
                          : perto
                          ? "location"
                          : "navigate"
                      }
                      size={14}
                      color={
                        encontrado
                          ? "#4ADE80"
                          : perto
                          ? "#67E8F9"
                          : "#AAA5C8"
                      }
                    />

                    <Text
                      style={[
                        styles.distanceText,
                        encontrado &&
                          styles.textEncontrado,
                        perto &&
                          !encontrado &&
                          styles.textPerto,
                      ]}
                    >
                      {encontrado
                        ? "Encontrado"
                        : perto
                        ? "Você está perto!"
                        : `${Math.round(
                            distancia
                          )}m`}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalVisivel(false)
        }
      >
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() =>
                setModalVisivel(false)
              }
            >
              <Ionicons
                name="close"
                size={22}
                color="#AAA5C8"
              />
            </TouchableOpacity>

            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              style={styles.treasureBigIcon}
            >
              <Ionicons
                name="trophy"
                size={48}
                color="#FFFFFF"
              />
            </LinearGradient>

            <Text style={styles.modalTag}>
              TESOURO ENCONTRADO
            </Text>

            <Text style={styles.modalTitle}>
              {tesouroSelecionado?.nome}
            </Text>

            <Text style={styles.modalDescription}>
              {tesouroSelecionado?.descricao}
            </Text>

            <View style={styles.divider} />

            <View style={styles.successBox}>
              <Ionicons
                name="checkmark-circle"
                size={25}
                color="#4ADE80"
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>
                  Missão concluída!
                </Text>

                <Text style={styles.successText}>
                  Você encontrou um dos tesouros
                  escondidos.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                setModalVisivel(false)
              }
            >
              <LinearGradient
                colors={["#7C3AED", "#5B4FE9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButton}
              >
                <Text style={styles.continueText}>
                  CONTINUAR MISSÃO
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#110C27",
  },

  mapa: {
    flex: 1,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 35,
  },

  loadingIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(139,92,246,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  loadingTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },

  loadingText: {
    color: "#B7B1D0",
    fontSize: 14,
    marginTop: 8,
  },

  loadingLine: {
    width: 180,
    height: 5,
    backgroundColor: "#292044",
    borderRadius: 10,
    marginTop: 25,
    overflow: "hidden",
  },

  loadingProgress: {
    width: "65%",
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
  },

  header: {
    position: "absolute",
    top: 45,
    left: 15,
    right: 15,
    height: 78,
    borderRadius: 22,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#7042D8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#7DE5CC",
    fontSize: 11,
    marginTop: 3,
  },

  score: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,215,106,0.12)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  scoreText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  gpsButton: {
    position: "absolute",
    right: 18,
    bottom: 285,
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#6540D7",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#110D25",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  panelHandle: {
    width: 45,
    height: 4,
    borderRadius: 10,
    backgroundColor: "#48415F",
    alignSelf: "center",
    marginBottom: 15,
  },

  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  panelTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  panelSubtitle: {
    color: "#85809D",
    fontSize: 12,
    marginTop: 4,
  },

  progressCircle: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "#211942",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 13,
  },

  progressNumber: {
    color: "#A78BFA",
    fontSize: 18,
    fontWeight: "900",
  },

  progressTotal: {
    color: "#817A9C",
    fontSize: 12,
  },

  progressBar: {
    height: 5,
    backgroundColor: "#27213D",
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 15,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  tesouroCard: {
    width: width * 0.56,
    height: 142,
    borderRadius: 20,
    marginRight: 12,
    overflow: "hidden",
  },

  cardGradient: {
    flex: 1,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
  },

  cardEncontrado: {
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.5)",
  },

  cardPerto: {
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.5)",
  },
  tesouroIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "rgba(139,92,246,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  iconEncontrado: {
    backgroundColor: "rgba(74,222,128,0.13)",
  },

  tesouroNumero: {
    color: "#77718F",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  tesouroNome: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },

  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 5,
  },

  distanceText: {
    color: "#AAA5C8",
    fontSize: 11,
    fontWeight: "600",
  },

  textEncontrado: {
    color: "#4ADE80",
  },

  textPerto: {
    color: "#67E8F9",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(5,3,15,0.82)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modal: {
    backgroundColor: "#18132F",
    borderRadius: 28,
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  closeButton: {
    position: "absolute",
    right: 18,
    top: 18,
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "#28223F",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },

  treasureBigIcon: {
    width: 90,
    height: 90,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 18,
  },

  modalTag: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 5,
  },

  modalDescription: {
    color: "#9F9AB5",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "#2C2644",
    marginVertical: 18,
  },

  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#102D29",
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.2)",
  },

  successTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  successText: {
    color: "#7E9B92",
    fontSize: 11,
    marginTop: 3,
  },

  continueButton: {
    height: 54,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 18,
  },

  continueText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
