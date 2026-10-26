import { LogOut, Menu, UserRound } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useHasRole } from "@/hooks/usePermissions";

/** Escudo de la UNMSM, el mismo archivo del CMS de la Facultad que usa Red Alumni. */
const ESCUDO_URL =
  "https://d36uo5rgyynebe.cloudfront.net/ciencias-biologicas/universidad_nacional_mayor_de_san_marcos_logo_png_seeklogo_390422_48ace18936.png";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const backendUser = useAuthStore((state) => state.backendUser);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = useHasRole("Admin");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const name =
    `${backendUser?.firstName || ""} ${backendUser?.lastName || ""}`.trim() ||
    backendUser?.email ||
    "Usuario";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `repo-nav-link ${isActive ? "repo-nav-link--active" : ""}`;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="repo-header">
        <div className="repo-header__inner">
          <NavLink
            to="/"
            className="repo-brand"
            aria-label="Repositorio de Materiales Académicos - Facultad de Ciencias Biológicas - UNMSM"
          >
            <img className="repo-escudo" src={ESCUDO_URL} alt="" aria-hidden="true" />
            <span className="min-w-0">
              <span className="repo-brand__title">Repositorio de Materiales Académicos</span>
              <span className="repo-brand__subtitle">
                Facultad de Ciencias Biológicas - UNMSM
              </span>
            </span>
          </NavLink>
          <nav className="repo-nav" aria-label="Navegación principal">
            <NavLink to="/" end className={linkClass}>
              Cursos dictados
            </NavLink>
            {isAdmin && (
              <NavLink to="/maintenance" className={linkClass}>
                Mantenimiento
              </NavLink>
            )}
          </nav>
          <div className="relative hidden lg:block">
            <details className="repo-account">
              <summary>
                <UserRound size={18} aria-hidden="true" />
                <span>{name}</span>
              </summary>
              <div className="repo-account__menu">
                <p>{backendUser?.email}</p>
                <button type="button" onClick={handleLogout}>
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </div>
            </details>
          </div>
          <button
            type="button"
            className="repo-mobile-toggle"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
          >
            <Menu />
          </button>
        </div>
        {mobileOpen && (
          <nav className="repo-mobile-nav">
            <NavLink to="/" onClick={() => setMobileOpen(false)}>
              Cursos dictados
            </NavLink>
            {isAdmin && (
              <NavLink to="/maintenance" onClick={() => setMobileOpen(false)}>
                Mantenimiento
              </NavLink>
            )}
            <button type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </nav>
        )}
      </header>
      <main className="repo-shell">
        <Outlet />
      </main>
    </div>
  );
}
