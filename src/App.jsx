import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════
   CONFIGURATION — Update links here
   ═══════════════════════════════════════════════════════════ */
const CONFIG = {
  name: "Marvelous",
  surname: "Iretomiwa",
  title: "Full-Stack Engineer",
  subtitle: "& Cybersecurity Specialist",
  email: "marveloustommyims@gmail.com",
  phone: "+234 906 632 5685",
  location: "Lagos, Nigeria",
  github: "https://github.com/IMAdegboyega",
  linkedin: "https://linkedin.com/in/marvelousiretomiwa",
  photoUrl: "", // Replace with your hosted photo URL
};

/* ═══════════════════════════════════════════════════════════
   ABSTRACT TERRAIN — Flowing 3D wireframe landscape
   ═══════════════════════════════════════════════════════════ */
const AbstractTerrain = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0e, 0.018);

    const camera = new THREE.PerspectiveCamera(55, el.clientWidth / el.clientHeight, 0.1, 200);
    camera.position.set(0, 12, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0x1a1a2e, 0.6));
    const goldLight = new THREE.PointLight(0xc9a84c, 1.2, 80);
    goldLight.position.set(15, 20, 10);
    scene.add(goldLight);
    const blueLight = new THREE.PointLight(0x4a7cc9, 0.6, 60);
    blueLight.position.set(-20, 15, -10);
    scene.add(blueLight);

    // Terrain plane
    const segW = 128, segH = 80;
    const planeGeo = new THREE.PlaneGeometry(80, 50, segW, segH);
    planeGeo.rotateX(-Math.PI * 0.5);

    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xc9a84c,
      wireframe: true,
      transparent: true,
      opacity: 0.13,
      metalness: 0.7,
      roughness: 0.4,
    });
    const terrain = new THREE.Mesh(planeGeo, planeMat);
    terrain.position.set(0, -4, -8);
    scene.add(terrain);

    // Second layer — slightly offset, different color for depth
    const planeGeo2 = new THREE.PlaneGeometry(80, 50, segW, segH);
    planeGeo2.rotateX(-Math.PI * 0.5);
    const planeMat2 = new THREE.MeshStandardMaterial({
      color: 0x4a7cc9,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
      metalness: 0.5,
      roughness: 0.6,
    });
    const terrain2 = new THREE.Mesh(planeGeo2, planeMat2);
    terrain2.position.set(0, -6, -8);
    scene.add(terrain2);

    // Floating accent particles above terrain
    const particleCount = 60;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const goldC = new THREE.Color(0xc9a84c);
    const blueC = new THREE.Color(0x4a7cc9);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 60;
      pPositions[i * 3 + 1] = Math.random() * 12 + 2;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 8;
      const c = Math.random() > 0.7 ? goldC : blueC;
      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // Store original Y positions for wave calculation
    const verts1 = planeGeo.attributes.position;
    const verts2 = planeGeo2.attributes.position;
    const baseY1 = new Float32Array(verts1.count);
    const baseY2 = new Float32Array(verts2.count);
    for (let i = 0; i < verts1.count; i++) baseY1[i] = verts1.getY(i);
    for (let i = 0; i < verts2.count; i++) baseY2[i] = verts2.getY(i);

    let mouseX = 0, mouseY = 0;
    const onMouse = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    let t = 0;
    const animate = () => {
      t += 0.006;

      // Animate terrain vertices — layered sine waves for organic feel
      for (let i = 0; i < verts1.count; i++) {
        const x = verts1.getX(i);
        const z = verts1.getZ(i);
        const wave1 = Math.sin(x * 0.08 + t * 1.2) * 1.8;
        const wave2 = Math.sin(z * 0.12 + t * 0.8) * 1.2;
        const wave3 = Math.sin((x + z) * 0.06 + t * 1.5) * 0.8;
        const wave4 = Math.cos(x * 0.15 - t * 0.6) * Math.sin(z * 0.1 + t) * 0.6;
        verts1.setY(i, baseY1[i] + wave1 + wave2 + wave3 + wave4);
      }
      verts1.needsUpdate = true;

      // Second layer — slightly different wave pattern
      for (let i = 0; i < verts2.count; i++) {
        const x = verts2.getX(i);
        const z = verts2.getZ(i);
        const wave1 = Math.sin(x * 0.07 + t * 0.9 + 1.5) * 1.5;
        const wave2 = Math.cos(z * 0.1 + t * 1.1) * 1.0;
        const wave3 = Math.sin((x - z) * 0.05 + t * 1.3) * 0.7;
        verts2.setY(i, baseY2[i] + wave1 + wave2 + wave3);
      }
      verts2.needsUpdate = true;

      // Floating particles gentle drift
      const pArr = pGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pArr[i * 3 + 1] += Math.sin(t * 0.5 + i) * 0.003;
      }
      pGeo.attributes.position.needsUpdate = true;

      // Subtle camera movement following mouse
      camera.position.x += (mouseX * 6 - camera.position.x) * 0.008;
      camera.position.y += (12 + mouseY * -3 - camera.position.y) * 0.008;
      camera.lookAt(0, 2, -5);

      // Gentle light movement
      goldLight.position.x = 15 + Math.sin(t * 0.4) * 8;
      blueLight.position.x = -20 + Math.cos(t * 0.3) * 6;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />;
};

/* ═══════════════════════════════════════════════════════════
   MINI 3D ORB — For skill category headers
   ═══════════════════════════════════════════════════════════ */
const MiniOrb = ({ color = "#c9a84c", type = "torus" }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.z = 4;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(56, 56);
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(new THREE.Color(color), 1);
    dl.position.set(2, 2, 3);
    scene.add(dl);

    const threeColor = new THREE.Color(color);
    const mat = new THREE.MeshStandardMaterial({ color: threeColor, wireframe: true, transparent: true, opacity: 0.6, metalness: 0.8, roughness: 0.2 });

    const geos = {
      torus: () => new THREE.TorusGeometry(1.1, 0.35, 12, 40),
      ico: () => new THREE.IcosahedronGeometry(1.3, 0),
      octa: () => new THREE.OctahedronGeometry(1.3, 0),
      dodeca: () => new THREE.DodecahedronGeometry(1.2, 0),
      tetra: () => new THREE.TetrahedronGeometry(1.4, 0),
      knot: () => new THREE.TorusKnotGeometry(0.9, 0.3, 64, 8),
    };
    const mesh = new THREE.Mesh((geos[type] || geos.torus)(), mat);
    scene.add(mesh);

    let t = Math.random() * 100;
    const animate = () => {
      t += 0.012;
      mesh.rotation.x = t * 0.5;
      mesh.rotation.y = t * 0.7;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [color, type]);

  return <div ref={mountRef} style={{ width: 56, height: 56, flexShrink: 0 }} />;
};

/* ═══════════════════════════════════════════════════════════
   GRAIN OVERLAY
   ═══════════════════════════════════════════════════════════ */
const GrainOverlay = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", opacity: 0.028,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  }} />
);

/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL HOOK
   ═══════════════════════════════════════════════════════════ */
const useReveal = (threshold = 0.12) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
};

/* ═══════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════ */
const navLinks = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Security", href: "#security" },
  { label: "Contact", href: "#contact" },
];

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      padding: scrolled ? "14px 40px" : "24px 40px",
      background: scrolled ? "rgba(10, 10, 14, 0.88)" : "transparent",
      backdropFilter: scrolled ? "blur(24px) saturate(1.4)" : "none",
      borderBottom: scrolled ? "1px solid rgba(201, 168, 76, 0.06)" : "none",
      transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <a href="#hero" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#c9a84c", letterSpacing: -0.5 }}>M</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: 3, textTransform: "uppercase", fontWeight: 300 }}>arvelous</span>
      </a>

      <div className="nav-desktop" style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {navLinks.map((l) => (
          <a key={l.label} href={l.href} style={{
            color: "rgba(255,255,255,0.45)", textDecoration: "none", fontSize: 12.5, fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 400, padding: "8px 14px", borderRadius: 6,
            transition: "all 0.3s",
          }}
            onMouseEnter={(e) => { e.target.style.color = "#c9a84c"; e.target.style.background = "rgba(201,168,76,0.06)"; }}
            onMouseLeave={(e) => { e.target.style.color = "rgba(255,255,255,0.45)"; e.target.style.background = "transparent"; }}
          >{l.label}</a>
        ))}
        <a href={`mailto:${CONFIG.email}`} style={{
          marginLeft: 12, padding: "9px 22px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: 100, color: "#c9a84c", textDecoration: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500, transition: "all 0.3s",
        }}
          onMouseEnter={(e) => { e.target.style.background = "#c9a84c"; e.target.style.color = "#0a0a0e"; }}
          onMouseLeave={(e) => { e.target.style.background = "rgba(201,168,76,0.1)"; e.target.style.color = "#c9a84c"; }}
        >Hire Me</a>
      </div>

      <button className="nav-mobile-btn" onClick={() => setOpen(!open)} style={{
        display: "none", background: "none", border: "1px solid rgba(201,168,76,0.2)", color: "#c9a84c",
        padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
      }}>{open ? "✕" : "Menu"}</button>

      {open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(10, 10, 14, 0.97)", backdropFilter: "blur(30px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, zIndex: 999,
        }}>
          <button onClick={() => setOpen(false)} style={{
            position: "absolute", top: 24, right: 40, background: "none", border: "none",
            color: "#c9a84c", fontSize: 28, cursor: "pointer",
          }}>✕</button>
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={{
              color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 18, fontFamily: "'Playfair Display', serif",
              letterSpacing: 2, transition: "color 0.3s",
            }}
              onMouseEnter={(e) => e.target.style.color = "#c9a84c"}
              onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.6)"}
            >{l.label}</a>
          ))}
        </div>
      )}
    </nav>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION WRAPPER
   ═══════════════════════════════════════════════════════════ */
const Section = ({ id, children, label, title }) => {
  const [ref, vis] = useReveal();
  return (
    <section id={id} ref={ref} style={{
      position: "relative", zIndex: 2, padding: "120px 24px", maxWidth: 1120, margin: "0 auto",
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(50px)",
      transition: "all 1s cubic-bezier(0.22, 1, 0.36, 1)",
    }}>
      {title && (
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, color: "#c9a84c", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, marginBottom: 14, opacity: 0.7 }}>
            {label || title}
          </div>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 50px)", fontWeight: 400, color: "#f0ece4", margin: 0, fontFamily: "'Playfair Display', serif", lineHeight: 1.15, letterSpacing: -0.5 }}>
            {title}
          </h2>
          <div style={{ width: 48, height: 1.5, background: "#c9a84c", marginTop: 20, opacity: 0.5 }} />
        </div>
      )}
      {children}
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════ */
const Hero = () => {
  const [ref, vis] = useReveal(0.05);
  return (
    <section id="hero" ref={ref} style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
      <AbstractTerrain />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, rgba(10,10,14,0.15), rgba(10,10,14,0.75) 65%), linear-gradient(to top, rgba(10,10,14,0) 40%, rgba(10,10,14,0.6) 100%)", zIndex: 1 }} />

      <div style={{
        position: "relative", zIndex: 2, padding: "0 40px", maxWidth: 800,
        opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(40px)",
        transition: "all 1.4s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        <div style={{
          fontSize: 12, letterSpacing: 5, color: "#c9a84c", textTransform: "uppercase",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 400, marginBottom: 24, opacity: 0.7,
        }}>
          Full-Stack Engineer · Cybersecurity Specialist
        </div>

        <h1 style={{ margin: 0, lineHeight: 1.05 }}>
          <span style={{
            display: "block", fontSize: "clamp(48px, 9vw, 96px)", fontFamily: "'Playfair Display', serif",
            fontWeight: 400, color: "#f0ece4", letterSpacing: -2,
          }}>
            {CONFIG.name}
          </span>
          <span style={{
            display: "block", fontSize: "clamp(48px, 9vw, 96px)", fontFamily: "'Playfair Display', serif",
            fontWeight: 400, letterSpacing: -2,
            background: "linear-gradient(135deg, #c9a84c, #e8d5a3, #c9a84c)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {CONFIG.surname}
          </span>
        </h1>

        <p style={{
          fontSize: 17, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.8, maxWidth: 520, marginTop: 32, fontWeight: 300,
        }}>
          I design and build high-performance web applications with a security-first mindset.
          3+ years shipping production systems across React, Next.js, Go, Python, and Node.js.
        </p>

        <div style={{ display: "flex", gap: 16, marginTop: 44, flexWrap: "wrap" }}>
          <a href="#projects" style={{
            padding: "15px 36px", background: "#c9a84c", color: "#0a0a0e", textDecoration: "none",
            borderRadius: 100, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            letterSpacing: 1.5, textTransform: "uppercase", transition: "all 0.4s",
            boxShadow: "0 4px 24px rgba(201,168,76,0.25)",
          }}
            onMouseEnter={(e) => e.target.style.boxShadow = "0 8px 40px rgba(201,168,76,0.4)"}
            onMouseLeave={(e) => e.target.style.boxShadow = "0 4px 24px rgba(201,168,76,0.25)"}
          >View My Work</a>
          <a href="#contact" style={{
            padding: "15px 36px", background: "transparent", color: "rgba(255,255,255,0.6)",
            textDecoration: "none", borderRadius: 100, fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.12)", transition: "all 0.4s",
          }}
            onMouseEnter={(e) => { e.target.style.borderColor = "#c9a84c"; e.target.style.color = "#c9a84c"; }}
            onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.color = "rgba(255,255,255,0.6)"; }}
          >Get In Touch</a>
        </div>

        <div style={{ position: "absolute", bottom: -120, left: 40, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 1, height: 48, background: "linear-gradient(180deg, #c9a84c, transparent)", opacity: 0.4 }} />
          <span style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", writingMode: "vertical-lr" }}>Scroll</span>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   ABOUT
   ═══════════════════════════════════════════════════════════ */
const About = () => (
  <Section id="about" label="Introduction" title="Building Digital Experiences With Purpose">
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 60, alignItems: "start" }} className="about-grid">
      <div style={{ position: "relative" }}>
        <div style={{
          width: 280, height: 360, borderRadius: 12, overflow: "hidden", position: "relative",
          background: "linear-gradient(145deg, rgba(201,168,76,0.08), rgba(30,30,40,0.5))",
          border: "1px solid rgba(201,168,76,0.1)",
        }}>
          {CONFIG.photoUrl ? (
            <img src={CONFIG.photoUrl} alt={CONFIG.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 32, opacity: 0.4, fontFamily: "'Playfair Display', serif", color: "#c9a84c" }}>M</span>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans', sans-serif" }}>Photo</span>
            </div>
          )}
        </div>
        <div style={{ position: "absolute", top: -8, right: -8, width: 60, height: 60, borderTop: "1px solid rgba(201,168,76,0.2)", borderRight: "1px solid rgba(201,168,76,0.2)", borderRadius: "0 8px 0 0" }} />
        <div style={{ position: "absolute", bottom: -8, left: -8, width: 60, height: 60, borderBottom: "1px solid rgba(201,168,76,0.2)", borderLeft: "1px solid rgba(201,168,76,0.2)", borderRadius: "0 0 0 8px" }} />
      </div>

      <div>
        <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.9, fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 300, margin: "0 0 24px" }}>
          I'm a full-stack software engineer with <span style={{ color: "#c9a84c" }}>3+ years of professional experience</span> building and deploying web applications end to end. From database architecture to polished interfaces, I own the entire stack.
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.9, fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 300, margin: "0 0 24px" }}>
          My toolset spans <span style={{ color: "rgba(255,255,255,0.85)" }}>React, Next.js, Go, Python, FastAPI, and Node.js</span>. What sets me apart is a deep background in cybersecurity — threat hunting, malware analysis, and SOC operations — which means every system I build is <span style={{ color: "#c9a84c" }}>secure by design</span>.
        </p>
        <p style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.9, fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 300, margin: 0, fontStyle: "italic" }}>
          B.Sc. Computer Science — Federal University of Agriculture, Abeokuta, 2018–2022.
        </p>

        <div style={{ display: "flex", gap: 40, marginTop: 44, flexWrap: "wrap" }}>
          {[
            { num: "3+", label: "Years Experience" },
            { num: "9+", label: "Projects Shipped" },
            { num: "8+", label: "Core Technologies" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 38, fontWeight: 300, color: "#c9a84c", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginTop: 8, fontWeight: 400 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Section>
);

/* ═══════════════════════════════════════════════════════════
   FLAGSHIP PROJECTS — Systems & Security (deep work)
   ───────────────────────────────────────────────────────────
   TODO: replace the github/live URLs below with the real ones.
   Live demos are optional — leave live:"" to hide the Live button.
   ═══════════════════════════════════════════════════════════ */
const flagshipProjects = [
  {
    name: "ZeroSum",
    tagline: "Double-Entry Ledger Payment System",
    problem:
      "A payments core where the books always sum to zero — proving the parts most “I can do payments” projects skip: double-entry accounting, idempotency, replay-safe webhooks, and drift-free concurrency.",
    metrics: [
      { value: "4", label: "Invariants enforced" },
      { value: "SERIALIZABLE", label: "Isolation level" },
      { value: "0", label: "Balance drift" },
    ],
    highlights: [
      "Money stored as integer minor units — value is never created or destroyed, only moved; the whole system always sums to zero.",
      "Append-only postings enforced by a DB trigger; corrections are reversing entries, never edits.",
      "HMAC-verified inbound webhooks with a replay guard; signed, retried outbound deliveries.",
    ],
    tech: ["Go (Gin)", "PostgreSQL", "Next.js", "Docker"],
    accent: "#c9a84c",
    github: "https://github.com/IMAdegboyega/zerosum",
    demo: "https://www.loom.com/share/091d851a00b94950969df6ade041cef1", 
    live: "",
  },
  {
    name: "Real-Time Fraud Detection",
    tagline: "Explainable Risk Scoring + Immutable Audit",
    problem:
      "A latency-critical fraud scorer for a payments ledger. Every transaction is scored in well under 50ms and answered with allow / review / block + a score + human-readable reasons — and every decision is written to an append-only audit log that can be reconstructed and defended months later.",
    metrics: [
      { value: "p99 < 50ms", label: "Decision path" },
      { value: "3-way", label: "allow / review / block" },
      { value: "Immutable", label: "Audit log" },
    ],
    highlights: [
      "Velocity engine (card / user / IP across 1m / 5m / 1h windows) + rule engine + ML risk model, one shared feature builder for train and serve.",
      "Plugs into ZeroSum: scores a transfer inline before the ledger commits, with a 40ms timeout and fail-open so a scorer outage never halts payments.",
      "Every decline is explainable for compliance — “the algorithm decided” is not acceptable, so reasons are durable and tamper-proof.",
    ],
    tech: ["FastAPI", "Redis", "Random Forest", "Next.js"],
    accent: "#c87a7a",
    github: "https://github.com/IMAdegboyega/fraud-detection",
    demo: "", // Loom/video walkthrough URL
    live: "",
  },
  {
    name: "apiscan",
    tagline: "OWASP API Top 10 Security Scanner",
    problem:
      "Point it at an API you own via its OpenAPI spec, and it scans, confirms, and writes up each flaw — broken authorization, broken authentication, mass assignment, and resource abuse — with the exact request/response that proves it.",
    metrics: [
      { value: "41", label: "Tests passing" },
      { value: "5", label: "Detectors" },
      { value: "Consent-gated", label: "Deny-by-default" },
    ],
    highlights: [
      "Five detectors mapped to the OWASP API Top 10 — BOLA/IDOR, JWT attacks, mass assignment, broken function authz, and rate-limit gaps.",
      "Every finding is proven with a reproducible HTTP request/response pair, plus confidence and a 0–100 risk score — triaged, not just dumped.",
      "Deny-by-default allowlist re-checked on every redirect; Authorization / Cookie / API-key headers redacted from stored evidence.",
    ],
    tech: ["Python", "FastAPI", "React", "Docker"],
    accent: "#8aa4c8",
    github: "https://github.com/IMAdegboyega/apiscan",
    demo: "", // Loom/video walkthrough URL
    live: "",
  },
];

/* ═══════════════════════════════════════════════════════════
   PROJECTS
   ═══════════════════════════════════════════════════════════ */
const projects = [
  {
    name: "Capture", tagline: "Screen Recording & Video Sharing Platform",
    description: "Full-stack video platform with Google OAuth, Bunny.net CDN streaming, Cloudinary media processing, and paginated video feeds with async FastAPI backend.",
    tech: ["Next.js", "TypeScript", "FastAPI", "PostgreSQL", "Bunny.net"], accent: "#8aa4c8",
    github: "https://github.com/IMAdegboyega/Capture", demo: "", live: "https://capture-8zsi.vercel.app/",
  },
  {
    name: "ArcVault", tagline: "Full-Stack Banking Platform",
    description: "Provider-agnostic banking API with Plaid bank linking, JWT token rotation, and a simulated payment layer designed for seamless production swap.",
    tech: ["Next.js", "TypeScript", "Node.js", "Express", "Prisma", "PostgreSQL"], accent: "#c9a84c",
    github: "https://github.com/IMAdegboyega/ArcVault", demo: "", live: "https://arc-vault-chi.vercel.app/",
  },
  {
    name: "Kiekky", tagline: "Community & Social Platform",
    description: "Production-ready platform with auth, user profiles, feeds, and real-time content. Go backend with clean layered architecture paired with a modern Next.js frontend.",
    tech: ["Next.js", "Go", "PostgreSQL", "JWT", "WebSockets"], accent: "#7dba89",
    github: "https://github.com/IMAdegboyega/community-platform-core", demo: "", live: "https://community-platform-core.vercel.app/",
  },
  {
    name: "247spyware", tagline: "Tech News & Content Platform",
    description: "Full-featured tech news platform with hero slider, admin dashboard, post scheduling, category management, and responsive editorial layout under Torth Enterprise.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Lucide React"], accent: "#d4a86a",
    github: "https://github.com/IMAdegboyega/247spy", demo: "", live: "",
  },
  {
    name: "Vault", tagline: "Personal File Storage & Management",
    description: "Secure cloud storage app with file uploads, sharing, OTP auth, drag-and-drop, and a radial usage chart. Built on Appwrite with shadcn/ui components.",
    tech: ["Next.js", "TypeScript", "Appwrite", "shadcn/ui", "Tailwind CSS"], accent: "#a78bca",
    github: "https://github.com/IMAdegboyega/IMA-Vault-App", demo: "", live: "https://ima-vault-app.vercel.app/",
  },
  // {
  //   name: "TREMAD Dashboard", tagline: "School Management System",
  //   description: "Comprehensive admin dashboard for student records, payments, and exams. Fully responsive with systematic breakpoint coverage across all viewports.",
  //   tech: ["React", "Next.js", "Node.js", "PostgreSQL"], accent: "#a78bca",
  //   github: null, live: "https://tremad-dashboard.example.com",
  // },
  {
    name: "Travel Agency", tagline: "Full-Stack Booking Platform",
    description: "Travel booking application with JWT-authenticated API layer, structured error handling, and CORS-configured React-to-FastAPI integration.",
    tech: ["React", "FastAPI", "Python", "PostgreSQL"], accent: "#c87a7a",
    github: "https://github.com/IMAdegboyega/IMA-Travelers", demo: "", live: "https://ima-travelers.vercel.app/",
  },
];

const ProjectCard = ({ project, index }) => {
  const [hovered, setHovered] = useState(false);
  const [ref, vis] = useReveal(0.1);

  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", borderRadius: 14, overflow: "hidden",
        background: hovered ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${hovered ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)"}`,
        padding: 36, transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        transform: vis ? (hovered ? "translateY(-6px)" : "none") : "translateY(40px)",
        opacity: vis ? 1 : 0, transitionDelay: `${index * 0.1}s`, cursor: "default",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)`,
        opacity: hovered ? 0.5 : 0, transition: "opacity 0.5s",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: "#f0ece4", fontFamily: "'Playfair Display', serif", letterSpacing: -0.3 }}>{project.name}</h3>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: project.accent, marginTop: 6, fontWeight: 400, opacity: 0.8 }}>{project.tagline}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" style={{
              color: "rgba(255,255,255,0.3)", textDecoration: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              padding: "6px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, transition: "all 0.3s",
            }}
              onMouseEnter={(e) => { e.target.style.color = "#c9a84c"; e.target.style.borderColor = "rgba(201,168,76,0.3)"; }}
              onMouseLeave={(e) => { e.target.style.color = "rgba(255,255,255,0.3)"; e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >GitHub ↗</a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" style={{
              color: project.accent, textDecoration: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              padding: "6px 14px", border: `1px solid ${project.accent}55`, background: `${project.accent}12`,
              borderRadius: 100, transition: "all 0.3s",
            }}
              onMouseEnter={(e) => { e.target.style.background = `${project.accent}22`; }}
              onMouseLeave={(e) => { e.target.style.background = `${project.accent}12`; }}
            >▶ Demo</a>
          )}
          {project.live && (
            <a href={project.live} target="_blank" rel="noopener noreferrer" style={{
              color: "#0a0a0e", textDecoration: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              padding: "6px 14px", background: project.accent, borderRadius: 100,
            }}>Live ↗</a>
          )}
        </div>
      </div>

      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14.5, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", fontWeight: 300, margin: "0 0 24px" }}>
        {project.description}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {project.tech.map((t) => (
          <span key={t} style={{
            padding: "5px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 100, fontSize: 11.5, fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.45)", letterSpacing: 0.5,
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
};

const FlagshipCard = ({ project, index }) => {
  const [hovered, setHovered] = useState(false);
  const [ref, vis] = useReveal(0.1);

  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", borderRadius: 16, overflow: "hidden",
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? `${project.accent}40` : "rgba(255,255,255,0.05)"}`,
        padding: "40px 40px 36px", transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        transform: vis ? (hovered ? "translateY(-4px)" : "none") : "translateY(40px)",
        opacity: vis ? 1 : 0, transitionDelay: `${index * 0.1}s`, cursor: "default",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)`,
        opacity: hovered ? 0.6 : 0.25, transition: "opacity 0.5s",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 10, letterSpacing: 2.5, color: project.accent, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: `${project.accent}12`, border: `1px solid ${project.accent}22` }}>Flagship</span>
          </div>
          <h3 style={{ margin: "14px 0 0", fontSize: 27, fontWeight: 400, color: "#f0ece4", fontFamily: "'Playfair Display', serif", letterSpacing: -0.4 }}>{project.name}</h3>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: project.accent, marginTop: 6, fontWeight: 400, opacity: 0.85 }}>{project.tagline}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" style={{
              color: "rgba(255,255,255,0.3)", textDecoration: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              padding: "7px 15px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, transition: "all 0.3s",
            }}
              onMouseEnter={(e) => { e.target.style.color = project.accent; e.target.style.borderColor = `${project.accent}55`; }}
              onMouseLeave={(e) => { e.target.style.color = "rgba(255,255,255,0.3)"; e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >GitHub ↗</a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" style={{
              color: project.accent, textDecoration: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              padding: "7px 15px", border: `1px solid ${project.accent}55`, background: `${project.accent}12`,
              borderRadius: 100, fontWeight: 500, transition: "all 0.3s",
            }}
              onMouseEnter={(e) => { e.target.style.background = `${project.accent}22`; }}
              onMouseLeave={(e) => { e.target.style.background = `${project.accent}12`; }}
            >▶ Demo</a>
          )}
          {project.live && (
            <a href={project.live} target="_blank" rel="noopener noreferrer" style={{
              color: "#0a0a0e", textDecoration: "none", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              padding: "7px 15px", background: project.accent, borderRadius: 100, fontWeight: 500,
            }}>Live ↗</a>
          )}
        </div>
      </div>

      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif", fontWeight: 300, margin: "22px 0 28px", maxWidth: 720 }}>
        {project.problem}
      </p>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 30, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {project.metrics.map((m) => (
          <div key={m.label}>
            <div style={{ fontSize: 24, fontWeight: 400, color: project.accent, fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>{m.value}</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginTop: 7, fontWeight: 400 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {project.highlights.map((h, j) => (
          <div key={j} style={{ display: "flex", gap: 12 }}>
            <span style={{ color: project.accent, fontSize: 7, marginTop: 8, flexShrink: 0 }}>●</span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{h}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {project.tech.map((t) => (
          <span key={t} style={{
            padding: "5px 14px", background: `${project.accent}0D`, border: `1px solid ${project.accent}1A`,
            borderRadius: 100, fontSize: 11.5, fontFamily: "'DM Sans', sans-serif", color: `${project.accent}CC`, letterSpacing: 0.5,
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
};

const Projects = () => (
  <Section id="projects" label="Selected Work" title="Projects I've Built">
    <div style={{ marginBottom: 20, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
      <h3 style={{ margin: 0, fontSize: 15, letterSpacing: 3, color: "#c9a84c", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Systems &amp; Security</h3>
      <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>Deep infrastructure work — payments, fraud, and security tooling.</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginBottom: 72 }}>
      {flagshipProjects.map((p, i) => <FlagshipCard key={p.name} project={p} index={i} />)}
    </div>

    <div style={{ marginBottom: 20, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
      <h3 style={{ margin: 0, fontSize: 15, letterSpacing: 3, color: "#c9a84c", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Other Builds</h3>
      <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>Full-stack products across web, media, and fintech.</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
      {projects.map((p, i) => <ProjectCard key={p.name} project={p} index={i} />)}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════════════════════
   SKILLS
   ═══════════════════════════════════════════════════════════ */
const skillGroups = [
  { name: "Frontend", color: "#8aa4c8", orbType: "torus", skills: ["React", "Next.js", "TypeScript", "JavaScript", "React Native", "HTML/CSS", "Tailwind"] },
  { name: "Backend", color: "#c9a84c", orbType: "ico", skills: ["Node.js", "Express", "Go (GIN, CHI)", "Python", "FastAPI", "Django"] },
  { name: "Databases", color: "#7dba89", orbType: "octa", skills: ["PostgreSQL", "MySQL", "MongoDB", "Redis"] },
  { name: "DevOps", color: "#a78bca", orbType: "dodeca", skills: ["Docker", "AWS", "CI/CD", "REST APIs", "JWT Auth"] },
  { name: "Security", color: "#c87a7a", orbType: "tetra", skills: ["Threat Hunting", "Malware Analysis", "Wireshark", "SOC Ops", "MITRE ATT&CK", "Log Analysis"] },
  { name: "Tools", color: "#d4a86a", orbType: "knot", skills: ["Git", "GitHub", "VS Code", "Linux", "Postman"] },
];

const Skills = () => (
  <Section id="skills" label="Expertise" title="Technologies & Tools">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {skillGroups.map((g, i) => {
        const [ref, vis] = useReveal(0.1);
        const [hov, setHov] = useState(false);
        return (
          <div key={g.name} ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
              padding: 28, borderRadius: 14,
              background: hov ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.012)",
              border: `1px solid ${hov ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)"}`,
              transition: "all 0.5s", opacity: vis ? 1 : 0,
              transform: vis ? "none" : "translateY(25px)", transitionDelay: `${i * 0.07}s`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <MiniOrb color={g.color} type={g.orbType} />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: "#f0ece4", fontFamily: "'Playfair Display', serif" }}>{g.name}</h3>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {g.skills.map((s) => (
                <span key={s} style={{
                  padding: "5px 14px", borderRadius: 100, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                  background: `${g.color}0D`, border: `1px solid ${g.color}1A`, color: `${g.color}CC`,
                }}>{s}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════════════════════
   EXPERIENCE
   ═══════════════════════════════════════════════════════════ */
const experiences = [
  {
    role: "Software Engineer", company: "Torth Enterprise LLC", loc: "Denver, CO (Remote)", period: "2025 – Present",
    points: [
      "Designed full-stack fashion community platform with React and Next.js",
      "Architected multiple RESTful APIs with clean separation of concerns",
      "Containerized backend services with Docker for deployment consistency",
      "Built CI/CD pipelines automating testing and deployment workflows",
    ],
  },
  {
    role: "Junior Software Developer", company: "Torth Enterprise LLC", loc: "Denver, CO (Remote)", period: "2022 – 2023",
    points: [
      "Built JWT-based auth system handling high-volume user traffic",
      "Integrated PostgreSQL and Redis, improving query performance significantly",
      "Contributed to code reviews and technical planning with senior team",
    ],
  },
  {
    role: "IT Support & Systems Specialist", company: "TREMAD Schools", loc: "Lagos, Nigeria", period: "2021 – 2022",
    points: [
      "Maintained school web portal ensuring high availability for staff and students",
      "Built responsive React/Next.js admin dashboard for records and payments",
      "Improved system uptime through targeted performance optimisations",
    ],
  },
];

const Experience = () => (
  <Section id="experience" label="Career" title="Where I've Worked">
    <div>
      {experiences.map((exp, i) => {
        const [ref, vis] = useReveal(0.12);
        return (
          <div key={i} ref={ref} style={{
            display: "grid", gridTemplateColumns: "200px 1fr", gap: 40,
            padding: "44px 0",
            borderBottom: i < experiences.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(25px)",
            transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.12}s`,
          }} className="exp-grid">
            <div>
              <div style={{ fontSize: 13, color: "#c9a84c", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{exp.period}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>{exp.loc}</div>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: "#f0ece4", fontFamily: "'Playfair Display', serif" }}>{exp.role}</h3>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", marginTop: 4, marginBottom: 20 }}>{exp.company}</div>
              {exp.points.map((p, j) => (
                <div key={j} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <span style={{ color: "#c9a84c", fontSize: 7, marginTop: 8, flexShrink: 0 }}>●</span>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════════════════════
   CYBERSECURITY
   ═══════════════════════════════════════════════════════════ */
const secItems = [
  { name: "Threat Hunting", desc: "Proactive identification of adversary activity using behavioral analysis and IOC-based detection across network and endpoint telemetry." },
  { name: "Malware Analysis", desc: "Traffic analysis with Wireshark/PCAP to identify C2 communications, data exfiltration patterns, and extract malware payloads." },
  { name: "SOC Operations", desc: "Security Operations Center workflows — alert triage, incident response, log correlation, and threat intelligence integration." },
  { name: "MITRE ATT&CK", desc: "Mapping adversary techniques for structured threat modeling, detection engineering, and security gap analysis." },
  { name: "Log Analysis", desc: "SIEM-driven analysis of system and network logs to detect anomalies, track lateral movement, and support forensic investigations." },
  { name: "Network Security", desc: "Deep OSI model understanding, TCP/IP, DNS, HTTP — identifying attack vectors from protocol-level anomalies." },
];

const Security = () => (
  <Section id="security" label="Specialization" title="Cybersecurity Expertise">
    <div style={{
      padding: 28, borderRadius: 14, marginBottom: 36,
      background: "rgba(200, 122, 122, 0.03)", border: "1px solid rgba(200,122,122,0.08)",
    }}>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
        Beyond building applications, I bring a <span style={{ color: "#c87a7a", fontWeight: 500 }}>security-first engineering mindset</span> — and I've shipped it, not just studied it. <span style={{ color: "rgba(255,255,255,0.8)" }}>apiscan</span> automates the OWASP API Top 10 with reproducible evidence, and my <span style={{ color: "rgba(255,255,255,0.8)" }}>real-time fraud detection</span> system defends a live payments ledger with explainable, auditable decisions. That work sits on top of SOC analyst operations, hands-on malware traffic analysis, and practical vulnerability testing — making me a strong fit for teams that treat security as a core feature.
      </p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
      {secItems.map((item, i) => {
        const [ref, vis] = useReveal(0.1);
        const [hov, setHov] = useState(false);
        return (
          <div key={item.name} ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
              padding: 28, borderRadius: 14,
              background: hov ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.012)",
              border: `1px solid ${hov ? "rgba(200,122,122,0.12)" : "rgba(255,255,255,0.03)"}`,
              transition: "all 0.5s", opacity: vis ? 1 : 0,
              transform: vis ? "none" : "translateY(20px)", transitionDelay: `${i * 0.07}s`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c87a7a", opacity: 0.6 }} />
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 400, color: "#f0ece4", fontFamily: "'Playfair Display', serif" }}>{item.name}</h4>
            </div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 13.5, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>{item.desc}</p>
          </div>
        );
      })}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════════════════════
   CONTACT
   ═══════════════════════════════════════════════════════════ */
const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const inputStyle = {
    width: "100%", padding: "16px 20px", background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, color: "#f0ece4",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300, outline: "none",
    transition: "border-color 0.3s", boxSizing: "border-box",
  };

  return (
    <Section id="contact" label="Connect" title="Let's Work Together">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }} className="contact-grid">
        <div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1.9, fontFamily: "'DM Sans', sans-serif", fontWeight: 300, margin: "0 0 40px" }}>
            I'm currently available for remote full-stack engineering and cybersecurity roles. If you have a project in mind or want to discuss an opportunity, I'd love to hear from you.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { label: "Email", value: CONFIG.email, href: `mailto:${CONFIG.email}` },
              { label: "GitHub", value: "IMAdegboyega", href: CONFIG.github },
              { label: "LinkedIn", value: "marvelousiretomiwa", href: CONFIG.linkedin },
              { label: "Location", value: CONFIG.location, href: null },
            ].map((c) => (
              <div key={c.label} style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, width: 80, flexShrink: 0 }}>{c.label}</span>
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ color: "#c9a84c", textDecoration: "none", fontSize: 14, fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.3s" }}
                    onMouseEnter={(e) => e.target.style.opacity = "0.7"}
                    onMouseLeave={(e) => e.target.style.opacity = "1"}
                  >{c.value}</a>
                ) : (
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{c.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: 36, borderRadius: 14,
          background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)",
        }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(125,186,137,0.1)", border: "1px solid rgba(125,186,137,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <span style={{ color: "#7dba89", fontSize: 24 }}>✓</span>
              </div>
              <div style={{ color: "#f0ece4", fontSize: 18, fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>Message Sent</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>I'll respond within 24 hours.</div>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="form-inner-grid">
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 8 }}>Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(201,168,76,0.3)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.06)"} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 8 }}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(201,168,76,0.3)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.06)"} />
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: 8 }}>Message</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell me about your project..." rows={5} style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(201,168,76,0.3)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.06)"} />
              </div>
              <button onClick={() => { setSent(true); setTimeout(() => setSent(false), 4000); }} style={{
                width: "100%", padding: "16px", background: "#c9a84c", color: "#0a0a0e", border: "none",
                borderRadius: 100, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                letterSpacing: 2, cursor: "pointer", transition: "all 0.4s", textTransform: "uppercase",
              }}
                onMouseEnter={(e) => e.target.style.boxShadow = "0 8px 32px rgba(201,168,76,0.3)"}
                onMouseLeave={(e) => e.target.style.boxShadow = "none"}
              >Send Message</button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
};

/* ═══════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════ */
const Footer = () => (
  <footer style={{ position: "relative", zIndex: 2, padding: "40px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 300, letterSpacing: 1 }}>
      © {new Date().getFullYear()} Marvelous Iretomiwa — Built with precision
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
   ═══════════════════════════════════════════════════════════ */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.3) #0a0a0e; }
    body { background: #0a0a0e; color: #f0ece4; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: #0a0a0e; }
    ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.25); border-radius: 10px; }
    ::selection { background: rgba(201,168,76,0.25); color: #f0ece4; }

    .nav-desktop { display: flex !important; }
    .nav-mobile-btn { display: none !important; }

    @media (max-width: 900px) {
      .nav-desktop { display: none !important; }
      .nav-mobile-btn { display: block !important; }
      .about-grid { grid-template-columns: 1fr !important; justify-items: center; }
      .exp-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
      .contact-grid { grid-template-columns: 1fr !important; }
      .form-inner-grid { grid-template-columns: 1fr !important; }
    }

    @media (max-width: 500px) {
      section { padding-left: 16px !important; padding-right: 16px !important; }
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════ */
export default function Portfolio() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0a0a0e" }}>
      <Styles />
      <GrainOverlay />
      <Nav />
      <Hero />
      <About />
      <Projects />
      <Skills />
      <Experience />
      <Security />
      <Contact />
      <Footer />
    </div>
  );
}