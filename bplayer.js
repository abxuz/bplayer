class BPlayer {
    constructor(opt) {
        this.opt = opt
        this.curSongIndex = -1
        this.opt.playlist = this.opt.playlist.map(v => (v.waves = this._genRandomWaveHeights(), v))

        this.container = this._d('div', 'container')

        this.title = this._d('div', 'title', this.container)
        this.title.style.pointerEvents = 'none'

        this.info = this._d('div', 'info', this.container)

        this.curTime = this._d('span', 'current-time', this.info)
        this.curTime.style.pointerEvents = 'none'

        this.progress = this._d('div', 'progress', this.info)
        this.progress.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            let precent = e.offsetX / e.target.clientWidth
            if (precent < 0) {
                precent = 0
            } else if (precent > 1) {
                precent = 1
            }
            this.seek(this.audio.duration * precent)
        })

        this.restTime = this._d('span', 'rest-time', this.info)
        this.restTime.style.pointerEvents = 'none'

        this.control = this._d('div', 'control', this.container)

        this.prevBtn = this._d('i', 'btn', this.control)
        this.prevBtn.classList.add('b-player-icon', 'b-player-icon-prev')
        this.prevBtn.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            this.prev()
        })

        this.playBtn = this._d('i', 'btn', this.control)
        this.playBtn.classList.add('b-player-icon', 'b-player-icon-play')
        this.playBtn.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            this.play()
        })

        this.pauseBtn = this._d('i', 'btn', this.control)
        this.pauseBtn.classList.add('b-player-icon', 'b-player-icon-pause')
        this.pauseBtn.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            this.pause()
        })

        this.nextBtn = this._d('i', 'btn', this.control)
        this.nextBtn.classList.add('b-player-icon', 'b-player-icon-next')
        this.nextBtn.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            this.next(true)
        })

        this.audio = this._d('audio', null, this.container)
        this.audio.style.display = 'none'
        for (let evtName of ['timeupdate', 'loadedmetadata', 'play', 'pause', 'abort', 'error', 'seeked', 'stalled', 'suspend']) {
            this.audio.addEventListener(evtName, e => {
                this._updateAudioState()
            })
        }

        this.audio.addEventListener('ended', e => {
            this.next(false)
        })

        this._initProgress()
        this._updateAudioState()
        this.load(0, false)
    }

    mount(selector, replace) {
        let dom;
        if (typeof (selector) === 'string') {
            dom = document.querySelector(selector)
        } else {
            dom = selector
        }
        if (replace) {
            dom.parentNode.replaceChild(this.container, dom)
        } else {
            dom.appendChild(this.container)
        }
    }

    load(i, play) {
        if (!this.opt.playlist || this.opt.playlist.length == 0) {
            throw new Error('no playlist set')
        }
        if (i >= this.opt.playlist.length) {
            throw new Error('out of playlist index')
        }

        if (i === this.curSongIndex) {
            this.seek(0)
            this.play()
            return
        }

        this.curSongIndex = i
        const song = this.opt.playlist[i]
        this._setTitle(song.title)
        this._setWaveHeights(song.waves)
        if (play) {
            let canplayCallback = e => {
                this.play()
                this.audio.removeEventListener(canplayCallback, null)
            }
            this.audio.addEventListener('canplay', canplayCallback)
        }
        this.audio.src = song.src
    }

    play() {
        this.audio.play()
    }

    pause() {
        this.audio.pause()
    }

    prev() {
        let prev;
        if (this.curSongIndex > 0) {
            prev = this.curSongIndex - 1
        } else {
            prev = this.opt.playlist.length - 1
        }
        this.load(prev, true)
    }

    next(forceLoop) {
        let next = this.curSongIndex + 1
        if (next >= this.opt.playlist.length) {
            if (!this.opt.loop && !forceLoop) return
            next = 0
        }
        this.load(next, true)
    }

    seek(offset) {
        this.audio.currentTime = offset
    }

    _d(tagName, className, parentNode) {
        let dom = document.createElement(tagName)
        if (className) {
            dom.classList.add('b-player-' + className)
        }
        if (parentNode) {
            parentNode.appendChild(dom)
        }
        return dom
    }

    _initProgress() {
        this.progressWaves = []
        for (let i = 0; i < 100; i++) {
            let wave = this._d('div', 'progress-wave', this.progress)
            wave.style.pointerEvents = 'none'
            this.progressWaves.push(wave)
        }
    }

    _genRandomWaveHeights() {
        return new Array(100).fill(0).map(v => Math.random() * 10000000 % 45 + 5)
    }

    _setWaveHeights(heights) {
        this.progressWaves.forEach((e, i) => {
            e.style.height = heights[i] + 'px'
        })
    }

    _setTitle(title) {
        let content;
        if (this.opt.hideIndex) {
            content = title
        } else {
            content = '<pre>' + (this.curSongIndex + 1) + '.' + title + '</pre>'
        }
        this.title.innerHTML = content
        if (this.opt.hideTitle) {
            this.title.style.display = 'none'
        } else {
            this.title.style.display = ''
        }
    }

    _updateAudioState() {
        let hideHour = this.audio.duration < 3600;
        this.curTime.textContent = this._formatSeconds(this.audio.currentTime, hideHour)
        let restTime = this.audio.duration - this.audio.currentTime;
        this.restTime.textContent = '-' + this._formatSeconds(restTime, hideHour)
        let progress = this.audio.duration ? parseInt(this.audio.currentTime * 100 / this.audio.duration) : 0;
        this._setProgress(progress)
        if (this.audio.paused) {
            this.playBtn.style.display = ''
            this.pauseBtn.style.display = 'none'
        } else {
            this.playBtn.style.display = 'none'
            this.pauseBtn.style.display = ''
        }
    }

    _setProgress(t) {
        for (let i = 0; i < 100; i++) {
            if (i < t) {
                this.progressWaves[i].style.backgroundColor = 'green';
            } else {
                this.progressWaves[i].style.backgroundColor = '#747474';
            }
        }
    }

    _formatSeconds(s, hideHour) {
        const hours = parseInt(s / 60 / 60)
        const minutes = ('00' + parseInt(s / 60 % 60)).substr(-2)
        const seconds = ('00' + parseInt(s % 60)).substr(-2)
        let ret = minutes + ":" + seconds
        if (hours > 0 || !hideHour) {
            ret = ('00' + hours).substr(-2) + ':' + ret
        }
        return ret
    }
}