/* HALDEN HX-60P — reloj 3D procedural (Three.js r149, script clásico)
   Expone window.HXWatch.create(opts) -> { group, setExplode, setUnroll, setFinish, update } */
(function () {
  'use strict';

  const TAU = Math.PI * 2;

  const FINISHES = {
    silver: { metal: 0xdcdee1, rough: 0.16, accent: '#eef0f2', label: 'Silver Steel' },
    black:  { metal: 0x3a3c41, rough: 0.28, accent: '#c9ccd1', label: 'Carbon Black' },
    gold:   { metal: 0xe9c073, rough: 0.18, accent: '#f4d89c', label: 'Solar Gold' },
    rose:   { metal: 0xe2a790, rough: 0.18, accent: '#f3c9b8', label: 'Rose Bronze' },
  };

  /* ---------- geometrías auxiliares ---------- */

  function roundedBox(w, h, d, r) {
    const b = Math.min(r, d / 2) * 0.8;
    const w2 = w / 2 - b, h2 = h / 2 - b;
    const rr = Math.max(Math.min(r - b, w2, h2), 0.002);
    const s = new THREE.Shape();
    s.moveTo(-w2, -h2 + rr);
    s.lineTo(-w2, h2 - rr);  s.quadraticCurveTo(-w2, h2, -w2 + rr, h2);
    s.lineTo(w2 - rr, h2);   s.quadraticCurveTo(w2, h2, w2, h2 - rr);
    s.lineTo(w2, -h2 + rr);  s.quadraticCurveTo(w2, -h2, w2 - rr, -h2);
    s.lineTo(-w2 + rr, -h2); s.quadraticCurveTo(-w2, -h2, -w2, -h2 + rr);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b,
      bevelSegments: 3, curveSegments: 5,
    });
    g.translate(0, 0, -(d - 2 * b) / 2);
    return g;
  }

  // Perfil (radio, altura) girado alrededor del eje Z (la esfera mira a +Z)
  function lathe(pts, segs) {
    const g = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), segs || 128);
    g.rotateX(Math.PI / 2);
    return g;
  }

  function gearGeo(r, teeth, depth) {
    const s = new THREE.Shape();
    const ri = r * 0.9, step = TAU / teeth;
    for (let i = 0; i < teeth; i++) {
      const a0 = i * step;
      [[ri, a0], [r, a0 + step * 0.2], [r, a0 + step * 0.5], [ri, a0 + step * 0.7]].forEach(([rad, a], j) => {
        const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
        if (i === 0 && j === 0) s.moveTo(x, y); else s.lineTo(x, y);
      });
    }
    s.closePath();
    if (r > 0.1) {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU, p = new THREE.Path();
        p.absarc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.2, 0, TAU, true);
        s.holes.push(p);
      }
    }
    const hole = new THREE.Path();
    hole.absarc(0, 0, r * 0.12, 0, TAU, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 });
    g.translate(0, 0, -depth / 2);
    return g;
  }

  function handGeo(len, w, tail, depth) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -tail);
    s.lineTo(w / 2, -tail);
    s.lineTo(w / 2, len * 0.8);
    s.lineTo(0, len);
    s.lineTo(-w / 2, len * 0.8);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth, bevelEnabled: true, bevelThickness: depth * 0.3,
      bevelSize: Math.min(w * 0.18, 0.006), bevelSegments: 2,
    });
  }

  /* ---------- esfera dibujada en canvas ---------- */

  function drawDial(canvas, accent) {
    const S = canvas.width, R = S / 2, c = canvas.getContext('2d');
    c.clearRect(0, 0, S, S);
    c.save();
    c.translate(R, R);

    const bg = c.createRadialGradient(0, -R * 0.25, R * 0.05, 0, 0, R);
    bg.addColorStop(0, '#202226');
    bg.addColorStop(0.65, '#0c0d0f');
    bg.addColorStop(1, '#040405');
    c.fillStyle = bg;
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();

    // guilloché tipo sunburst
    c.strokeStyle = 'rgba(255,255,255,0.045)';
    c.lineWidth = 1;
    for (let i = 0; i < 360; i++) {
      const a = (i / 360) * TAU;
      c.beginPath();
      c.moveTo(Math.cos(a) * R * 0.04, Math.sin(a) * R * 0.04);
      c.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      c.stroke();
    }

    // minutero
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU, big = i % 5 === 0;
      const r0 = R * 0.905, r1 = R * (big ? 0.975 : 0.95);
      c.strokeStyle = big ? accent : 'rgba(255,255,255,0.5)';
      c.lineWidth = big ? S * 0.004 : S * 0.0018;
      c.beginPath();
      c.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0);
      c.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1);
      c.stroke();
    }

    // índices aplicados
    const bw = S * 0.016;
    for (let h = 0; h < 12; h++) {
      if (h === 3) continue;
      c.save();
      c.rotate((h / 12) * TAU);
      const offs = h === 0 ? [-bw * 0.9, bw * 0.9] : [0];
      offs.forEach((ox) => {
        const gr = c.createLinearGradient(ox - bw / 2, 0, ox + bw / 2, 0);
        gr.addColorStop(0, accent); gr.addColorStop(0.5, '#6d6f73'); gr.addColorStop(1, accent);
        c.fillStyle = gr;
        c.fillRect(ox - bw / 2, -R * 0.86, bw, R * 0.16);
        c.strokeStyle = 'rgba(0,0,0,0.6)';
        c.lineWidth = 1;
        c.strokeRect(ox - bw / 2, -R * 0.86, bw, R * 0.16);
      });
      c.restore();
    }

    // subesfera fase lunar (12h)
    const my = -R * 0.4, mr = R * 0.19;
    const sky = c.createRadialGradient(0, my, mr * 0.1, 0, my, mr);
    sky.addColorStop(0, '#141a2a'); sky.addColorStop(1, '#030407');
    c.fillStyle = sky;
    c.beginPath(); c.arc(0, my, mr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    [[-0.5, -0.3], [0.45, -0.45], [0.2, 0.35], [-0.25, 0.5], [0.6, 0.15]].forEach(([x, y]) => {
      c.beginPath(); c.arc(x * mr, my + y * mr, S * 0.0022, 0, TAU); c.fill();
    });
    const moon = c.createRadialGradient(-mr * 0.12, my - mr * 0.12, 0, 0, my, mr * 0.42);
    moon.addColorStop(0, '#fff2c4'); moon.addColorStop(1, '#c99a3a');
    c.fillStyle = moon;
    c.beginPath(); c.arc(0, my, mr * 0.38, 0, TAU); c.fill();
    c.strokeStyle = accent; c.lineWidth = S * 0.006;
    c.beginPath(); c.arc(0, my, mr, 0, TAU); c.stroke();

    // apertura corazón abierto (6h)
    const ay = R * 0.42, ar = R * 0.2;
    c.fillStyle = '#050505';
    c.beginPath(); c.arc(0, ay, ar, 0, TAU); c.fill();
    c.save();
    c.beginPath(); c.arc(0, ay, ar, 0, TAU); c.clip();
    c.strokeStyle = '#b8913f'; c.lineWidth = S * 0.003;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, ay, ar * (0.35 + k * 0.22), 0, TAU); c.stroke(); }
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * TAU;
      c.beginPath();
      c.moveTo(Math.cos(a) * ar * 0.78, ay + Math.sin(a) * ar * 0.78);
      c.lineTo(Math.cos(a) * ar * 0.9, ay + Math.sin(a) * ar * 0.9);
      c.stroke();
    }
    c.strokeStyle = '#d9dadc'; c.lineWidth = S * 0.004;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU;
      c.beginPath(); c.moveTo(0, ay); c.lineTo(Math.cos(a) * ar * 0.57, ay + Math.sin(a) * ar * 0.57); c.stroke();
    }
    c.fillStyle = '#a3102f';
    [[0, 0], [0.62, -0.5], [-0.6, 0.45]].forEach(([x, y]) => {
      c.beginPath(); c.arc(x * ar, ay + y * ar, S * 0.007, 0, TAU); c.fill();
    });
    c.restore();
    c.strokeStyle = accent; c.lineWidth = S * 0.006;
    c.beginPath(); c.arc(0, ay, ar, 0, TAU); c.stroke();

    // ventana de fecha (3h)
    const dx = R * 0.62, dw = R * 0.16, dh = R * 0.11;
    c.fillStyle = '#efefef';
    c.fillRect(dx - dw / 2, -dh / 2, dw, dh);
    c.strokeStyle = accent; c.lineWidth = S * 0.004;
    c.strokeRect(dx - dw / 2, -dh / 2, dw, dh);
    c.fillStyle = '#111';
    c.font = `600 ${Math.round(R * 0.085)}px Jost, Arial, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('27', dx, R * 0.006);

    // rotulación
    c.fillStyle = accent;
    if ('letterSpacing' in c) c.letterSpacing = `${Math.round(R * 0.012)}px`;
    c.font = `500 ${Math.round(R * 0.07)}px Jost, Arial, sans-serif`;
    c.fillText('HALDEN', -R * 0.44, -R * 0.04);
    c.font = `300 ${Math.round(R * 0.045)}px Jost, Arial, sans-serif`;
    c.fillText('HX 60P', -R * 0.44, R * 0.05);
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.font = `400 ${Math.round(R * 0.032)}px Jost, Arial, sans-serif`;
    c.fillText('AUTOMATIC', -R * 0.44, R * 0.12);
    if ('letterSpacing' in c) c.letterSpacing = '0px';

    c.restore();
  }

  /* ---------- fábrica del reloj ---------- */

  function create(opts) {
    opts = opts || {};
    const withMovement = opts.movement !== false;
    const group = new THREE.Group();

    const mPolished = new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.16, side: THREE.DoubleSide });
    const mBrushed  = new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.36, side: THREE.DoubleSide });
    const mDark     = new THREE.MeshStandardMaterial({ color: 0x1a1b1d, metalness: 0.9, roughness: 0.3 });
    const mRhodium  = new THREE.MeshStandardMaterial({ color: 0x8f9297, metalness: 1, roughness: 0.32 });
    const mGold     = new THREE.MeshStandardMaterial({ color: 0xd6a94c, metalness: 1, roughness: 0.25 });
    const mRuby     = new THREE.MeshStandardMaterial({ color: 0x9b0f2c, metalness: 0.2, roughness: 0.15 });
    const mHands    = new THREE.MeshStandardMaterial({ color: 0xf2f3f5, metalness: 1, roughness: 0.12 });
    const mGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16,
      clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, envMapIntensity: 1.6,
    });

    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = dialCanvas.height = opts.lite ? 512 : 1024;
    const dialTex = new THREE.CanvasTexture(dialCanvas);
    dialTex.encoding = THREE.sRGBEncoding;
    dialTex.anisotropy = 8;
    const mDial = new THREE.MeshStandardMaterial({ map: dialTex, metalness: 0.25, roughness: 0.42 });

    // partes que se separan en el despiece (offset en Z)
    const parts = {};
    const part = (name, k) => { const g = new THREE.Group(); g.userData.k = k; parts[name] = g; group.add(g); return g; };

    /* caja */
    const caseG = part('case', 0);
    caseG.add(new THREE.Mesh(lathe([
      [0.8, -0.15], [0.9, -0.15], [0.965, -0.125], [0.995, -0.075], [1.005, 0], [0.995, 0.07],
      [0.975, 0.105], [0.94, 0.122], [0.86, 0.124], [0.8, 0.12], [0.8, -0.15],
    ]), mBrushed));
    const lugGeo = roundedBox(0.2, 0.44, 0.2, 0.07);
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => {
      const lug = new THREE.Mesh(lugGeo, mPolished);
      lug.position.set(sx * 0.47, sy * 0.92, -0.025);
      lug.rotation.x = sy * 0.12;
      caseG.add(lug);
    });
    const barGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.76, 16);
    barGeo.rotateZ(Math.PI / 2);
    [1, -1].forEach((sy) => {
      const bar = new THREE.Mesh(barGeo, mPolished);
      bar.position.set(0, sy * 1.06, -0.04);
      caseG.add(bar);
    });
    // corona y pulsadores
    const radial = (geo, a, r, mat) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      m.rotation.z = a - Math.PI / 2;
      caseG.add(m);
      return m;
    };
    radial(new THREE.CylinderGeometry(0.105, 0.105, 0.15, 36), 0, 1.06, mPolished);
    radial(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16), 0, 0.98, mBrushed);
    [0.62, -0.62].forEach((a) => {
      radial(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 16), a, 1.02, mBrushed);
      radial(new THREE.CylinderGeometry(0.06, 0.06, 0.07, 24), a, 1.1, mPolished);
    });

    /* bisel con tornillos */
    const bezelG = part('bezel', 1.6);
    bezelG.add(new THREE.Mesh(lathe([
      [0.8, 0.118], [0.97, 0.118], [0.985, 0.15], [0.96, 0.19], [0.9, 0.205],
      [0.84, 0.205], [0.81, 0.19], [0.8, 0.118],
    ]), mPolished));
    const screwGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.02, 16);
    screwGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, sc = new THREE.Mesh(screwGeo, mDark);
      sc.position.set(Math.sin(a) * 0.905, Math.cos(a) * 0.905, 0.206);
      bezelG.add(sc);
    }

    /* esfera, agujas y cristal */
    const dialG = part('dial', 0.75);
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.805, 96), mDial);
    dial.position.z = 0.1;
    dialG.add(dial);

    const handsG = part('hands', 1.15);
    const mkHand = (geo, z) => { const p = new THREE.Group(); p.position.z = z; p.add(new THREE.Mesh(geo, mHands)); handsG.add(p); return p; };
    const hourHand = mkHand(handGeo(0.44, 0.055, 0.06, 0.006), 0.104);
    const minHand = mkHand(handGeo(0.66, 0.04, 0.08, 0.006), 0.114);
    const secHand = mkHand(handGeo(0.72, 0.012, 0.18, 0.004), 0.124);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 24), mHands);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.12;
    handsG.add(cap);

    const crystalG = part('crystal', 2.15);
    const crystal = new THREE.Mesh(new THREE.CircleGeometry(0.815, 96), mGlass);
    crystal.position.z = 0.18;
    crystal.renderOrder = 2;
    crystalG.add(crystal);

    /* fondo de caja con cristal de zafiro */
    const backG = part('caseback', -1.85);
    backG.add(new THREE.Mesh(lathe([
      [0.55, -0.205], [0.8, -0.205], [0.835, -0.18], [0.84, -0.15], [0.55, -0.15], [0.55, -0.205],
    ]), mPolished));
    const backGlass = new THREE.Mesh(new THREE.CircleGeometry(0.555, 64), mGlass);
    backGlass.position.z = -0.19;
    backGlass.rotation.y = Math.PI;
    backGlass.renderOrder = 2;
    backG.add(backGlass);

    /* calibre */
    const gears = [];
    let balance = null, rotor = null;
    if (withMovement) {
      const movG = part('movement', -0.75);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.04, 96), mRhodium);
      plate.rotation.x = Math.PI / 2;
      plate.position.z = -0.06;
      movG.add(plate);
      [[0.15, 0.25, 0.6], [-0.2, -0.05, -0.9], [0.32, -0.25, 1.9]].forEach(([x, y, a]) => {
        const br = new THREE.Mesh(roundedBox(0.95, 0.17, 0.03, 0.08), mRhodium);
        br.position.set(x, y, -0.025);
        br.rotation.z = a;
        movG.add(br);
      });
      [[-0.27, 0.22, 0.26, 44, 0.6], [0.24, 0.3, 0.18, 32, -0.9], [0.34, -0.12, 0.14, 26, 1.2], [-0.14, -0.36, 0.12, 22, -1.5], [-0.42, -0.18, 0.09, 18, 2.2]]
        .forEach(([x, y, r, t, sp]) => {
          const geo = gearGeo(r, t, 0.022);
          // tren de engranajes por ambas caras: visible en el despiece y a través del fondo de zafiro
          [[x, y, -0.002, sp], [-x, y, -0.092, -sp]].forEach(([gx, gy, gz, gs]) => {
            const g = new THREE.Mesh(geo, mGold);
            g.position.set(gx, gy, gz);
            g.userData.speed = gs;
            movG.add(g);
            gears.push(g);
          });
          const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), mRuby);
          jewel.position.set(x, y, 0.012);
          movG.add(jewel);
        });
      balance = new THREE.Group();
      balance.position.set(0, -0.33, 0.01);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 10, 64), mGold);
      balance.add(ring);
      for (let k = 0; k < 3; k++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.15, 0.008), mGold);
        sp.position.set(Math.cos((k / 3) * TAU) * 0.075, Math.sin((k / 3) * TAU) * 0.075, 0);
        sp.rotation.z = (k / 3) * TAU - Math.PI / 2;
        balance.add(sp);
      }
      for (let k = 1; k <= 4; k++) {
        balance.add(new THREE.Mesh(new THREE.TorusGeometry(0.025 * k, 0.0025, 4, 48), mHands));
      }
      movG.add(balance);

      const rotorG = part('rotor', -1.3);
      const rs = new THREE.Shape();
      rs.absarc(0, 0, 0.74, 0, Math.PI, false);
      rs.absarc(0, 0, 0.1, Math.PI, 0, true);
      rotor = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 0.022, bevelEnabled: false, curveSegments: 48 }), mPolished);
      rotor.position.z = -0.125;
      const rimS = new THREE.Shape();
      rimS.absarc(0, 0, 0.74, 0.05, Math.PI - 0.05, false);
      rimS.absarc(0, 0, 0.62, Math.PI - 0.05, 0.05, true);
      const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rimS, { depth: 0.03, bevelEnabled: false, curveSegments: 48 }), mGold);
      rim.position.z = -0.004;
      rotor.add(rim);
      rotorG.add(rotor);
    }

    /* brazalete de tres eslabones (instanciado) */
    const braceletG = new THREE.Group();
    group.add(braceletG);
    const curve = new THREE.CatmullRomCurve3([
      [0, 1.13, -0.04], [0, 1.45, -0.42], [0, 1.52, -1.15], [0, 1.22, -1.85], [0, 0.55, -2.22],
      [0, -0.55, -2.22], [0, -1.22, -1.85], [0, -1.52, -1.15], [0, -1.45, -0.42], [0, -1.13, -0.04],
    ].map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5);
    const L = curve.getLength(), pitch = 0.168;
    const n = Math.floor(L / pitch);
    const loopM = [], flatM = [];
    const X = new THREE.Vector3(1, 0, 0), T = new THREE.Vector3(), N = new THREE.Vector3(), M = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const p = curve.getPointAt(u);
      curve.getTangentAt(u, T);
      N.crossVectors(X, T).normalize();
      M.makeBasis(X, T, N);
      const q = new THREE.Quaternion().setFromRotationMatrix(M);
      loopM.push({ p: p.clone(), q });
      const s = u * L, half = i < n / 2;
      const fp = half ? new THREE.Vector3(0, 1.13 + s, -0.04) : new THREE.Vector3(0, -1.13 - (L - s), -0.04);
      flatM.push({ p: fp, q: new THREE.Quaternion() });
    }
    const centerLinks = new THREE.InstancedMesh(roundedBox(0.3, 0.155, 0.11, 0.045), mPolished, n);
    const outerLinks = new THREE.InstancedMesh(roundedBox(0.21, 0.155, 0.1, 0.04), mBrushed, n * 2);
    braceletG.add(centerLinks, outerLinks);

    const tmpP = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), off = new THREE.Vector3();
    let lastUnroll = -1;
    function setUnroll(v) {
      v = Math.round(v * 1000) / 1000;
      if (v === lastUnroll) return;
      lastUnroll = v;
      for (let i = 0; i < n; i++) {
        tmpP.lerpVectors(loopM[i].p, flatM[i].p, v);
        tmpQ.slerpQuaternions(loopM[i].q, flatM[i].q, v);
        M.compose(tmpP, tmpQ, one);
        centerLinks.setMatrixAt(i, M);
        [-1, 1].forEach((sx, j) => {
          off.set(sx * 0.265, 0, -0.005).applyQuaternion(tmpQ).add(tmpP);
          M.compose(off, tmpQ, one);
          outerLinks.setMatrixAt(i * 2 + j, M);
        });
      }
      centerLinks.instanceMatrix.needsUpdate = true;
      outerLinks.instanceMatrix.needsUpdate = true;
    }
    setUnroll(0);

    function setExplode(e) {
      Object.values(parts).forEach((g) => { g.position.z = g.userData.k * e; });
      const b = 1 - Math.min(1, e * 3);
      braceletG.scale.setScalar(Math.max(b, 0.0001));
      braceletG.visible = b > 0.001;
    }

    function setFinish(name) {
      const f = FINISHES[name] || FINISHES.silver;
      [mPolished, mBrushed].forEach((m) => m.color.setHex(f.metal));
      mPolished.roughness = f.rough;
      mBrushed.roughness = f.rough + 0.2;
      mHands.color.set(name === 'silver' || name === 'black' ? 0xf2f3f5 : f.metal);
      drawDial(dialCanvas, f.accent);
      dialTex.needsUpdate = true;
      group.userData.finish = name;
    }
    setFinish(opts.finish || 'silver');
    // la fuente Jost puede cargar después: redibuja la esfera
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setFinish(group.userData.finish));

    function update(t) {
      const now = new Date();
      const s = now.getSeconds() + now.getMilliseconds() / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;
      hourHand.rotation.z = -(h / 12) * TAU;
      minHand.rotation.z = -(m / 60) * TAU;
      secHand.rotation.z = -(Math.floor(s * 6) / 6 / 60) * TAU;
      gears.forEach((g) => { g.rotation.z = t * g.userData.speed; });
      if (balance) balance.rotation.z = Math.sin(t * TAU * 2.5) * 2.2;
      if (rotor) rotor.rotation.z = t * 0.35;
    }

    return { group, setExplode, setUnroll, setFinish, update };
  }

  window.HXWatch = { create, FINISHES };
})();
