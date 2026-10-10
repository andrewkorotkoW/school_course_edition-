"""Static building catalog for the town/shop. Not stored in the database -
emoji are used as the visuals on purpose (see docs/CONCEPT.md) so the project
doesn't depend on hand-drawn art that nobody here can produce well.

Prices are multiples of 10 to line up with the seeded quest reward (10 points
each) - the cheapest building is always affordable after a single quest.
"""

CATALOG: list[dict] = [
    {"key": "house", "name": "Домик", "cost": 10, "emoji": "🏠"},
    {"key": "stall", "name": "Лавка", "cost": 15, "emoji": "🏪"},
    {"key": "park", "name": "Парк", "cost": 20, "emoji": "🌳"},
    {"key": "library", "name": "Библиотека", "cost": 25, "emoji": "📚"},
    {"key": "fountain", "name": "Фонтан", "cost": 30, "emoji": "⛲"},
    {"key": "zoo", "name": "Зоопарк", "cost": 40, "emoji": "🦁"},
    {"key": "circus", "name": "Цирк", "cost": 50, "emoji": "🎪"},
    {"key": "tower", "name": "Башня", "cost": 70, "emoji": "🗼"},
]

CATALOG_BY_KEY: dict[str, dict] = {b["key"]: b for b in CATALOG}
