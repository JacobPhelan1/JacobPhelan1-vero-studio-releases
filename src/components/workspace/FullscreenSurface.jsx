import { useEffect, useState } from "react";
import { productionStore } from "../../persistence/productionStore";
import SourceSurface from "./SourceSurface";

const getProduction = () => productionStore.getActive();
function View({ label, input }) { return <section className="fullscreen-monitor"><header><span>{label}</span><strong>{input?.name || "NO SIGNAL"}</strong></header><div>{input ? <SourceSurface input={input} /> : <b>No source selected</b>}</div></section>; }

export default function FullscreenSurface({ surface }) {
  const [production, setProduction] = useState(getProduction);
  useEffect(() => { const refresh = () => setProduction(getProduction()); const timer = setInterval(refresh, 500); window.addEventListener("storage", refresh); return () => { clearInterval(timer); window.removeEventListener("storage", refresh); }; }, []);
  const config = production?.inputConfiguration || {}, inputs = config.inputs || [];
  const preview = inputs.find((input) => input.id === config.previewInputId), program = inputs.find((input) => input.id === config.programInputId);
  if (!production) return <main className="fullscreen-output"><b>No active VERO Studio production.</b></main>;
  if (surface === "preview") return <main className="fullscreen-output preview"><View label="PREVIEW" input={preview} /></main>;
  if (surface === "program") return <main className="fullscreen-output program"><View label="PROGRAM" input={program} /></main>;
  return <main className="fullscreen-output multiview"><div className="multiview-primary"><View label="PREVIEW" input={preview} /><View label="PROGRAM" input={program} /></div><div className="multiview-inputs">{inputs.map((input, index) => <View key={input.id} label={`INPUT ${index + 1}`} input={input} />)}</div></main>;
}
