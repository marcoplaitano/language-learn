from element import Element


class Word(Element):
    def __init__(self, l_eng, l_turk):
        super().__init__('W', l_eng, l_turk)

    def _exercise1(self):
        """Translate word from English to Turkish"""
        lang_show = self._l_eng
        lang_guess = self._l_turk
        self._translate(lang_show, lang_guess)

    def _exercise2(self):
        """Translate word from Turkish to English"""
        lang_show = self._l_turk
        lang_guess = self._l_eng
        self._translate(lang_show, lang_guess)
