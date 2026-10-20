from app.models import Parent, Program, ProgramQuest, Progress, Quest, Student, Subject


def make_subject(db_session, slug="math", name="Математика"):
    subject = Subject(slug=slug, name=name)
    db_session.add(subject)
    db_session.commit()
    return subject


def make_quest(db_session, subject, grade, order=1, title="Квест"):
    quest = Quest(subject_id=subject.id, grade=grade, order=order, title=title, story_text="")
    db_session.add(quest)
    db_session.commit()
    return quest


def make_student(db_session, grade=1, program_id=None):
    parent = Parent(name="Родитель", email=f"parent-{grade}-{program_id}@example.com")
    db_session.add(parent)
    db_session.flush()
    student = Student(name="Ученик", grade=grade, parent_id=parent.id, program_id=program_id)
    db_session.add(student)
    db_session.commit()
    return student


def make_program(db_session, quests, title="Программа", grade_from=1, grade_to=1):
    program = Program(title=title, grade_from=grade_from, grade_to=grade_to)
    db_session.add(program)
    db_session.flush()
    for quest in quests:
        db_session.add(ProgramQuest(program_id=program.id, quest_id=quest.id))
    db_session.commit()
    return program


class TestStudentQuestsCompletedFlag:
    def test_quest_with_progress_record_is_completed(self, client, db_session):
        subject = make_subject(db_session)
        quest = make_quest(db_session, subject, grade=1, order=1, title="Квест")
        program = make_program(db_session, [quest])
        student = make_student(db_session, grade=1, program_id=program.id)
        db_session.add(Progress(student_id=student.id, quest_id=quest.id))
        db_session.commit()

        response = client.get(f"/students/{student.id}/quests")

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["id"] == quest.id
        assert body[0]["completed"] is True

    def test_quest_without_progress_record_is_not_completed(self, client, db_session):
        subject = make_subject(db_session)
        quest = make_quest(db_session, subject, grade=1, order=1, title="Квест")
        program = make_program(db_session, [quest])
        student = make_student(db_session, grade=1, program_id=program.id)

        response = client.get(f"/students/{student.id}/quests")

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["id"] == quest.id
        assert body[0]["completed"] is False

    def test_two_quest_program_mixed_completion(self, client, db_session):
        """Mirrors a demo student's program: exactly two quests, one passed,
        one not - checks both flags and that ordering stays by
        (subject_id, grade, order) regardless of completion state."""
        subject = make_subject(db_session)
        first_quest = make_quest(db_session, subject, grade=1, order=1, title="Первый")
        second_quest = make_quest(db_session, subject, grade=1, order=2, title="Второй")
        program = make_program(db_session, [first_quest, second_quest])
        student = make_student(db_session, grade=1, program_id=program.id)
        db_session.add(Progress(student_id=student.id, quest_id=first_quest.id))
        db_session.commit()

        response = client.get(f"/students/{student.id}/quests")

        assert response.status_code == 200
        body = response.json()
        assert [q["id"] for q in body] == [first_quest.id, second_quest.id]
        completed_by_id = {q["id"]: q["completed"] for q in body}
        assert completed_by_id[first_quest.id] is True
        assert completed_by_id[second_quest.id] is False

    def test_student_without_program_returns_empty_list(self, client, db_session):
        student = make_student(db_session, grade=1, program_id=None)

        response = client.get(f"/students/{student.id}/quests")

        assert response.status_code == 200
        assert response.json() == []
