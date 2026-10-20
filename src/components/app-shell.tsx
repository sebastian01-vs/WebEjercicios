"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Dumbbell,
  ArrowUpRight,
  LogOut,
  ChevronRight,
  Menu,
  X,
  HeartPulse,
} from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
import { usePlanner } from "./planner-provider";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { href: "/", label: "Mi rutina", icon: LayoutDashboard },
  { href: "/calendar/edit", label: "Mi calendario", icon: CalendarDays },
  { href: "/exercises", label: "Ejercicios", icon: Dumbbell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isGuest, notify } = usePlanner();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.push("/login");
      router.refresh();
    } catch {
      notify("No pudimos cerrar la sesión. Inténtalo otra vez.");
      setSigningOut(false);
    }
  }
  return (
    <div className="app-layout">
      <div className="mobile-bar">
        <Link href="/" aria-label="Pulso, inicio">
          <Brand compact />
        </Link>
        <button
          className="icon-button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="sidebar"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      )}
      <aside id="sidebar" className={`sidebar ${open ? "is-open" : ""}`}>
        <Link
          href="/"
          className="sidebar-brand"
          aria-label="Pulso, inicio"
          onClick={() => setOpen(false)}
        >
          <Brand />
        </Link>
        <div className="workspace-label">
          <span className="workspace-dot" />
          TU ESPACIO DE ENTRENAMIENTO
        </div>
        <nav aria-label="Navegación principal">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${pathname === href ? "active" : ""}`}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {pathname === href && <ChevronRight size={15} />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="motivation-card">
            <HeartPulse size={23} />
            <p>
              La constancia
              <br />
              <strong>hace la diferencia.</strong>
            </p>
            <span>Un entrenamiento a la vez.</span>
            <div className="mini-bars" aria-hidden="true">
              {[22, 35, 28, 46, 40, 56, 67, 60, 79, 88, 75, 100].map((height, i) => (
                <i key={i} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          {isGuest ? (
            <Link href="/register" className="user-card">
              <div className="avatar">A</div>
              <span>
                <strong>Atleta invitado</strong>
                <small>Crear mi cuenta</small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ) : (
            <div className="user-card">
              <div className="avatar">{user?.name.charAt(0).toUpperCase()}</div>
              <span>
                <strong>{user?.name}</strong>
                <small>Tu espacio personal</small>
              </span>
              <button
                className="icon-button"
                aria-label="Cerrar sesión"
                disabled={signingOut}
                onClick={signOut}
              >
                <LogOut size={17} />
              </button>
            </div>
          )}
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Mi espacio <ChevronRight size={13} />
            <strong>{navigation.find((n) => n.href === pathname)?.label || "Mi rutina"}</strong>
          </div>
          <div className="topbar-status">
            <span className="status-dot" />
            {isGuest ? "Modo invitado" : "Tu plan, contigo"}
            <span className="topbar-divider" />
            <span className="small-avatar">{user?.name.charAt(0).toUpperCase() || "A"}</span>
          </div>
        </header>
        <main id="main" className="content">
          {children}
        </main>
        <footer className="app-footer">
          <span>
            PULSO <span className="muted">/</span> HECHO PARA TU RITMO
          </span>
          <span>Pequeños pasos. Grandes cambios.</span>
        </footer>
      </div>
    </div>
  );
}
