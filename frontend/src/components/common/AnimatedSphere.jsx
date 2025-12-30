import { motion } from 'framer-motion'

const AnimatedSphere = ({ size = 200, className = '' }) => {
  return (
    <div className={`relative ${className}`} style={{ perspective: '1000px' }}>
      {/* Main Sphere */}
      <motion.div
        className="relative cursor-pointer"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #a0a0a0 100%)',
          boxShadow: `
            inset -20px -20px 40px rgba(0, 0, 0, 0.3),
            inset 20px 20px 40px rgba(255, 255, 255, 0.5),
            0 30px 60px rgba(0, 0, 0, 0.4),
            0 0 100px rgba(255, 255, 255, 0.1)
          `,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          y: [0, -20, 0],
          rotateZ: [0, 5, 0],
        }}
        transition={{
          duration: 4,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
        whileHover={{
          rotateX: 15,
          rotateY: 15,
          transition: { duration: 0.3 },
        }}
      >
        {/* Highlight */}
        <div
          className="absolute"
          style={{
            top: '15%',
            left: '20%',
            width: '30%',
            height: '20%',
            background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        
        {/* Shine overlay */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '50%',
            background: 'linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.2) 50%, transparent 60%)',
          }}
        />
      </motion.div>

      {/* Shadow */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -32,
          width: size * 0.6,
          height: 16,
          background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(4px)',
        }}
        animate={{
          scale: [1, 0.8, 1],
          opacity: [0.3, 0.15, 0.3],
        }}
        transition={{
          duration: 4,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
    </div>
  )
}

export default AnimatedSphere
