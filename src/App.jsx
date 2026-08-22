import { useState } from "react";
import { newProduction } from "./types/production";
import { productionStore } from "./persistence/productionStore";
import { useStudioController } from "./state/useStudioController";
import { useUpdater } from "./state/useUpdater";
import Startup from "./components/Startup";
import Shell from "./components/Shell";
import UpdateNotice from "./components/UpdateNotice";

export default function App() {
  const [production, setProduction] = useState(() => productionStore.getActive());
  const controller = useStudioController();
  const updater = useUpdater();
  const notice = <UpdateNotice updater={updater} />;
  if (!production) return <><Startup productions={productionStore.list()} updater={updater} onCreate={(data) => setProduction(productionStore.save(newProduction(data)))} onOpen={(id) => { productionStore.setActive(id); setProduction(productionStore.get(id)); }} />{notice}</>;
  const save = (next) => setProduction(productionStore.save(next));
  return <><Shell production={production} onProductionChange={save} onClose={() => setProduction(null)} controller={controller} updater={updater} />{notice}</>;
}
