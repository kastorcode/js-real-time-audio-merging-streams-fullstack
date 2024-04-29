export default class View {

  constructor () {
    this.buttonStart = document.getElementById('start')
    this.buttonStop = document.getElementById('stop')
    this.buttons = () => Array.from(document.querySelectorAll('button'))
    this.ignoreButtons = new Set(['unassigned'])
  }


  changeCommandButtonsVisibility (unassigned) {
    Array.from(document.querySelectorAll('[name=command]')).forEach(button => {
      const fn = unassigned ? 'add' : 'remove'
      button.classList[fn]('unassigned')
    })
  }


  onLoad () {
    this.changeCommandButtonsVisibility(true)
  }


  setButtonsOnClick (onClick) {
    const actions = {
      start: () => {
        this.toggleButtonStart(true)
        this.changeCommandButtonsVisibility(false)
      },
      stop: () => {
        this.toggleButtonStart(false)
        this.changeCommandButtonsVisibility(true)
      }
    }
    this.buttons()
      .forEach(button => button.onclick = () => {
        if (this.unassignedButton(button) || !button.id) return
        onClick(button.id)
        if (actions[button.id]) {
          actions[button.id]()
        }
        else {
          this.toggleDisableButton(button.classList)
          setTimeout(() => this.toggleDisableButton(button.classList), 1000)
        }
      })
  }


  toggleButtonStart (active) {
    if (active) {
      this.buttonStart.classList.add('hidden')
      this.buttonStop.classList.remove('hidden')
    }
    else {
      this.buttonStop.classList.add('hidden')
      this.buttonStart.classList.remove('hidden')
    }
  }


  toggleDisableButton (classList) {
    if (classList.contains('active')) {
      classList.remove('active')
    }
    else {
      classList.add('active')
    }
  }


  unassignedButton (button) {
    const classes = Array.from(button.classList)
    return classes.find(className => this.ignoreButtons.has(className))
      ? true : false
  }

}