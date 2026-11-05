/* Escena WebGL: renderer, entorno de reflejos, reloj principal, fila de acabados y partículas.
   Expone window.WatchScene(canvas) -> { apply(state, mouse, t), render(), select(finish), resize() } */
(function () {
  'use strict';

  const ORDER = ['silver', 'black', 'gold', 'rose'];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const backOut = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

  // Estudio fotográfico mínimo para los reflejos del metal (equivalente a RoomEnvironment)
  function buildEnvironment(renderer) {
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x232323, side: THREE.BackSide })
    ));
    const softbox = (w, h, x, y, z, i) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    softbox(8, 1.2, 0, 4.7, 0, 9);
    softbox(1, 7, -4.8, 0, 1.5, 7);
    softbox(0.6, 7, -4.8, 0, -2.5, 4);
    softbox(1, 7, 4.8, 0.5, -1, 5);
    softbox(7, 0.8, 0, -4.8, 2, 2);
    softbox(2.4, 2.4, 2.4, 1.6, 4.8, 3.5);
    softbox(1.2, 5, -2.5, 0, 4.8, 2.5);
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(env, 0.035).texture;
    pm.dispose();
    return tex;
  }

  // Cintas de partículas que se ensamblan (uMix) a partir de una nube dispersa
  function buildParticles(count) {
    const curves = [
      [[-5, -3, -2], [-2, -1, -1], [0, 1.6, -2.5], [2.5, 0.4, -1], [5, 2.8, -3]],
      [[-4.5, 3, -3], [-1.5, 0.5, -1.6], [1, -1.2, -0.5], [3, -2.6, -2], [5, -1, -3.5]],
      [[-3, -3.5, -1], [-1, 0, -3], [0.5, 3, -1.5], [2, 1, 0], [4, -3.2, -2.5]],
    ].map((pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))));

    const pos = new Float32Array(count * 3), scat = new Float32Array(count * 3), seed = new Float32Array(count);
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const p = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const c = curves[i % curves.length];
      c.getPoint(Math.random(), p);
      const spread = 0.12 + Math.random() * 0.25;
      pos[i * 3] = p.x + gauss() * spread;
      pos[i * 3 + 1] = p.y + gauss() * spread * 1.6;
      pos[i * 3 + 2] = p.z + gauss() * spread;
      scat[i * 3] = (Math.random() - 0.5) * 16;
      scat[i * 3 + 1] = (Math.random() - 0.5) * 10;
      scat[i * 3 + 2] = -6 + Math.random() * 8;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scat, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMix: { value: 0 }, uTime: { value: 0 }, uOpacity: { value: 0.3 },
        uSize: { value: 2.2 }, uPixelRatio: { value: 1 }, uColor: { value: new THREE.Color(0.2, 0.2, 0.2) },
      },
      vertexShader: /* glsl */`
        attribute vec3 aScatter;
        attribute float aSeed;
        uniform float uMix, uTime, uSize, uPixelRatio;
        varying float vAlpha;
        void main() {
          float m = smoothstep(aSeed * 0.4, 0.6 + aSeed * 0.4, uMix);
          vec3 p = mix(aScatter, position, m);
          p += 0.05 * vec3(sin(uTime * 0.6 + aSeed * 12.0), cos(uTime * 0.5 + aSeed * 7.0), sin(uTime * 0.4 + aSeed * 3.0));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * uPixelRatio * (0.5 + aSeed) * (7.0 / -mv.z);
          vAlpha = 0.3 + 0.7 * aSeed;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, uOpacity * vAlpha * smoothstep(0.5, 0.15, d));
        }`,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    return points;
  }

  function WatchScene(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.environment = buildEnvironment(renderer);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 9.5);

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 4, 5);
    scene.add(key);

    const rig = new THREE.Group();
    scene.add(rig);
    const main = HXWatch.create({ finish: 'silver' });
    rig.add(main.group);

    const row = new THREE.Group();
    scene.add(row);
    const rowWatches = ORDER.map((f) => {
      const w = HXWatch.create({ finish: f, movement: false, lite: true });
      w.group.userData.lift = 0;
      row.add(w.group);
      return w;
    });

    const particles = buildParticles(window.innerWidth < 700 ? 5000 : 9000);
    scene.add(particles);
    const pu = particles.material.uniforms;

    let fit = 1, shift = 1, selected = 'silver';

    function resize() {
      const w = window.innerWidth, h = window.innerHeight, aspect = w / h;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      fit = clamp(aspect / 1.35, 0.52, 1);
      shift = aspect > 1 ? 1 : 0.12;
      pu.uPixelRatio.value = renderer.getPixelRatio();
    }
    resize();

    function apply(st, mouse, t) {
      rig.position.set(st.x * shift, st.y + (shift < 1 ? 0.15 : 0), 0);
      rig.scale.setScalar(Math.max(st.s * fit, 0.0001));
      rig.visible = st.s > 0.01;
      main.group.rotation.set(
        st.rx + mouse.y * 0.12 + Math.sin(t * 0.5) * 0.03,
        st.ry + mouse.x * 0.2 + Math.sin(t * 0.3) * 0.05,
        st.rz
      );
      main.setExplode(st.e);
      main.setUnroll(st.u);
      main.update(t);

      const gap = 1.55 * fit * (shift < 1 ? 0.62 : 1);
      rowWatches.forEach((w, i) => {
        const k = backOut(clamp(st.row * 1.7 - i * 0.22, 0, 1));
        const isSel = ORDER[i] === selected;
        w.group.userData.lift += ((isSel ? 0.14 : 0) - w.group.userData.lift) * 0.1;
        w.group.visible = k > 0.001;
        w.group.position.set((i - 1.5) * gap, -0.1 + w.group.userData.lift + (1 - k) * -0.6, 0);
        w.group.scale.setScalar(Math.max(k * 0.44 * fit * (shift < 1 ? 0.7 : 1), 0.0001));
        w.group.rotation.set(0.12 + mouse.y * 0.1, -0.25 + Math.sin(t * 0.6 + i) * 0.12 + mouse.x * 0.25, 0);
        if (w.group.visible) w.update(t);
      });

      pu.uTime.value = t;
      pu.uMix.value = st.pm;
      pu.uOpacity.value = st.po;
      pu.uColor.value.setRGB(st.pc[0], st.pc[1], st.pc[2]);
      particles.rotation.y = Math.sin(t * 0.05) * 0.3 + mouse.x * 0.08;
    }

    function select(finish) {
      selected = finish;
      main.setFinish(finish);
    }

    return { apply, select, resize, render: () => renderer.render(scene, camera) };
  }

  window.WatchScene = WatchScene;
})();
