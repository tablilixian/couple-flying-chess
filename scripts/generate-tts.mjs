import { createHash } from 'crypto';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, '..', 'public', 'audio');
const MANIFEST_PATH = join(AUDIO_DIR, 'manifest.json');
const VOICE = process.env.TTS_VOICE || 'zh-CN-XiaoxiaoNeural';

const NARRATIONS = [
  "周末午后的阳光透过玻璃窗，<br>在木质地板上洒下斑驳的光影。<br>你推开\"遇见\"咖啡店的木门，<br>一阵咖啡香扑面而来。",
  "窗边坐着一个熟悉的身影——<br>上周朋友的聚会上，你们有过一面之缘。<br>她正低头在素描本上画着什么，<br>阳光勾勒出她专注的侧脸轮廓。",
  "你抬起头，正好对上了他的目光。<br>空气仿佛在这一秒凝固了。<br>你微微一笑，他也轻轻点了点头——<br>有些相遇，从第一眼就注定了。",
  "服务生走过来打破沉默：<br>\"两位想喝点什么？\"<br>你们不约而同地笑了——<br>故事，就这样自然而然地开始了。",
  "咖啡的香气在空气中弥漫，<br>你们的对话渐渐从客套变得自然。<br>从兴趣爱好聊到童年往事，<br>仿佛认识了很久很久。<br><br>阳光透过窗户洒在桌上，<br>这个普通的周末午后，<br>正在变得不再普通……",
  "一周后的傍晚，<br>你们约定在一家天台餐厅见面。<br>城市的灯火在脚下铺开，<br>晚风轻柔地吹过你的发梢。<br><br>他比你到得早，<br>远远看到你，就挥了挥手。",
  "暖黄的烛光在桌上摇曳，<br>你们的倒影在红酒杯中交叠。<br>他看你的眼神里，<br>有一种说不清道不明的温柔。<br><br>今晚的星星很亮，<br>但似乎都不及你眼中的光。",
  "夜色渐深，<br>你们并肩看着城市的万家灯火。<br>那些亮着的窗户后面，<br>是一个个温暖的故事。<br><br>你偷偷看了他一眼，<br>发现他也在看你。<br>有些话在心口盘旋，<br>却还没找到说出口的时机……",
  "又是一个周末。<br>你们相约在江边散步。<br>晚风习习，吹皱了一江灯火，<br>星光在波光粼粼的水面上碎成万千光芒。<br><br>你们并肩走着，<br>肩膀偶尔碰在一起，<br>谁都没有躲开。",
  "江边的灯光下，<br>你停下脚步，转过身，<br>认真地看着她的眼睛。<br><br>\"其实……从那天在咖啡店开始，<br>我就一直在想怎么跟你说——<br>我喜欢你。\"<br><br>风吹过来，<br>带走了所有的犹豫。",
  "\"我也喜欢你。\"<br>她轻声说道，<br>眼中有星光闪烁。<br><br>你紧紧握住了她的手——<br>十指相扣，<br>仿佛整个世界都安静了下来。<br><br>这一刻，就是永远。",
  "你们的故事，从那个午后的咖啡店开始，<br>在这个星光璀璨的夜晚开花结果。<br>有些缘分，从一开始就注定了。<br><br>愿每一杯咖啡，都有一个温暖的结局。",
];

function normalizeText(text) {
  return text.replace(/<br\s*\/?>/gi, '，').replace(/<[^>]*>/g, '').trim();
}

function textHash(text) {
  const plain = normalizeText(text);
  return createHash('md5').update(plain, 'utf-8').digest('hex');
}

function runDockerEdgeTTS(text) {
  return new Promise((resolve, reject) => {
    const proc = spawn('docker', [
      'exec', 'edge-tts',
      'edge-tts',
      '--text', normalizeText(text),
      '--voice', VOICE,
      '--write-media', '/dev/stdout',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    const chunks = [];
    proc.stdout.on('data', (chunk) => chunks.push(chunk));

    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`exit code ${code}, stderr: ${stderr.slice(0, 200)}`));
      }
    });
    proc.on('error', reject);
  });
}

async function generateAudio(text) {
  const hash = textHash(text);
  const filename = `${hash}.mp3`;
  const filepath = join(AUDIO_DIR, filename);

  if (existsSync(filepath)) {
    return { text, file: filename, hash, cached: true };
  }

  const buffer = await runDockerEdgeTTS(text);
  writeFileSync(filepath, buffer);
  return { text, file: filename, hash, cached: false };
}

async function main() {
  if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });

  console.log(`Voice: ${VOICE}`);
  console.log(`Output: ${AUDIO_DIR}\n`);

  const results = [];
  for (let i = 0; i < NARRATIONS.length; i++) {
    const text = NARRATIONS[i];
    const preview = normalizeText(text).slice(0, 50);
    process.stdout.write(`[${i + 1}/${NARRATIONS.length}] ${preview}... `);
    try {
      const result = await generateAudio(text);
      console.log(result.cached ? '✓ (cached)' : '✓');
      results.push(result);
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(results.map(r => ({ text: r.text, file: r.file })), null, 2));
  console.log(`\nManifest written: ${MANIFEST_PATH}`);
  const generated = results.filter(r => !r.cached).length;
  console.log(`Total: ${results.length} files (${generated} new, ${results.length - generated} cached)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
