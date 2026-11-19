export const formatClassBlocks = (blocks = []) => blocks.map((block) => {
    const [sh, sm] = String(block.start_time).split(':').map(Number)
    const [eh, em] = String(block.end_time).split(':').map(Number)
    const start = new Date(`${block.date}T00:00:00`)
    start.setHours(sh, sm || 0, 0, 0)
    const end = new Date(`${block.date}T00:00:00`)
    end.setHours(eh, em || 0, 0, 0)

    return {
        ...block,
        id: `class-${block.schedule_id}-${block.date}`,
        title: `${block.subject} — ${block.course} ${block.section}`,
        start,
        end,
        isClass: true,
        status: 'class',
        room: block.room_name || block.room,
        user: block.instructor || 'Scheduled Class',
        purpose: 'Class Schedule'
    }
})
