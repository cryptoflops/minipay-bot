"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders";

export function AsciiBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Three.js
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: false, 
      powerPreference: "high-performance" 
    });
    
    // We don't want pixel ratio scaling here because the 10x10 grid is hardcoded
    // in pixel coordinates in the shader. If we scale by devicePixelRatio, 
    // the grid gets extremely small on Retina displays.
    renderer.setPixelRatio(1);
    
    const container = containerRef.current;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    
    // Orthographic camera for fullscreen 2D shader
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      transparent: true,
      glslVersion: THREE.GLSL1 // Changed to GLSL1 for compatibility since we don't use strictly GLSL3 features in the current shader
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Resize handler
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.setSize(width, height);
        uniforms.uResolution.value.set(width, height);
      }
    });
    resizeObserver.observe(container);

    // Mouse Interaction State
    let targetMouse = new THREE.Vector2(0, 0);
    let targetScroll = 0;

    const onMouseMove = (e: MouseEvent) => {
      // Normalize mouse to -1 to 1
      targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onScroll = () => {
      targetScroll = window.scrollY;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Time
      uniforms.uTime.value = clock.getElapsedTime();

      // Lerp mouse and scroll for smoothness
      uniforms.uMouse.value.lerp(targetMouse, 0.05);
      uniforms.uScroll.value += (targetScroll - uniforms.uScroll.value) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 w-screen h-screen pointer-events-none overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    />
  );
}
