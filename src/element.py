from random import choice


class Element:
    def __init__(self, _type: str, l_eng: list, l_turk: list):
        self._type = _type      # W, P, S
        self._l_eng = l_eng
        self._l_turk = l_turk

    def _translate(self, lang_show: list, lang_guess: list):
        print(f"Translate: {choice(lang_show)}")
        user_guess = input("> ").strip().lower()
        if user_guess not in lang_guess:
            print(f"{choice(lang_guess)}")

    def exercise(self):
        methods = [
            getattr(self, name)
            for name in dir(self) if name.startswith("_exercise")
        ]
        choice(methods)()

    def __str__(self) -> str:
        return f"({self._type}) TURK: {self._l_turk}  ENG: {self._l_eng}"

    def __repr__(self) -> str:
        return str(self)
