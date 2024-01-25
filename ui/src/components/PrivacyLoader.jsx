import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

// Separate component for the animated lock
const AnimatedLock = () => {
    const lockRef = useRef();

    useFrame(() => {
        if (lockRef.current) {
            lockRef.current.rotation.y += 0.02;
        }
    });

    // Adjust the scale to fit the object within the 44px canvas
    const scale = 1.65; // Adjust this value as needed

    return (
        <mesh ref={lockRef} position={[0, 0, 0]} scale={[scale, scale, scale]}>
            <torusKnotGeometry args={[1, 0.4, 100, 16]} />
            <meshStandardMaterial color='grey' />
        </mesh>
    );
};

const PrivacyLoader = () => {
    return (
        <div style={{ width: '28px', height: '28px', margin: '0', padding: '0' }}> {/* Ensuring the Canvas and div are exactly 44px */}
            <Canvas style={{ width: '100%', height: '100%' }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 15, 10]} angle={0.3} />
                <AnimatedLock />
            </Canvas>
        </div>
    );
};

export default PrivacyLoader;
