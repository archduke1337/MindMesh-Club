"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import FeaturedSection from '@/components/FeaturedSection';
import GuitarStringDivider from '@/components/GuitarStringDivider';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  // Simple CSS animation instead of GSAP
  useEffect(() => {
    // Add a small delay to ensure DOM is ready, then trigger animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current as HTMLCanvasElement;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 5;

    const resize = () => {
      const width = canvas.clientWidth || 500;
      const height = canvas.clientHeight || 500;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener('resize', resize);

    // Clean, professional lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa855f7, 0.3);
    fillLight.position.set(-3, 0, -5);
    scene.add(fillLight);

    let model: THREE.Object3D | null = null;

    const loadModel = () => {
      const loader = new GLTFLoader();

      loader.load(
        '/model.glb',
        (gltf) => {
          model = gltf.scene;

          const box = new THREE.Box3().setFromObject(model as THREE.Object3D);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = maxDim > 0 ? 3 / maxDim : 1;

          model!.scale.setScalar(scale);
          model!.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

          scene.add(model!);
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
        }
      );
    };

    loadModel();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1;

    let reqId = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      if (model) {
        model.position.y = Math.sin(time * 0.8) * 0.1;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(reqId);
      controls.dispose();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => {
              if (typeof m.dispose === 'function') m.dispose();
            });
          } else if (mat && typeof mat.dispose === 'function') {
            mat.dispose();
          }
        }
      });

      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full">
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden -mt-14 sm:-mt-16 pt-14 sm:pt-16 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-pink-500/20 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center relative z-10">
          {/* Hero Content - Simple fade in with CSS */}
          <div className={`space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left transition-all duration-700 ease-out ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  Mind Mesh
                </span>
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700 dark:text-gray-300">
                Where Ideas Connect
              </h2>
            </div>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Join our community of innovators, thinkers, and creators. 
              Connect, collaborate, and bring your ideas to life.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-2 sm:pt-3 md:pt-4">
              <button 
                onClick={() => router.push('/register')}
                className="px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm sm:text-base md:text-lg active:scale-95"
              >
                Join the Club
              </button>
              <button 
                onClick={() => router.push('/about')}
                className="px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 font-semibold rounded-full hover:bg-purple-50 dark:hover:bg-purple-950 transition-all duration-200 text-sm sm:text-base md:text-lg active:scale-95"
              >
                Explore More
              </button>
            </div>
          </div>

          {/* 3D Model Canvas - Fade in separately */}
          <div className={`flex justify-center lg:justify-end transition-all duration-700 ease-out delay-300 ${
            isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
              <canvas
                ref={canvasRef}
                className="w-full aspect-square max-h-[400px] sm:max-h-[450px] md:max-h-[500px] lg:max-h-full"
              />
            </div>
          </div>
        </div>
      </section>
      
      <GuitarStringDivider />
      <FeaturedSection />
    </div>
  );
}