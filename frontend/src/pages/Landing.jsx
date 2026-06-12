import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import "./Landing.css";

export default function Landing() {
  const { usuario, cargando } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cargando && usuario) {
      navigate("/dashboard");
    }
  }, [usuario, cargando, navigate]);

  if (cargando) return null;

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <span className="landing-nav-logo">NavalMaint</span>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-nav-link">
            Entrar
          </Link>
          <Link to="/register" className="landing-nav-btn">
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1673896493356-6684ede37a7d?w=1600&q=85"
            alt=""
          />
        </div>
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">Gestión naval profesional</div>
          <h1>
            El mantenimiento de tu flota,
            <br />
            <em>bajo control</em>
          </h1>
          <p className="landing-hero-sub">
            Diseñado para embarcaciones medianas que necesitan más que una app
            de recreo y no necesitan la complejidad del software enterprise.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="btn-primary-lg">
              Empezar gratis
            </Link>
            <Link to="/login" className="btn-ghost-lg">
              Acceder →
            </Link>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="landing-problem">
        <div className="landing-container">
          <div className="landing-label">El problema</div>
          <h2>El mercado tiene un hueco sin cubrir</h2>
          <p className="landing-section-sub">
            Las soluciones existentes están en los extremos. NavalMaint ocupa el
            espacio intermedio.
          </p>
          <div className="landing-comparison">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Característica</th>
                  <th>Enterprise</th>
                  <th className="col-featured">NavalMaint</th>
                  <th>Recreo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Gestión de equipos</td>
                  <td><span className="check">✓</span></td>
                  <td className="col-featured"><span className="check">✓</span></td>
                  <td><span className="cross">✗</span></td>
                </tr>
                <tr>
                  <td>Plan de mantenimiento</td>
                  <td><span className="check">✓</span></td>
                  <td className="col-featured"><span className="check">✓</span></td>
                  <td><span className="cross">✗</span></td>
                </tr>
                <tr>
                  <td>Control de stock</td>
                  <td><span className="check">✓</span></td>
                  <td className="col-featured"><span className="check">✓</span></td>
                  <td><span className="cross">✗</span></td>
                </tr>
                <tr>
                  <td>Asistente IA</td>
                  <td><span className="cross">✗</span></td>
                  <td className="col-featured"><span className="check">✓</span></td>
                  <td><span className="cross">✗</span></td>
                </tr>
                <tr>
                  <td>Alertas incidencias</td>
                  <td><span className="check">✓</span></td>
                  <td className="col-featured"><span className="check">✓</span></td>
                  <td><span className="cross">✗</span></td>
                </tr>
                <tr>
                  <td>Precio accesible</td>
                  <td><span className="cross">✗</span></td>
                  <td className="col-featured"><span className="check">✓</span></td>
                  <td><span className="check">✓</span></td>
                </tr>
                <tr>
                  <td>Uso profesional</td>
                  <td><span className="check">✓</span></td>
                  <td className="col-featured"><span className="check">✓</span></td>
                  <td><span className="cross">✗</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="landing-features-section">
        <div className="landing-features-bg">
          <img
            src="https://images.unsplash.com/photo-1661571094656-1887a27885db?w=1600&q=85"
            alt=""
          />
        </div>
        <div className="landing-features-overlay" />
        <div className="landing-container landing-features-inner">
          <div className="landing-label">Funcionalidades</div>
          <h2>Todo lo que necesitas en un solo sistema</h2>
          <div className="landing-features">
            <div className="landing-feature">
              <h4>Gestión de equipos</h4>
              <p>Registro de sistemas y equipos con códigos técnicos y especificaciones reales.</p>
            </div>
            <div className="landing-feature">
              <h4>Plan de mantenimiento</h4>
              <p>Tareas por frecuencia — desde diaria hasta bianual. Pendientes en tiempo real.</p>
            </div>
            <div className="landing-feature">
              <h4>Control de stock</h4>
              <p>Inventario con alertas automáticas cuando el stock baja del mínimo establecido.</p>
            </div>
            <div className="landing-feature">
              <h4>Historial de logs</h4>
              <p>Registro de cada intervención con estado, observaciones y horas de motor.</p>
            </div>
            <div className="landing-feature">
              <h4>Asistente IA</h4>
              <p>Chat entrenado sobre la documentación real del buque. Respuestas al instante.</p>
            </div>
            <div className="landing-feature">
              <h4>Alertas de incidencias</h4>
              <p>Notificación automática al administrador cuando se registra una incidencia crítica.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-container landing-cta-inner">
          <h2>¿Listo para empezar?</h2>
          <p>Registra tu embarcación y gestiona el mantenimiento de forma profesional.</p>
          <div className="landing-hero-actions">
            <Link to="/register" className="btn-primary-lg">
              Crear cuenta gratuita
            </Link>
            <Link to="/login" className="btn-ghost-lg">
              Ya tengo cuenta →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <span>NavalMaint © 2025</span>
        <span>Proyecto final bootcamp full stack</span>
      </footer>

      {/* SCROLL HINT */}
      <div className="scroll-hint">
        <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="2,2 12,14 22,2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="2,14 12,26 22,14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

    </div>
  );
}