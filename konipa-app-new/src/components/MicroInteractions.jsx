import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ShoppingCart, Eye, Zap, Sparkles } from 'lucide-react';

// Bouton avec effet de pulsation
export const PulseButton = ({ children, onClick, className = '', variant = 'primary' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <motion.div
      className={`px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${variants[variant]} ${className}`}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{
          scale: isHovered ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 0.6,
          repeat: isHovered ? Infinity : 0,
          repeatType: 'reverse'
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Icône de cœur animée pour les favoris
export const AnimatedHeart = ({ isFavorite, onToggle, size = 24, className = '' }) => {
  const [particles, setParticles] = useState([]);

  const handleToggle = () => {
    if (!isFavorite) {
      // Créer des particules d'explosion
      const newParticles = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i * 60) * (Math.PI / 180),
        delay: i * 0.1
      }));
      setParticles(newParticles);
      
      // Nettoyer les particules après l'animation
      setTimeout(() => setParticles([]), 1000);
    }
    onToggle();
  };

  return (
    <motion.div
      className={`relative inline-block cursor-pointer ${className}`}
      onClick={handleToggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        animate={{
          scale: isFavorite ? [1, 1.3, 1] : 1,
          rotate: isFavorite ? [0, 15, -15, 0] : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <Heart
          size={size}
          className={`transition-colors duration-200 ${
            isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'
          }`}
        />
      </motion.div>
      
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-red-500 rounded-full"
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 1
            }}
            animate={{
              x: Math.cos(particle.angle) * 30,
              y: Math.sin(particle.angle) * 30,
              scale: [0, 1, 0],
              opacity: [1, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              delay: particle.delay,
              ease: 'easeOut'
            }}
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

// Étoiles de notation animées
export const AnimatedStars = ({ rating, onRate, interactive = false }) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleStarClick = (starIndex) => {
    if (!interactive) return;
    setIsAnimating(true);
    onRate(starIndex);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoveredStar || rating);
        return (
          <motion.div
            key={star}
            className={`cursor-pointer ${interactive ? 'hover:scale-110' : ''}`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
            whileHover={interactive ? { scale: 1.1 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
            animate={{
              scale: isAnimating && star <= rating ? [1, 1.3, 1] : 1,
              rotate: isAnimating && star <= rating ? [0, 360] : 0
            }}
            transition={{ duration: 0.3, delay: isAnimating ? (star - 1) * 0.1 : 0 }}
          >
            <Star
              size={20}
              className={`transition-colors duration-200 ${
                isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

// Bouton d'ajout au panier animé
export const AnimatedCartButton = ({ onAddToCart, isAdding = false, className = '' }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = () => {
    onAddToCart();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer flex items-center space-x-2"
        onClick={handleAddToCart}
        animate={{
          backgroundColor: showSuccess ? '#10B981' : '#2563EB'
        }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span>Ajout...</span>
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                ✓
              </motion.div>
              <span>Ajouté!</span>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <ShoppingCart size={16} />
              <span>Ajouter au panier</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// Compteur animé
export const AnimatedCounter = ({ value, duration = 1000, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    let startValue = displayValue;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const currentValue = Math.floor(startValue + (value - startValue) * progress);
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <motion.span
      className={className}
      key={value}
      initial={{ scale: 1.2, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
};

// Badge animé avec compteur
export const AnimatedBadge = ({ count, className = '' }) => {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center ${className}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <AnimatedCounter value={count} duration={300} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Carte avec effet de survol
export const HoverCard = ({ children, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0"
        animate={{ opacity: isHovered ? 0.1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      <motion.div
        className="relative z-10"
        animate={{
          scale: isHovered ? 1.02 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
      
      {/* Effet de brillance */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
        animate={{
          x: isHovered ? ['0%', '100%'] : '0%',
          opacity: isHovered ? [0, 0.3, 0] : 0
        }}
        transition={{ duration: 0.6 }}
        style={{
          transform: 'skewX(-20deg)',
          width: '20%'
        }}
      />
    </motion.div>
  );
};

// Loader avec points animés
export const DotLoader = ({ size = 'md', color = 'blue' }) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  const colors = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${sizes[size]} ${colors[color]} rounded-full`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
};

// Effet de tap avec ondulation
export const TapEffect = ({ children, onTap, className = '' }) => {
  const [ripples, setRipples] = useState([]);

  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    if (onTap) onTap(event);
  };

  return (
    <motion.div
      className={`relative overflow-hidden cursor-pointer ${className}`}
      onClick={createRipple}
      whileTap={{ scale: 0.98 }}
    >
      {children}
      
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white opacity-30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size
          }}
          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </motion.div>
  );
};