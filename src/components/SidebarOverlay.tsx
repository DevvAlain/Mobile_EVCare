import React from 'react';
import { Animated, StyleSheet, TouchableWithoutFeedback } from 'react-native';

type SidebarOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  opacity?: Animated.Value;
};

const SidebarOverlay = ({ isOpen, onClose, opacity }: SidebarOverlayProps) => {
  if (!isOpen) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <Animated.View style={[styles.overlay, opacity ? { opacity } : {}]} />
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 15,
  },
});

export default SidebarOverlay;
