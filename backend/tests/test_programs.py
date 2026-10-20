from sqlalchemy import select

from app.models import Parent, ProgramQuest, Quest, Student, Subject


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


class TestCreateProgram:
    def test_create_program_returns_nested_quests_within_requested_range(self, client, db_session):
        subject = make_subject(db_session)
        quest_grade_2 = make_quest(db_session, subject, grade=2, order=1, title="Квест 2 класс")
        quest_grade_3 = make_quest(db_session, subject, grade=3, order=1, title="Квест 3 класс")

        response = client.post(
            "/admin/programs",
            json={
                "title": "Математика 2-3 класс",
                "grade_from": 2,
                "grade_to": 3,
                "quest_ids": [quest_grade_2.id, quest_grade_3.id],
            },
        )

        assert response.status_code == 200, response.text
        body = response.json()
        assert body["grade_from"] == 2
        assert body["grade_to"] == 3
        returned_ids = {q["id"] for q in body["quests"]}
        assert returned_ids == {quest_grade_2.id, quest_grade_3.id}
        assert all(2 <= q["grade"] <= 3 for q in body["quests"])

    def test_create_program_with_missing_quest_id_returns_404(self, client, db_session):
        subject = make_subject(db_session)
        quest = make_quest(db_session, subject, grade=1)

        response = client.post(
            "/admin/programs",
            json={
                "title": "Program",
                "grade_from": 1,
                "grade_to": 1,
                "quest_ids": [quest.id, 999999],
            },
        )

        assert response.status_code == 404
        assert "999999" in response.text

    def test_create_program_rejects_quest_outside_declared_grade_range(self, client, db_session):
        """Known defect: create_program never checks that a requested quest's
        grade falls within [grade_from, grade_to] - a quest from a completely
        different grade is silently accepted and nested in the response.
        This test encodes the intended contract and currently FAILS against
        the real implementation; see report to Michael."""
        subject = make_subject(db_session)
        in_range_quest = make_quest(db_session, subject, grade=1, order=1, title="В диапазоне")
        out_of_range_quest = make_quest(db_session, subject, grade=5, order=1, title="Вне диапазона")

        response = client.post(
            "/admin/programs",
            json={
                "title": "Только 1 класс",
                "grade_from": 1,
                "grade_to": 1,
                "quest_ids": [in_range_quest.id, out_of_range_quest.id],
            },
        )

        assert response.status_code in (400, 422), (
            "ожидалась ошибка валидации, но квест 5 класса был принят в программу "
            f"для диапазона 1-1 класс: {response.status_code} {response.text}"
        )


class TestAssignProgram:
    def test_assign_program_sets_student_program_id(self, client, db_session):
        subject = make_subject(db_session)
        quest = make_quest(db_session, subject, grade=1)
        student = make_student(db_session, grade=1, program_id=None)

        create_resp = client.post(
            "/admin/programs",
            json={"title": "Program", "grade_from": 1, "grade_to": 1, "quest_ids": [quest.id]},
        )
        program_id = create_resp.json()["id"]

        assign_resp = client.post(
            f"/admin/programs/{program_id}/assign", json={"student_id": student.id}
        )

        assert assign_resp.status_code == 200, assign_resp.text
        db_session.refresh(student)
        assert student.program_id == program_id

    def test_assign_program_twice_is_idempotent(self, client, db_session):
        subject = make_subject(db_session)
        quest = make_quest(db_session, subject, grade=1)
        student = make_student(db_session, grade=1, program_id=None)

        create_resp = client.post(
            "/admin/programs",
            json={"title": "Program", "grade_from": 1, "grade_to": 1, "quest_ids": [quest.id]},
        )
        program_id = create_resp.json()["id"]

        first = client.post(f"/admin/programs/{program_id}/assign", json={"student_id": student.id})
        second = client.post(f"/admin/programs/{program_id}/assign", json={"student_id": student.id})

        assert first.status_code == 200
        assert second.status_code == 200
        db_session.refresh(student)
        assert student.program_id == program_id
        # Assignment is a plain FK on Student, not a join-table row - repeating
        # the call must not create duplicate ProgramQuest rows either.
        program_quest_rows = db_session.scalars(
            select(ProgramQuest).where(ProgramQuest.program_id == program_id)
        ).all()
        assert len(program_quest_rows) == 1

    def test_assign_program_to_unknown_student_returns_404(self, client, db_session):
        subject = make_subject(db_session)
        quest = make_quest(db_session, subject, grade=1)
        create_resp = client.post(
            "/admin/programs",
            json={"title": "Program", "grade_from": 1, "grade_to": 1, "quest_ids": [quest.id]},
        )
        program_id = create_resp.json()["id"]

        response = client.post(f"/admin/programs/{program_id}/assign", json={"student_id": 999999})

        assert response.status_code == 404

    def test_assign_unknown_program_returns_404(self, client, db_session):
        student = make_student(db_session, grade=1, program_id=None)

        response = client.post("/admin/programs/999999/assign", json={"student_id": student.id})

        assert response.status_code == 404


class TestStudentQuestFiltering:
    def test_quests_before_assignment_is_empty(self, client, db_session):
        """Documented, intentional behaviour (see students.py comment): a
        student without a program sees no quests at all, rather than every
        quest in the database."""
        student = make_student(db_session, grade=1, program_id=None)

        response = client.get(f"/students/{student.id}/quests")

        assert response.status_code == 200
        assert response.json() == []

    def test_quests_for_unknown_student_returns_404(self, client, db_session):
        response = client.get("/students/999999/quests")

        assert response.status_code == 404

    def test_quests_after_assignment_only_includes_program_quests(self, client, db_session):
        subject = make_subject(db_session)
        in_program_quest = make_quest(db_session, subject, grade=1, order=1, title="В программе")
        other_quest_same_subject = make_quest(
            db_session, subject, grade=2, order=1, title="Другой класс, вне программы"
        )
        other_subject = make_subject(db_session, slug="russian", name="Русский язык")
        other_quest_other_subject = make_quest(
            db_session, other_subject, grade=1, order=1, title="Другой предмет, вне программы"
        )

        create_resp = client.post(
            "/admin/programs",
            json={
                "title": "Только один квест",
                "grade_from": 1,
                "grade_to": 1,
                "quest_ids": [in_program_quest.id],
            },
        )
        program_id = create_resp.json()["id"]

        student = make_student(db_session, grade=1, program_id=None)
        client.post(f"/admin/programs/{program_id}/assign", json={"student_id": student.id})

        response = client.get(f"/students/{student.id}/quests")

        assert response.status_code == 200
        returned_ids = {q["id"] for q in response.json()}
        assert returned_ids == {in_program_quest.id}
        assert other_quest_same_subject.id not in returned_ids
        assert other_quest_other_subject.id not in returned_ids
