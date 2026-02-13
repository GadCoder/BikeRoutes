import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { tokens } from "../../theme/tokens";

export function AuthedHomeScreen(props: { email: string; onSignOut: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>BikeRoutes</Text>
        <Text style={styles.sub}>Signed in as {props.email}</Text>
        <View style={styles.actions}>
          <Button variant="secondary" label="Sign Out" onPress={props.onSignOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  body: {
    flex: 1,
    padding: tokens.space.xl,
    justifyContent: "center",
  },
  title: {
    fontSize: tokens.font.size.xl,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
    textAlign: "center",
  },
  sub: {
    marginTop: 8,
    fontSize: tokens.font.size.sm,
    color: tokens.color.textSecondary,
    textAlign: "center",
  },
  actions: {
    marginTop: tokens.space.xl,
  },
});

