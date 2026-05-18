export interface RivalPublisher {
  id: string
  name: string
  founded: string
  specialty: string
  personality: string
}

export const RIVALS: RivalPublisher[] = [
  {
    id: 'chenxi',
    name: '晨曦出版社',
    founded: '1927年',
    specialty: '言情与文学小说',
    personality: '永夜最古老的对手。主编是一位不知疲倦的人类，已经换到了第七任——每一任都在退休前留下同一句话："伯爵的品味过时了。"他们专门出版永夜退掉的稿子，并以此为荣。两家出版社的大楼隔街相望，夜里各自亮着一盏灯。',
  },
  {
    id: 'xinggui',
    name: '星轨出版社',
    founded: '1969年',
    specialty: '科幻与未来主义',
    personality: '创始人是一位退役宇航员，坚信"未来属于星辰而非棺材"。他们每年举办一次"未来文学奖"，奖杯是一枚真正的陨石碎片。永夜的编辑曾匿名投稿参赛，拿了二等奖——至今没去领奖，因为颁奖典礼在白天。',
  },
  {
    id: 'wanxiang',
    name: '万象出版集团',
    founded: '1891年',
    specialty: '大众畅销书',
    personality: '百年老店，但一点不老派。他们发明了腰封、签名本和"加印一百万册"的谎言。集团大楼有十七层，第十六层专门用来堆放滞销书。据说前任董事长曾在酒后对永夜的伯爵说："你活得久不代表你懂市场。"伯爵笑了，没说话。',
  },
  {
    id: 'yeyu',
    name: '夜雨学社',
    founded: '1956年',
    specialty: '学术与社科',
    personality: '由三位文学教授在一场夜雨中创立的学社。他们的退稿信以长度著称——平均1200字，引经据典，比大部分被退的稿子本身还有阅读价值。有人专门收集这些退稿信装订成册。永夜编辑与夜雨编辑的关系很微妙：互相退稿，互相引用。',
  },
  {
    id: 'zhijing',
    name: '纸镜书房',
    founded: '2015年',
    specialty: '轻小说与类型文学',
    personality: '最年轻的竞争者，由一家倒闭书店的五个店员合伙创立。他们没有办公室，编辑们在咖啡馆和旧书摊之间流动办公。口号是"每本书都配得上一个好封面"。与永夜的关系像学徒与老师傅——他们模仿永夜的审稿标准，但从不承认。',
  },
]
