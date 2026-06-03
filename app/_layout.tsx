import { useFonts } from "expo-font";
import { SQLiteProvider } from "expo-sqlite";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { DATABASE_NAME, inicializarBanco } from "../src/database/database";
import { VeiculoService } from "../src/services/veiculoService";
import { UsuarioService } from "../src/services/usuarioService";
import "react-native-reanimated";

import { useColorScheme } from "../components/useColorScheme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [initialRouteName, setInitialRouteName] = useState<string | null>(null);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    try {
      const totalVeiculos = VeiculoService.contarTotal();
      const totalUsuarios = UsuarioService.contarTotal();
      setInitialRouteName(
        totalVeiculos === 0 || totalUsuarios === 0 ? "onboarding" : "(tabs)",
      );
    } catch (error) {
      console.error("Erro na carga inicial do banco offline:", error);
      setInitialRouteName("(tabs)");
    }
  }, []);

  useEffect(() => {
    if (loaded && initialRouteName) {
      SplashScreen.hideAsync();
    }
  }, [loaded, initialRouteName]);

  if (!loaded || !initialRouteName) {
    return null;
  }

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={inicializarBanco}>
      <RootLayoutNav initialRouteName={initialRouteName} />
    </SQLiteProvider>
  );
}

function RootLayoutNav({ initialRouteName }: { initialRouteName: string }) {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName={initialRouteName}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
