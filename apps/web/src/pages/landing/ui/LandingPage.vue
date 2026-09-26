<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  IconArrowUpRight,
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconPlus,
  IconWaveSine,
} from '@tabler/icons-vue'
import { ROUTE_NAMES } from '@/app/router/routes'

const isPreviewPlaying = ref(false)

function togglePreview() {
  isPreviewPlaying.value = !isPreviewPlaying.value
}

const benefits = [
  {
    number: '01',
    title: 'A sharper signal',
    copy: 'Recommendations shaped by the way you actually listen.',
  },
  {
    number: '02',
    title: 'Find your people',
    copy: 'Follow the artists and scenes that feel like yours.',
  },
  {
    number: '03',
    title: 'Make it yours',
    copy: 'Save tracks, build playlists, and keep your sound close.',
  },
]
</script>

<template>
  <div class="landing-page">
    <header class="landing-nav">
      <RouterLink class="brand-mark" :to="{ name: ROUTE_NAMES.landing }">
        <span>so</span>nora
      </RouterLink>

      <nav>
        <a href="#why-sonora">Why Sonora</a>
        <a href="#preview">Preview</a>
      </nav>

      <div class="landing-actions">
        <RouterLink :to="{ name: ROUTE_NAMES.login }">Log in</RouterLink>
        <RouterLink class="landing-signup" :to="{ name: ROUTE_NAMES.register }">
          Start listening
          <IconArrowUpRight :size="15" />
        </RouterLink>
      </div>
    </header>

    <main>
      <section class="landing-hero">
        <div class="landing-hero-copy">
          <p class="eyebrow accent-text">A new way to listen</p>
          <h1>Music that<br /><em>gets you.</em></h1>
          <p class="landing-lede">
            Sonora learns the edges of your taste and turns them into your next favorite song.
          </p>
          <div class="landing-hero-actions">
            <RouterLink class="primary-button" :to="{ name: ROUTE_NAMES.register }">
              Start listening
              <IconArrowUpRight :size="16" />
            </RouterLink>
            <RouterLink class="landing-text-link" :to="{ name: ROUTE_NAMES.login }">
              I already have an account
            </RouterLink>
          </div>
        </div>

        <div class="landing-visual" aria-hidden="true">
          <div class="landing-orbit orbit-large" />
          <div class="landing-orbit orbit-mid" />
          <div class="landing-orbit orbit-small" />
          <div class="landing-visual-disc">
            <IconWaveSine :size="46" :stroke-width="1.2" />
          </div>
          <span class="landing-visual-label">
            SONORA<br />
            <i>YOUR PERSONAL FREQUENCY</i>
          </span>
          <span class="landing-sticker">
            CURATED<br />
            FOR YOU
          </span>
        </div>
      </section>

      <section class="landing-note">
        <span>01 — THE SHORT VERSION</span>
        <p>
          Your taste is more than a genre. Sonora pays attention to the mood, the moment, and the
          beautiful weird in between.
        </p>
      </section>

      <section class="benefits-section" id="why-sonora">
        <div class="section-heading">
          <h2>
            Made for the way<br />
            <em>you listen.</em>
          </h2>
          <span>Built around discovery,<br />not endless scrolling.</span>
        </div>

        <div class="benefits-grid">
          <article v-for="item in benefits" :key="item.number">
            <span>{{ item.number }}</span>
            <IconPlus :size="18" />
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </article>
        </div>
      </section>

      <section class="preview-section" id="preview">
        <div class="preview-copy">
          <p class="eyebrow accent-text">Inside Sonora</p>
          <h2>
            Your next favorite<br />
            <em>is closer than you think.</em>
          </h2>
          <RouterLink class="landing-text-link" :to="{ name: ROUTE_NAMES.register }">
            Build your taste profile
            <IconArrowUpRight :size="15" />
          </RouterLink>
        </div>

        <div class="mini-player">
          <div class="mini-art">
            <div />
          </div>
          <div>
            <span>NOW PLAYING</span>
            <strong>Midnight City</strong>
            <small>M83 · Hurry Up, We're Dreaming</small>
          </div>
          <div class="mini-progress" :class="{ 'is-active': isPreviewPlaying }" />
          <button aria-label="Preview play" type="button" @click="togglePreview">
            <IconPlayerPauseFilled v-if="isPreviewPlaying" :size="15" />
            <IconPlayerPlayFilled v-else :size="15" />
          </button>
        </div>
      </section>
    </main>

    <footer class="landing-footer">
      <span>sonora © 2024</span>
      <span>Listen closer.</span>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  background: var(--sonora-bg);
  color: var(--sonora-text);
  min-height: 100vh;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.landing-nav {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 27px 5vw;
}

.landing-nav .brand-mark {
  margin: 0;
}

.landing-nav nav {
  display: flex;
  gap: 34px;
}

.landing-nav nav a,
.landing-actions a {
  color: var(--sonora-muted);
  font-size: 11px;
  text-decoration: none;
  transition: color 0.15s ease;
}

.landing-nav nav a:hover,
.landing-actions a:hover {
  color: var(--sonora-text);
}

.landing-actions {
  align-items: center;
  display: flex;
  gap: 22px;
}

.landing-signup {
  align-items: center;
  background: var(--sonora-accent);
  border-radius: 999px;
  color: #12140e !important;
  display: flex;
  font-weight: 700;
  gap: 7px;
  padding: 10px 14px;
  text-decoration: none;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.landing-signup:hover {
  background: #e5fc73;
  transform: translateY(-1px);
}

.landing-hero {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  margin: 60px auto 0;
  max-width: 1230px;
  min-height: 590px;
  padding: 0 5vw;
}

.landing-hero-copy {
  padding: 73px 0 0;
  position: relative;
  z-index: 2;
}

.landing-hero h1 {
  font-size: clamp(68px, 9vw, 132px);
  letter-spacing: -0.095em;
  line-height: 0.78;
  margin: 25px 0 28px;
}

.landing-hero h1 em,
.landing-note p em,
.section-heading h2 em,
.preview-copy h2 em {
  color: var(--sonora-accent);
  font-style: normal;
}

.landing-lede {
  color: #a7a7ad;
  font-size: 14px;
  line-height: 1.55;
  max-width: 340px;
}

.landing-hero-actions {
  align-items: center;
  display: flex;
  gap: 22px;
  margin-top: 30px;
}

.landing-text-link {
  align-items: center;
  color: var(--sonora-text);
  display: inline-flex;
  font-size: 11px;
  gap: 7px;
  text-decoration: none;
  transition: color 0.15s ease;
}

.landing-text-link:hover {
  color: var(--sonora-accent);
}

.landing-visual {
  background: #273a30;
  border-radius: 50%;
  height: min(52vw, 590px);
  margin-left: auto;
  max-height: 590px;
  max-width: 590px;
  overflow: hidden;
  position: relative;
  width: min(52vw, 590px);
}

.landing-visual::after {
  background: #ed6f50;
  border-radius: 50%;
  content: '';
  height: 36%;
  left: 39%;
  position: absolute;
  top: 31%;
  width: 36%;
}

.landing-orbit {
  border: 1px solid rgba(233, 241, 193, 0.58);
  border-radius: 50%;
  position: absolute;
  z-index: 1;
}

.orbit-large {
  height: 94%;
  left: 3%;
  top: 3%;
  width: 94%;
}

.orbit-mid {
  height: 67%;
  left: 16%;
  top: 16%;
  width: 67%;
}

.orbit-small {
  height: 42%;
  left: 29%;
  top: 29%;
  width: 42%;
}

.landing-visual-disc {
  align-items: center;
  background: var(--sonora-accent);
  border-radius: 50%;
  color: #293224;
  display: flex;
  height: 22%;
  justify-content: center;
  left: 46%;
  position: absolute;
  top: 38%;
  width: 22%;
  z-index: 3;
}

.landing-visual-label {
  bottom: 18%;
  color: var(--sonora-text);
  font-size: 14px;
  font-weight: 700;
  left: 12%;
  letter-spacing: 0.19em;
  line-height: 1.1;
  position: absolute;
  z-index: 4;
}

.landing-visual-label i {
  color: var(--sonora-accent);
  font-size: 7px;
  font-style: normal;
  letter-spacing: 0.2em;
}

.landing-sticker {
  background: var(--sonora-accent);
  border-radius: 50%;
  color: #1a201a;
  font-size: 8px;
  font-weight: 800;
  height: 78px;
  letter-spacing: 0.08em;
  line-height: 1.15;
  padding-top: 29px;
  position: absolute;
  right: 12%;
  text-align: center;
  top: 12%;
  transform: rotate(13deg);
  width: 78px;
  z-index: 5;
}

.landing-note {
  border-top: 1px solid #28282f;
  display: grid;
  gap: 10%;
  grid-template-columns: 0.8fr 1.2fr;
  margin: 0 auto;
  max-width: 1230px;
  padding: 35px 5vw 90px;
  width: 100%;
}

.landing-note span {
  color: var(--sonora-muted);
  font-size: 10px;
  letter-spacing: 0.14em;
}

.landing-note p {
  font-size: clamp(23px, 3vw, 39px);
  letter-spacing: -0.05em;
  line-height: 1.03;
  margin: 0;
  max-width: 660px;
}

.benefits-section,
.preview-section {
  margin: 0 auto;
  max-width: 1230px;
  padding: 90px 5vw;
  width: 100%;
}

.benefits-section .section-heading {
  align-items: flex-end;
  display: flex;
  justify-content: space-between;
  margin-bottom: 55px;
}

.benefits-section .section-heading h2 {
  font-size: clamp(37px, 4vw, 58px);
  letter-spacing: -0.07em;
  line-height: 0.93;
  margin: 0;
}

.benefits-section .section-heading > span {
  color: var(--sonora-muted);
  font-size: 11px;
  line-height: 1.5;
}

.benefits-grid {
  border-top: 1px solid #292930;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.benefits-grid article {
  border-right: 1px solid #292930;
  min-height: 220px;
  padding: 22px 25px 20px 0;
}

.benefits-grid article + article {
  padding-left: 25px;
}

.benefits-grid article:last-child {
  border-right: 0;
}

.benefits-grid article > span {
  color: var(--sonora-accent);
  font-size: 10px;
}

.benefits-grid article > svg {
  color: var(--sonora-muted);
  float: right;
}

.benefits-grid h3 {
  font-size: 17px;
  letter-spacing: -0.03em;
  margin: 74px 0 7px;
}

.benefits-grid p {
  color: var(--sonora-muted);
  font-size: 11px;
  line-height: 1.55;
  max-width: 220px;
}

.preview-section {
  align-items: center;
  background: #151c1a;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  margin-bottom: 90px;
  min-height: 280px;
  padding: 60px 5vw;
}

.preview-copy h2 {
  font-size: clamp(35px, 4vw, 57px);
  letter-spacing: -0.07em;
  line-height: 0.92;
  margin: 17px 0 25px;
}

.mini-player {
  align-items: center;
  background: #232a26;
  border: 1px solid #39443a;
  border-radius: 13px;
  display: flex;
  gap: 14px;
  min-width: 400px;
  padding: 14px;
  position: relative;
}

.mini-art {
  background: #8b473d;
  border-radius: 8px;
  height: 62px;
  overflow: hidden;
  position: relative;
  width: 62px;
  flex-shrink: 0;
}

.mini-art div {
  border: 1px solid #e6b274;
  border-radius: 50%;
  height: 45px;
  left: 8px;
  position: absolute;
  top: 8px;
  width: 45px;
}

.mini-player span,
.mini-player strong,
.mini-player small {
  display: block;
}

.mini-player span {
  color: var(--sonora-accent);
  font-size: 8px;
  letter-spacing: 0.15em;
}

.mini-player strong {
  font-size: 14px;
  margin: 5px 0;
}

.mini-player small {
  color: var(--sonora-muted);
  font-size: 10px;
}

.mini-player button {
  align-items: center;
  background: var(--sonora-accent);
  border: 0;
  border-radius: 50%;
  color: #182015;
  display: flex;
  height: 34px;
  justify-content: center;
  margin-left: auto;
  width: 34px;
  flex-shrink: 0;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
  cursor: pointer;
}

.mini-player button:hover {
  background: #e5fc73;
  transform: scale(1.08);
}

.mini-progress {
  background: var(--sonora-accent);
  bottom: 0;
  height: 2px;
  left: 14px;
  position: absolute;
  width: 40%;
  transition: width 0.4s ease;
}

.mini-progress.is-active {
  width: 82%;
}

.landing-footer {
  border-top: 1px solid #292930;
  color: var(--sonora-muted);
  display: flex;
  font-size: 10px;
  justify-content: space-between;
  margin: auto 5vw 0;
  padding: 25px 0;
}

@media (prefers-reduced-motion: no-preference) {
  .landing-visual-disc {
    animation: disc-pulse 5s ease-in-out infinite alternate;
  }
}

@keyframes disc-pulse {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.04);
  }
}

@media (max-width: 720px) {
  .landing-nav nav {
    display: none;
  }
  .landing-actions {
    gap: 10px;
  }
  .landing-hero {
    display: block;
    margin-top: 20px;
    min-height: 0;
  }
  .landing-hero-copy {
    padding-top: 30px;
  }
  .landing-hero h1 {
    font-size: clamp(48px, 14vw, 76px);
  }
  .landing-visual {
    height: 330px;
    margin: 50px auto 0;
    width: 330px;
  }
  .landing-note {
    display: block;
    padding-bottom: 65px;
  }
  .landing-note p {
    margin-top: 20px;
  }
  .benefits-section,
  .preview-section {
    padding: 60px 5vw;
  }
  .benefits-section .section-heading {
    display: block;
  }
  .benefits-section .section-heading > span {
    display: block;
    margin-top: 20px;
  }
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  .benefits-grid article,
  .benefits-grid article + article {
    border-bottom: 1px solid #292930;
    border-right: 0;
    min-height: 0;
    padding: 20px 0;
  }
  .benefits-grid h3 {
    margin-top: 30px;
  }
  .preview-section {
    display: block;
  }
  .mini-player {
    margin-top: 35px;
    min-width: 0;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
