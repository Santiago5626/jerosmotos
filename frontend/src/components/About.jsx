import React from 'react';

const About = () => {
  return (
    <section id="quienes-somos" className="about-section py-5">
      <div className="container text-center my-5">
  <h2 className="mb-3">¿Quiénes somos?</h2>
  <p className="lead">
    Somos especialistas en compra, venta, consignación y empeño de vehículos y artículos de valor.
    Brindamos un servicio cercano, confiable y ágil para que tu experiencia siempre sea positiva.
  </p>
  <div className="row mt-4">
    <div className="col-md-4 mb-4">
      <i className="bi bi-shield-check" style={{ fontSize: '2rem', color: '#25D366' }}></i>
      <h5 className="mt-2">Confianza que te acompaña</h5>
      <p>Procesos claros y respaldo en cada operación.</p>
    </div>
    <div className="col-md-4 mb-4">
      <i className="bi bi-lightning-charge" style={{ fontSize: '2rem', color: '#25D366' }}></i>
      <h5 className="mt-2">Agilidad en cada trámite</h5>
      <p>Resolvemos rápido para que ganes tiempo.</p>
    </div>
    <div className="col-md-4 mb-4">
      <i className="bi bi-chat-dots" style={{ fontSize: '2rem', color: '#25D366' }}></i>
      <h5 className="mt-2">Atención personalizada</h5>
      <p>Te orientamos según tus necesidades reales.</p>
    </div>
  </div>
</div>

    </section>
  );
};

export default About;
