import React, { useState, useEffect, useRef } from 'react';
import { Box, styled } from '@mui/joy';

const ResizableContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  width: '100%',
  overflow: 'hidden',
  position: 'relative',
});

const ResizeHandle = styled(Box)(({ theme }) => ({
  width: '4px',
  backgroundColor: theme.palette.neutral[300],
  cursor: 'col-resize',
  transition: 'background-color 0.2s',
  '&:hover, &:active': {
    backgroundColor: theme.palette.primary[500],
  },
  '&:active': {
    backgroundColor: theme.palette.primary[700],
  },
}));

interface SplitLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  initialLeftWidth?: number | string;
  minLeftWidth?: number | string;
  maxLeftWidth?: number | string;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  leftPanel,
  rightPanel,
  initialLeftWidth = '25%',
  minLeftWidth = '15%',
  maxLeftWidth = '40%',
}) => {
  const [leftWidth, setLeftWidth] = useState<number | string>(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = typeof leftWidth === 'number' ? leftWidth : 
      (containerRef.current ? containerRef.current.offsetWidth * parseFloat(leftWidth) / 100 : 0);
  }, [leftWidth]);

  const stopResizing = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - startXRef.current;
      const newWidth = startWidthRef.current + deltaX;
      
      // Convert min/max to pixels if they're percentages
      let minPx = typeof minLeftWidth === 'string' && minLeftWidth.endsWith('%')
        ? (parseFloat(minLeftWidth) / 100) * containerWidth
        : Number(minLeftWidth);
      
      let maxPx = typeof maxLeftWidth === 'string' && maxLeftWidth.endsWith('%')
        ? (parseFloat(maxLeftWidth) / 100) * containerWidth
        : Number(maxLeftWidth);
      
      // Apply constraints
      const constrainedWidth = Math.min(Math.max(newWidth, minPx), maxPx);
      
      // Convert back to percentage if initial was a percentage
      const finalWidth = typeof initialLeftWidth === 'string' && initialLeftWidth.endsWith('%')
        ? (constrainedWidth / containerWidth) * 100 + '%'
        : Math.round(constrainedWidth);
      
      setLeftWidth(finalWidth);
    },
    [isDragging, minLeftWidth, maxLeftWidth, initialLeftWidth]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <ResizableContainer ref={containerRef}>
      <Box
        sx={{
          width: typeof leftWidth === 'number' ? `${leftWidth}px` : leftWidth,
          height: '100%',
          overflow: 'auto',
          borderRight: '1px solid',
          borderColor: 'divider',
          p: 2,
          flexShrink: 0,
        }}
      >
        {leftPanel}
      </Box>
      <ResizeHandle 
        onMouseDown={startResizing}
        sx={{
          position: 'relative',
          '&:hover, &:active': {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: -4,
              right: -4,
              zIndex: 1,
            },
          },
        }}
      />
      <Box
        sx={{
          flex: 1,
          height: '100%',
          overflow: 'auto',
          minWidth: 0, // Important for flex items to respect overflow
        }}
      >
        {rightPanel}
      </Box>
    </ResizableContainer>
  );
};

export default SplitLayout;
