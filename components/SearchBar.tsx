import { IconLupa } from "./icons";

export default function SearchBar({ defaultValue = "", cat }: { defaultValue?: string; cat?: string }) {
  return (
    <form className="search" action="/catalogo" role="search">
      <IconLupa className="search-icon" />
      <label htmlFor="q" className="sr-only">Buscar en la feria</label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Buscá plumas de faisán, espaldar, strass…"
        autoComplete="off"
        enterKeyHint="search"
      />
      {cat && <input type="hidden" name="cat" value={cat} />}
      <button className="btn btn-fucsia" type="submit">Buscar</button>
    </form>
  );
}
