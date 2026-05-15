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
    founded: '1987年',
    specialty: '言情与文学小说',
    personality: '晨曦的主编是个人类——一位从纽约回来的前文学经纪人。他相信好书不需要活太久才能发现，并经常在社交媒体上暗讽永夜出版社的编辑"对新人不够友好"。',
  },
  {
    id: 'newera',
    name: '新石器时代文学',
    founded: '2011年',
    specialty: '科幻与未来主义',
    personality: '由一位前硅谷产品经理创立的出版公司。他们的办公室没有墙壁，只有白板和站立会议。他们的审稿流程使用了AI初审——据说准确率高达"好文章都精准地退了"。',
  },
  {
    id: 'wanxiang',
    name: '万象出版集团',
    founded: '1954年',
    specialty: '大众畅销书',
    personality: '业内最大的出版社，每年出版上千种书。他们的座右铭是"不是每本书都值得精校"。与永夜出版社的关系是表面客气、私下互抢作者。',
  },
  {
    id: 'lengmian',
    name: '冷面书社',
    founded: '1993年',
    specialty: '学术与社科',
    personality: '由三位退休文学教授创立的独立书社，叫这个名字单纯因为他们喜欢去学校门口的一家冷面店。书社的退稿信以长度著称——平均800字，比被退的稿子本身还长。永夜出版社的编辑偶尔会收到冷面书社寄来的"友好建议"邮件。',
  },
  {
    id: 'youguqi',
    name: '有骨气文化',
    founded: '2018年',
    specialty: '轻小说与漫画改编',
    personality: '最年轻的竞争者，创始人是三个在没骨气平台出道的前网络作者。他们用二次元话术写出版合同，并在每一份新书腰封上都放了二维码——扫出来是作者的会员专属表情包。',
  },
]
