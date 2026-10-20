"use client";
import { CircleAlert } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <CircleAlert size={40} />
      <h1>No pudimos cargar tu espacio</h1>
      <p>
        Comprueba tu conexión. Si el problema continúa, revisa la configuración de la base de datos.
      </p>
      <button className="button primary" onClick={reset}>
        Volver a intentar
      </button>
    </main>
  );
}
