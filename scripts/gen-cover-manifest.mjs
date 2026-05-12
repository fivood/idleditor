import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SCI_FI_TITLES = [
  '最后的时空旅行者', '量子茶渍', '火星，很遗憾', '有知觉的脚注',
  '此处重力可选', '明日简史', '代码深处的回声', '银河系通勤指南',
  '四体', '零体', '流浪火星', '沙堆',
  '神经躺平者', '银河系迷路指南', '基础', '太阳泛起了涟漪',
  '安德的加班', '海不理俺', '环形废墟2.0', '光子罢工日',
  '永生者的宇宙学', '光年是错的', '最后的外卖骑手', '戴森球招标书',
  '时空管理局拒签记录', '无限循环与有限耐心',
  '勉强还行新世界', '华氏452', '发条柚子', '仿生人会发朋友圈吗',
  '银河系搭车客生存手册', '时间足够你摸鱼', '与拉玛相看两厌',
  '童年的终结（青少年版）', '神们自己也不确定', '永恒的终结·续',
  '火星三部曲·第四部', '你一生的故事（简写本）',
]

const MYSTERY_TITLES = [
  '饼干盒疑案', '委员会谋杀案', '牧师又干了', '游园会杀人事件',
  '图书馆里的狗奇案', '七楼走廊的脚步声', '不在场证明太完美了',
  '祸尔摩斯探案集', '东方慢车误点案', '差点无人伤亡', '白夜走',
  '嫌疑人X的加班', '淡淡的恶意', '电梯里的第十三个人', '最后一页被撕了',
  '出版社杀人事件', '死者生前发了一条朋友圈', '不在场证明有1080页',
  '密室里的自动回复', '凶手是AI', '温泉旅馆与消失的拖鞋',
  '红发会的中国分社', '斑驳的铜像', '巴斯克维尔的哈士奇',
  '养活一只知更鸟', '尼罗河上的惨案（邮轮版）', '无人生还·修订版',
  'ABC谋杀案·重启', '帷幕之后还有一页', '啤酒谋杀案',
  '格林家杀人事件·物业版', '占星术杀人魔法（已破解）',
]

const SUSPENSE_TITLES = [
  '知道太少的人', '截稿日', '沉默的来电者', '地板下面',
  '错误的钥匙', '开往无处的末班车', '第十二个目击者', '不能说的姓名',
  '沉默的烤全羊', '龙纹身的项目经理', '消失的快递', '达芬奇验证码',
  '天黑之后千万别看邮箱', '房东突然说下个月涨房租', '那个谁死了',
  '地下室传来打字声', '监控拍到的是昨天', '第十二通电话没有来电显示',
  '被锁在稿子里的编辑', '合同第七条附款（小字）',
  '实习生沉默的方式', '别相信任何人（包括作者）', '独居的一年·邻居版',
  '第22条军规', '蝇王·蜂后篇', '罪与改',
]

const SOCIAL_TITLES = [
  '关于排队：一项田野调查', '寒暄的社会学', '我们为什么道歉',
  'M&S咖啡馆的人类学考察', '天气与民族性格', '下午茶的仪式分析',
  '键盘咖啡与加班', '散了又聚之众', '思考：算了不想了', '挺正常的',
  '人类流水账', '外卖迟到五分钟的阶层分析', '朋友圈点赞的政治经济学',
  '如何假装自己读过这本书', '社恐的哲学辩护', '精致穷的谱系学',
  '当代青年用省略号的方式研究', '表情包使用的代际差异',
  '偏见与更偏见', '存在与摆烂', '局内人', '瓦尔登湖景房',
  '战争与还行', '了不起的盖茨比（平装）', '年轻人与泳池',
  '太阳照常迟到', '包法利夫人（双语注解版）',
]

const HYBRID_TITLES = [
  'AI刑警', '时间犯罪调查科', '心理时间机器', '算法谋杀案',
  '赛博推理', '平行宇宙证词', '仿生人会梦见996吗', '雪滑',
  '量子纠缠情感咨询所', '蒸汽朋克考据学', '克苏鲁的HR手册',
  '穿越成编辑后的我被迫出版自己的小说', '基因编码的暗恋',
  '太空站灵异事件簿', '区块链时间旅行保险公司',
  '巴别图书馆的安保系统',
  '城堡（物业版）', '变形计（甲虫视角）', '绿楼梦',
  '四国演义', '东游记（高铁篇）', '聊斋志异（已科学解释）',
  '鲁滨逊隔离记', '洛丽塔（争议版）', '尤利西斯（注音版）',
]

const TITLE_POOLS = {
  'sci-fi': SCI_FI_TITLES,
  mystery: MYSTERY_TITLES,
  suspense: SUSPENSE_TITLES,
  'social-science': SOCIAL_TITLES,
  hybrid: HYBRID_TITLES,
}

function titleToSlug(title) {
  return title
    .replace(/[：:]/g, '-')
    .replace(/[？?！!。，,、（）()【】\[\]《》""]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\/+/g, '-')
    .trim()
}

/** @type {Array<{ title: string, genre: string, filename: string, slug: string }>} */
const manifest = []

for (const [genre, titles] of Object.entries(TITLE_POOLS)) {
  for (const title of titles) {
    const slug = titleToSlug(title)
    manifest.push({
      title,
      genre,
      slug,
      filename: `${slug}.svg`,
    })
  }
}

const outDir = join(__dirname, '..', 'public', 'covers')
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true })
}

const outPath = join(outDir, 'manifest.json')
writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf-8')

// Also write a human-readable table as markdown
const genreLabel = { 'sci-fi': '科幻', mystery: '推理', suspense: '悬疑', 'social-science': '社科', hybrid: '混合' }
const mdLines = [
  '# 封面图片对照表',
  '',
  '将生成的封面图片放入 `public/covers/` 目录，文件名见下表。',
  '',
  '| 编号 | 书名 | 类型 | 文件名 | 已生成 |',
  '|------|------|------|--------|--------|',
]
manifest.forEach((entry, i) => {
  mdLines.push(`| ${i + 1} | ${entry.title} | ${genreLabel[entry.genre] ?? entry.genre} | \`${entry.filename}\` | ☐ |`)
})

writeFileSync(join(outDir, 'README.md'), mdLines.join('\n'), 'utf-8')

console.log(`Generated ${manifest.length} cover entries → ${outPath}`)
console.log(`README → ${join(outDir, 'README.md')}`)
console.log(`\nTotal: ${manifest.length} unique titles across ${Object.keys(TITLE_POOLS).length} genres`)
console.log(`Next: generate a ${manifest[0].filename.slice(-3)} image for each entry and place in public/covers/`)
