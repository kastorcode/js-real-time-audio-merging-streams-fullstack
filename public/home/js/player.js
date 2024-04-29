window.onload = windowOnLoad

function windowOnLoad () {

  let beganTime = null
  let intervalId = null
  const hideClass = 'hide'
  /** @type {HTMLAudioElement} */
  const audio = document.getElementById('audio')
  /** @type {SVGElement} */
  const play = document.getElementById('play')
  /** @type {SVGElement} */
  const stop = document.getElementById('stop')
  /** @type {HTMLSpanElement} */
  const time = document.getElementById('time')

  play.onclick = startPlaying
  stop.onclick = stopPlaying

  function startPlaying () {
    play.classList.add(hideClass)
    stop.classList.remove(hideClass)
    audio.play()
    beganTime = new Date().getTime()
    intervalId = setInterval(updateTime, 1000)
  }

  function stopPlaying () {
    stop.classList.add(hideClass)
    play.classList.remove(hideClass)
    audio.pause()
    clearInterval(intervalId)
  }

  function updateTime () {
    time.innerText = timePassed()
  }

  function timePassed () {
    const now = new Date().getTime()
    const difference = now - beganTime
    const seconds = Math.floor((difference / 1000) % 60)
    const minutes = Math.floor((difference / (1000 * 60)) % 60)
    const timeFormatted = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0')
    return timeFormatted
  }

}