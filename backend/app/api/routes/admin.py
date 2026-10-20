from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Program, ProgramQuest, Quest, Student
from app.schemas.program import ProgramAssignIn, ProgramCreateIn, ProgramOut

router = APIRouter(prefix="/admin", tags=["admin"])


def _to_program_out(db: Session, program: Program) -> ProgramOut:
    quests = list(
        db.scalars(
            select(Quest)
            .join(ProgramQuest, ProgramQuest.quest_id == Quest.id)
            .where(ProgramQuest.program_id == program.id)
            .order_by(Quest.subject_id, Quest.grade, Quest.order)
        )
    )
    return ProgramOut(
        id=program.id,
        title=program.title,
        grade_from=program.grade_from,
        grade_to=program.grade_to,
        quests=quests,
    )


@router.post("/programs", response_model=ProgramOut)
def create_program(payload: ProgramCreateIn, db: Session = Depends(get_db)) -> ProgramOut:
    quests = list(db.scalars(select(Quest).where(Quest.id.in_(payload.quest_ids))))
    found_ids = {quest.id for quest in quests}
    missing_ids = set(payload.quest_ids) - found_ids
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Quests not found: {sorted(missing_ids)}")

    program = Program(title=payload.title, grade_from=payload.grade_from, grade_to=payload.grade_to)
    db.add(program)
    db.flush()

    for quest_id in payload.quest_ids:
        db.add(ProgramQuest(program_id=program.id, quest_id=quest_id))

    db.commit()
    return _to_program_out(db, program)


@router.get("/programs", response_model=list[ProgramOut])
def list_programs(db: Session = Depends(get_db)) -> list[ProgramOut]:
    programs = list(db.scalars(select(Program)))
    return [_to_program_out(db, program) for program in programs]


@router.get("/programs/{program_id}", response_model=ProgramOut)
def get_program(program_id: int, db: Session = Depends(get_db)) -> ProgramOut:
    program = db.get(Program, program_id)
    if program is None:
        raise HTTPException(status_code=404, detail="Program not found")
    return _to_program_out(db, program)


@router.post("/programs/{program_id}/assign", response_model=ProgramOut)
def assign_program(
    program_id: int, payload: ProgramAssignIn, db: Session = Depends(get_db)
) -> ProgramOut:
    program = db.get(Program, program_id)
    if program is None:
        raise HTTPException(status_code=404, detail="Program not found")
    student = db.get(Student, payload.student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    student.program_id = program.id
    db.commit()
    return _to_program_out(db, program)
