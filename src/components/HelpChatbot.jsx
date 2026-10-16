import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MessageCircle, RotateCcw, Send, X } from 'lucide-react'
import useAuthStore from '@/store/authStore.js'
import { normalizeRole } from '@/utils/auth.js'
import { CHAT_TOPICS, getChatLink, getChatReply } from '@/utils/chatbot.js'

const welcome = { author: 'bot', text: '¡Hola! ¿En qué te puedo ayudar? Elegí un tema o escribí una pregunta sobre cómo usar SocioAPP.' }

export default function HelpChatbot() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([welcome])
  const [allTopics, setAllTopics] = useState(false)
  const role = normalizeRole(useAuthStore(state => state.rol))
  const input = useRef(null)
  const launcher = useRef(null)
  const history = useRef(null)

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  useEffect(() => {
    if (open && history.current) history.current.scrollTop = history.current.scrollHeight
  }, [open, messages])

  function close() {
    setOpen(false)
    launcher.current?.focus()
  }

  function ask(value) {
    const text = value.trim().slice(0, 400)
    const reply = getChatReply(text)
    if (!reply) return
    setMessages(previous => [...previous, { author: 'user', text }, { author: 'bot', ...reply }].slice(-40))
    setQuestion('')
    input.current?.focus()
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <section id="socioapp-help-chat" role="region" aria-labelledby="help-chat-title"
          onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close() } }}
          className="mb-3 flex h-[min(580px,calc(100dvh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex shrink-0 items-center gap-3 bg-slate-900 px-4 py-3 text-white">
            <span className="rounded-xl bg-teal-400/15 p-2 text-teal-300"><MessageCircle className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1"><h2 id="help-chat-title" className="font-semibold">Asistente Rancul</h2><p className="text-xs text-slate-300">Ayuda para usar SocioAPP</p></div>
            <button type="button" aria-label="Reiniciar conversación" onClick={() => { setMessages([welcome]); setQuestion(''); input.current?.focus() }} className="rounded-lg p-2 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"><RotateCcw className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" aria-label="Cerrar chat de ayuda" onClick={close} className="rounded-lg p-2 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"><X className="h-5 w-5" aria-hidden="true" /></button>
          </header>
          <p className="shrink-0 border-b border-slate-100 bg-teal-50 px-4 py-2 text-xs leading-relaxed text-teal-900">Respuestas predefinidas. No consulta tu cuenta ni realiza trámites. No envíes datos personales.</p>
          <div ref={history} role="log" aria-label="Conversación de ayuda" aria-live="polite" aria-relevant="additions" tabIndex={0} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
            {messages.map((message, index) => {
              const link = getChatLink(message.link, role)
              return <div key={index} className={`flex ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] rounded-2xl px-3 py-3 text-sm leading-relaxed ${message.author === 'user' ? 'rounded-br-sm bg-teal-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'}`}>
                  <span className="sr-only">{message.author === 'user' ? 'Vos: ' : 'Asistente: '}</span>
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  {link && <Link to={link.to} state={link.state} onClick={close} className="mt-2 inline-flex items-center gap-1 font-semibold text-teal-800 underline underline-offset-4">{link.label}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>}
                </div>
              </div>
            })}
          </div>
          <div className="flex max-h-24 shrink-0 flex-wrap gap-2 overflow-y-auto border-t border-slate-100 px-3 py-3" aria-label="Temas de ayuda">
            {(allTopics ? CHAT_TOPICS : CHAT_TOPICS.slice(0, 4)).map(topic => <button key={topic.id} type="button" onClick={() => ask(topic.label)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-500 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">{topic.label}</button>)}
            <button type="button" aria-expanded={allTopics} onClick={() => setAllTopics(value => !value)} className="rounded-full border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">{allTopics ? 'Ver menos consultas' : `Ver todas las consultas (${CHAT_TOPICS.length})`}</button>
          </div>
          <form onSubmit={event => { event.preventDefault(); ask(question) }} className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-3 py-3">
            <label htmlFor="help-chat-question" className="sr-only">Tu pregunta sobre SocioAPP</label>
            <input id="help-chat-question" ref={input} value={question} onChange={event => setQuestion(event.target.value)} maxLength={400} autoComplete="off" placeholder="Escribí tu pregunta…" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100" />
            <button type="submit" disabled={!question.trim()} aria-label="Enviar pregunta" className="rounded-xl bg-teal-700 p-3 text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" aria-hidden="true" /></button>
          </form>
        </section>
      )}
      <div className="flex justify-end">
        <button ref={launcher} type="button" aria-expanded={open} aria-controls="socioapp-help-chat" aria-label={open ? 'Cerrar asistente Rancul' : 'Abrir asistente Rancul'} onClick={() => open ? close() : setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-5 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"><MessageCircle className="h-5 w-5" aria-hidden="true" /><span>¿Te ayudamos?</span></button>
      </div>
    </div>
  )
}
