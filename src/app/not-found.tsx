import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="error-page">
      <span className="eyebrow">404 / FUERA DE RUTA</span>
      <h1>Esta página se tomó un descanso.</h1>
      <Link href="/" className="button primary">
        Volver a mi rutina
      </Link>
    </main>
  );
}
