"""Dev-only seed data: one quest per subject per grade (1-4, plus 5 for math/russian),
each with a few real tasks tied to that grade's typical first topic. Run with:

    docker compose exec backend python -m app.db.seed
"""
from sqlalchemy import select

from app.db.session import Base, SessionLocal, engine
from app.models import Parent, Program, ProgramQuest, Quest, Student, Subject, Task

# Matches DEMO_STUDENT_ID hardcoded in the frontend scaffold until real auth exists.
DEMO_STUDENT_ID = 1
DEFAULT_PROGRAM_TITLE = "Математика и русский, 1 класс"

SUBJECTS = [
    {"slug": "math", "name": "Математика"},
    {"slug": "russian", "name": "Русский язык"},
]

# subject_slug -> grade -> quest + tasks
QUESTS: dict[str, dict[int, dict]] = {
    "math": {
        1: {
            "title": "Городок Чисел",
            "story_text": "Помоги жителям городка пересчитать припасы на зиму.",
            "tasks": [
                {
                    "type": "puzzle",
                    "puzzle_kind": "count_click",
                    "prompt": "Собери все яблоки и посчитай, сколько их было",
                    "config": {"emoji": "🍎", "count": 3},
                    "correct_answer": "3",
                    "explanation": "Посчитай яблоки по одному: 🍎(1) 🍎(2) 🍎(3) — всего 3.",
                },
                {
                    "type": "input",
                    "prompt": "5 + 2 = ?",
                    "correct_answer": "7",
                    "explanation": "Если к 5 прибавить ещё 2, получится 7.",
                },
                {
                    "type": "input",
                    "prompt": "9 − 4 = ?",
                    "correct_answer": "5",
                    "explanation": "От 9 отними 4 — останется 5.",
                },
            ],
        },
        2: {
            "title": "Городок Чисел: Сотня",
            "story_text": "Жители городка строят мост — посчитай, сколько брёвен нужно.",
            "tasks": [
                {
                    "type": "input",
                    "prompt": "36 + 25 = ?",
                    "correct_answer": "61",
                    "explanation": "36 + 25: сначала 36 + 20 = 56, потом 56 + 5 = 61.",
                },
                {
                    "type": "input",
                    "prompt": "Чему равно 3 × 2?",
                    "correct_answer": "6",
                    "explanation": "3 × 2 — это 3 взять 2 раза: 3 + 3 = 6.",
                },
                {
                    "type": "choice",
                    "prompt": "Сколько будет 70 − 40?",
                    "options": ["20", "30", "40"],
                    "correct_answer": "30",
                    "explanation": "7 десятков минус 4 десятка — остаётся 3 десятка, то есть 30.",
                },
            ],
        },
        3: {
            "title": "Городок Чисел: Таблица умножения",
            "story_text": "Мэр городка делит монеты поровну между жителями.",
            "tasks": [
                {
                    "type": "input",
                    "prompt": "7 × 6 = ?",
                    "correct_answer": "42",
                    "explanation": "7 × 6 = 42 — вспомни таблицу умножения на 7.",
                },
                {
                    "type": "input",
                    "prompt": "48 ÷ 8 = ?",
                    "correct_answer": "6",
                    "explanation": "8 × 6 = 48, значит 48 ÷ 8 = 6.",
                },
                {
                    "type": "input",
                    "prompt": "243 + 158 = ?",
                    "correct_answer": "401",
                    "explanation": "Сложи по разрядам: сотни 2+1=3, десятки 4+5=9, единицы 3+8=11 → 401.",
                },
            ],
        },
        4: {
            "title": "Городок Чисел: Дроби и большие числа",
            "story_text": "Пекарь городка делит пироги на дольки для всех гостей.",
            "tasks": [
                {
                    "type": "choice",
                    "prompt": "Какая дробь больше: 1/2 или 1/4?",
                    "options": ["1/2", "1/4", "они равны"],
                    "correct_answer": "1/2",
                    "explanation": "Если пирог делят на 2 части, кусок больше, чем если делят на 4.",
                },
                {
                    "type": "input",
                    "prompt": "124 × 3 = ?",
                    "correct_answer": "372",
                    "explanation": "124 × 3: 100×3=300, 20×3=60, 4×3=12. 300+60+12=372.",
                },
                {
                    "type": "input",
                    "prompt": "936 ÷ 4 = ?",
                    "correct_answer": "234",
                    "explanation": "4 × 234 = 936, значит 936 ÷ 4 = 234.",
                },
            ],
        },
        5: {
            "title": "Городок Чисел: Дроби и проценты",
            "story_text": "Торговец городка пересчитывает скидки и делит товар на равные доли.",
            "tasks": [
                {
                    "type": "input",
                    "prompt": "0,3 + 0,45 = ?",
                    "correct_answer": "0,75",
                    "explanation": "Сложи десятичные дроби по разрядам: 0,30 + 0,45 = 0,75.",
                },
                {
                    "type": "choice",
                    "prompt": "Сколько будет 50% от 80?",
                    "options": ["20", "40", "60"],
                    "correct_answer": "40",
                    "explanation": "50% — это половина, а половина от 80 равна 40.",
                },
                {
                    "type": "input",
                    "prompt": "1,2 × 3 = ?",
                    "correct_answer": "3,6",
                    "explanation": "1,2 × 3: умножь 12 × 3 = 36, затем верни запятую — 3,6.",
                },
            ],
        },
    },
    "russian": {
        1: {
            "title": "Городок Букв",
            "story_text": "Буквы разбежались по городку — помоги собрать их в слова.",
            "tasks": [
                {
                    "type": "choice",
                    "prompt": "Сколько гласных букв в слове «мама»?",
                    "options": ["1", "2", "3"],
                    "correct_answer": "2",
                    "explanation": "В слове «мама» гласные буквы — это обе буквы «а».",
                },
                {
                    "type": "choice",
                    "prompt": "Какая буква лишняя: А, О, Б, У?",
                    "options": ["А", "О", "Б", "У"],
                    "correct_answer": "Б",
                    "explanation": "А, О, У — гласные, а Б — согласная буква.",
                },
                {
                    "type": "input",
                    "prompt": "Сколько слогов в слове «ма-ши-на»?",
                    "correct_answer": "3",
                    "explanation": "Слово делится на слоги: ма-ши-на — это 3 слога.",
                },
            ],
        },
        2: {
            "title": "Городок Слов",
            "story_text": "Жители городка учатся различать, что слово называет и что делает.",
            "tasks": [
                {
                    "type": "choice",
                    "prompt": "В предложении «Кот бежит» слово «бежит» — это:",
                    "options": ["существительное", "глагол", "прилагательное"],
                    "correct_answer": "глагол",
                    "explanation": "«Бежит» отвечает на вопрос «что делает?» — это глагол.",
                },
                {
                    "type": "input",
                    "prompt": "Вставь букву: ж_вот — какая буква нужна, и или ы?",
                    "correct_answer": "и",
                    "explanation": "После «ж» всегда пишем «и»: правило «жи-ши пиши с буквой И».",
                },
                {
                    "type": "choice",
                    "prompt": "Какое слово — имя существительное?",
                    "options": ["бежать", "быстрый", "дерево"],
                    "correct_answer": "дерево",
                    "explanation": "«Дерево» отвечает на вопрос «что?» — это существительное.",
                },
            ],
        },
        3: {
            "title": "Городок Падежей",
            "story_text": "Почтальон городка должен верно подписать посылки по падежам.",
            "tasks": [
                {
                    "type": "choice",
                    "prompt": "В предложении «Я вижу кошку» слово «кошку» стоит в падеже:",
                    "options": ["именительный", "винительный", "дательный"],
                    "correct_answer": "винительный",
                    "explanation": "«Вижу (кого?) кошку» — вопрос винительного падежа.",
                },
                {
                    "type": "input",
                    "prompt": "«ехал» + приставка = «уехал». Какая это приставка?",
                    "correct_answer": "у",
                    "explanation": "Приставка «у-» добавляется в начало слова: у + ехал = уехал.",
                },
                {
                    "type": "choice",
                    "prompt": "Выбери слово во множественном числе:",
                    "options": ["стол", "столы", "столом"],
                    "correct_answer": "столы",
                    "explanation": "«Столы» обозначает больше одного предмета — множественное число.",
                },
            ],
        },
        4: {
            "title": "Городок Предложений",
            "story_text": "Собери предложения городка так, чтобы в них всё было на своих местах.",
            "tasks": [
                {
                    "type": "choice",
                    "prompt": "Подлежащее в предложении «Яркое солнце светит» — это:",
                    "options": ["яркое", "солнце", "светит"],
                    "correct_answer": "солнце",
                    "explanation": "Подлежащее отвечает на вопрос «кто? что?» — «солнце».",
                },
                {
                    "type": "choice",
                    "prompt": "Какой знак ставится в конце вопросительного предложения?",
                    "options": [".", "!", "?"],
                    "correct_answer": "?",
                    "explanation": "Вопросительный знак ставится, когда предложение задаёт вопрос.",
                },
                {
                    "type": "input",
                    "prompt": "Сколько главных членов предложения в «Птицы поют»?",
                    "correct_answer": "2",
                    "explanation": "«Птицы» — подлежащее, «поют» — сказуемое: два главных члена.",
                },
            ],
        },
        5: {
            "title": "Городок Разбора",
            "story_text": "Мастер городка разбирает слова по составу и предложения по частям.",
            "tasks": [
                {
                    "type": "choice",
                    "prompt": "В слове «поездка» корень — это:",
                    "options": ["по", "езд", "ка"],
                    "correct_answer": "езд",
                    "explanation": "«Езд» — общая часть слов «ездить», «поездка», «въезд»: это корень.",
                },
                {
                    "type": "input",
                    "prompt": "Назови приставку в слове «подснежник».",
                    "correct_answer": "под",
                    "explanation": "«Под-» стоит перед корнем «снеж» и добавляет значение «расположенный под чем-то».",
                },
                {
                    "type": "choice",
                    "prompt": "Предложение «Когда закончился дождь, вышло солнце» является:",
                    "options": ["простым", "сложным", "восклицательным"],
                    "correct_answer": "сложным",
                    "explanation": "В нём две грамматические основы («дождь закончился» и «солнце вышло»), значит оно сложное.",
                },
            ],
        },
    },
}


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        demo_student = db.get(Student, DEMO_STUDENT_ID)
        if demo_student is None:
            parent = Parent(name="Демо-родитель", email="demo-parent@example.com")
            db.add(parent)
            db.flush()
            db.add(Student(id=DEMO_STUDENT_ID, name="Демо-ученик", grade=1, parent_id=parent.id))
            db.flush()

        grade_1_quest_ids: list[int] = []
        for subject_data in SUBJECTS:
            subject = db.scalar(select(Subject).where(Subject.slug == subject_data["slug"]))
            if subject is None:
                subject = Subject(**subject_data)
                db.add(subject)
                db.flush()

            for grade, quest_data in QUESTS[subject_data["slug"]].items():
                quest = db.scalar(
                    select(Quest).where(Quest.subject_id == subject.id, Quest.grade == grade)
                )
                if quest is None:
                    quest = Quest(
                        subject_id=subject.id,
                        grade=grade,
                        order=1,
                        title=quest_data["title"],
                        story_text=quest_data["story_text"],
                    )
                    db.add(quest)
                    db.flush()

                    for i, task_data in enumerate(quest_data["tasks"], start=1):
                        db.add(Task(quest_id=quest.id, order=i, **task_data))

                if grade == 1:
                    grade_1_quest_ids.append(quest.id)

        default_program = db.scalar(select(Program).where(Program.title == DEFAULT_PROGRAM_TITLE))
        if default_program is None:
            default_program = Program(title=DEFAULT_PROGRAM_TITLE, grade_from=1, grade_to=1)
            db.add(default_program)
            db.flush()
            for quest_id in grade_1_quest_ids:
                db.add(ProgramQuest(program_id=default_program.id, quest_id=quest_id))

        demo_student = db.get(Student, DEMO_STUDENT_ID)
        if demo_student is not None and demo_student.program_id is None:
            demo_student.program_id = default_program.id

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()
