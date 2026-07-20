import HomeScreen from "./ui/home/HomeScreen";
import TrainingScreen from "./ui/TrainingScreen";
import BattleScreen from "./ui/BattleScreen";
import StubScreen from "./ui/StubScreen";
import { useScreenStore } from "./state/screenStore";

export default function App() {
  const screen = useScreenStore((s) => s.screen);

  if (screen === "home") return <HomeScreen />;
  // PLAY is the real fight; TRAINING keeps the throw/catch drill.
  if (screen === "play") return <BattleScreen />;
  if (screen === "training") return <TrainingScreen />;
  return <StubScreen screen={screen} />;
}
