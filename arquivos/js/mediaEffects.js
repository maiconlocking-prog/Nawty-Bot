const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

const TEMP = path.join(__dirname, '../../database/tmp')
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true })

function tmp(ext = 'tmp') {
  return path.join(TEMP, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`)
}
function clean(...files) {
  for (const f of files) try { if (f && fs.existsSync(f)) fs.unlinkSync(f) } catch {}
}

async function runFfmpeg(inputBuf, inExt, outExt, args) {
  const input = tmp(inExt)
  const output = tmp(outExt)
  fs.writeFileSync(input, inputBuf)
  const cmd = `ffmpeg -y -i "${input}" ${args} "${output}"`
  try {
    await execAsync(cmd, { timeout: 120000 })
    const buf = fs.readFileSync(output)
    clean(input, output)
    return buf
  } catch (e) {
    clean(input, output)
    throw e
  }
}

// ===== ÁUDIO =====
const audioFilters = {
  bass: 'bass=g=10:f=110:w=0.6',
  bass2: 'bass=g=15:f=100:w=0.7',
  bass3: 'bass=g=20:f=90:w=0.8',
  grave: 'bass=g=12:f=80:w=0.8',
  eco: 'aecho=0.8:0.88:60:0.4',
  reverb: 'aecho=0.8:0.9:1000:0.3',
  reverse: 'areverse',
  normalizar: 'loudnorm=I=-16:TP=-1.5:LRA=11',
  vozmenino: 'asetrate=44100*1.25,aresample=44100,atempo=0.9',
  boyvoice: 'asetrate=44100*1.25,aresample=44100,atempo=0.9',
  vozmulher: 'asetrate=44100*1.35,aresample=44100,atempo=0.85',
  womenvoice: 'asetrate=44100*1.35,aresample=44100,atempo=0.85',
  vozhomem: 'asetrate=44100*0.85,aresample=44100,atempo=1.1',
  manvoice: 'asetrate=44100*0.85,aresample=44100,atempo=1.1',
  vozcrianca: 'asetrate=44100*1.5,aresample=44100,atempo=0.8',
  childvoice: 'asetrate=44100*1.5,aresample=44100,atempo=0.8',
  audiorapido: 'atempo=1.75',
  vozrapida: 'atempo=1.75',
  speedup: 'atempo=1.75',
  audiolento: 'atempo=0.6',
  vozlenta: 'atempo=0.6',
  chorus: 'chorus=0.5:0.9:50:0.4:0.25:2',
  phaser: 'aphaser=type=t:speed=2:decay=0.6',
  flanger: 'flanger',
  tremolo: 'tremolo=f=5:d=0.8',
  vibrato: 'vibrato=f=5:d=0.5',
  volumeboost: 'volume=2.5',
  aumentarvolume: 'volume=2.5',
  overdrive: 'volume=3,alimiter=limit=0.9',
  lowpass: 'lowpass=f=1000',
  pitch: 'asetrate=44100*1.1,aresample=44100'
}

async function applyAudioEffect(buffer, effectName, extra = {}) {
  let filter = audioFilters[effectName]
  if (effectName === 'bassbn' || effectName === 'bassn') {
    const g = Math.min(20, Math.max(1, parseInt(extra.gain) || 10))
    filter = `bass=g=${g}:f=110:w=0.6`
  }
  if (effectName === 'speed' || effectName === 'velocidade') {
    let s = parseFloat(extra.speed) || 1.5
    s = Math.min(3, Math.max(0.5, s))
    // atempo só aceita 0.5-2.0 por filtro
    const parts = []
    let rem = s
    while (rem > 2.0) { parts.push('atempo=2.0'); rem /= 2 }
    while (rem < 0.5) { parts.push('atempo=0.5'); rem /= 0.5 }
    parts.push(`atempo=${rem}`)
    filter = parts.join(',')
  }
  if (!filter) throw new Error('Efeito desconhecido: ' + effectName)
  return runFfmpeg(buffer, 'input', 'mp3', `-af "${filter}" -c:a libmp3lame -q:a 2`)
}

async function cutAudio(buffer, start, end) {
  return runFfmpeg(buffer, 'input', 'mp3', `-ss ${start} -to ${end} -c:a libmp3lame -q:a 2`)
}

async function toMp3(buffer, isVideo = true) {
  const inExt = isVideo ? 'mp4' : 'input'
  return runFfmpeg(buffer, inExt, 'mp3', `-vn -c:a libmp3lame -q:a 2`)
}

// ===== VÍDEO =====
const videoFilters = {
  videorapido: 'setpts=0.5*PTS',
  fastvid: 'setpts=0.5*PTS',
  videoslow: 'setpts=2.0*PTS',
  videolento: 'setpts=2.0*PTS',
  videoreverso: 'reverse',
  videobw: 'hue=s=0',
  pretoebranco: 'hue=s=0',
  sepia: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
  espelhar: 'hflip',
  rotacionar: 'transpose=1',
  videomudo: null // tratado à parte
}

async function applyVideoEffect(buffer, effectName) {
  if (effectName === 'videomudo') {
    return runFfmpeg(buffer, 'mp4', 'mp4', `-c:v copy -an`)
  }
  if (effectName === 'videoloop') {
    // loop 2x simples
    const input = tmp('mp4')
    const output = tmp('mp4')
    fs.writeFileSync(input, buffer)
    try {
      await execAsync(`ffmpeg -y -stream_loop 1 -i "${input}" -c copy "${output}"`, { timeout: 120000 })
      const buf = fs.readFileSync(output)
      clean(input, output)
      return buf
    } catch (e) {
      clean(input, output)
      throw e
    }
  }
  const filter = videoFilters[effectName]
  if (!filter) throw new Error('Efeito de vídeo desconhecido: ' + effectName)
  return runFfmpeg(buffer, 'mp4', 'mp4', `-vf "${filter}" -c:a copy`)
}

async function cutVideo(buffer, start, end) {
  return runFfmpeg(buffer, 'mp4', 'mp4', `-ss ${start} -to ${end} -c:v libx264 -c:a aac -preset ultrafast`)
}

module.exports = {
  applyAudioEffect,
  applyVideoEffect,
  cutAudio,
  cutVideo,
  toMp3,
  audioFilters,
  videoFilters
}
