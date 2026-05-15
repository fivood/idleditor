import { nanoid } from '@/utils/id'
import { advanceCalendar, TICKS_PER_DAY } from '../calendar'
import { checkDateEvent } from '../dateEvents'
import type { TickContext } from './types'

export function processCalendarPhase({ world, result, ct }: TickContext) {
  if (world.playTicks % TICKS_PER_DAY === 0) {
    const prevMonth = world.calendar.month
    const prevYear = world.calendar.year
    advanceCalendar(world.calendar)
    
    // Reset publishing quota on month change
    if (world.calendar.month !== prevMonth) {
      world.booksPublishedThisMonth = 0
    }
    
    // Cat lifecycle: age up on game-year change
    if (world.catState && world.catState.alive && world.calendar.year !== prevYear) {
      world.catState.age++
      const cat = world.catState
      // Immortality prompt: affection >= 80, age >= 5, not yet immortal
      if (cat.affection >= 80 && cat.age >= 5 && !cat.immortal) {
        result.toasts.push({
          id: nanoid(),
          text: `${cat.name}已经陪伴你${cat.age}年了。它开始显老——动作变慢，跳不上书架了。你看着它蜷在窗台晒太阳，忽然意识到：你的永生不该孤独。你可以选择用一座铜像换取它的永生。`,
          type: 'milestone',
          createdAt: world.playTicks,
        })
        cat.immortalityPrompted = true
      }
      // Mortality check: age >= 10, affection < 50, not immortal
      if (cat.age >= 10 && cat.affection < 50 && !cat.immortal) {
        if (Math.random() < 0.3) {
          result.toasts.push({
            id: nanoid(),
            text: `${cat.name}在一个安静的夜晚离开了。它蜷在你桌上那叠还没审的稿子旁边——和往常一样。你知道它只是睡着了，但这次不会再醒来。`,
            type: 'milestone',
            createdAt: world.playTicks,
          })
          world.catState = null
        } else {
          result.toasts.push(ct(`${cat.name}看起来更老了。它趴在暖气片旁边的时间越来越长。`, 'info'))
        }
      }
      // Age milestones
      if (world.catState) { // Might have died above
        if (cat.age === 1) result.toasts.push(ct(`${cat.name}已经陪伴你一年了。它学会了在稿件堆里找到最舒服的位置——通常是今天必须审完的那叠。`, 'info'))
        if (cat.age === 3) result.toasts.push(ct(`${cat.name}三岁了。它现在认识所有编辑的脚步声，唯独你的——它每次都会抬头。`, 'info'))
        if (cat.age === 5 && cat.immortal) result.toasts.push(ct(`${cat.name}五岁了。它跳上窗台的动作依然像第一天那样轻盈。永生是份礼物——尤其是给一只猫。`, 'info'))
      }
    }
    // Tick down active date event duration
    if (world.activeDateEvent) {
      world.activeDateEvent = {
        ...world.activeDateEvent,
        durationDays: world.activeDateEvent.durationDays - 1,
      }
      if (world.activeDateEvent.durationDays <= 0) {
        world.activeDateEvent = null
      }
    }
    // Check for new date events
    const dateEvt = checkDateEvent(world.calendar)
    if (dateEvt) {
      world.activeDateEvent = { ...dateEvt }
      result.toasts.push({
        id: nanoid(),
        text: `📅 ${dateEvt.title}！${dateEvt.description}（${dateEvt.genre ? dateEvt.genre + '类书籍销量×' + dateEvt.multiplier : '全类书籍销量×' + dateEvt.multiplier}，持续${dateEvt.durationDays}天）`,
        type: 'milestone',
        createdAt: world.playTicks,
      })
    }
  }
}
