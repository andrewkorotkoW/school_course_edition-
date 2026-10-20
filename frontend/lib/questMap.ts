export type QuestMapStatus = "completed" | "current" | "locked";

export type QuestMapQuest = {
  id: number;
  subject_id: number;
  grade: number;
  title: string;
  completed: boolean;
};

export type QuestMapEntry<T extends QuestMapQuest = QuestMapQuest> = {
  quest: T;
  status: QuestMapStatus;
  icon: string;
  globalIndex: number;
};

// Park-attraction emoji, cycled by position so the map stays visually varied
// no matter how many quests the program has.
export const ATTRACTION_ICONS = ["🎡", "🎠", "🎢", "🚂", "🎪", "🛞", "🎯", "🚀"];

// Status is derived from the order the backend returns quests in
// (ORDER BY subject_id, grade, order): the first quest with completed===false
// is the single "current" node, everything after it is "locked", everything
// before it is "completed".
export function buildQuestMapEntries<T extends QuestMapQuest>(quests: T[]): QuestMapEntry<T>[] {
  let currentAssigned = false;
  return quests.map((quest, globalIndex) => {
    let status: QuestMapStatus;
    if (quest.completed) {
      status = "completed";
    } else if (!currentAssigned) {
      status = "current";
      currentAssigned = true;
    } else {
      status = "locked";
    }
    return { quest, status, icon: ATTRACTION_ICONS[globalIndex % ATTRACTION_ICONS.length], globalIndex };
  });
}
