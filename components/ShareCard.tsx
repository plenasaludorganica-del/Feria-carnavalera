import ShareFeria from "./ShareFeria";

/** Aviso para difundir la Feria entre comparseros. */
export default function ShareCard({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <section className={`share-card share-card-${tone}`} aria-labelledby="difundir" data-fx="rise">
      <h2 id="difundir" data-fx="title">Contale a tu comparsa</h2>
      <p>
        La gente no sabe dónde buscar insumos usados. Acá está todo en un solo lugar, con contacto directo y sin
        depender de las redes. Cuantos más comparseros la conozcan, más rápido se vende todo.
      </p>
      <ShareFeria tone={tone} />
    </section>
  );
}
