/* Olivar · escena procedural: casa de cristal de una planta en un olivar, luz de hora dorada.
   Expone window.OlivarScene.build() → { scene, sun, update } (script clásico, sin módulos). */
(function () {
  'use strict';

  /* ---------- utilidades ---------- */
  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function canvasTex(size, draw, rep) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (rep) t.repeat.set(rep[0], rep[1]);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  }

  function speckle(ctx, s, n, colors, r0, r1, rand) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = colors[(rand() * colors.length) | 0];
      ctx.globalAlpha = 0.25 + rand() * 0.5;
      const r = r0 + rand() * (r1 - r0);
      ctx.beginPath();
      ctx.arc(rand() * s, rand() * s, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- texturas ---------- */
  function makeTextures() {
    const R = rng(11);
    const grass = canvasTex(512, (c, s) => {
      c.fillStyle = '#7b8546'; c.fillRect(0, 0, s, s);
      speckle(c, s, 2600, ['#6a7439', '#8a9350', '#9a9a58', '#5f6a33', '#a5a064'], 1, 3.2, R);
      c.lineWidth = 1;
      for (let i = 0; i < 1800; i++) {
        c.strokeStyle = R() > 0.5 ? 'rgba(160,160,90,.35)' : 'rgba(70,80,40,.35)';
        const x = R() * s, y = R() * s;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 3, y - 3 - R() * 5); c.stroke();
      }
    }, [70, 70]);

    const concrete = canvasTex(512, (c, s) => {
      c.fillStyle = '#cdc8be'; c.fillRect(0, 0, s, s);
      speckle(c, s, 160, ['#c3bdb2', '#d8d3ca'], 20, 70, R);
      speckle(c, s, 5000, ['#b9b3a8', '#e0dcd4', '#a9a397'], 0.4, 1.4, R);
      c.strokeStyle = 'rgba(120,115,105,.18)';
      for (let y = 0; y < s; y += 128) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(s, y + 0.5); c.stroke(); }
    }, [4, 1]);

    const wood = canvasTex(1024, (c, s) => {
      const plank = s / 8;
      for (let i = 0; i < 8; i++) {
        const l = 34 + R() * 10;
        c.fillStyle = `hsl(${24 + R() * 6},${38 + R() * 10}%,${l}%)`;
        c.fillRect(i * plank, 0, plank, s);
        for (let g = 0; g < 26; g++) {
          c.strokeStyle = `rgba(${R() > 0.5 ? '60,35,20' : '200,150,110'},${0.08 + R() * 0.1})`;
          c.lineWidth = 0.6 + R() * 1.6;
          const x = i * plank + R() * plank;
          c.beginPath(); c.moveTo(x, 0);
          c.bezierCurveTo(x + (R() - 0.5) * 10, s * 0.3, x + (R() - 0.5) * 10, s * 0.7, x, s);
          c.stroke();
        }
        c.fillStyle = 'rgba(30,18,10,.55)'; c.fillRect(i * plank, 0, 2, s);
        const cut = R() * s;
        c.fillRect(i * plank, cut, plank, 2);
      }
    }, [3, 1.4]);

    const plaster = canvasTex(256, (c, s) => {
      c.fillStyle = '#ece8e0'; c.fillRect(0, 0, s, s);
      speckle(c, s, 900, ['#e2ddd3', '#f4f1ea'], 0.5, 2, R);
    }, [3, 2]);

    const linen = canvasTex(256, (c, s) => {
      c.fillStyle = '#ebe8e2'; c.fillRect(0, 0, s, s);
      for (let i = 0; i < 40; i++) {
        c.strokeStyle = `rgba(150,140,125,${0.05 + R() * 0.08})`;
        c.lineWidth = 2 + R() * 6;
        const y = R() * s;
        c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(s * 0.3, y + (R() - 0.5) * 40, s * 0.7, y + (R() - 0.5) * 40, s, y); c.stroke();
      }
    }, [1, 1]);

    return { grass, concrete, wood, plaster, linen };
  }

  /* ---------- cielo para el environment map ---------- */
  function makeEnv(renderer) {
    const envScene = new THREE.Scene();
    const geo = new THREE.SphereGeometry(50, 32, 16);
    const col = [];
    const pos = geo.attributes.position;
    const top = new THREE.Color('#8fb1cf'), hor = new THREE.Color('#f3e2c4'), gnd = new THREE.Color('#6d6c45');
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 50;
      const c = y > 0 ? hor.clone().lerp(top, Math.pow(y, 0.6)) : hor.clone().lerp(gnd, Math.min(1, -y * 4));
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    envScene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.6, 3) }));
    sunDisc.position.set(-34, 12, 30).setLength(44);
    envScene.add(sunDisc);
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(envScene, 0.02).texture;
    pm.dispose();
    return tex;
  }

  /* ---------- construcción ---------- */
  function build(renderer) {
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false; // colores hex en sRGB → lineal
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#ddd6c3', 40, 170);
    scene.environment = makeEnv(renderer);

    const T = makeTextures();
    const M = {
      grass: new THREE.MeshStandardMaterial({ map: T.grass, roughness: 1, envMapIntensity: 0.5 }),
      concrete: new THREE.MeshStandardMaterial({ map: T.concrete, roughness: 0.92, envMapIntensity: 0.7 }),
      plaster: new THREE.MeshStandardMaterial({ map: T.plaster, roughness: 0.95, envMapIntensity: 0.6 }),
      wood: new THREE.MeshStandardMaterial({ map: T.wood, roughness: 0.38, envMapIntensity: 0.9 }),
      oak: new THREE.MeshStandardMaterial({ color: '#b98a5c', roughness: 0.55 }),
      walnut: new THREE.MeshStandardMaterial({ color: '#5a3b26', roughness: 0.5 }),
      steel: new THREE.MeshStandardMaterial({ color: '#191919', roughness: 0.45, metalness: 0.6 }),
      white: new THREE.MeshStandardMaterial({ color: '#ebe7df', roughness: 0.6 }),
      stone: new THREE.MeshStandardMaterial({ color: '#d9d4ca', roughness: 0.3 }),
      linen: new THREE.MeshStandardMaterial({ map: T.linen, roughness: 1 }),
      sofa: new THREE.MeshStandardMaterial({ color: '#8f8a82', roughness: 1 }),
      red: new THREE.MeshStandardMaterial({ color: '#b3301f', roughness: 0.85 }),
      rug: new THREE.MeshStandardMaterial({ color: '#cbbfa8', roughness: 1 }),
      terracotta: new THREE.MeshStandardMaterial({ color: '#b8664a', roughness: 0.9 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#4f6a36', roughness: 0.8, flatShading: true }),
      glass: new THREE.MeshStandardMaterial({
        color: '#bcd0d2', roughness: 0.04, metalness: 0.95, transparent: true, opacity: 0.16,
        depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.4,
      }),
      lampIn: new THREE.MeshStandardMaterial({ color: '#fff2d6', emissive: '#ffcf86', emissiveIntensity: 1.6 }),
      bark: new THREE.MeshStandardMaterial({ color: '#5d5347', roughness: 1 }),
      olive: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true, envMapIntensity: 0.6 }),
    };

    const box = (w, h, d, mat, x, y, z, parent, opt) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = !(opt && opt.noCast);
      m.receiveShadow = true;
      (parent || scene).add(m);
      return m;
    };
    const cyl = (rt, rb, h, mat, x, y, z, parent, seg) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), mat);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      (parent || scene).add(m);
      return m;
    };

    /* --- terreno --- */
    const ground = new THREE.Mesh(new THREE.CircleGeometry(260, 64), M.grass);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    /* --- casa --- */
    const F = 0.45;           // cota del suelo interior
    const CEIL = 2.9;         // altura libre
    const house = new THREE.Group();
    scene.add(house);

    box(19.4, F, 11.6, M.concrete, 0, F / 2, 0.9, house);                  // zócalo + terraza
    box(18, 0.02, 8, M.wood, 0, F + 0.01, 0, house, { noCast: true });     // tarima interior
    const roof = box(22.4, 0.32, 12.6, M.concrete, 0, F + CEIL + 0.16, 0.5, house);
    roof.receiveShadow = true;
    box(18, 0.02, 8, M.plaster, 0, F + CEIL - 0.01, 0, house, { noCast: true }); // falso techo

    // focos empotrados
    const dotGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
    for (let x = -8; x <= 8; x += 2) for (let z = -3; z <= 3; z += 3) {
      const d = new THREE.Mesh(dotGeo, M.lampIn); d.position.set(x, F + CEIL - 0.025, z); house.add(d);
    }

    // muros ciegos de hormigón en los testeros y tabique del dormitorio
    box(0.3, CEIL, 8.3, M.concrete, -9.05, F + CEIL / 2, 0, house);
    box(0.3, CEIL, 8.3, M.concrete, 9.05, F + CEIL / 2, 0, house);
    box(0.22, CEIL, 5.2, M.plaster, -3, F + CEIL / 2, -1.4, house);
    box(2.6, CEIL, 0.22, M.plaster, 7.4, F + CEIL / 2, -4.02, house); // tramo ciego tras la cocina

    // pilares de acero bajo el voladizo
    [-10.8, -5.4, 0, 5.4, 10.8].forEach((x) => {
      box(0.12, CEIL, 0.12, M.steel, x, F + CEIL / 2, 6.55, house);
      box(0.12, CEIL, 0.12, M.steel, x, F + CEIL / 2, -5.55, house);
    });

    // fachadas de cristal con montantes
    function glassWall(x0, x1, z) {
      const w = x1 - x0;
      const g = new THREE.Mesh(new THREE.PlaneGeometry(w, CEIL), M.glass);
      g.position.set((x0 + x1) / 2, F + CEIL / 2, z);
      g.renderOrder = 2;
      house.add(g);
      const n = Math.round(w / 1.8);
      for (let i = 0; i <= n; i++) box(0.05, CEIL, 0.07, M.steel, x0 + (w * i) / n, F + CEIL / 2, z, house);
      box(w, 0.05, 0.08, M.steel, (x0 + x1) / 2, F + 0.025, z, house);
      box(w, 0.05, 0.08, M.steel, (x0 + x1) / 2, F + CEIL - 0.025, z, house);
    }
    glassWall(-8.9, 8.9, 4);
    glassWall(-8.9, 6.1, -4);

    /* --- dormitorio (x ≈ -6) --- */
    const bed = new THREE.Group(); bed.position.set(-6, F, -1.15); house.add(bed);
    box(2.0, 0.3, 2.25, M.oak, 0, 0.15, 0, bed);
    box(1.86, 0.24, 2.05, M.white, 0, 0.42, 0, bed);
    const duvet = box(1.98, 0.14, 1.45, M.linen, 0, 0.58, 0.36, bed);
    duvet.rotation.z = 0.012;
    const fold = box(1.98, 0.09, 0.32, M.linen, 0, 0.62, -0.34, bed);
    fold.rotation.x = -0.25;
    [-0.45, 0.45].forEach((x) => {
      const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 6, 12), M.linen);
      p.rotation.z = Math.PI / 2; p.scale.set(1, 1, 0.55); p.position.set(x, 0.66, -0.78); p.castShadow = true; bed.add(p);
    });
    box(2.7, 1.15, 0.1, M.walnut, -6, F + 0.58, -2.33, house);
    [-7.65, -4.35].forEach((x) => {
      box(0.5, 0.45, 0.4, M.walnut, x, F + 0.225, -2.0, house);
      cyl(0.08, 0.12, 0.32, M.white, x, F + 0.61, -2.0, house);
    });
    box(2.2, 0.01, 1.6, M.rug, -6, F + 0.025, 1.3, house, { noCast: true });

    /* --- salón (x ≈ 0) --- */
    box(4.2, 0.012, 3.1, M.rug, 0.1, F + 0.026, 0.9, house, { noCast: true });
    const sofa = new THREE.Group(); sofa.position.set(-2.3, F, 0.9); house.add(sofa);
    box(0.95, 0.42, 2.8, M.sofa, 0.1, 0.21, 0, sofa);
    box(0.28, 0.82, 2.8, M.sofa, -0.36, 0.41, 0, sofa);
    box(0.95, 0.58, 0.22, M.sofa, 0.1, 0.29, 1.5, sofa);
    box(0.95, 0.58, 0.22, M.sofa, 0.1, 0.29, -1.5, sofa);
    [-0.7, 0.7].forEach((z) => {
      const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.35, 6, 12), M.white);
      c.rotation.x = Math.PI / 2; c.scale.set(1, 1, 0.5); c.position.set(-0.12, 0.66, z); c.rotation.y = 0.3; c.castShadow = true; sofa.add(c);
    });
    // butaca roja
    const arm = new THREE.Group(); arm.position.set(1.85, F, 1.9); arm.rotation.y = -2.3; house.add(arm);
    box(0.85, 0.36, 0.8, M.red, 0, 0.3, 0, arm);
    box(0.85, 0.85, 0.2, M.red, 0, 0.62, -0.38, arm);
    box(0.16, 0.55, 0.8, M.red, -0.42, 0.42, 0, arm);
    box(0.16, 0.55, 0.8, M.red, 0.42, 0.42, 0, arm);
    [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]].forEach(([x, z]) => cyl(0.025, 0.02, 0.14, M.walnut, x, 0.07, z, arm, 8));
    // mesas bajas redondas
    cyl(0.48, 0.48, 0.05, M.oak, -0.55, F + 0.38, 0.55, house, 40);
    cyl(0.1, 0.16, 0.36, M.oak, -0.55, F + 0.18, 0.55, house);
    cyl(0.36, 0.36, 0.05, M.oak, 0.05, F + 0.3, 1.45, house, 40);
    cyl(0.08, 0.14, 0.28, M.oak, 0.05, F + 0.14, 1.45, house);
    // aparador y lámpara de pie
    box(2.4, 0.55, 0.42, M.walnut, 0.6, F + 0.275, -3.6, house);
    cyl(0.012, 0.012, 1.55, M.steel, 2.5, F + 0.78, -0.4, house, 6);
    const shade = cyl(0.16, 0.24, 0.26, M.lampIn, 2.5, F + 1.6, -0.4, house); shade.castShadow = false;
    // planta
    cyl(0.22, 0.17, 0.42, M.terracotta, 2.6, F + 0.21, 3.45, house);
    for (let i = 0; i < 9; i++) {
      const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), M.leaf);
      const a = (i / 9) * Math.PI * 2;
      l.position.set(2.6 + Math.cos(a) * 0.2, F + 0.62 + (i % 3) * 0.15, 3.45 + Math.sin(a) * 0.2);
      l.scale.set(1, 0.5, 1.2); l.rotation.set(a, a * 2, 0); l.castShadow = true; house.add(l);
    }

    /* --- cocina + comedor (x ≈ 6) --- */
    box(5.6, 2.45, 0.62, M.white, 6.15, F + 1.225, -3.58, house);
    box(1.0, 0.7, 0.05, M.steel, 5.2, F + 1.15, -3.25, house);
    box(5.6, 0.04, 0.64, M.stone, 6.15, F + 0.92, -3.58, house);
    // isla
    box(3.5, 0.9, 0.95, M.white, 6.1, F + 0.45, -1.45, house);
    box(3.6, 0.05, 1.05, M.stone, 6.1, F + 0.925, -1.45, house);
    const stool = new THREE.Group();
    const sSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 24), M.oak); sSeat.position.y = 0.72; sSeat.castShadow = true; stool.add(sSeat);
    const sLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.7, 8), M.steel); sLeg.position.y = 0.35; sLeg.castShadow = true; stool.add(sLeg);
    const sRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 6, 24), M.steel); sRing.rotation.x = Math.PI / 2; sRing.position.y = 0.28; stool.add(sRing);
    const sBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24), M.steel); sBase.position.y = 0.01; stool.add(sBase);
    [4.95, 5.7, 6.5, 7.25].forEach((x) => { const s = stool.clone(); s.position.set(x, F, -0.62); house.add(s); });
    // mesa de comedor
    box(3.1, 0.06, 1.05, M.oak, 6.1, F + 0.75, 1.75, house);
    [[4.7, 1.35], [7.5, 1.35], [4.7, 2.15], [7.5, 2.15]].forEach(([x, z]) => box(0.06, 0.72, 0.06, M.walnut, x, F + 0.36, z, house));
    const chair = new THREE.Group();
    box(0.46, 0.04, 0.44, M.oak, 0, 0.46, 0, chair);
    box(0.46, 0.38, 0.03, M.oak, 0, 0.7, -0.21, chair);
    [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]].forEach(([x, z]) => box(0.03, 0.46, 0.03, M.walnut, x, 0.23, z, chair));
    [5.0, 6.1, 7.2].forEach((x) => {
      const a = chair.clone(); a.position.set(x, F, 0.95); house.add(a);
      const b = chair.clone(); b.position.set(x, F, 2.55); b.rotation.y = Math.PI; house.add(b);
    });
    // lámparas colgantes (cono negro)
    const coneGeo = new THREE.ConeGeometry(0.24, 0.3, 32, 1, true);
    const pend = (x, z, y) => {
      const cord = cyl(0.006, 0.006, F + CEIL - y, M.steel, x, (F + CEIL + y) / 2, z, house, 6); cord.castShadow = false;
      const c = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.5, side: THREE.DoubleSide }));
      c.position.set(x, y, z); c.castShadow = true; house.add(c);
      const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), M.lampIn);
      bulb.rotation.x = Math.PI / 2; bulb.position.set(x, y - 0.13, z); house.add(bulb);
    };
    [5.0, 6.1, 7.2].forEach((x) => pend(x, -1.45, F + 1.95));
    [5.4, 6.8].forEach((x) => pend(x, 1.75, F + 1.75));
    const warm1 = new THREE.PointLight('#ffc37a', 0.55, 6, 2); warm1.position.set(6.1, F + 1.7, -1.45); scene.add(warm1);
    const warm2 = new THREE.PointLight('#ffc37a', 0.45, 6, 2); warm2.position.set(6.1, F + 1.5, 1.75); scene.add(warm2);
    // jarrón en la mesa
    cyl(0.07, 0.11, 0.3, M.white, 6.3, F + 0.93, 1.75, house, 20);

    /* --- terraza: tumbonas y camino de losas --- */
    [-6.5, -4.6].forEach((x) => {
      const l = box(0.7, 0.12, 1.9, M.oak, x, F + 0.3, 5.5, house);
      const back = box(0.7, 0.08, 0.7, M.oak, x, F + 0.55, 4.75, house); back.rotation.x = 0.6;
      l.castShadow = true;
    });
    for (let i = 0; i < 9; i++) {
      const s = box(1.1, 0.06, 0.6, M.concrete, -2.5 - i * 1.15 + Math.sin(i) * 0.3, 0.03, 7.6 + i * 1.05, scene);
      s.rotation.y = 0.5 + Math.sin(i * 1.3) * 0.08;
    }

    /* --- olivos --- */
    const R = rng(42);
    const trunkVariants = [];
    for (let v = 0; v < 5; v++) {
      const pts = [new THREE.Vector3(0, 0, 0)];
      let x = 0, z = 0;
      for (let k = 1; k <= 4; k++) { x += (R() - 0.5) * 0.45; z += (R() - 0.5) * 0.45; pts.push(new THREE.Vector3(x, k * 0.5, z)); }
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.13, 7, false);
      trunkVariants.push({ geo: tube, top: pts[pts.length - 1], list: [] });
    }
    const branchGeo = new THREE.CylinderGeometry(0.035, 0.07, 1.2, 6);
    branchGeo.translate(0, 0.6, 0);
    const blobs = [];
    const branches = [];
    const placeTree = (x, z, s) => {
      const v = trunkVariants[(R() * trunkVariants.length) | 0];
      const rot = R() * Math.PI * 2;
      v.list.push({ x, z, s, rot });
      const top = v.top.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rot).multiplyScalar(s);
      for (let b = 0; b < 3; b++) {
        const a = rot + b * 2.1 + R() * 0.6;
        branches.push({ x: x + top.x, y: top.y * 0.85, z: z + top.z, s, a, tilt: 0.5 + R() * 0.4 });
      }
      const n = 7 + ((R() * 5) | 0);
      for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, r = (0.4 + R() * 1.1) * s;
        blobs.push({
          x: x + top.x + Math.cos(a) * r, y: top.y + (0.3 + R() * 1.1) * s, z: z + top.z + Math.sin(a) * r,
          s: (0.55 + R() * 0.55) * s, tone: R(),
        });
      }
    };
    const free = (x, z) => {
      if (x > -14 && x < 14 && z > -8.5 && z < 9.5) return false;   // casa
      if (x > -26 && x < 4 && z > 6 && z < 34) return false;      // pasillo de la cámara de portada/jardín
      return true;
    };
    for (let gx = -60; gx <= 60; gx += 7.5) {
      for (let gz = -70; gz <= -11; gz += 7.5) {
        const x = gx + (R() - 0.5) * 2.5, z = gz + (R() - 0.5) * 2.5;
        if (free(x, z)) placeTree(x, z, 0.85 + R() * 0.45);
      }
    }
    for (let i = 0; i < 70; i++) {
      const x = (R() - 0.5) * 120, z = -12 + R() * 70;
      if (free(x, z)) placeTree(x, z, 0.8 + R() * 0.6);
    }
    placeTree(-21, 7, 1.35);   // olivo de primer plano a la izquierda de la portada
    placeTree(-15.5, -2, 1.2);
    placeTree(16, 4, 1.25);
    placeTree(13, 11, 1.1);
    placeTree(7, 15, 1.3);     // jardín delantero visto desde el salón

    const dummy = new THREE.Object3D();
    trunkVariants.forEach((v) => {
      if (!v.list.length) return;
      const im = new THREE.InstancedMesh(v.geo, M.bark, v.list.length);
      v.list.forEach((t, i) => {
        dummy.position.set(t.x, 0, t.z); dummy.rotation.set(0, t.rot, 0); dummy.scale.setScalar(t.s); dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      });
      im.castShadow = true; im.receiveShadow = true; scene.add(im);
    });
    const brIM = new THREE.InstancedMesh(branchGeo, M.bark, branches.length);
    branches.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z); dummy.rotation.set(0, b.a, b.tilt, 'YXZ'); dummy.scale.setScalar(b.s); dummy.updateMatrix();
      brIM.setMatrixAt(i, dummy.matrix);
    });
    brIM.castShadow = true; scene.add(brIM);

    const blobGeo = new THREE.IcosahedronGeometry(1, 1);
    const blobIM = new THREE.InstancedMesh(blobGeo, M.olive, blobs.length);
    const cA = new THREE.Color('#7f8b5c'), cB = new THREE.Color('#a3a77a'), cC = new THREE.Color('#5f6d44'), tmp = new THREE.Color();
    blobs.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.set(R() * 3, R() * 3, R() * 3);
      dummy.scale.set(b.s * 1.15, b.s * 0.72, b.s);
      dummy.updateMatrix();
      blobIM.setMatrixAt(i, dummy.matrix);
      tmp.copy(b.tone < 0.5 ? cA : cC).lerp(cB, (b.tone * 1.7) % 1 * 0.6);
      blobIM.setColorAt(i, tmp);
    });
    blobIM.castShadow = true; blobIM.receiveShadow = true;
    scene.add(blobIM);

    // lavandas junto a la terraza
    const lav = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 0), new THREE.MeshStandardMaterial({ color: '#8d84a6', roughness: 1, flatShading: true }), 40);
    for (let i = 0; i < 40; i++) {
      dummy.position.set(-9 + i * 0.47, 0.18, 7.4 + Math.sin(i) * 0.15);
      dummy.rotation.set(R(), R(), R()); dummy.scale.set(1, 0.7 + R() * 0.4, 1); dummy.updateMatrix();
      lav.setMatrixAt(i, dummy.matrix);
    }
    lav.castShadow = true; scene.add(lav);

    /* --- luces --- */
    const hemi = new THREE.HemisphereLight('#cfdcea', '#5a5733', 0.5);
    scene.add(hemi);
    scene.add(new THREE.AmbientLight('#ffe9cc', 0.12));
    const sun = new THREE.DirectionalLight('#ffd09a', 3.2);
    sun.position.set(-26, 8.5, 24);
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -22; sc.right = 22; sc.top = 16; sc.bottom = -16; sc.near = 5; sc.far = 80;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);

    return { scene, sun };
  }

  window.OlivarScene = { build };
})();
