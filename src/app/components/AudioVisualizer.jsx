"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { Mic, Pause, Play } from "lucide-react"

export function AudioVisualizer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [hasAudio, setHasAudio] = useState(false)
  const controls = useAnimation()
  const buttonRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const bars = Array.from({ length: 10 })

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      setIsRecording(true)
      setIsPaused(false)
      animateBars()
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setIsRecording(false)
    controls.start("initial")
  }

  const animateBars = () => {
    if (!analyserRef.current || isPaused) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const normalizedData = Array.from(dataArray.slice(0, 10)).map((value) => value / 215)

    const hasAudioInput = normalizedData.some((value) => value > 0.1)
    setHasAudio(hasAudioInput)

    if (hasAudioInput) {
      controls.start((i) => ({
        scaleY: normalizedData[i] * 3 + 0.2,
        opacity: normalizedData[i] + 0.5,
        transition: { duration: 0.1 },
      }))
    } else {
      controls.start({
        scaleY: 0.2,
        opacity: 0.5,
      })
    }

    animationFrameRef.current = requestAnimationFrame(animateBars)
  }

  const handleMicClick = () => {
    if (isOpen) {
      stopRecording()
      setIsOpen(false)
    } else {
      setIsOpen(true)
      startRecording()
    }
  }

  const handleClose = () => {
    stopRecording()
    controls.start("exit")
    setTimeout(() => setIsOpen(false), 500)
  }

  const handlePause = () => {
    setIsPaused(true)
  }

  const handleResume = () => {
    setIsPaused(false)
    if (isRecording) {
      animateBars()
    }
  }

  const barVariants = {
    initial: { scaleY: 0.2, opacity: 0.5 },
    exit: (i) => ({
      scaleY: 0.2,
      opacity: 0,
      transition: {
        duration: 0.3,
        delay: i * 0.05,
      },
    }),
  }

  const containerVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: {
      width: "auto",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
    exit: {
      width: 0,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.5,
      },
    },
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMicClick}
            className="bg-[#2A2A36] p-4 rounded-full shadow-lg"
          >
            <Mic className="w-8 h-8 text-white" />
          </motion.button>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-[#2A2A36] rounded-2xl p-6 shadow-xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-white font-medium text-lg">Voice Visualizer</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#7C5DFA]/20 text-[#7C5DFA] text-sm rounded-md font-medium">
                  {isRecording ? "Recording" : "Ready"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-[3px] h-36 px-4 mb-8">
              {bars.map((_, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={barVariants}
                  initial="initial"
                  animate={controls}
                  className="w-6 h-12 rounded-full"
                  style={{
                    originY: 0.5,
                    background: hasAudio ? `#f74f38` : "white",
                  }}
                />
              ))}
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <motion.button
                  ref={buttonRef}
                  onClick={isRecording ? stopRecording : startRecording}
                  className="bg-[#fa5d5d] p-4 rounded-full shadow-lg hover:bg-[#7C5DFA]/90 transition-colors relative"
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: isRecording ? 0 : 180 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-6 h-6 relative"
                  >
                    <motion.div
                      initial={false}
                      animate={{ opacity: isRecording ? 0 : 1 }}
                      transition={{ duration: 0.1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Mic className="w-6 h-6 text-white" />
                    </motion.div>
                    <motion.div
                      initial={false}
                      animate={{ opacity: isRecording ? 1 : 0 }}
                      transition={{ duration: 0.1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Pause className="w-6 h-6 text-white" />
                    </motion.div>
                  </motion.div>
                </motion.button>
              </motion.div>
              {isRecording && (
                <>
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    onClick={handleResume}
                    className="bg-[#fa5d5d] p-4 rounded-full shadow-lg hover:bg-[#7C5DFA]/90 transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-6 h-6 text-white" />
                  </motion.button>
                </>
              )}
            </div>

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

