import React from 'react'
import cospralLogo from '@/assets/cospral-wordmark.png'

export default function PublicFooter() {
  return <footer className="public-footer">
    <div className="public-footer-inner">
      <div className="public-footer-top">
        <img src={cospralLogo} alt="C.O.S.P.R.A.L." />
        <div><p className="public-footer-name">Cooperativa de Agua y Luz de Rancul</p><p>Comprometidos con el bienestar de nuestra comunidad, brindando servicios esenciales y un mejor futuro para todos.</p></div>
      </div>
      <div className="public-footer-copyright">© {new Date().getFullYear()} C.O.S.P.R.A.L. — Cooperativa de Agua y Luz de Rancul. Todos los derechos reservados.</div>
    </div>
  </footer>
}
