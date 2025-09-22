import React from 'react';
import { Box } from '@mui/material';

export default function SimpleCarousel({ images }) {
  const [index, setIndex] = React.useState(0);
  const [fade, setFade] = React.useState(true);
  React.useEffect(() => {
    if (!images || images.length === 0) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % images.length);
        setFade(true);
      }, 400); // tempo da transição
    }, 4000); // intervalo maior entre trocas
    return () => clearInterval(timer);
  }, [images]);
  if (!images || images.length === 0) return null;
  return (
    <Box sx={{ width: '100%', maxWidth: 400, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', mx: 'auto' }}>
      <img
        src={images[index]}
        alt={`Foto ${index+1}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: 12,
          boxShadow: 2,
          position: 'absolute',
          left: 0,
          top: 0,
          opacity: fade ? 1 : 0,
          transition: 'opacity 0.4s ease',
          background: '#f5f5f5'
        }}
      />
    </Box>
  );
}
