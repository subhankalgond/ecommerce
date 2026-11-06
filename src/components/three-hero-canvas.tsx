"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeHeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let animationFrameId: number;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Renderer
    let renderer: THREE.WebGLRenderer | null = null;
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
      // Graceful fallback if WebGL is unavailable
      return;
    }

    // Interactive Silk/Fabric Ribbon Geometry
    const ribbonCount = 28;
    const segments = 120;
    const ribbons: THREE.Mesh[] = [];

    // Subtle luxury color palette: Champagne, Sand, Mocha, Ivory
    const colors = [
      new THREE.Color("#e8ded2"),
      new THREE.Color("#dcd2c4"),
      new THREE.Color("#c8b8a5"),
      new THREE.Color("#8b5a42"),
      new THREE.Color("#ded5c7"),
    ];

    const group = new THREE.Group();
    scene.add(group);

    for (let i = 0; i < ribbonCount; i++) {
      const curvePoints: THREE.Vector3[] = [];
      const zOffset = (i - ribbonCount / 2) * 0.14;
      const xSpread = (i - ribbonCount / 2) * 0.22;

      for (let j = 0; j <= segments; j++) {
        const t = (j / segments) * Math.PI * 2.5 - Math.PI;
        const x = t * 1.8 + xSpread * 0.4;
        const y = Math.sin(t * 1.5 + i * 0.2) * 0.7 + Math.cos(t * 0.8 + i * 0.15) * 0.4;
        const z = Math.cos(t * 1.2 + i * 0.1) * 0.8 + zOffset;
        curvePoints.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 90, 0.018 + (i % 3) * 0.008, 6, false);
      
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.45,
        metalness: 0.15,
        transparent: true,
        opacity: 0.72 + (i % 3) * 0.1,
      });

      const mesh = new THREE.Mesh(tubeGeo, mat);
      ribbons.push(mesh);
      group.add(mesh);
    }

    // Warm Architectural Studio Lights
    const ambientLight = new THREE.AmbientLight(0xfff8f0, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffeedd, 2.0);
    dirLight1.position.set(5, 6, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd9c5b2, 1.2);
    dirLight2.position.set(-5, -3, 3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x8b5a42, 2.5, 12);
    pointLight.position.set(0, 1, 2);
    scene.add(pointLight);

    // Mouse Parallax & Easing
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.6;
      targetY = y * 0.4;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse damping
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      // Group subtle dynamic rotation and wave breathing
      group.rotation.y = mouseX * 0.5 + Math.sin(elapsedTime * 0.25) * 0.12;
      group.rotation.x = -mouseY * 0.35 + Math.cos(elapsedTime * 0.2) * 0.08;
      group.position.y = Math.sin(elapsedTime * 0.4) * 0.08;

      // Individual ribbon undulation
      ribbons.forEach((ribbon, idx) => {
        const offset = idx * 0.15;
        ribbon.scale.set(
          1 + Math.sin(elapsedTime * 0.5 + offset) * 0.04,
          1 + Math.cos(elapsedTime * 0.4 + offset) * 0.05,
          1
        );
      });

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      ribbons.forEach((m) => {
        m.geometry.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material.dispose();
        }
      });
      if (renderer) renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-75"
      aria-hidden="true"
    />
  );
}

