const Avatar = ({ src, alt = 'User', size = 'md', className = '', online = false }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-32 h-32 text-4xl',
  };

  const onlineIndicatorSize = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  // Get initials from alt text
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate consistent color based on name
  const getColor = (name) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500',
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const imageUrl = src
    ? src.startsWith('http')
      ? src
      : `/uploads/profiles/${src}`
    : null;

  return (
    <div className={`relative inline-block ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={`${sizeClasses[size]} ${getColor(alt)} rounded-full flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm ${
          imageUrl ? 'hidden' : ''
        }`}
      >
        {getInitials(alt)}
      </div>
      
      {/* Online indicator */}
      {online && (
        <span
          className={`absolute bottom-0 right-0 ${onlineIndicatorSize[size]} bg-green-500 border-2 border-white rounded-full`}
        />
      )}
    </div>
  );
};

export default Avatar;
