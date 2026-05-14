import { pick, rangeInt } from '../../utils/random'
import {
  pickAdjective,
  pickIntro,
  pickPunchline,
  pickVerb,
} from './lexicons/phrases'

export interface ToastContext {
  title?: string
  authorName?: string
  genre?: string
  quality?: string
  [key: string]: string | undefined
}

type SlotResolver = (ctx: ToastContext) => string

const SLOTS: Record<string, SlotResolver> = {
  '{editorName}': (ctx) => ctx.playerName ?? '你',
  '{title}': (ctx) => `《${ctx.title ?? '无名稿件'}》`,
  '{authorName}': (ctx) => ctx.authorName ?? '匿名作者',
  '{genre}': (ctx) => ctx.genre ?? '杂类',
  '{quality}': (ctx) => ctx.quality ?? '凑合',
  '{intro}': () => pickIntro(),
  '{verb_read}': () => pickVerb('reading'),
  '{verb_write}': () => pickVerb('writing'),
  '{verb_edit}': () => pickVerb('editing'),
  '{verb_sell}': () => pickVerb('selling'),
  '{adj_pos}': () => pickAdjective('positive'),
  '{adj_neg}': () => pickAdjective('negative'),
  '{adj_neut}': () => pickAdjective('neutral'),
  '{punch_review}': () => pickPunchline('review'),
  '{punch_publish}': () => pickPunchline('publish'),
  '{punch_author}': () => pickPunchline('author'),
  '{time_minutes}': () => String(rangeInt(5, 45)),
  '{time_hours}': () => String(rangeInt(1, 8)),
  '{time_days}': () => String(rangeInt(2, 14)),
  '{he}': (ctx) => ctx.playerGender === 'female' ? '她' : '他',
}

function resolve(template: string, ctx: ToastContext): string {
  let result = template
  for (const [slot, resolver] of Object.entries(SLOTS)) {
    while (result.includes(slot)) {
      result = result.replace(slot, resolver(ctx))
    }
  }
  return result
}

const SCENES: Record<string, string[]> = {
  reviewComplete: [
    '{intro}{editorName}{verb_read}了{title}。{punch_review}',
    '读完{title}用时{time_minutes}分钟。{editorName}觉得两百多年的编辑经验在此刻尽数化为一声叹息。',
    '{title}的最后一章让{editorName}盯着天花板整整发了{time_minutes}秒的呆。永生在这一刻显得过于漫长。',
    '审阅完毕。{editorName}在{title}的空白处留下了一句批语。区区三十字，足够{authorName}琢磨三个月。',
    '合上{title}后，{editorName}在办公室里来回踱了{time_minutes}步。这是一种古老的蝙蝠式思考法。',
    '批注{title}时羽毛笔不慎漏墨。{he}在手稿上留下了一个不可磨灭的黑斑。作者很可能会把这当成某种深刻的隐喻。',
    '审阅完{title}，{editorName}推开窗户飞了两圈。夜风能让头脑清醒，尤其是当你自己长着翅膀的时候。',
    '读完{title}，{editorName}决定回棺材里躺一会儿。并非出于困倦，只是需要一个绝对隔音的地方来消化这份震撼。',
    '{title}的行文让{editorName}回忆起了19世纪的伦敦。那时候审稿全凭摇曳的烛光，以及未经污染的视力。',
    '放下{title}，{editorName}端起杯子啜饮了一口成色诡异的红茶，随后淡定地拿起下一份。三百年来日日如此。',
    '{editorName}在{title}的封底画了一只蝙蝠。这既是批注，也是签名，更是代表“已阅”的图腾印记。',
    '阅读{title}耗费的时间远低于预期。并非篇幅短小，而是不用呼吸的生物总是拥有惊人的一目十行技巧。',
    '窗外的鸽子全程目睹了{title}被审阅的过程。它们歪着头，似乎对主角的命运不太满意。{editorName}只能回以耸肩。',
    '审毕。{editorName}拿起黄铜印章，在{title}的检测单上用力盖下“通过”。沉闷的声响在走廊里回荡。',
    '这本{title}还算差强人意。永生者的词典里鲜有“可以”二字，更多时候他们只会说“再观望百年”。',
    '读完{title}，{editorName}看了一眼旁边的镜子。很好，依然没有倒影。这份无聊的稿件差点让人产生变回人类的错觉。',
    '{title}里对吸血鬼的描写极度偏离常识。{editorName}叹了口气，决定不告诉作者血族其实最怕的并非大蒜，而是周一的早会。',
    '审阅{title}时，{editorName}不小心用尖牙把纸张戳穿了。这显然是对第三章最恰如其分的评价。',
    '{title}的男主角为了爱情轻率地放弃了永生。{editorName}发出一声冷笑。无知的人类根本不懂取消各大流媒体的年度订阅有多繁琐。',
    '合上{title}，{editorName}用力揉了揉太阳穴。如果吸血鬼也会患上偏头痛，大概就是此刻的感受。',
    '审完{title}，{editorName}怀着最后一丝希望把稿件翻了个面，企图寻找隐藏的求救信号。令人失望的是，完全没有。',
    '这本{title}犹如1890年的伦敦大雾。一样让人摸不清方向，一样拥有极佳的催眠效果。',
    '读完{title}，{editorName}感觉自己的灵魂被抽走了一小块。如果工伤保险能覆盖精神损失，这绝对能索赔一大笔钱。',
    '审阅{title}耗费的精力堪比跑一场马拉松。唯一不同的是，马拉松跑到终点至少还有瓶水喝。',
    '{intro}合上{title}的最后一页，{editorName}陷入了深思。到底是哪一个环节出了差错，才会让文字排列组合出这种离奇的效果。',
    '对{title}的审阅终于结束。{editorName}疲惫地闭上双眼，虔诚祈祷明天醒来时人类已经发明了全自动审稿机。',
  ],
  bookPublished: [
    '{title}终于付梓印发。{intro}现在它的销量是读者该头疼的问题了。{editorName}端起杯子抿了一口红茶，动作从容不迫。',
    '{intro}印刷机在地下室隆隆作响。{title}被无情地释放到了毫无防备的世人面前。永夜的流水线从不停歇。',
    '永夜出版社的目录上又多了一个名字：{title}。沉重的木质书架发出微弱的抗议声。',
    '{title}的首版已经装车发往各大书店。{editorName}默默祈祷运货司机不要在太阳升起前抛锚。',
    '伴随着刺鼻的油墨味，{title}终于面世。这气味甚至掩盖了地下室里存放了几十年的防腐剂味道。',
    '新书{title}上架了。为了庆祝，编辑部决定破例把窗帘拉开一条细缝，让大家感受长达三秒的危险刺激。',
    '又一部名为{title}的著作诞生。{editorName}在日记上划掉一行，漫长的岁月里又度过了一个毫无波澜的出版日。',
    '{title}被摆上了书店最显眼的推荐位。谁能想到背后的主推手甚至没有在白天出过门。',
    '{title}正式发售。{editorName}已经在认真考虑如果这书滞销，该用它来垫桌角还是直接当废纸回收。',
    '伴随着印刷厂浓重的油墨味，{title}来到世间。如果销量惨淡，至少还能对外宣称是为了促进造纸业的繁荣。',
    '又一本名为{title}的读物被送上了各大书店的货架。世界上的树木又无辜地减少了一大批。',
    '{intro}庆祝{title}出版的内部仪式非常简短。主要原因是所有参与者都只想早点下班回家。',
  ],
  bestseller: [
    '{title}正在各大榜单上{verb_sell}。据不可靠消息，竞品出版社的同行正在面对自家的垃圾堆面露绝望。',
    '{intro}订购台的传真机已经过热报废。{editorName}上次看到这种疯狂的加印场面还是在1920年代。那本书的作者叫海明威。',
    '{title}销量一举突破十万册。作者{authorName}欣喜若狂。{editorName}也罕见地表达了愉悦，具体表现为左侧嘴角上扬了两毫米。',
    '{title}迅速登顶畅销榜。财务部的吸血鬼算账算得手指快要冒烟，他们已经好几个世纪没见过这么多活期存款了。',
    '书迷们为了抢购{title}甚至在书店外搭起了帐篷。{editorName}完全无法理解这种不睡在安稳棺材里的野外生存狂热。',
    '{title}大卖。出版社的地下金库又装满了一个隔间。伯爵大概终于能买得起那套中世纪盔甲的抛光套装了。',
    '{intro}各大媒体争相报道{title}的销售奇迹。{editorName}婉拒了所有采访请求，宣称自己对紫外线过敏。这也是实话。',
    '{title}成了现象级作品。上次惹出这种乱子的还是拜伦。{editorName}至今还没原谅他欠下的那一笔酒钱。',
    '{title}不可思议地登上了畅销榜首。{editorName}开始严肃地重新评估当代大众读者的品味底线。',
    '面对{title}惊人的销量数据，财务主管笑得连假牙都快掉下来了。{editorName}则在盘算能不能借此申请加薪百分之零点五。',
    '{intro}书店发来急电要求{title}立刻加印。谁能想到这种字距大得能跑马的排版居然如此大受欢迎。',
  ],
  authorCooldown: [
    '{authorName}宣布需要无限期休假。{editorName}深表理解，毕竟活了两百年的生物比谁都清楚保持社交距离的必要性。',
    '{intro}{authorName}正在某个不为人知的角落{verb_write}下一部巨著。预计{time_days}个工作日后交稿。对于不朽者而言，这只是眨眼之间。',
    '{authorName}以寻找灵感为由遁入深山。{editorName}十分赞同，毕竟当初为了躲避猎魔人，{he}也在黑森林里住过五十年。',
    '耗尽心血的{authorName}进入了休眠期。希望只是普通的休眠，而不是像编辑部某些老同事那样一睡就是半个世纪。',
    '{intro}收到了{authorName}的请假邮件。{editorName}熟练地将其拖入“百年后处理”的专属文件夹。',
    '{authorName}的键盘终于停止了轰鸣。整个办公室恢复了死一般的沉寂，这正是吸血鬼们最向往的办公环境。',
    '{authorName}单方面宣布进入创作瓶颈期。{editorName}暗自松了口气，至少接下来的几个月都不用再面对那可怕的错别字大军了。',
    '收到了{authorName}要去寻找人生意义的辞行信。{editorName}只希望对方不要迷路太久，毕竟明年的出版计划还要靠这个坑来填。',
    '{intro}{authorName}暂时放下了手中的笔。整个宇宙似乎都因此少制造了一些文字垃圾。',
  ],
  authorReturn: [
    '{authorName}结束休假带着新稿件归来，满面红光。{editorName}合理怀疑{he}是不是半夜潜入了伯爵的私人血库。',
    '{intro}{authorName}重新坐到了打字机前。新稿件{adj_pos}。活了几个世纪，{editorName}依然会为这种久违的勤奋感到惊讶。',
    '{authorName}带着厚度惊人的新草稿重返人间。{editorName}下意识地检查了一下抽屉里备用速效救心丸的保质期。',
    '消失已久的{authorName}重新冒泡并声称自己获得了神启。{editorName}只希望这神启里不包含随意拖稿的特权。',
    '伴随着浓烈的现磨咖啡酸味，{authorName}宣告回归。人类对咖啡因的依赖确实与血族对新鲜血液的渴望不相上下。',
    '{intro}{authorName}再次敲响了出版社的大门。{editorName}熟练地藏起那盆用来防身的大蒜盆栽，露出营业性的微笑。',
    '{authorName}满血复活，带着所谓的新鲜灵感杀回编辑部。{editorName}立刻戴上痛苦面具准备迎战。',
    '{intro}听说{authorName}带着新作重出江湖，编辑部原本就稀薄的空气瞬间凝固到了冰点。',
    '短暂的清净日子彻底结束。{authorName}不仅回来了，还带来了一份厚达百页的大纲。{editorName}按着狂跳的太阳穴双手接过。',
  ],
  manuscriptRejected: [
    '{intro}{title}不出意外地被退稿了。{editorName}活了这么久，处理过的废纸连起来可以绕特兰西瓦尼亚三圈。',
    '{title}的退稿通知已下发。编辑部里那位一百多岁的实习生也认为这篇实在无药可救。',
    '{title}的退稿信由一只面露难色的邮差蝙蝠送出。考虑到这份手稿的惊人厚度，它极有可能会申请工伤赔偿。',
    '{editorName}将{title}塞进碎纸机。机器在发出一声惨绝人寰的哀鸣后彻底卡死。劣质的文字果然难以消化。',
    '经过草率的权衡，{editorName}决定退回{title}。主要原因是构思这封刻薄的退稿信带来的乐趣远胜于阅读小说本身。',
    '{editorName}在{title}的退信中诚恳地写道：“抱歉，本社的出版计划已排至2250年。”在吸血鬼经营的公司，这甚至是一句实话。',
    '拒绝{title}是一个异常轻松的决定。就像把推销纯银十字架的业务员赶出大门一样顺理成章。',
    '{title}惨遭退稿。实习生适时地端来一杯热饮并宽慰{editorName}：“往好处想，至少作者没有在里面塞满插图。”',
    '面对{title}，{editorName}连礼貌性的叹气都予以省略。永生者的耐心虽然无尽，却也不能随意挥霍在垃圾桶上。',
    '{title}的作者愤怒地打来电话质问退稿缘由。{editorName}平静作答：“因为排版极度不符合哥特审美。”毕竟实话往往太伤人。',
    '拒绝{title}的决定下达得异常迅速。这是{editorName}今天唯一一件感到身心愉悦的工作。',
    '将{title}的退稿信塞进信封后，{editorName}觉得连呼吸都顺畅了不少。这大概就是传说中的职场新陈代谢。',
    '{intro}{title}被毫不留情地退回。如果这篇糟糕的稿子能作为燃料放进发电机，绝对足以供应整个街区一整年的电力。',
  ],
  idle: [
    '未读稿件像一座小山般安静地堆叠在桌角。茶杯上方飘出淡淡的暗红色蒸汽。那绝对只是某种特调红茶。',
    '{intro}永夜出版社在夜色中平稳运转。世界的某个角落，一位人类作者正因截稿日而陷入恐慌。而{editorName}早已对这种恐慌习以为常。',
    '时钟的滴答声在空荡荡的编辑部里回荡。{editorName}花了一个小时研究天花板上的蜘蛛结网，这显然比催稿有意义得多。',
    '没有电话，没有邮件，没有歇斯底里的作者。{editorName}开始认真思考要不要去地窖给那些陈年血浆贴上生产日期标签。',
    '空气静谧得连灰尘落地都能听见。{editorName}翻开了一本17世纪的食谱，试图寻找一种能让纯红茶更有嚼劲的香料配方。',
    '{intro}难得的平静时刻。几只蝙蝠倒挂在复印机上方安静地打盹。只要没人去按复印键，今天就是一个完美的夜晚。',
    '{intro}没有新稿件送来的下午简直堪比天堂。{editorName}甚至开始带着欣赏的眼光注视起电脑屏幕上的死机报错代码。',
    '难得的绝对清闲时光。{editorName}认真统计了键盘上字母E的磨损程度，最终得出的结论是它还能再强撑半年。',
    '周围安静得出奇。{editorName}仔细聆听了走廊里的动静，确认没有带着刀的作者来催促进度，这才安心地端起水杯。',
  ],
}

export function generateToast(scene: string, ctx: ToastContext = {}): string {
  const templates = SCENES[scene]
  if (!templates) {
    return '发生了一些事情。详情不明，一如传统。'
  }
  const template = pick(templates)
  return resolve(template, ctx)
}
