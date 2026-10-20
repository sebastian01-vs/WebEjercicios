import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pulso — Tu rutina, tu ritmo", template: "%s · Pulso" },
  description:
    "Planifica tu semana de entrenamiento, encuentra ejercicios y construye una rutina a tu medida.",
  applicationName: "Pulso Routine Planner",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#main">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
