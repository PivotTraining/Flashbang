import HomeScreen from "./ui/home/HomeScreen";
import TrainingScreen from "./ui/TrainingScreen";
import StubScreen from "./ui/StubScreen";
import { useScreenStore } from "./state/screenStore";

export default function App() {
  const screen = useScreenStore((s) => s.screen);

  if (screen === "home") return <HomeScreen />;
  if (screen === "training") return <TrainingScreen />;
  return <StubScreen screen={screen} />;
}
