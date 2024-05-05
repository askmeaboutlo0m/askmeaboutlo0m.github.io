onload = function() {
  var body = document.body
  var slides = {}
  var slide

  function fit(el) {
    var style = el.style
    var i = 1000
    var top
    var left
    var img

    style.display  = "inline"
    style.fontSize = i + "px"
    style.position = "absolute"

    if (el.classList.contains("image")) {
      img = el.querySelector("img")
      img.style.display = "none"
      style.fontSize = "1px"
      style.top = innerHeight * 0.1 + "px"
      style.left = innerWidth * 0.1 + "px"
      img.style.width = "auto"
      img.style.height = innerHeight * 0.8 + "px"
      img.style.display = null
      style.left = innerWidth * 0.1 + (innerWidth * 0.8 - img.width) / 2 + "px"
      if (img.width > innerWidth * 0.9) {
        img.style.width = innerWidth * 0.8 + "px"
        img.style.height = "auto"
        style.left = innerWidth * 0.1 + "px"
        style.top = innerHeight * 0.1 + (innerHeight * 0.8 - img.height) / 2 + "px"
      }
    } else {
      while (i > 10) {
        left = innerWidth * 0.8 - el.offsetWidth
        top  = innerHeight * 0.8 - el.offsetHeight

        if (top > 0 && left > 0) break

        style.fontSize = (i -= i * 0.05) + "px"
      }

      style.display = "block"
      style.top     = innerHeight * 0.1 + top / 2 + "px"
      style.left    = innerWidth * 0.1 + left / 2 + "px"
    }
  }

  for (var el, count = 0; el = body.firstChild;) {
    if (el.nodeType == 1) slides[++count] = el
    body.removeChild(el)
  }

  body.appendChild(document.createComment(""))

  !function sync() {
    setTimeout(sync, 50)

    var next = 0 | location.hash.match(/\d+/)

    if (slide == next) return

    next = Math.max(Math.min(count, next), 1)
    next = slides[location.hash = slide = next]

    body.replaceChild(next, body.firstChild)
    fit(next)
  }()

  const FORWARD = 1
  const BACKWARD = -1
  const keyToSlideDirection = {
    "ArrowRight": FORWARD, "ArrowLeft": BACKWARD,
    "ArrowDown": FORWARD, "ArrowUp": BACKWARD,
    "PageDown": FORWARD, "PageUp": BACKWARD,
    " ": FORWARD, "Enter": FORWARD, "Backspace": BACKWARD,
  }

  document.onkeydown = function(e) {
    var i = slide + keyToSlideDirection[e.key]

    if (i in slides) location.hash = i
  }

  document.ontouchstart = function(e) {
    if (e.target.href) return

    var i = slide + (e.touches[0].pageX > innerWidth / 2 ? 1 : -1)

    if (i in slides) location.hash = i
  }
}
