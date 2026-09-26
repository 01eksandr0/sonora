import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import LandingPage from './LandingPage.vue'
import { routes } from '@/app/router/routes'

describe('LandingPage', () => {
  it('renders landing page with login and register links', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(LandingPage, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('sonora')
    expect(wrapper.text()).toContain('Music thatgets you.')
    expect(wrapper.text()).toContain('Why Sonora')
    expect(wrapper.text()).toContain('Log in')
    expect(wrapper.text()).toContain('Start listening')

    const links = wrapper.findAll('a')
    const hrefs = links.map((l) => l.attributes('href'))

    expect(hrefs).toContain('/login')
    expect(hrefs).toContain('/register')
  })

  it('toggles preview audio state on button click', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(LandingPage, {
      global: {
        plugins: [router],
      },
    })

    const playButton = wrapper.find('button[aria-label="Preview play"]')
    expect(playButton.exists()).toBe(true)

    const progress = wrapper.find('.mini-progress')
    expect(progress.classes()).not.toContain('is-active')

    await playButton.trigger('click')
    expect(progress.classes()).toContain('is-active')

    await playButton.trigger('click')
    expect(progress.classes()).not.toContain('is-active')
  })
})
