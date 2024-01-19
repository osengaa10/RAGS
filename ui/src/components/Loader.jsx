import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';

const AnimatedSphere = () => {
    const sphereRef = useRef();

    useFrame(() => {
        sphereRef.current.rotation.x = sphereRef.current.rotation.y += 0.02;
    });

    return (
        <mesh ref={sphereRef}>
            <sphereGeometry args={[1.5, 100, 100]} />
            <MeshDistortMaterial color="#00ff00" attach="material" distort={1.0} speed={2} />
        </mesh>
    );
};

const FuturisticAnimation = () => {
    return (
        <Canvas>
            <ambientLight intensity={1.5} />
            <spotLight position={[10, 15, 10]} angle={1} />
            <AnimatedSphere />
        </Canvas>
    );
};

export default FuturisticAnimation;