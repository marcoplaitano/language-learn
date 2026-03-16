from re import findall
from random import randint, choice
from element import Element


class Sentence(Element):
    def __init__(self, l_eng, l_turk):
        super().__init__('S', l_eng, l_turk)

    def _exercise1(self):
        """Translate from English to Turkish"""
        lang_show = self._l_eng
        lang_guess = self._l_turk
        self._translate(lang_show, lang_guess)

    def _exercise2(self):
        """Translate from Turkish to English"""
        lang_show = self._l_turk
        lang_guess = self._l_eng
        self._translate(lang_show, lang_guess)

    def _exercise3(self):
        """Fill in blank words in the sentence"""
        sentence = choice(self._l_turk)
        words = findall(r"[\w']+|[.,!?;]", sentence)
        num_words = len(words)
        for i in range(num_words):
            index = randint(0, num_words-1)
            if len(words[index]) > 2:
                break
        blank_word = ""
        for char in words[index]:
            if char >= 'a' and char <= 'z':
                blank_word += "_"
            else:
                blank_word += char
        sentence = ""
        for i in range(num_words):
            if i == index:
                sentence += blank_word + " "
            else:
                sentence += words[i] + " "
        print(f"Fill: {sentence}")
        print(f"{choice(self._l_eng)}")
        user_guess = input("> ").strip().lower()
        if user_guess != words[index]:
            print(words[index])
