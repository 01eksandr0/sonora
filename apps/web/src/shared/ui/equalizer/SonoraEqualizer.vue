<template>
  <span class="equalizer" aria-hidden="true">
    <i />
    <i />
    <i />
  </span>
</template>

<style scoped>
.equalizer {
  align-items: flex-end;
  color: var(--sonora-accent);
  display: inline-flex;
  gap: 2px;
  height: 12px;
  width: 12px;
}

.equalizer i {
  animation: equalizer-bounce 0.9s ease-in-out infinite;
  background: currentColor;
  border-radius: 1px;
  flex: 1;
  height: 100%;
  transform-origin: bottom;
}

.equalizer i:nth-child(2) {
  animation-delay: -0.3s;
  animation-duration: 0.7s;
}

.equalizer i:nth-child(3) {
  animation-delay: -0.6s;
  animation-duration: 1.1s;
}

@keyframes equalizer-bounce {
  0%,
  100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .equalizer i {
    animation: none;
    transform: scaleY(0.7);
  }
}
</style>
