"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface FabricPreset {
  id: string;
  name: string;
  kicker: string;
  gsm: string;
  weave: string;
  origin: string;
  colorHex: string;
  roughness: number;
  metalness: number;
  wireframe?: boolean;
  notes: string;
}

const FABRICS: FabricPreset[] = [
  {
    id: "pima",
    name: "Brushed Pima Cotton",
    kicker: "Everyday Staple Weave",
    gsm: "380 GSM",
    weave: "Interlock Fine Gauge",
    origin: "Piura Valley, Peru",
    colorHex: "#e8ded1",
    roughness: 0.85,
    metalness: 0.04,
    notes: "Extra-long staple fibers resist pilling and retain structural collar integrity through repeated cycles.",
  },
  {
    id: "linen",
    name: "European Pure Slub Linen",
    kicker: "Summer Tailoring",
    gsm: "290 GSM",
    weave: "Plain Slub Breathable",
    origin: "Normandy, France",
    colorHex: "#d5c7b3",
    roughness: 0.95,
    metalness: 0.02,
    notes: "Naturally thermo-regulating flax with characteristic textural slubs that soften with every wearing.",
  },
  {
    id: "cashmere",
    name: "Grade-A Cashmere Twill",
    kicker: "Architectural Layering",
    gsm: "460 GSM",
    weave: "Diagonal Compact Twill",
    origin: "Inner Mongolia",
    colorHex: "#8b5a42",
    roughness: 0.65,
    metalness: 0.12,
    notes: "Combed virgin underfleece providing featherweight thermal insulation with a gentle lustre.",
  },
  {
    id: "selvedge",
    name: "Raw Selvedge Denim",
    kicker: "Heritage Trucker",
    gsm: "14.5 oz",
    weave: "Right-Hand 3x1 Twill",
    origin: "Kurashiki, Okayama",
    colorHex: "#28343f",
    roughness: 0.75,
    metalness: 0.08,
    notes: "Woven on vintage shuttle looms with clean red-line selvedge ID, breaking in uniquely to the wearer.",
  },
];

export default function ThreeFabricStudio() {
  const [activeFabric, setActiveFabric] = useState<FabricPreset>(FABRICS[0]);
  const [lightMode, setLightMode] = useState<"atelier" | "warm" | "dramatic">("atelier");
  const [wireframe, setWireframe] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // References to three objects for runtime updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    key: THREE.DirectionalLight;
    fill: THREE.DirectionalLight;
    rim: THREE.PointLight;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // Geometry: Parametric Fabric Drape / Wave
    const geometry = new THREE.PlaneGeometry(3.2, 3.2, 64, 64);
    
    // Deform plane to create dynamic natural cloth folds
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const z =
        Math.sin(u * 2.2) * 0.28 +
        Math.cos(v * 2.0) * 0.22 +
        Math.sin(u * 4.0 + v * 3.0) * 0.06;
      pos.setZ(i, z);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeFabric.colorHex),
      roughness: activeFabric.roughness,
      metalness: activeFabric.metalness,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -0.35;
    mesh.rotation.y = 0.2;
    meshRef.current = mesh;
    scene.add(mesh);

    // Studio Lighting setup
    const ambient = new THREE.AmbientLight(0xfff8f2, 1.3);
    const key = new THREE.DirectionalLight(0xffeedb, 2.2);
    key.position.set(4, 5, 4);

    const fill = new THREE.DirectionalLight(0xdbcfc2, 1.0);
    fill.position.set(-4, -2, 2);

    const rim = new THREE.PointLight(0xffffff, 2.0, 10);
    rim.position.set(0, 3, 2);

    scene.add(ambient);
    scene.add(key);
    scene.add(fill);
    scene.add(rim);

    lightsRef.current = { ambient, key, fill, rim };

    // Interaction: Pointer Drag Rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotX = -0.35;
    let rotY = 0.2;
    let targetRotX = rotX;
    let targetRotY = rotY;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      targetRotY += deltaX * 0.008;
      targetRotX += deltaY * 0.008;
      targetRotX = Math.max(-1.2, Math.min(0.6, targetRotX));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    dom.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Damping rotation
      rotX += (targetRotX - rotX) * 0.06;
      rotY += (targetRotY - rotY) * 0.06;

      if (!isDragging) {
        // Idle gentle breathing sway
        mesh.rotation.y = rotY + Math.sin(t * 0.6) * 0.08;
        mesh.rotation.x = rotX + Math.cos(t * 0.5) * 0.04;
      } else {
        mesh.rotation.y = rotY;
        mesh.rotation.x = rotX;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      dom.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // Update material on fabric preset change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.set(activeFabric.colorHex);
      materialRef.current.roughness = activeFabric.roughness;
      materialRef.current.metalness = activeFabric.metalness;
      materialRef.current.wireframe = wireframe;
      materialRef.current.needsUpdate = true;
    }
  }, [activeFabric, wireframe]);

  // Update lighting on mode change
  useEffect(() => {
    if (!lightsRef.current) return;
    const { ambient, key, fill, rim } = lightsRef.current;
    if (lightMode === "atelier") {
      ambient.color.set(0xfff8f2);
      ambient.intensity = 1.3;
      key.color.set(0xffeedb);
      key.intensity = 2.2;
      fill.color.set(0xdbcfc2);
      rim.intensity = 2.0;
    } else if (lightMode === "warm") {
      ambient.color.set(0xffecd2);
      ambient.intensity = 1.5;
      key.color.set(0xffb87a);
      key.intensity = 2.8;
      fill.color.set(0xa6633f);
      rim.intensity = 2.5;
    } else if (lightMode === "dramatic") {
      ambient.color.set(0x403d39);
      ambient.intensity = 0.6;
      key.color.set(0xffffff);
      key.intensity = 3.4;
      fill.color.set(0x282624);
      rim.intensity = 3.5;
    }
  }, [lightMode]);

  return (
    <div className="border border-[#e5dfd5] bg-[#faf8f5]">
      <div className="border-b border-[#e5dfd5] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
            Interactive ThreeUI Showcase
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-[#171614]">
            The Tactile Dimension · 3D Fabric &amp; Weave Studio
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#736c62] text-[11px] uppercase tracking-wider hidden sm:inline">Lighting:</span>
          {(["atelier", "warm", "dramatic"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setLightMode(m)}
              className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition border ${
                lightMode === m
                  ? "border-[#171614] bg-[#171614] text-[#faf8f5]"
                  : "border-[#e0d9cf] bg-white text-[#544e45] hover:border-[#171614]"
              }`}
            >
              {m}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setWireframe((w) => !w)}
            aria-pressed={wireframe}
            className={`ml-2 px-2.5 py-1 text-[11px] uppercase tracking-wider transition border ${
              wireframe
                ? "border-[#8b5a42] bg-[#8b5a42] text-white"
                : "border-[#e0d9cf] bg-white text-[#544e45] hover:border-[#171614]"
            }`}
          >
            {wireframe ? "Solid" : "Mesh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* 3D WebGL Canvas */}
        <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[440px] bg-[#f2ede4] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing border-b lg:border-b-0 lg:border-r border-[#e5dfd5]">
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
          <div className="pointer-events-none absolute bottom-4 left-4 border border-[#ded7ca] bg-[#faf8f5]/90 px-3 py-1.5 backdrop-blur-xs text-[10px] tracking-widest uppercase text-[#5e584f]">
            Drag to Rotate 3D Drape · Real-time WebGL Shader
          </div>
        </div>

        {/* Fabric Selector & Technical Specifications */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-[#faf8f5]">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#8b5a42]">
              Select Material Weave
            </span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {FABRICS.map((fabric) => (
                <button
                  key={fabric.id}
                  type="button"
                  onClick={() => setActiveFabric(fabric)}
                  className={`text-left p-3 border transition ${
                    activeFabric.id === fabric.id
                      ? "border-[#171614] bg-white shadow-xs"
                      : "border-[#e5dfd5] bg-transparent hover:border-[#b5ac9d]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full border border-black/20"
                      style={{ backgroundColor: fabric.colorHex }}
                    />
                    <span className="text-xs font-medium text-[#171614] truncate">
                      {fabric.name.split(" ")[0]}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#7a7368] truncate">{fabric.gsm}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-[#ede6da] pt-5">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#736c62]">
                {activeFabric.kicker}
              </span>
              <h3 className="mt-1 font-serif text-2xl text-[#171614]">
                {activeFabric.name}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#544e45]">
                {activeFabric.notes}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#ede6da] pt-4 text-xs">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[#8c857b]">Fabric Weight</dt>
                  <dd className="mt-0.5 font-medium text-[#171614]">{activeFabric.gsm}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[#8c857b]">Weave Structure</dt>
                  <dd className="mt-0.5 font-medium text-[#171614]">{activeFabric.weave}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-wider text-[#8c857b]">Fibre Provenance</dt>
                  <dd className="mt-0.5 font-medium text-[#171614]">{activeFabric.origin}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 border-t border-[#ede6da] pt-4 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#615a51]">All pieces crafted under certified fair-trade conditions.</span>
            <span className="font-serif italic text-[#8b5a42]">Nova Threads Atelier</span>
          </div>
        </div>
      </div>
    </div>
  );
}

