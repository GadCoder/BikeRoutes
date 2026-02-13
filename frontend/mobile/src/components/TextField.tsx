import { StyleSheet, Text, TextInput, View } from "react-native";
import { tokens } from "../theme/tokens";

export function TextField(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  helperRight?: { label: string; onPress?: () => void };
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
  textContentType?: "emailAddress" | "password" | "newPassword" | "none";
}) {
  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{props.label}</Text>
        {props.helperRight ? (
          <Text
            accessibilityRole="link"
            onPress={props.helperRight.onPress}
            style={styles.helperRight}
          >
            {props.helperRight.label}
          </Text>
        ) : null}
      </View>

      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={"rgba(1, 58, 99, 0.45)"}
        secureTextEntry={props.secureTextEntry}
        style={[styles.input, props.multiline && styles.inputMultiline]}
        multiline={props.multiline}
        numberOfLines={props.numberOfLines}
        autoCapitalize={props.autoCapitalize ?? "none"}
        keyboardType={props.keyboardType}
        textContentType={props.textContentType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: tokens.space.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.medium,
    color: tokens.color.text,
  },
  helperRight: {
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.medium,
    color: tokens.palette.cerulean,
  },
  input: {
    height: 48,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    fontSize: tokens.font.size.md,
    color: tokens.color.text,
  },
  inputMultiline: {
    height: 110,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
});

