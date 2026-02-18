import { useState, useRef, useCallback } from 'react'

const AUDIO_MIME_PRIORITY = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

const VIDEO_MIME_PRIORITY = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
]

function getMimeType(type) {
  const list = type === 'audio' ? AUDIO_MIME_PRIORITY : VIDEO_MIME_PRIORITY
  return list.find(m => MediaRecorder.isTypeSupported(m)) || ''
}

// States: 'idle' | 'requesting' | 'recording' | 'stopped' | 'error'
export function useMediaRecorder(type = 'audio') {
  const maxMs = type === 'audio' ? 60_000 : 30_000
  const [state, setState] = useState('idle')
  const [elapsed, setElapsed] = useState(0)
  const [blob, setBlob] = useState(null)
  const [mimeType, setMimeType] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const intervalRef = useRef(null)
  const streamRef = useRef(null)

  const start = useCallback(async (videoElementRef) => {
    setState('requesting')
    setErrorMsg('')
    setBlob(null)
    setElapsed(0)
    chunksRef.current = []

    try {
      const constraints = type === 'audio'
        ? { audio: true }
        : { audio: true, video: { facingMode: 'user' } }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Attach stream to live preview element if provided
      if (videoElementRef?.current) {
        videoElementRef.current.srcObject = stream
        videoElementRef.current.muted = true
        videoElementRef.current.play().catch(() => {})
      }

      const mime = getMimeType(type)
      setMimeType(mime)

      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {})
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const recorded = new Blob(chunksRef.current, { type: mime || 'audio/webm' })
        setBlob(recorded)
        setState('stopped')
        // Stop preview stream
        streamRef.current?.getTracks().forEach(t => t.stop())
        if (videoElementRef?.current) {
          videoElementRef.current.srcObject = null
        }
      }

      recorder.start(1000) // collect chunks every 1s
      setState('recording')

      // Auto-stop at max duration
      timerRef.current = setTimeout(() => stop(), maxMs)

      // Update elapsed every second
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1)
      }, 1000)
    } catch (err) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      setState('error')
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Permission denied — allow access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setErrorMsg(`No ${type === 'audio' ? 'microphone' : 'camera'} found.`)
      } else {
        setErrorMsg(err.message || 'Recording failed.')
      }
    }
  }, [type, maxMs])

  const stop = useCallback(() => {
    clearTimeout(timerRef.current)
    clearInterval(intervalRef.current)
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setState('idle')
    setBlob(null)
    setElapsed(0)
    setErrorMsg('')
    chunksRef.current = []
  }, [stop])

  return { state, elapsed, blob, mimeType, errorMsg, start, stop, reset }
}
