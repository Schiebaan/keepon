/**
 * Houd een pagina actueel zonder dat iemand op F5 hoeft te drukken.
 *
 * Twee triggers, allebei nodig:
 *
 *   1. Terugkeer naar het tabblad. Dit is verreweg de belangrijkste — een
 *      monteur klikt weg naar zijn mail en komt terug. Dat moment is precies
 *      wanneer hij verwacht het laatste nieuws te zien, en het is gratis.
 *
 *   2. Een interval terwijl het tabblad zichtbaar is. Voor het scherm dat de
 *      hele dag openstaat.
 *
 * Bewust niet pollen op een verborgen tabblad. Een servicedesk laat dit scherm
 * weken openstaan; blijven pollen kost accuduur en levert requests op die
 * niemand leest. Bij terugkeer halen we toch meteen alles op.
 *
 * De aanroeper houdt zelf zijn laadstate bij. Wij roepen alleen `fn` aan en
 * zorgen dat er nooit twee tegelijk lopen.
 */
export interface LiveRefreshOptions {
  /** Interval in ms terwijl het tabblad zichtbaar is. 0 = alleen op focus. */
  intervalMs?: number
  /** Tijdelijk stilleggen, bijvoorbeeld terwijl een modal openstaat. */
  paused?: Ref<boolean>
}

export function useLiveRefresh(fn: () => Promise<any>, options: LiveRefreshOptions = {}) {
  const { intervalMs = 45_000, paused } = options

  const lastRefreshed = ref<Date | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null
  let running = false

  async function tick() {
    // Nooit stapelen: een trage backend mag geen rij verzoeken opbouwen die
    // allemaal tegelijk terugkomen en elkaars resultaat overschrijven.
    if (running || paused?.value) return
    running = true
    try {
      await fn()
      lastRefreshed.value = new Date()
    } catch {
      // Stil falen. Dit is een achtergrondverversing — de gebruiker heeft er
      // niet om gevraagd, dus een foutmelding voor zijn neus is misplaatst.
      // Zijn huidige lijst blijft gewoon staan.
    } finally {
      running = false
    }
  }

  function start() {
    if (timer || !intervalMs) return
    timer = setInterval(tick, intervalMs)
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null }
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') { tick(); start() }
    else stop()
  }

  onMounted(() => {
    lastRefreshed.value = new Date()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', tick)
    if (document.visibilityState === 'visible') start()
  })

  onBeforeUnmount(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('focus', tick)
  })

  return { lastRefreshed, refreshNow: tick }
}

/** "zojuist" / "3 min geleden" — voor het bijgewerkt-label. */
export function useRelativeTime(at: Ref<Date | null>) {
  const now = ref(Date.now())
  let t: ReturnType<typeof setInterval> | null = null
  onMounted(() => { t = setInterval(() => { now.value = Date.now() }, 15_000) })
  onBeforeUnmount(() => { if (t) clearInterval(t) })

  return computed(() => {
    if (!at.value) return ''
    const sec = Math.floor((now.value - at.value.getTime()) / 1000)
    if (sec < 45) return 'zojuist'
    const min = Math.round(sec / 60)
    if (min < 60) return `${min} min geleden`
    const uur = Math.round(min / 60)
    return `${uur} uur geleden`
  })
}
